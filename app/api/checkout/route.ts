import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/db";
import {
  cancelStalePendingStripeOrders,
  createStripeCheckoutSession,
  pendingStatus,
  StripeError,
} from "@/lib/stripe";
import { products, orders, orderItems, profiles, dealerProfiles } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import {
  calculateShippingCost,
  calculateEuropeShippingCost,
  getShippingZone,
  getShippingConfig,
  type EuropeShippingMethod,
} from "@/lib/shipping";
import {
  euVatCountryPrefix,
  isValidItalianPartitaIva,
  italianVatIncludedOnProducts,
} from "@/lib/italian-vat";
import { grossToNetItalianVat } from "@/lib/catalog-display-price";
import { applyDealerDiscount } from "@/lib/products";
import { retailFromCatalog } from "@/lib/pricing";
import { getPricingConfig } from "@/lib/pricing-server";

interface LineItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  lineKey?: string;
  lineNotes?: string | null;
}

interface BillingInfo {
  company?: string;
  vatNumber?: string;
  sdiCode?: string;
  pec?: string;
  fiscalCode?: string;
  viesExempt?: boolean;
}

function lineItemDisplayName(item: LineItem, nameIt: string): string {
  const base = (item.name || nameIt || "Prodotto").trim();
  const note = item.lineNotes?.trim();
  return note ? `${base}\n${note}` : base;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { items, shippingInfo, billingInfo, europeShippingMethod } = body as {
      items: LineItem[];
      shippingInfo: {
        name: string;
        email: string;
        phone?: string;
        address: string;
        city: string;
        zip: string;
        country: string;
        province?: string;
        notes?: string;
      };
      billingInfo?: BillingInfo;
      europeShippingMethod?: EuropeShippingMethod;
    };

    if (!items?.length) {
      return NextResponse.json({ error: "Carrello vuoto" }, { status: 400 });
    }

    // Check if user is logged in for dealer discount
    const session = await auth();
    const user = session?.user;
    const db = getDb();

    let dealerDiscount = 0;
    // Indirizzo di riferimento del cliente registrato: usato per forzare la zona
    // di spedizione lato server, a prescindere da cosa invia il client.
    let profileCountry: string | null = null;
    let profileProvince: string | null = null;
    if (user?.id) {
      const profile = await db
        .select({
          role: profiles.role,
          country: profiles.country,
          province: profiles.province,
        })
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1)
        .then((r) => r[0]);
      profileCountry = profile?.country?.trim() || null;
      profileProvince = profile?.province?.trim() || null;
      if (profile?.role === "dealer") {
        const dealer = await db
          .select({
            discountPercent: dealerProfiles.discountPercent,
            status: dealerProfiles.status,
          })
          .from(dealerProfiles)
          .where(eq(dealerProfiles.id, user.id))
          .limit(1)
          .then((r) => r[0]);
        if (dealer?.status === "approved") {
          dealerDiscount = dealer.discountPercent ?? 0;
        }
      }
    }

    // --- Calculate shipping cost server-side ---

    // Fetch product weights and fragile shipping info
    const productIds = items.map((i) => i.id);
    const dbProducts = await db
      .select({
        id: products.id,
        weight: products.weight,
        fragileShipping: products.fragileShipping,
        fragileShippingCost: products.fragileShippingCost,
        catalogPrice: products.catalogPrice,
        price: products.price,
      })
      .from(products)
      .where(inArray(products.id, productIds));

    if (dbProducts.length !== new Set(productIds).size) {
      return NextResponse.json({ error: "Uno o più prodotti non sono più disponibili" }, { status: 400 });
    }

    const { markup } = await getPricingConfig();
    const retailMap = new Map(
      dbProducts.map((p) => [
        p.id,
        retailFromCatalog(Number(p.catalogPrice ?? p.price), markup),
      ])
    );
    items = items.map((item) => ({
      ...item,
      price: applyDealerDiscount(retailMap.get(item.id) ?? 0, dealerDiscount),
    }));

    const weightMap = new Map(
      dbProducts.map((p) => [p.id, p.weight != null ? Number(p.weight) : 0.5])
    );

    const totalWeight = items.reduce((sum, item) => {
      const weight = weightMap.get(item.id) || 0.5;
      return sum + weight * item.quantity;
    }, 0);

    // --- Validate stock availability ---
    const stockProducts = await db
      .select({
        id: products.id,
        stockQuantity: products.stockQuantity,
        nameIt: products.nameIt,
      })
      .from(products)
      .where(inArray(products.id, productIds));

    if (stockProducts.length) {
      const requestedByProduct = new Map<number, number>();
      for (const item of items) {
        requestedByProduct.set(
          item.id,
          (requestedByProduct.get(item.id) || 0) + item.quantity
        );
      }
      const outOfStock = stockProducts.filter((p) => {
        const requested = requestedByProduct.get(p.id) ?? 0;
        return requested > 0 && p.stockQuantity < requested;
      });

      if (outOfStock.length > 0) {
        const names = outOfStock.map((p) => p.nameIt).join(", ");
        return NextResponse.json(
          { error: `Disponibilità insufficiente per: ${names}` },
          { status: 400 }
        );
      }
    }

    const shippingConfig = await getShippingConfig();

    // Mappa nome paese -> codice ISO. Risolta qui (prima del calcolo spedizione)
    // così che la zona derivi dallo STESSO paese di destinazione che verrà
    // salvato sull'ordine: un cliente estero non può mai cadere sulla tariffa
    // italiana.
    const countryMap: Record<string, string> = {
      Italia: "IT",
      Austria: "AT",
      Belgio: "BE",
      Bulgaria: "BG",
      Croazia: "HR",
      Danimarca: "DK",
      Estonia: "EE",
      Finlandia: "FI",
      Francia: "FR",
      Germania: "DE",
      Grecia: "GR",
      Irlanda: "IE",
      Lettonia: "LV",
      Lituania: "LT",
      Lussemburgo: "LU",
      Malta: "MT",
      "Paesi Bassi": "NL",
      Polonia: "PL",
      Portogallo: "PT",
      "Repubblica Ceca": "CZ",
      Romania: "RO",
      Slovacchia: "SK",
      Slovenia: "SI",
      Spagna: "ES",
      Svezia: "SE",
      Ungheria: "HU",
      "Regno Unito": "GB",
      Svizzera: "CH",
    };
    const formCountryCode = countryMap[shippingInfo.country];
    if (!formCountryCode) {
      return NextResponse.json(
        { error: "Paese non supportato" },
        { status: 400 }
      );
    }

    // Clienti registrati con indirizzo di riferimento: zona e tariffa forzate dal
    // profilo, senza possibilità di scelta (incluso il metodo Europa). I guest e
    // gli utenti senza indirizzo salvato usano i dati inseriti nel form.
    const useReferenceAddress = !!(user?.id && profileCountry);
    const shippingCountryCode = useReferenceAddress
      ? profileCountry!
      : formCountryCode;
    const shippingProvince = useReferenceAddress
      ? profileProvince
      : shippingInfo.province;

    const zone = getShippingZone(
      shippingCountryCode,
      shippingProvince,
      shippingConfig
    );
    const shippingCost =
      zone === "europe" && europeShippingMethod && !useReferenceAddress
        ? calculateEuropeShippingCost(europeShippingMethod, shippingConfig)
        : calculateShippingCost(totalWeight, zone, shippingConfig);

    // Fragile shipping surcharge (per-item, IVA applied for Italian zones)
    const dbProductMap = new Map(dbProducts.map((p) => [p.id, p]));
    const fragileNet = items.reduce((sum, item) => {
      const prod = dbProductMap.get(item.id);
      if (prod?.fragileShipping && prod.fragileShippingCost != null) {
        return sum + Number(prod.fragileShippingCost) * item.quantity;
      }
      return sum;
    }, 0);
    const zoneConfig = shippingConfig.zones[zone];
    const fragileShippingCost =
      fragileNet > 0
        ? zoneConfig.includesIva
          ? Math.round(fragileNet * (1 + shippingConfig.ivaRate) * 100) / 100
          : fragileNet
        : 0;
    const totalShippingCost = Math.round((shippingCost + fragileShippingCost) * 100) / 100;

    // Calculate totals (prices in cart are already discounted)
    const subtotal = items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    const companyName = billingInfo?.company?.trim();
    if (companyName && shippingInfo.country === "Italia") {
      const vat = billingInfo?.vatNumber?.trim() || "";
      const foreignPrefix = vat ? euVatCountryPrefix(vat) : null;
      const isForeignEuVat = !!(foreignPrefix && foreignPrefix !== "IT");
      if (!isForeignEuVat && !isValidItalianPartitaIva(vat)) {
        return NextResponse.json(
          {
            error:
              "Per fattura azienda in Italia inserisci una Partita IVA italiana valida (11 cifre).",
          },
          { status: 400 }
        );
      }
    }

    const italianVatOnProducts = italianVatIncludedOnProducts(
      shippingInfo.country,
      billingInfo?.vatNumber
    );

    const excludeItalianProductVat = !italianVatOnProducts;

    const round2 = (n: number) => Math.round(n * 100) / 100;

    // Prezzo unitario persistito: al NETTO dell'IVA italiana quando l'ordine la
    // esclude (estero / cessione intracomunitaria reverse charge), altrimenti il
    // prezzo lordo invariato.
    const netUnitPrice = (grossUnit: number) =>
      excludeItalianProductVat ? grossToNetItalianVat(grossUnit) : round2(grossUnit);

    // Subtotale calcolato dalla somma delle righe effettivamente salvate, così
    // che l'ordine quadri sempre: somma(lineTotal) === subtotal e
    // total === subtotal + spedizione. Per gli ordini esenti
    // tax_amount riporta l'IVA scorporata a titolo informativo.
    const persistedSubtotal = round2(
      items.reduce(
        (sum, item) => sum + round2(netUnitPrice(item.price) * item.quantity),
        0
      )
    );
    const persistedTaxAmount = excludeItalianProductVat
      ? round2(subtotal - persistedSubtotal)
      : 0;

    const total = round2(persistedSubtotal + totalShippingCost);

    // Build shipping & billing address objects
    const shippingAddress = {
      name: shippingInfo.name,
      phone: shippingInfo.phone || "",
      address: shippingInfo.address,
      city: shippingInfo.city,
      zip: shippingInfo.zip,
      province: (shippingProvince || "").toUpperCase().slice(0, 2) || "",
      country: shippingCountryCode,
    };

    const billingAddress = {
      email: shippingInfo.email,
      ...(billingInfo?.company ? { company: billingInfo.company } : {}),
      ...(billingInfo?.vatNumber
        ? { vat_number: billingInfo.vatNumber }
        : {}),
      ...(billingInfo?.sdiCode ? { sdi_code: billingInfo.sdiCode } : {}),
      ...(billingInfo?.pec ? { pec: billingInfo.pec } : {}),
      ...(billingInfo?.fiscalCode
        ? { fiscal_code: billingInfo.fiscalCode }
        : {}),
      ...(excludeItalianProductVat ? { vies_exempt: true } : {}),
    };

    await cancelStalePendingStripeOrders({
      userId: user?.id || null,
      guestEmail: !user ? shippingInfo.email : null,
    });

    const productDetails = await db
      .select({ id: products.id, sku: products.sku, nameIt: products.nameIt })
      .from(products)
      .where(inArray(products.id, productIds));
    const productMap = new Map(productDetails.map((p) => [p.id, p]));

    let orderId: number;
    try {
      const [o] = await db
        .insert(orders)
        .values({
          userId: user?.id || null,
          guestEmail: !user ? shippingInfo.email : null,
          status: "pending",
          paymentMethod: "stripe",
          paymentStatus: "stripe_pending",
          subtotal: String(persistedSubtotal),
          shippingCost: String(totalShippingCost),
          taxAmount: String(persistedTaxAmount),
          total: String(total),
          shippingAddress,
          billingAddress,
          notes: shippingInfo.notes || null,
        })
        .returning({ id: orders.id });
      if (!o) throw new Error("no id");
      orderId = o.id;
    } catch (orderError) {
      console.error("Failed to create Stripe order:", orderError);
      return NextResponse.json(
        { error: "Errore nella creazione dell'ordine" },
        { status: 500 }
      );
    }

    const rows = items.map((item) => {
      const product = productMap.get(item.id);
      const unitPrice = netUnitPrice(item.price);
      return {
        orderId,
        productId: item.id,
        productName: lineItemDisplayName(item, product?.nameIt || "Prodotto"),
        productSku: product?.sku || null,
        quantity: item.quantity,
        unitPrice: String(unitPrice),
        discountPercent: 0,
        lineTotal: String(round2(unitPrice * item.quantity)),
      };
    });

    try {
      await db.insert(orderItems).values(rows);
    } catch (itemsErr) {
      console.error("Failed to save Stripe order items:", itemsErr);
    }

    try {
      const { sessionId, url } = await createStripeCheckoutSession({
        orderId,
        totalEur: total,
        customerEmail: shippingInfo.email,
        shippingCost: totalShippingCost,
        items: rows.map((r, i) => ({
          name: r.productName,
          quantity: r.quantity,
          unitPrice: Number(r.unitPrice),
          image: items[i]?.image ?? null,
        })),
      });

      await db
        .update(orders)
        .set({
          paymentStatus: pendingStatus(sessionId),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      return NextResponse.json({ url });
    } catch (payErr) {
      console.error("Stripe session create failed, cancelling order", orderId, payErr);
      await db
        .update(orders)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(orders.id, orderId));
      if (payErr instanceof StripeError) {
        const message =
          payErr.code === "missing_credentials" || payErr.code === "auth_failed"
            ? "Pagamento Stripe non disponibile: credenziali API non valide o mancanti. Contatta l'assistenza."
            : "Errore durante il pagamento Stripe. Riprova.";
        return NextResponse.json({ error: message }, { status: 502 });
      }
      return NextResponse.json(
        { error: "Errore durante il pagamento Stripe. Riprova." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("Checkout error:", err);
    if (err instanceof StripeError) {
      const message =
        err.code === "missing_credentials" || err.code === "auth_failed"
          ? "Pagamento Stripe non disponibile: credenziali API non valide o mancanti. Contatta l'assistenza."
          : "Errore durante il pagamento Stripe. Riprova.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
    return NextResponse.json(
      { error: "Errore durante la creazione del pagamento" },
      { status: 500 }
    );
  }
}
