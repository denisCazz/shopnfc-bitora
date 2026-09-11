import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, inArray, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, orderItems, profiles, daneaOrdersExportLogs } from "@/db/schema";
import { ORDER_NUMBERING_SUFFIX } from "@/lib/order-number";

// Codice IVA Danea per le cessioni intracomunitarie esenti (reverse charge,
// non imponibile art. 41 D.L.331/93). Deve coincidere con il codice presente
// nella tabella "Aliquote/Nature IVA" di Easyfatt.
const EU_REVERSE_CHARGE_VAT_CODE = "N41";

interface ShippingAddress {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
  province?: string;
  country?: string;
}

interface OrderRow {
  id: number;
  created_at: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total: number;
  payment_method: string | null;
  payment_status: string;
  shipping_address: ShippingAddress | null;
  billing_address: {
    email?: string;
    vies_exempt?: boolean;
    vat_number?: string;
    company?: string;
  } | null;
  notes: string | null;
  danea_exported: boolean;
  user_id: string | null;
  guest_email: string | null;
  order_items: {
    id: number;
    product_id: number;
    product_name: string;
    product_sku: string | null;
    quantity: number;
    unit_price: number;
    discount_percent: number;
    line_total: number;
  }[];
}

interface ProfileInfo {
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  vat_number: string | null;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
}

/**
 * Danea Easyfatt e-commerce integration endpoint.
 * Easyfatt calls this URL via HTTP GET to download orders as XML.
 * Supports HTTP Basic Auth and query params:
 *   - appver: protocol version
 *   - firstdate / lastdate: ISO date range filter
 *   - firstnum / lastnum: order number range filter
 *
 * After successful download, orders are marked as danea_exported = true.
 */
export async function GET(req: NextRequest) {
  // --- HTTP Basic Auth ---
  const apiUser = process.env.DANEA_API_USER;
  const apiPass = process.env.DANEA_API_PASSWORD;

  if (apiUser && apiPass) {
    const auth = req.headers.get("authorization");
    if (!auth || !auth.startsWith("Basic ")) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Danea"' },
      });
    }

    const decoded = Buffer.from(auth.slice(6), "base64").toString("utf-8");
    const [user, pass] = decoded.split(":");

    if (user !== apiUser || pass !== apiPass) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Danea"' },
      });
    }
  }

  // --- Parse query params ---
  const { searchParams } = new URL(req.url);
  const firstdate = searchParams.get("firstdate");
  const lastdate = searchParams.get("lastdate");
  const firstnum = searchParams.get("firstnum");
  const lastnum = searchParams.get("lastnum");

  const db = getDb();
  const conds = [
    eq(orders.daneaExported, false),
    // Escludi solo gli ordini annullati
    inArray(orders.status, [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
    ]),
  ];

  if (firstdate) {
    // Danea manda date locali (IT = UTC+2): tratta come inizio giornata italiana
    conds.push(
      gte(orders.createdAt, new Date(`${firstdate}T00:00:00+02:00`))
    );
  }
  if (lastdate) {
    // Fine giornata italiana
    conds.push(
      lte(orders.createdAt, new Date(`${lastdate}T23:59:59+02:00`))
    );
  }
  if (firstnum) {
    conds.push(gte(orders.id, parseInt(firstnum, 10)));
  }
  if (lastnum) {
    conds.push(lte(orders.id, parseInt(lastnum, 10)));
  }

  const orderRows = await db
    .select()
    .from(orders)
    .where(and(...conds))
    .orderBy(asc(orders.id));

  const oids = orderRows.map((o) => o.id);
  const itemRows =
    oids.length > 0
      ? await db
          .select()
          .from(orderItems)
          .where(inArray(orderItems.orderId, oids))
      : [];
  const byOrder = new Map<number, typeof itemRows>();
  for (const it of itemRows) {
    const list = byOrder.get(it.orderId) || [];
    list.push(it);
    byOrder.set(it.orderId, list);
  }

  const mapped: OrderRow[] = orderRows.map((o) => ({
    id: o.id,
    created_at: o.createdAt.toISOString(),
    status: o.status,
    subtotal: Number(o.subtotal),
    shipping_cost: Number(o.shippingCost),
    tax_amount: Number(o.taxAmount),
    total: Number(o.total),
    payment_method: o.paymentMethod,
    payment_status: o.paymentStatus,
    shipping_address: o.shippingAddress as ShippingAddress | null,
    billing_address: o.billingAddress as OrderRow["billing_address"] | null,
    notes: o.notes,
    danea_exported: o.daneaExported,
    user_id: o.userId,
    guest_email: o.guestEmail,
    order_items: (byOrder.get(o.id) || []).map((it) => ({
      id: it.id,
      product_id: it.productId,
      product_name: it.productName,
      product_sku: it.productSku,
      quantity: it.quantity,
      unit_price: Number(it.unitPrice),
      discount_percent: it.discountPercent,
      line_total: Number(it.lineTotal),
    })),
  }));

  // --- Fetch customer profiles for user_id orders ---
  const userIds = mapped
    .map((o) => o.user_id)
    .filter((id): id is string => !!id);

  let profileMap = new Map<
    string,
    {
      email: string;
      first_name: string | null;
      last_name: string | null;
      company: string | null;
      vat_number: string | null;
      phone: string | null;
      address_line1: string | null;
      city: string | null;
      province: string | null;
      postal_code: string | null;
      country: string | null;
    }
  >();

  if (userIds.length > 0) {
    const prows = await db
      .select()
      .from(profiles)
      .where(inArray(profiles.id, userIds));
    profileMap = new Map(
      prows.map((p) => [
        p.id,
        {
          email: p.email,
          first_name: p.firstName,
          last_name: p.lastName,
          company: p.company,
          vat_number: p.vatNumber,
          phone: p.phone,
          address_line1: p.addressLine1,
          city: p.city,
          province: p.province,
          postal_code: p.postalCode,
          country: p.country,
        },
      ])
    );
  }

  // --- Build XML ---
  const xml = buildEasyfattXml(mapped, profileMap);

  // --- Mark orders as exported (+ auto-confirm pending) ---
  const exportedIds = mapped.map((o) => o.id);
  const pendingIds = mapped.filter((o) => o.status === "pending").map((o) => o.id);
  if (exportedIds.length > 0) {
    await db
      .update(orders)
      .set({ daneaExported: true, updatedAt: new Date() })
      .where(inArray(orders.id, exportedIds));
  }
  if (pendingIds.length > 0) {
    await db
      .update(orders)
      .set({ status: "confirmed", updatedAt: new Date() })
      .where(inArray(orders.id, pendingIds));
  }

  // --- Write export log ---
  try {
    await db.insert(daneaOrdersExportLogs).values({
      success: true,
      orderCount: exportedIds.length,
      orderIds: exportedIds,
      firstdate: firstdate ?? null,
      lastdate: lastdate ?? null,
    });
  } catch (e) {
    console.error("[danea-orders] export log insert failed", e);
  }

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": "inline; filename=orders.xml",
    },
  });
}

// ---- XML Builder ----

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function tag(name: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return `      <${name}>${escapeXml(String(value))}</${name}>\n`;
}

function rowTag(
  name: string,
  value: string | number | null | undefined
): string {
  if (value === null || value === undefined || value === "") return "";
  return `          <${name}>${escapeXml(String(value))}</${name}>\n`;
}

function buildEasyfattXml(
  orders: OrderRow[],
  profileMap: Map<string, ProfileInfo>
): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<EasyfattDocuments AppVersion="2" Creator="Shop NFC" CreatorUrl="shopnfc.bitora.it">\n`;
  xml += `  <Company>\n`;
  xml += `    <Name>Shop NFC</Name>\n`;
  xml += `  </Company>\n`;
  xml += `  <Documents>\n`;

  for (const order of orders) {
    const profile = order.user_id
      ? profileMap.get(order.user_id)
      : null;
    const ship = (order.shipping_address || {}) as ShippingAddress;
    const billing = (order.billing_address || {}) as { email?: string; vies_exempt?: boolean; vat_number?: string; company?: string };
    const isViesExempt = billing.vies_exempt === true;
    const date = order.created_at
      ? order.created_at.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    // Customer name: prefer profile, fallback to shipping name
    const customerName =
      profile && (profile.first_name || profile.last_name)
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
        : ship.name || "Ospite";

    xml += `    <Document>\n`;
    xml += tag("DocumentType", "C"); // C = Ordine cliente
    xml += tag("Date", date);
    xml += tag("Number", order.id);
    xml += tag("Numbering", ORDER_NUMBERING_SUFFIX); // sezionale, es. "11/A"
    xml += tag(
      "CustomerWebLogin",
      profile?.email || order.guest_email || billing.email
    );
    xml += tag("CustomerName", profile?.company || customerName);
    xml += tag(
      "CustomerAddress",
      profile?.address_line1 || ship.address
    );
    xml += tag("CustomerPostcode", ship.zip || profile?.postal_code);
    xml += tag("CustomerCity", ship.city || profile?.city);
    xml += tag("CustomerProvince", ship.province || profile?.province);
    xml += tag(
      "CustomerCountry",
      mapCountryCode(ship.country || profile?.country || "IT")
    );
    xml += tag("CustomerVatCode", billing.vat_number || profile?.vat_number);
    xml += tag(
      "CustomerTel",
      ship.phone || profile?.phone
    );
    xml += tag(
      "CustomerEmail",
      profile?.email || order.guest_email || billing.email
    );

    // Delivery address (from shipping_address if different)
    if (ship.name) {
      xml += tag("DeliveryName", ship.name);
      xml += tag("DeliveryAddress", ship.address);
      xml += tag("DeliveryPostcode", ship.zip);
      xml += tag("DeliveryCity", ship.city);
      xml += tag("DeliveryProvince", ship.province);
      xml += tag(
        "DeliveryCountry",
        mapCountryCode(ship.country || "IT")
      );
    }

    xml += tag("Total", order.total.toFixed(2));
    xml += tag("PricesIncludeVat", isViesExempt ? "false" : "true");

    // Shipping cost as CostAmount
    if (order.shipping_cost > 0) {
      xml += tag("CostDescription", "Spese di spedizione");
      xml += tag("CostAmount", order.shipping_cost.toFixed(2));
      if (isViesExempt) {
        xml += `      <CostVatCode Perc="0" Class="Non Imponibile" Description="Non imponibile art. 41 D.L.331/93">${EU_REVERSE_CHARGE_VAT_CODE}</CostVatCode>\n`;
      } else {
        xml += `      <CostVatCode Perc="22" Class="Imponibile" Description="IVA 22%">22</CostVatCode>\n`;
      }
    }

    // Payment info - map from payment method
    const paymentName = getPaymentName(order.payment_method, order.payment_status);
    xml += tag("PaymentName", paymentName);
    xml += tag("InternalComment", order.notes);

    // Rows
    xml += `      <Rows>\n`;
    for (const item of order.order_items) {
      const isMeterRow = item.product_name.toLowerCase().includes("vendita al metro");
      xml += `        <Row>\n`;
      xml += rowTag("Code", item.product_sku || `P${item.product_id}`);
      xml += rowTag("Description", item.product_name);
      xml += rowTag("Qty", item.quantity);
      xml += rowTag("Um", isMeterRow ? "m" : "pz");
      xml += rowTag("Price", item.unit_price.toFixed(2));
      if (item.discount_percent > 0) {
        xml += rowTag("Discounts", `${item.discount_percent}%`);
      }
      if (isViesExempt) {
        xml += `          <VatCode Perc="0" Class="Non Imponibile" Description="Non imponibile art. 41 D.L.331/93">${EU_REVERSE_CHARGE_VAT_CODE}</VatCode>\n`;
      } else {
        xml += `          <VatCode Perc="22" Class="Imponibile" Description="IVA 22%">22</VatCode>\n`;
      }
      xml += `        </Row>\n`;
    }
    xml += `      </Rows>\n`;

    // Payment (mark as paid for stripe/paypal/satispay; unpaid for legacy bank_transfer/cod)
    const isPaid = isOrderPaid(order.payment_status);
    xml += `      <Payments>\n`;
    xml += `        <Payment>\n`;
    xml += `          <Advance>false</Advance>\n`;
    xml += `          <Date>${date}</Date>\n`;
    xml += `          <Amount>${order.total.toFixed(2)}</Amount>\n`;
    xml += `          <Paid>${isPaid ? 'true' : 'false'}</Paid>\n`;
    xml += `        </Payment>\n`;
    xml += `      </Payments>\n`;

    xml += `    </Document>\n`;
  }

  xml += `  </Documents>\n`;
  xml += `</EasyfattDocuments>`;

  return xml;
}

function isOrderPaid(paymentStatus: string | null): boolean {
  if (!paymentStatus) return false;
  if (paymentStatus.startsWith("stripe:")) return true;
  if (paymentStatus.startsWith("paypal:")) return true;
  if (paymentStatus.startsWith("satispay:") && !paymentStatus.startsWith("satispay_pending")) {
    return true;
  }
  return false;
}

function getPaymentName(paymentMethod: string | null, paymentStatus: string | null): string {
  if (paymentMethod === 'stripe') return 'Carta di credito';
  if (paymentMethod === 'bank_transfer') return 'Bonifico bancario';
  if (paymentMethod === 'cod') return 'Contrassegno';
  if (paymentMethod === 'paypal') return 'PayPal';
  if (paymentMethod === 'satispay') return 'Satispay';
  if (paymentStatus?.startsWith('stripe:')) return 'Carta di credito';
  if (paymentStatus?.startsWith('paypal:')) return 'PayPal';
  if (paymentStatus?.startsWith('satispay')) return 'Satispay';
  return 'Carta di credito';
}

function mapCountryCode(code: string | null | undefined): string {
  if (!code) return "Italia";
  const map: Record<string, string> = {
    IT: "Italia",
    AT: "Austria",
    BE: "Belgio",
    BG: "Bulgaria",
    HR: "Croazia",
    DK: "Danimarca",
    EE: "Estonia",
    FI: "Finlandia",
    FR: "Francia",
    DE: "Germania",
    GR: "Grecia",
    IE: "Irlanda",
    LV: "Lettonia",
    LT: "Lituania",
    LU: "Lussemburgo",
    MT: "Malta",
    NL: "Paesi Bassi",
    PL: "Polonia",
    PT: "Portogallo",
    CZ: "Repubblica Ceca",
    RO: "Romania",
    SK: "Slovacchia",
    SI: "Slovenia",
    ES: "Spagna",
    SE: "Svezia",
    HU: "Ungheria",
    GB: "Regno Unito",
    CH: "Svizzera",
  };
  return map[code.toUpperCase()] || code;
}
