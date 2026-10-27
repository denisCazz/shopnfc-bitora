"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  FileText,
  Download,
  Eye,
  Plus,
  Trash2,
  Percent,
  Truck,
  User,
  Package,
  Printer,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { roundMoney } from "@/lib/pricing";
import { computeDiscountAmount } from "@/lib/discount";
import {
  type PrintOption,
  type PrintPrices,
  printSurcharge,
} from "@/lib/print-options";
import {
  type EuropeShippingMethod,
  type ShippingConfig,
  type ShippingZone,
} from "@/lib/shipping";

function calculateZoneShippingCost(
  totalWeightKg: number,
  zone: ShippingZone,
  config: ShippingConfig
): number {
  const weight = Math.max(totalWeightKg, 0.1);
  const zoneConfig = config.zones[zone];
  const sorted = [...zoneConfig.tiers].sort((a, b) => a.maxKg - b.maxKg);
  const tier =
    sorted.find((t) => weight <= t.maxKg) ?? sorted[sorted.length - 1];
  if (zoneConfig.includesIva) {
    return Math.round(tier.rate * (1 + config.ivaRate) * 100) / 100;
  }
  return tier.rate;
}

function calculateEuropeMethodShippingCost(
  method: EuropeShippingMethod,
  config: ShippingConfig
): number {
  if (method === "dhl") return config.dhlRate ?? 45.0;
  const sorted = [...config.zones.europe.tiers].sort(
    (a, b) => a.maxKg - b.maxKg
  );
  if (method === "standard_10") return sorted[0]?.rate ?? 20.0;
  return sorted[1]?.rate ?? sorted[0]?.rate ?? 30.0;
}
import {
  chargedItalianVat,
  grossToNetItalianVat,
  ITALIAN_VAT_RATE,
} from "@/lib/catalog-display-price";
import {
  buildQuotePdfDocument,
  loadImageAsDataUrl,
  type QuotePdfData,
  type QuotePdfLineItem,
} from "@/lib/quote-pdf";
import type { DiscountType } from "@/lib/types";
import { SITE } from "@/lib/site";

export interface AdminQuoteProduct {
  id: number;
  nameIt: string;
  slug: string;
  sku: string | null;
  retailPrice: number;
  catalogPrice: number;
  wholesalePrice: number | null;
  weightKg: number;
  minQuantity: number;
  stockQuantity: number;
  active: boolean;
  fragileShipping: boolean;
  fragileShippingCost: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
}

export interface AdminQuoteDiscountCode {
  id: number;
  code: string;
  type: DiscountType;
  value: number;
  minOrderAmount: number | null;
  note: string | null;
}

type PrintSidesKey = "none" | "color1" | "color2" | "black1" | "black2" | "custom";

interface QuoteFormLine {
  uid: string;
  productId: number | "custom";
  customModelName: string;
  customSku: string;
  quantity: string;
  hasGraphic: boolean;
  printSides: PrintSidesKey;
  customPrintLabel: string;
  unitBasePriceOverride: string;
  unitPrintSurchargeOverride: string;
  programmingLabel: string;
  notes: string;
}

const PRINT_SIDES_OPTIONS: {
  key: PrintSidesKey;
  label: string;
  shortLabel: string;
  optionForPrice: PrintOption;
  multiplier?: number;
}[] = [
  {
    key: "color1",
    label: "1 lato a colori (Solo fronte)",
    shortLabel: "1 lato (Fronte a colori)",
    optionForPrice: "color1",
  },
  {
    key: "color2",
    label: "2 lati a colori (Fronte / Retro)",
    shortLabel: "2 lati (Fronte / Retro a colori)",
    optionForPrice: "color2",
  },
  {
    key: "black1",
    label: "1 lato Nero / Monocromatico (Solo fronte)",
    shortLabel: "1 lato (Fronte nero)",
    optionForPrice: "black",
  },
  {
    key: "black2",
    label: "2 lati Nero / Monocromatico (Fronte / Retro)",
    shortLabel: "2 lati (Fronte / Retro nero)",
    optionForPrice: "black",
    multiplier: 2,
  },
  {
    key: "custom",
    label: "Personalizzato (incisione laser / serigrafia / altro)",
    shortLabel: "Personalizzato",
    optionForPrice: "color1",
  },
];

function formatDateIt(d: Date): string {
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function makeDefaultQuoteNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(100 + Math.random() * 900);
  return `PREV-${y}${m}${d}-${rand}`;
}

function formatEur(n: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(Number.isFinite(n) ? n : 0);
}

export default function PreventiviAdminClient({
  products,
  discountCodes,
  markup,
  printPrices,
  shippingConfig,
}: {
  products: AdminQuoteProduct[];
  discountCodes: AdminQuoteDiscountCode[];
  markup: number;
  printPrices: PrintPrices;
  shippingConfig: ShippingConfig;
}) {
  const defaultProduct = products[0];

  // Metadata
  const [quoteNumber, setQuoteNumber] = useState(makeDefaultQuoteNumber);
  const [issueDate, setIssueDate] = useState(() => formatDateIt(new Date()));
  const [validDays, setValidDays] = useState("15");

  // Customer info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Price list mode: "retail" (vetrina con ricarico), "catalog" (listino base), "b2b" (sconto rivenditore)
  const [priceListMode, setPriceListMode] = useState<"retail" | "catalog">("retail");
  const [pricesIncludeVat, setPricesIncludeVat] = useState(true);

  // Line items
  const [lines, setLines] = useState<QuoteFormLine[]>(() => [
    {
      uid: "line-1",
      productId: defaultProduct?.id ?? "custom",
      customModelName: "",
      customSku: "",
      quantity: "50",
      hasGraphic: true,
      printSides: "color1",
      customPrintLabel: "1 lato (Fronte)",
      unitBasePriceOverride: "",
      unitPrintSurchargeOverride: "",
      programmingLabel: "Inclusa nel prezzo",
      notes: "",
    },
  ]);

  // Discount options
  const [discountMode, setDiscountMode] = useState<
    "none" | "percent" | "fixed" | "code"
  >("none");
  const [discountValue, setDiscountValue] = useState<string>("10");
  const [selectedDiscountCode, setSelectedDiscountCode] = useState<string>(
    discountCodes[0]?.code ?? ""
  );
  const [customDiscountReason, setCustomDiscountReason] = useState<string>("");

  // Shipping options (always included in quote)
  const [shippingZone, setShippingZone] = useState<ShippingZone>("italy");
  const [europeMethod, setEuropeMethod] =
    useState<EuropeShippingMethod>("standard_10");
  const [customShippingOverride, setCustomShippingOverride] =
    useState<string>("");

  // Extra quote notes & terms
  const [deliveryEstimate, setDeliveryEstimate] = useState(
    "5–7 giorni lavorativi da approvazione grafica"
  );
  const [paymentTerms, setPaymentTerms] = useState(
    "Bonifico bancario / Carta di credito (Stripe)"
  );
  const [customNotes, setCustomNotes] = useState("");

  // Cached Bitora logo data URL for PDF embedding
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    loadImageAsDataUrl("/bitora.png").then((url) => {
      if (url) setLogoDataUrl(url);
    });
  }, []);

  const validUntilDate = useMemo(() => {
    const d = new Date();
    const parsedDays = parseInt(validDays, 10);
    d.setDate(d.getDate() + (Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 15));
    return formatDateIt(d);
  }, [validDays]);

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  const getDefaultBasePrice = useCallback(
    (prod: AdminQuoteProduct | undefined): number => {
      if (!prod) return 0;
      const rawGross =
        priceListMode === "catalog" ? prod.catalogPrice : prod.retailPrice;
      return pricesIncludeVat ? rawGross : grossToNetItalianVat(rawGross);
    },
    [priceListMode, pricesIncludeVat]
  );

  const getDefaultPrintSurcharge = useCallback(
    (hasGraphic: boolean, sides: PrintSidesKey): number => {
      if (!hasGraphic || sides === "none") return 0;
      const found = PRINT_SIDES_OPTIONS.find((o) => o.key === sides);
      if (!found) return 0;
      const baseExtra = printSurcharge(found.optionForPrice, printPrices);
      const mult = found.multiplier ?? 1;
      const grossExtra = roundMoney(baseExtra * mult);
      return pricesIncludeVat ? grossExtra : grossToNetItalianVat(grossExtra);
    },
    [printPrices, pricesIncludeVat]
  );

  // Computed line items + weight + fragile shipping
  const computedLines = useMemo(() => {
    let totalWeightKg = 0;
    let fragileNetTotal = 0;

    const pdfItems: QuotePdfLineItem[] = lines.map((line) => {
      const prod =
        line.productId !== "custom"
          ? productMap.get(line.productId)
          : undefined;

      const parsedQty = parseInt(String(line.quantity).trim(), 10);
      const qty = Number.isFinite(parsedQty) && parsedQty >= 1 ? parsedQty : 1;

      const defaultBase = getDefaultBasePrice(prod);
      const parsedBaseOverride = parseFloat(
        line.unitBasePriceOverride.replace(",", ".")
      );
      const baseUnitPrice =
        line.unitBasePriceOverride.trim() !== "" &&
        Number.isFinite(parsedBaseOverride) &&
        parsedBaseOverride >= 0
          ? roundMoney(parsedBaseOverride)
          : defaultBase;

      const defaultPrint = getDefaultPrintSurcharge(
        line.hasGraphic,
        line.printSides
      );
      const parsedPrintOverride = parseFloat(
        line.unitPrintSurchargeOverride.replace(",", ".")
      );
      const printUnitSurcharge = !line.hasGraphic
        ? 0
        : line.unitPrintSurchargeOverride.trim() !== "" &&
            Number.isFinite(parsedPrintOverride) &&
            parsedPrintOverride >= 0
          ? roundMoney(parsedPrintOverride)
          : defaultPrint;

      const finalUnitPrice = roundMoney(baseUnitPrice + printUnitSurcharge);
      const lineTotal = roundMoney(finalUnitPrice * qty);

      // Sides label
      let printSidesLabel = "Nessuna stampa (Neutro)";
      if (line.hasGraphic) {
        if (line.printSides === "custom") {
          printSidesLabel =
            line.customPrintLabel.trim() || "Personalizzata (1 o 2 lati)";
        } else {
          const opt = PRINT_SIDES_OPTIONS.find(
            (o) => o.key === line.printSides
          );
          printSidesLabel = opt?.shortLabel || "1 lato (Fronte)";
        }
      }

      // Accumulate weight & fragile
      const itemWeight = prod?.weightKg ?? 0.05;
      totalWeightKg += itemWeight * qty;
      if (prod?.fragileShipping && prod.fragileShippingCost > 0) {
        fragileNetTotal += prod.fragileShippingCost * qty;
      }

      return {
        productName:
          line.productId === "custom"
            ? line.customModelName.trim() || "Modello NFC Personalizzato"
            : prod?.nameIt || "Prodotto NFC",
        sku:
          line.productId === "custom"
            ? line.customSku.trim() || null
            : prod?.sku || null,
        categoryName: prod?.categoryName || null,
        quantity: qty,
        hasGraphic: line.hasGraphic,
        printSidesLabel,
        baseUnitPrice,
        printUnitSurcharge,
        finalUnitPrice,
        lineTotal,
        programmingLabel: line.programmingLabel.trim() || null,
        notes: line.notes.trim() || null,
      };
    });

    return { pdfItems, totalWeightKg, fragileNetTotal };
  }, [lines, productMap, getDefaultBasePrice, getDefaultPrintSurcharge]);

  const subtotal = useMemo(
    () =>
      roundMoney(
        computedLines.pdfItems.reduce((acc, item) => acc + item.lineTotal, 0)
      ),
    [computedLines.pdfItems]
  );

  // Compute discount
  const { discountAmount, discountLabel } = useMemo(() => {
    if (discountMode === "none" || subtotal <= 0) {
      return { discountAmount: 0, discountLabel: null };
    }
    if (discountMode === "code") {
      const found = discountCodes.find((d) => d.code === selectedDiscountCode);
      if (!found) return { discountAmount: 0, discountLabel: null };
      const amt = computeDiscountAmount(subtotal, found.type, found.value);
      const valDesc =
        found.type === "percent" ? `${found.value}%` : formatEur(found.value);
      return {
        discountAmount: amt,
        discountLabel: `Codice ${found.code} (-${valDesc})`,
      };
    }
    const rawVal = parseFloat(discountValue.replace(",", "."));
    if (!Number.isFinite(rawVal) || rawVal <= 0) {
      return { discountAmount: 0, discountLabel: null };
    }
    const amt = computeDiscountAmount(subtotal, discountMode, rawVal);
    const reasonSuffix = customDiscountReason.trim()
      ? ` · ${customDiscountReason.trim()}`
      : "";
    const label =
      discountMode === "percent"
        ? `${rawVal}%${reasonSuffix}`
        : `Sconto fisso${reasonSuffix}`;
    return { discountAmount: amt, discountLabel: label };
  }, [
    discountMode,
    discountValue,
    selectedDiscountCode,
    customDiscountReason,
    subtotal,
    discountCodes,
  ]);

  const subtotalAfterDiscount = useMemo(
    () => roundMoney(Math.max(0, subtotal - discountAmount)),
    [subtotal, discountAmount]
  );

  // Compute shipping (always included)
  const { calculatedShippingCost, finalShippingCost, shippingZoneLabel } =
    useMemo(() => {
      const zoneCfg = shippingConfig.zones[shippingZone];
      const baseShip =
        shippingZone === "europe"
          ? calculateEuropeMethodShippingCost(europeMethod, shippingConfig)
          : calculateZoneShippingCost(
              computedLines.totalWeightKg,
              shippingZone,
              shippingConfig
            );

      const fragileExtra =
        computedLines.fragileNetTotal > 0
          ? zoneCfg.includesIva && pricesIncludeVat
            ? roundMoney(
                computedLines.fragileNetTotal * (1 + shippingConfig.ivaRate)
              )
            : roundMoney(computedLines.fragileNetTotal)
          : 0;

      // If Italy zone and user toggled pricesExcludeVat, convert gross shipping to net
      const rawAutoShip = roundMoney(baseShip + fragileExtra);
      const autoShip =
        !pricesIncludeVat && zoneCfg.includesIva
          ? grossToNetItalianVat(rawAutoShip)
          : rawAutoShip;

      const parsedOverride = parseFloat(
        customShippingOverride.replace(",", ".")
      );
      const finalShip =
        customShippingOverride.trim() !== "" &&
        Number.isFinite(parsedOverride) &&
        parsedOverride >= 0
          ? roundMoney(parsedOverride)
          : autoShip;

      let label = zoneCfg?.label || "Italia";
      if (shippingZone === "europe") {
        const methodLbl =
          europeMethod === "dhl"
            ? "DHL Express"
            : europeMethod === "standard_10"
              ? "Standard ≤10kg"
              : "Standard ≤30kg";
        label = `Europa (${methodLbl})`;
      }

      return {
        calculatedShippingCost: autoShip,
        finalShippingCost: finalShip,
        shippingZoneLabel: label,
      };
    }, [
      shippingZone,
      europeMethod,
      shippingConfig,
      computedLines.totalWeightKg,
      computedLines.fragileNetTotal,
      pricesIncludeVat,
      customShippingOverride,
    ]);

  const totalGross = useMemo(
    () => roundMoney(subtotalAfterDiscount + finalShippingCost),
    [subtotalAfterDiscount, finalShippingCost]
  );

  const vatAmount = useMemo(() => {
    const zoneCfg = shippingConfig.zones[shippingZone];
    return chargedItalianVat({
      productsGrossAfterDiscount: subtotalAfterDiscount,
      shippingGross: finalShippingCost,
      italianVatIncluded: pricesIncludeVat,
      shippingIncludesIva: zoneCfg?.includesIva ?? true,
    });
  }, [
    subtotalAfterDiscount,
    finalShippingCost,
    pricesIncludeVat,
    shippingConfig,
    shippingZone,
  ]);

  const netTotal = useMemo(
    () => roundMoney(totalGross - vatAmount),
    [totalGross, vatAmount]
  );

  function updateLine(uid: string, patch: Partial<QuoteFormLine>) {
    setLines((prev) =>
      prev.map((l) => (l.uid === uid ? { ...l, ...patch } : l))
    );
  }

  function addLine() {
    const nextUid = `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setLines((prev) => [
      ...prev,
      {
        uid: nextUid,
        productId: defaultProduct?.id ?? "custom",
        customModelName: "",
        customSku: "",
        quantity: "50",
        hasGraphic: true,
        printSides: "color1",
        customPrintLabel: "1 lato (Fronte)",
        unitBasePriceOverride: "",
        unitPrintSurchargeOverride: "",
        programmingLabel: "Inclusa nel prezzo",
        notes: "",
      },
    ]);
  }

  function removeLine(uid: string) {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.uid !== uid));
  }

  function resetAll() {
    setQuoteNumber(makeDefaultQuoteNumber());
    setIssueDate(formatDateIt(new Date()));
    setFirstName("");
    setLastName("");
    setCompany("");
    setVatNumber("");
    setEmail("");
    setPhone("");
    setAddress("");
    setDiscountMode("none");
    setDiscountValue("10");
    setCustomDiscountReason("");
    setCustomShippingOverride("");
    setCustomNotes("");
    setLines([
      {
        uid: `line-${Date.now()}`,
        productId: defaultProduct?.id ?? "custom",
        customModelName: "",
        customSku: "",
        quantity: "50",
        hasGraphic: true,
        printSides: "color1",
        customPrintLabel: "1 lato (Fronte)",
        unitBasePriceOverride: "",
        unitPrintSurchargeOverride: "",
        programmingLabel: "Inclusa nel prezzo",
        notes: "",
      },
    ]);
  }

  function buildPdfData(): QuotePdfData {
    return {
      quoteNumber: quoteNumber.trim() || makeDefaultQuoteNumber(),
      issueDate: issueDate.trim() || formatDateIt(new Date()),
      validUntilDate,
      firstName: firstName.trim() || "Cliente",
      lastName: lastName.trim(),
      company: company.trim() || undefined,
      vatNumber: vatNumber.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      items: computedLines.pdfItems,
      subtotal,
      discountLabel,
      discountAmount,
      subtotalAfterDiscount,
      shippingZoneLabel,
      shippingCost: finalShippingCost,
      totalGross,
      netTotal,
      vatAmount,
      vatRatePercent: Math.round(ITALIAN_VAT_RATE * 100),
      pricesIncludeVat,
      paymentTerms,
      deliveryEstimate,
      customNotes,
      logoDataUrl,
    };
  }

  async function handleDownloadPdf(mode: "download" | "preview") {
    setGenerating(true);
    setGeneratedSuccess(false);
    setPdfError(null);

    const payload = buildPdfData();
    const safeQuote = (payload.quoteNumber || "PREVENTIVO").replace(
      /[^a-zA-Z0-9_-]+/g,
      "_"
    );
    const safeCustomer = `${firstName.trim()}_${lastName.trim()}`
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const fileName = `Preventivo_Bitora_${safeQuote}${
      safeCustomer ? `_${safeCustomer}` : ""
    }.pdf`;

    function triggerBlobAction(blob: Blob) {
      const url = URL.createObjectURL(blob);
      if (mode === "preview") {
        const win = window.open(url, "_blank");
        if (!win) {
          const a = document.createElement("a");
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }

    try {
      const res = await fetch("/api/admin/preventivo-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, inline: mode === "preview" }),
      });

      if (res.ok) {
        const rawBlob = await res.blob();
        const pdfBlob = new Blob([rawBlob], { type: "application/pdf" });
        triggerBlobAction(pdfBlob);
        setGeneratedSuccess(true);
        setTimeout(() => setGeneratedSuccess(false), 3500);
        return;
      }

      // Fallback client-side generation if API fails
      let currentLogo = logoDataUrl;
      if (!currentLogo) {
        currentLogo = await loadImageAsDataUrl("/bitora.png");
        if (currentLogo) setLogoDataUrl(currentLogo);
      }
      const doc = buildQuotePdfDocument({ ...payload, logoDataUrl: currentLogo });
      const arrayBuffer = doc.output("arraybuffer");
      const pdfBlob = new Blob([arrayBuffer], { type: "application/pdf" });
      triggerBlobAction(pdfBlob);
      setGeneratedSuccess(true);
      setTimeout(() => setGeneratedSuccess(false), 3500);
    } catch (err) {
      console.error("PDF download error:", err);
      setPdfError(
        err instanceof Error
          ? `Errore generazione PDF: ${err.message}`
          : "Errore durante il download del PDF."
      );
    } finally {
      setGenerating(false);
    }
  }

  // Group products by category for the select dropdown
  const groupedProducts = useMemo(() => {
    const map = new Map<string, AdminQuoteProduct[]>();
    for (const p of products) {
      const list = map.get(p.categoryName) || [];
      list.push(p);
      map.set(p.categoryName, list);
    }
    return Array.from(map.entries());
  }, [products]);

  const inputClass =
    "w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1">
            <Sparkles className="w-4 h-4" />
            Strumento Preventivazione Rapida
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Generatore Preventivi PDF Bitora
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Seleziona cliente, modello dal gestionale, quantità, grafica (sì/no), lati di stampa, sconto e spedizione per scaricare un preventivo PDF ordinato con logo Bitora.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-hover text-xs font-semibold text-muted hover:text-foreground transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Nuovo / Reset
          </button>
          <button
            type="button"
            disabled={generating}
            onClick={() => handleDownloadPdf("preview")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-accent/50 bg-sky-50/70 dark:bg-sky-950/30 text-accent text-sm font-semibold hover:bg-sky-100/80 transition disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            Anteprima PDF
          </button>
          <button
            type="button"
            disabled={generating}
            onClick={() => handleDownloadPdf("download")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white text-sm font-semibold shadow hover:shadow-lg hover:shadow-sky-500/25 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {generating ? "Generazione PDF..." : "Scarica Preventivo PDF"}
          </button>
        </div>
      </div>

      {generatedSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Preventivo PDF generato e scaricato con successo!
        </div>
      )}

      {pdfError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium">
          {pdfError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CONFIGURATION FORM */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. CLIENT DETAILS */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
                  <User className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-base">
                    1. Dati Cliente &amp; Riferimento Preventivo
                  </h2>
                  <p className="text-xs text-muted">
                    Inserisci Nome e Cognome del referente ed eventuali dati aziendali
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Es. Mario"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Cognome *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Es. Rossi"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Azienda / Ragione Sociale (opzionale)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Es. Rossi S.r.l."
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  P.IVA / Codice Fiscale (opzionale)
                </label>
                <input
                  type="text"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  placeholder="Es. IT01234567890"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Email (opzionale)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mario@azienda.it"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Telefono / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 333 1234567"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Città / Indirizzo
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Es. Milano (MI)"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-border/60">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Numero Preventivo
                </label>
                <input
                  type="text"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Data Emissione
                </label>
                <input
                  type="text"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Validità (giorni)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={365}
                  value={validDays}
                  onChange={(e) => setValidDays(e.target.value)}
                  placeholder="15"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* 2. PRODUCT MODEL, QUANTITY, GRAPHIC YES/NO & SIDES TO PRINT */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
                  <Package className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-base">
                    2. Modello, Quantità, Grafica (Sì/No) e Lati da Stampare
                  </h2>
                  <p className="text-xs text-muted">
                    Prezzi caricati automaticamente dal gestionale (moltiplicatore vetrina ×{markup.toFixed(2)} · Stampa nero +{formatEur(printPrices.black)}, 1 lato colori +{formatEur(printPrices.color1)}, 2 lati colori +{formatEur(printPrices.color2)})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-accent text-xs font-semibold hover:bg-sky-100 transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Aggiungi altro modello
              </button>
            </div>

            {/* Price list mode bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-border text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-muted uppercase">
                  Listino gestionale:
                </span>
                <button
                  type="button"
                  onClick={() => setPriceListMode("retail")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    priceListMode === "retail"
                      ? "bg-accent text-white"
                      : "bg-surface border border-border text-muted hover:text-foreground"
                  }`}
                >
                  Prezzo Vetrina (×{markup.toFixed(2)})
                </button>
                <button
                  type="button"
                  onClick={() => setPriceListMode("catalog")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    priceListMode === "catalog"
                      ? "bg-accent text-white"
                      : "bg-surface border border-border text-muted hover:text-foreground"
                  }`}
                >
                  Listino Base Fornitore
                </button>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={pricesIncludeVat}
                  onChange={(e) => setPricesIncludeVat(e.target.checked)}
                  className="rounded border-border text-accent"
                />
                Prezzi IVA 22% inclusa
              </label>
            </div>

            <div className="space-y-4">
              {lines.map((line, index) => {
                const prod =
                  line.productId !== "custom"
                    ? productMap.get(line.productId)
                    : undefined;
                const computed = computedLines.pdfItems[index];
                const defaultBase = getDefaultBasePrice(prod);
                const defaultPrint = getDefaultPrintSurcharge(
                  line.hasGraphic,
                  line.printSides
                );

                return (
                  <div
                    key={line.uid}
                    className="p-4 rounded-2xl border border-border bg-background/60 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                        Articolo #{index + 1}
                        {prod?.categoryName ? (
                          <span className="text-muted font-normal">
                            · {prod.categoryName}
                          </span>
                        ) : null}
                      </span>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(line.uid)}
                          className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Rimuovi
                        </button>
                      )}
                    </div>

                    {/* Model selection + Quantity */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                      <div className="sm:col-span-8">
                        <label className="block text-xs font-semibold text-muted uppercase mb-1">
                          Modello dal Gestionale *
                        </label>
                        <select
                          value={String(line.productId)}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "custom") {
                              updateLine(line.uid, {
                                productId: "custom",
                                unitBasePriceOverride: "1.50",
                              });
                            } else {
                              const pid = parseInt(val, 10);
                              updateLine(line.uid, {
                                productId: pid,
                                unitBasePriceOverride: "",
                              });
                            }
                          }}
                          className={inputClass}
                        >
                          {groupedProducts.map(([catName, catProds]) => (
                            <optgroup key={catName} label={catName}>
                              {catProds.map((p) => {
                                const displayP =
                                  priceListMode === "catalog"
                                    ? p.catalogPrice
                                    : p.retailPrice;
                                const shownPrice = pricesIncludeVat
                                  ? displayP
                                  : grossToNetItalianVat(displayP);
                                return (
                                  <option key={p.id} value={p.id}>
                                    {p.nameIt}{" "}
                                    {p.sku ? `[${p.sku}]` : ""} —{" "}
                                    {formatEur(shownPrice)}/pz
                                    {!p.active ? " (Non attivo)" : ""}
                                  </option>
                                );
                              })}
                            </optgroup>
                          ))}
                          <optgroup label="Fuori catalogo">
                            <option value="custom">
                              + Modello personalizzato / fuori catalogo...
                            </option>
                          </optgroup>
                        </select>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-xs font-semibold text-muted uppercase mb-1">
                          Quantità (pz) *
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          step={1}
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(line.uid, {
                              quantity: e.target.value,
                            })
                          }
                          placeholder="Es. 50"
                          className={`${inputClass} font-semibold tabular-nums`}
                        />
                      </div>
                    </div>

                    {line.productId === "custom" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-muted uppercase mb-1">
                            Nome Modello Personalizzato *
                          </label>
                          <input
                            type="text"
                            value={line.customModelName}
                            onChange={(e) =>
                              updateLine(line.uid, {
                                customModelName: e.target.value,
                              })
                            }
                            placeholder="Es. Tessera NFC Legno Incisa NTAG213"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted uppercase mb-1">
                            Codice / SKU (opzionale)
                          </label>
                          <input
                            type="text"
                            value={line.customSku}
                            onChange={(e) =>
                              updateLine(line.uid, {
                                customSku: e.target.value,
                              })
                            }
                            placeholder="Es. CUSTOM-NFC"
                            className={inputClass}
                          />
                        </div>
                      </div>
                    )}

                    {/* GRAPHIC YES/NO & SIDES TO PRINT */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-2 border-t border-border/60">
                      <div className="sm:col-span-5">
                        <label className="block text-xs font-semibold text-muted uppercase mb-1.5">
                          Grafica Personalizzata *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateLine(line.uid, {
                                hasGraphic: true,
                                printSides:
                                  line.printSides === "none"
                                    ? "color1"
                                    : line.printSides,
                              })
                            }
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                              line.hasGraphic
                                ? "border-accent bg-sky-50 dark:bg-sky-950/40 text-accent ring-1 ring-accent"
                                : "border-border bg-surface text-muted hover:text-foreground"
                            }`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            SÌ · Con grafica
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateLine(line.uid, {
                                hasGraphic: false,
                                unitPrintSurchargeOverride: "",
                              })
                            }
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                              !line.hasGraphic
                                ? "border-accent bg-sky-50 dark:bg-sky-950/40 text-accent ring-1 ring-accent"
                                : "border-border bg-surface text-muted hover:text-foreground"
                            }`}
                          >
                            NO · Neutro
                          </button>
                        </div>
                      </div>

                      <div className="sm:col-span-7">
                        <label className="block text-xs font-semibold text-muted uppercase mb-1.5">
                          Lati da Stampare &amp; Tipologia Stampa
                        </label>
                        {line.hasGraphic ? (
                          <div className="space-y-2">
                            <select
                              value={line.printSides}
                              onChange={(e) =>
                                updateLine(line.uid, {
                                  printSides: e.target.value as PrintSidesKey,
                                  unitPrintSurchargeOverride: "",
                                })
                              }
                              className={inputClass}
                            >
                              {PRINT_SIDES_OPTIONS.map((opt) => {
                                const extra = getDefaultPrintSurcharge(
                                  true,
                                  opt.key
                                );
                                return (
                                  <option key={opt.key} value={opt.key}>
                                    {opt.label} (+{formatEur(extra)}/pz)
                                  </option>
                                );
                              })}
                            </select>

                            {line.printSides === "custom" && (
                              <input
                                type="text"
                                value={line.customPrintLabel}
                                onChange={(e) =>
                                  updateLine(line.uid, {
                                    customPrintLabel: e.target.value,
                                  })
                                }
                                placeholder="Descrivi lati e stampa (es. Incisione laser 2 lati fronte/retro)"
                                className={inputClass}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="px-3 py-2 rounded-xl border border-border bg-stone-50 dark:bg-stone-800/40 text-xs text-muted">
                            Nessun lato stampato — Fornitura prodotto neutro / bianco
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Unit price from gestionale + optional manual override */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60">
                      <div>
                        <label className="block text-[11px] font-semibold text-muted uppercase mb-1">
                          Prezzo Base / pz (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.unitBasePriceOverride}
                          onChange={(e) =>
                            updateLine(line.uid, {
                              unitBasePriceOverride: e.target.value,
                            })
                          }
                          placeholder={`Da gestionale: ${defaultBase.toFixed(2)} €`}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-muted uppercase mb-1">
                          Sovrapprezzo Stampa / pz (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={!line.hasGraphic}
                          value={line.unitPrintSurchargeOverride}
                          onChange={(e) =>
                            updateLine(line.uid, {
                              unitPrintSurchargeOverride: e.target.value,
                            })
                          }
                          placeholder={
                            line.hasGraphic
                              ? `Da gestionale: +${defaultPrint.toFixed(2)} €`
                              : "0,00 € (No grafica)"
                          }
                          className={`${inputClass} disabled:opacity-50`}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-muted uppercase mb-1">
                          Programmazione Chip
                        </label>
                        <input
                          type="text"
                          value={line.programmingLabel}
                          onChange={(e) =>
                            updateLine(line.uid, {
                              programmingLabel: e.target.value,
                            })
                          }
                          placeholder="Es. Inclusa nel prezzo / Vergini"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <input
                        type="text"
                        value={line.notes}
                        onChange={(e) =>
                          updateLine(line.uid, { notes: e.target.value })
                        }
                        placeholder="Nota specifica riga (opzionale, es. serializzazione UID in Excel, numerazione progressiva...)"
                        className={`${inputClass} text-xs flex-1`}
                      />
                      {computed && (
                        <div className="text-right shrink-0">
                          <span className="text-xs text-muted block">
                            {formatEur(computed.finalUnitPrice)}/pz ×{" "}
                            {computed.quantity} pz
                          </span>
                          <span className="text-sm font-bold text-accent tabular-nums">
                            Totale riga: {formatEur(computed.lineTotal)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. DISCOUNTS & SHIPPING (ALWAYS INCLUDED) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Discount Box */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border pb-3">
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
                  <Percent className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-base">
                    3. Sconto Preventivo
                  </h2>
                  <p className="text-xs text-muted">
                    Percentuale, fisso in € o codice sconto
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["none", "Nessuno sconto"],
                    ["percent", "Sconto %"],
                    ["fixed", "Sconto fisso (€)"],
                    ["code", "Codice dal gestionale"],
                  ] as const
                ).map(([mode, lbl]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDiscountMode(mode)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition ${
                      discountMode === mode
                        ? "border-accent bg-sky-50 dark:bg-sky-950/40 text-accent"
                        : "border-border bg-background text-muted hover:text-foreground"
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {discountMode === "percent" || discountMode === "fixed" ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase mb-1">
                      {discountMode === "percent"
                        ? "Percentuale di sconto (%)"
                        : "Importo sconto (€)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={discountMode === "percent" ? 100 : undefined}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase mb-1">
                      Causale / Etichetta Sconto (opzionale)
                    </label>
                    <input
                      type="text"
                      value={customDiscountReason}
                      onChange={(e) => setCustomDiscountReason(e.target.value)}
                      placeholder="Es. Sconto quantità / Offerta riservata B2B"
                      className={inputClass}
                    />
                  </div>
                </div>
              ) : null}

              {discountMode === "code" && (
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase mb-1">
                    Seleziona Codice Sconto Attivo
                  </label>
                  {discountCodes.length > 0 ? (
                    <select
                      value={selectedDiscountCode}
                      onChange={(e) => setSelectedDiscountCode(e.target.value)}
                      className={inputClass}
                    >
                      {discountCodes.map((d) => (
                        <option key={d.id} value={d.code}>
                          {d.code} —{" "}
                          {d.type === "percent"
                            ? `-${d.value}%`
                            : `-${formatEur(d.value)}`}
                          {d.note ? ` (${d.note})` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-muted">
                      Nessun codice sconto attivo nel gestionale. Usa Sconto % o Sconto fisso.
                    </p>
                  )}
                </div>
              )}

              {discountAmount > 0 && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-between">
                  <span>Risparmio applicato:</span>
                  <span>-{formatEur(discountAmount)}</span>
                </div>
              )}
            </div>

            {/* Shipping Box (always included) */}
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border pb-3">
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-base">
                    4. Spedizione (Sempre Inclusa)
                  </h2>
                  <p className="text-xs text-muted">
                    Tariffa calcolata dal gestionale ({computedLines.totalWeightKg.toFixed(2)} kg stimati)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Zona Geografica Spedizione
                </label>
                <select
                  value={shippingZone}
                  onChange={(e) =>
                    setShippingZone(e.target.value as ShippingZone)
                  }
                  className={inputClass}
                >
                  <option value="italy">
                    Italia (Penisola) — {formatEur(calculateZoneShippingCost(computedLines.totalWeightKg, "italy", shippingConfig))}
                  </option>
                  <option value="islands_calabria">
                    Isole e Calabria — {formatEur(calculateZoneShippingCost(computedLines.totalWeightKg, "islands_calabria", shippingConfig))}
                  </option>
                  <option value="europe">Europa / Estero</option>
                </select>
              </div>

              {shippingZone === "europe" && (
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase mb-1">
                    Metodo Spedizione Europa
                  </label>
                  <select
                    value={europeMethod}
                    onChange={(e) =>
                      setEuropeMethod(e.target.value as EuropeShippingMethod)
                    }
                    className={inputClass}
                  >
                    <option value="standard_10">
                      Corriere Standard (fino a 10 kg) —{" "}
                      {formatEur(
                        calculateEuropeMethodShippingCost("standard_10", shippingConfig)
                      )}
                    </option>
                    <option value="standard_30">
                      Corriere Standard (fino a 30 kg) —{" "}
                      {formatEur(
                        calculateEuropeMethodShippingCost("standard_30", shippingConfig)
                      )}
                    </option>
                    <option value="dhl">
                      DHL Express Rapido —{" "}
                      {formatEur(calculateEuropeMethodShippingCost("dhl", shippingConfig))}
                    </option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Importo Spedizione Personalizzato (€, opzionale)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customShippingOverride}
                  onChange={(e) => setCustomShippingOverride(e.target.value)}
                  placeholder={`Da gestionale: ${calculatedShippingCost.toFixed(2)} €`}
                  className={inputClass}
                />
              </div>

              <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800 text-xs text-foreground flex items-center justify-between">
                <span className="font-medium">
                  Spedizione nel preventivo ({shippingZoneLabel}):
                </span>
                <span className="font-bold text-accent">
                  {formatEur(finalShippingCost)}
                </span>
              </div>
            </div>
          </div>

          {/* 5. EXTRA NOTES & CONDITIONS */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-foreground text-base">
              5. Condizioni di Consegna, Pagamento e Note
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Tempi di Consegna Stimati
                </label>
                <input
                  type="text"
                  value={deliveryEstimate}
                  onChange={(e) => setDeliveryEstimate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">
                  Modalità di Pagamento
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase mb-1">
                Note Personalizzate sul Preventivo (opzionale)
              </label>
              <textarea
                rows={2}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Es. Offerta comprensiva di verifica file grafico e codifica URL personalizzato..."
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE DOCUMENT PREVIEW */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
          <div className="bg-surface border-2 border-border rounded-2xl overflow-hidden shadow-lg">
            {/* Dark Bitora Header Preview */}
            <div className="bg-slate-900 text-white p-5 border-b-4 border-sky-500">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-black p-1 border border-slate-700 shrink-0 flex items-center justify-center">
                    <Image
                      src="/bitora.png"
                      alt="Bitora"
                      width={44}
                      height={44}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-extrabold tracking-tight text-base leading-tight">
                      SHOP NFC <span className="text-sky-400">BITORA</span>
                    </p>
                    <p className="text-[11px] text-sky-200 mt-0.5">
                      {SITE.tagline}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {SITE.legalName} · P.IVA IT{SITE.vat}
                    </p>
                  </div>
                </div>

                <div className="text-right bg-slate-800/90 px-3 py-2 rounded-xl border border-slate-700 shrink-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-sky-400">
                    Preventivo Ufficiale
                  </span>
                  <span className="block text-xs font-mono font-bold text-white mt-0.5">
                    {quoteNumber || "PREV-2026"}
                  </span>
                  <span className="block text-[10px] text-slate-300 mt-0.5">
                    Del {issueDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Body of Live Preview */}
            <div className="p-5 space-y-5 text-xs">
              {/* Recipient & Conditions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-border space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">
                    Destinatario
                  </span>
                  <p className="font-bold text-foreground text-sm">
                    {`${firstName.trim()} ${lastName.trim()}`.trim() ||
                      "Nome Cognome Cliente"}
                  </p>
                  {company.trim() && (
                    <p className="text-muted flex items-center gap-1">
                      <Building2 className="w-3 h-3 shrink-0" />
                      {company.trim()}
                    </p>
                  )}
                  {vatNumber.trim() && (
                    <p className="text-muted">P.IVA/C.F.: {vatNumber.trim()}</p>
                  )}
                  {(email.trim() || phone.trim()) && (
                    <p className="text-muted truncate">
                      {[email.trim(), phone.trim()].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {address.trim() && <p className="text-muted">{address.trim()}</p>}
                </div>

                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-border space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">
                    Dettagli Fornitura
                  </span>
                  <p className="text-foreground">
                    <span className="text-muted">Validità:</span> fino al{" "}
                    {validUntilDate}
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted">Spedizione:</span>{" "}
                    {shippingZoneLabel}
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted">Consegna:</span>{" "}
                    {deliveryEstimate}
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted">Regime:</span>{" "}
                    {pricesIncludeVat ? "IVA 22% inclusa" : "IVA esclusa / N.I."}
                  </p>
                </div>
              </div>

              {/* Items Table Preview */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Riepilogo Articoli nel PDF
                </p>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[10px] uppercase">
                        <th className="py-2 px-2.5 text-left">Modello &amp; Stampa</th>
                        <th className="py-2 px-2 text-center">Qtà</th>
                        <th className="py-2 px-2 text-right">Prezzo/pz</th>
                        <th className="py-2 px-2.5 text-right">Totale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {computedLines.pdfItems.map((item, i) => (
                        <tr key={i} className="bg-surface">
                          <td className="py-2.5 px-2.5">
                            <p className="font-bold text-foreground">
                              {item.productName}
                            </p>
                            <p className="text-[11px] text-accent font-medium mt-0.5">
                              {item.hasGraphic
                                ? `Grafica: SÌ · ${item.printSidesLabel}`
                                : "Grafica: NO (Neutro)"}
                            </p>
                            {item.printUnitSurcharge > 0 && (
                              <p className="text-[10px] text-muted">
                                Base {formatEur(item.baseUnitPrice)} + Stampa{" "}
                                {formatEur(item.printUnitSurcharge)}
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center font-semibold tabular-nums">
                            {item.quantity} pz
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums">
                            {formatEur(item.finalUnitPrice)}
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-bold tabular-nums">
                            {formatEur(item.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Preview */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <div className="flex justify-between text-muted">
                  <span>Subtotale articoli:</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatEur(subtotal)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <>
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>
                        Sconto{discountLabel ? ` (${discountLabel})` : ""}:
                      </span>
                      <span className="tabular-nums">
                        -{formatEur(discountAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>Subtotale scontato:</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatEur(subtotalAfterDiscount)}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-muted">
                  <span>Spedizione ({shippingZoneLabel}):</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatEur(finalShippingCost)}
                  </span>
                </div>

                {pricesIncludeVat && (
                  <div className="flex justify-between text-[11px] text-muted">
                    <span>Di cui IVA 22% (imponibile {formatEur(netTotal)}):</span>
                    <span className="tabular-nums">{formatEur(vatAmount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 mt-2 rounded-xl bg-slate-900 text-white">
                  <span className="font-bold uppercase tracking-wide text-sky-300 text-xs">
                    Totale Preventivo
                  </span>
                  <span className="text-lg font-extrabold tabular-nums">
                    {formatEur(totalGross)}
                  </span>
                </div>
              </div>

              {/* Action buttons inside preview card */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={generating}
                  onClick={() => handleDownloadPdf("preview")}
                  className="w-full py-2.5 px-3 rounded-xl border border-accent text-accent font-semibold text-xs hover:bg-sky-50 dark:hover:bg-sky-950/30 transition flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  Apri PDF nel Browser
                </button>
                <button
                  type="button"
                  disabled={generating}
                  onClick={() => handleDownloadPdf("download")}
                  className="w-full py-2.5 px-3 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent-hover transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  Scarica PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
