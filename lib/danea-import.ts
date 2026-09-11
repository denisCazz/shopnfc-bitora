/**
 * Danea Easyfatt product catalog import (XML spec:
 * https://www.danea.it/software/easyfatt/ecommerce/integrazione/invio-prodotti/)
 */

import { XMLParser } from "fast-xml-parser";
import { eq } from "drizzle-orm";
import type { getDb } from "@/db";
import { categories, products } from "@/db/schema";

type Db = ReturnType<typeof getDb>;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractText(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : undefined;
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object" && "#text" in (v as object)) {
    const t = (v as { "#text": unknown })["#text"];
    if (typeof t === "string") return t.trim() || undefined;
    if (typeof t === "number" || typeof t === "boolean") return String(t);
  }
  return undefined;
}

type RawProduct = Record<string, unknown>;

/** Aliquota predefinita catalogo (prezzi sito = IVA inclusa). */
export const DEFAULT_CATALOG_VAT_RATE = 0.22;

/**
 * Quale listino prezzi Easyfatt usare (NetPrice<N> / GrossPrice<N>).
 * Default: 2 per il pubblico, 1 per l'ingrosso (configurazione cliente).
 * Override via env: DANEA_CATALOG_PRICE_LIST / DANEA_WHOLESALE_PRICE_LIST.
 */
function readListIndex(envValue: string | undefined, fallback: number): number {
  const n = Number(envValue);
  if (!Number.isInteger(n) || n < 1 || n > 9) return fallback;
  return n;
}

export const CATALOG_PRICE_LIST_INDEX = readListIndex(
  process.env.DANEA_CATALOG_PRICE_LIST,
  2
);
export const WHOLESALE_PRICE_LIST_INDEX = readListIndex(
  process.env.DANEA_WHOLESALE_PRICE_LIST,
  1
);

function pickString(p: RawProduct, keys: string[]): string | undefined {
  for (const k of keys) {
    const t = extractText(p[k]);
    if (t) return t;
  }
  return undefined;
}

function pickDecimal(p: RawProduct, keys: string[]): string | undefined {
  for (const k of keys) {
    const t = extractText(p[k]);
    if (t === undefined) continue;
    const n = Number(t.replace(",", "."));
    if (!Number.isFinite(n)) continue;
    return n.toFixed(2);
  }
  return undefined;
}

function pickInt(p: RawProduct, keys: string[]): number | undefined {
  for (const k of keys) {
    const t = extractText(p[k]);
    if (t === undefined) continue;
    const n = parseInt(t, 10);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function buildCategoryDisplayName(p: RawProduct): string {
  const cat = pickString(p, ["Category"]) ?? "Senza categoria";
  const sub = pickString(p, ["Subcategory", "SubCategory"]);
  const extras = [2, 3, 4, 5, 6, 7, 8, 9].map((i) =>
    pickString(p, [`Subcategory${i}`, `SubCategory${i}`])
  ).filter(Boolean) as string[];
  const parts = [cat, sub, ...extras].filter(Boolean);
  return parts.join(" / ");
}

function pickGrossPriceAt(p: RawProduct, n: number): string | undefined {
  return pickDecimal(p, [`GrossPrice${n}`]);
}

function pickNetPriceAt(p: RawProduct, n: number): string | undefined {
  return pickDecimal(p, [`NetPrice${n}`]);
}

/** Primo listino con Gross/Net valorizzato, partendo da `preferred` poi 1..9. */
function pickPriceAnyList(
  p: RawProduct,
  preferred: number
): { net?: string; gross?: string } {
  const order = [preferred, ...Array.from({ length: 9 }, (_, i) => i + 1)];
  for (const i of order) {
    const gross = pickGrossPriceAt(p, i);
    const net = pickNetPriceAt(p, i);
    if (gross || net) return { net, gross };
  }
  return {};
}

/** Legge l'aliquota IVA dal tag Vat Easyfatt (es. Perc="22"). */
export function pickVatRate(p: RawProduct): number {
  const vat = p.Vat;
  if (vat && typeof vat === "object") {
    const perc = extractText((vat as { "@_Perc"?: unknown })["@_Perc"]);
    if (perc) {
      const n = Number(perc.replace(",", "."));
      if (Number.isFinite(n) && n >= 0 && n <= 100) return n / 100;
    }
  }
  return DEFAULT_CATALOG_VAT_RATE;
}

export function applyCatalogVat(netPrice: string, vatRate: number): string {
  const n = Number(netPrice);
  if (!Number.isFinite(n)) return netPrice;
  return (Math.round(n * (1 + vatRate) * 100) / 100).toFixed(2);
}

/**
 * Prezzo catalogo (IVA inclusa) dal listino configurato.
 * Preferisce GrossPrice<N> (già ivato dal gestionale).
 * Se manca, fa NetPrice<N> + IVA. Se anche quello manca, fallback su qualunque listino.
 */
export function resolveCatalogPrice(p: RawProduct): string {
  const vatRate = pickVatRate(p);
  const gross = pickGrossPriceAt(p, CATALOG_PRICE_LIST_INDEX);
  if (gross) return gross;
  const net = pickNetPriceAt(p, CATALOG_PRICE_LIST_INDEX);
  if (net) return applyCatalogVat(net, vatRate);
  const fallback = pickPriceAnyList(p, CATALOG_PRICE_LIST_INDEX);
  if (fallback.gross) return fallback.gross;
  if (fallback.net) return applyCatalogVat(fallback.net, vatRate);
  return "0";
}

/**
 * Prezzo ingrosso (IVA inclusa) dal listino configurato per i rivenditori.
 * Fallback: SupplierNetPrice + IVA, poi qualunque listino.
 */
function resolveWholesalePrice(p: RawProduct): string | undefined {
  const vatRate = pickVatRate(p);
  const gross = pickGrossPriceAt(p, WHOLESALE_PRICE_LIST_INDEX);
  if (gross) return gross;
  const net = pickNetPriceAt(p, WHOLESALE_PRICE_LIST_INDEX);
  if (net) return applyCatalogVat(net, vatRate);
  const supplierNet = pickDecimal(p, ["SupplierNetPrice"]);
  if (supplierNet) return applyCatalogVat(supplierNet, vatRate);
  return undefined;
}

export interface DaneaImportStats {
  created: number;
  updated: number;
  deactivatedFull: number;
  deactivatedDeleted: number;
  skipped: number;
}

export interface DaneaImportTraceEntry {
  level: "info" | "warn" | "error";
  scope: "import" | "product" | "delete";
  code?: string;
  message: string;
}

export interface DaneaImportResult {
  ok: true;
  stats: DaneaImportStats;
  mode: "full" | "incremental" | "legacy";
  trace: DaneaImportTraceEntry[];
}

export interface DaneaImportError {
  ok: false;
  message: string;
  trace: DaneaImportTraceEntry[];
}

function normalizeProduct(row: RawProduct): {
  code: string;
  barcode?: string;
  nameIt: string;
  descriptionIt?: string;
  categoryDisplayName: string;
  price: string;
  wholesalePrice?: string;
  stockQuantity: number;
  weight?: string;
  width?: string;
  height?: string;
  depth?: string;
  brand?: string;
} | null {
  const code = pickString(row, ["Code"]);
  if (!code) return null;

  const nameIt = pickString(row, ["Description"]) ?? code;
  const descPlain = pickString(row, ["Notes"]);
  const descHtml = pickString(row, ["DescriptionHTML"]);
  const descriptionIt = descHtml ?? descPlain;

  const price = resolveCatalogPrice(row);
  const wholesalePrice = resolveWholesalePrice(row);

  const stockQuantity = pickInt(row, [
    "AvailableQty",
    "AvailableQuantity",
    "Qty",
    "Quantity",
    "Qta",
    "Stock",
    "OnHand",
  ]) ?? 0;

  const weight = pickDecimal(row, ["NetWeight"]) ?? pickDecimal(row, ["GrossWeight"]);

  const width = pickDecimal(row, ["NetSizeX"]) ?? pickDecimal(row, ["PackingSizeX"]);
  const height = pickDecimal(row, ["NetSizeY"]) ?? pickDecimal(row, ["PackingSizeY"]);
  const depth = pickDecimal(row, ["NetSizeZ"]) ?? pickDecimal(row, ["PackingSizeZ"]);

  const brand = pickString(row, ["ProducerName", "Producer", "Brand"]);

  const ean13 = pickString(row, ["Barcode", "BarCode"]);

  return {
    code,
    barcode: ean13,
    nameIt,
    descriptionIt,
    categoryDisplayName: buildCategoryDisplayName(row),
    price,
    wholesalePrice,
    stockQuantity,
    weight,
    width,
    height,
    depth,
    brand,
  };
}

function collectFromRoot(root: Record<string, unknown>): {
  mode: "full" | "incremental" | "legacy";
  toUpsert: RawProduct[];
  toDeleteCodes: string[];
} {
  const ef = root.EasyfattProducts as Record<string, unknown> | undefined;
  if (!ef || typeof ef !== "object") {
    throw new Error("Radice XML mancante o non valida: EasyfattProducts");
  }

  const modeAttr = String(ef["@_Mode"] ?? "")
    .trim()
    .toLowerCase();
  const mode: "full" | "incremental" | "legacy" =
    modeAttr === "incremental"
      ? "incremental"
      : modeAttr === "full"
        ? "full"
        : "legacy";

  const toUpsert: RawProduct[] = [];

  const pushContainer = (container: unknown) => {
    if (!container || typeof container !== "object") return;
    const c = container as Record<string, unknown>;
    const prods = c.Product;
    const arr = Array.isArray(prods) ? prods : prods ? [prods] : [];
    for (const p of arr) {
      if (p && typeof p === "object") {
        toUpsert.push(p as RawProduct);
      }
    }
  };

  pushContainer(ef.Products);
  pushContainer(ef.UpdatedProducts);

  const toDeleteCodes: string[] = [];
  const del = ef.DeletedProducts as Record<string, unknown> | undefined;
  if (del?.Product) {
    const arr = Array.isArray(del.Product) ? del.Product : [del.Product];
    for (const p of arr) {
      if (p && typeof p === "object") {
        const code = pickString(p as RawProduct, ["Code"]);
        if (code) toDeleteCodes.push(code);
      }
    }
  }

  return { mode, toUpsert, toDeleteCodes };
}

async function upsertCategoryId(db: Db, displayName: string): Promise<number> {
  const nameIt = displayName.trim() || "Senza categoria";
  const baseSlug = slugify(nameIt) || `cat-${Date.now()}`;

  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, baseSlug))
    .limit(1);

  if (existing[0]) return existing[0].id;

  const [row] = await db
    .insert(categories)
    .values({
      nameIt,
      slug: baseSlug,
      sortOrder: 0,
      active: true,
    })
    .returning({ id: categories.id });

  return row.id;
}

/** Parse Danea Easyfatt catalog XML into structured lists. */
export function parseEasyfattProductsXml(xml: string): {
  mode: "full" | "incremental" | "legacy";
  toUpsert: RawProduct[];
  toDeleteCodes: string[];
} {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: true,
  });

  const parsed = parser.parse(xml);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("XML non valido o vuoto");
  }
  return collectFromRoot(parsed as Record<string, unknown>);
}

export async function syncEasyfattCatalog(
  db: Db,
  xml: string
): Promise<DaneaImportResult | DaneaImportError> {
  let bundle: ReturnType<typeof parseEasyfattProductsXml>;
  try {
    bundle = parseEasyfattProductsXml(xml);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore parse XML";
    return {
      ok: false,
      message: msg,
      trace: [{ level: "error", scope: "import", message: msg }],
    };
  }

  const { mode, toUpsert } = bundle;
  const { toDeleteCodes } = bundle;

  const stats: DaneaImportStats = {
    created: 0,
    updated: 0,
    deactivatedFull: 0,
    deactivatedDeleted: 0,
    skipped: 0,
  };
  const trace: DaneaImportTraceEntry[] = [
    {
      level: "info",
      scope: "import",
      message: `Import ricevuto: mode=${mode}, prodotti=${toUpsert.length}, eliminazioni=${toDeleteCodes.length}`,
    },
  ];

  for (const code of toDeleteCodes) {
    trace.push({
      level: "info",
      scope: "delete",
      code,
      message: "Prodotto segnalato in DeletedProducts (nessuna disattivazione automatica applicata).",
    });
  }

  try {

    for (const raw of toUpsert) {
      const n = normalizeProduct(raw);
      if (!n) {
        stats.skipped++;
        trace.push({
          level: "warn",
          scope: "product",
          message: "Prodotto saltato: codice assente o record non normalizzabile.",
        });
        continue;
      }

      const existing = await db
        .select({
          id: products.id,
          price: products.price,
          wholesalePrice: products.wholesalePrice,
          stockQuantity: products.stockQuantity,
        })
        .from(products)
        .where(eq(products.sku, n.code))
        .limit(1);

      if (!existing.length) {
        // Prodotto non presente nel catalogo: ignorato.
        // I prodotti vengono caricati manualmente dagli amministratori.
        stats.skipped++;
        trace.push({
          level: "warn",
          scope: "product",
          code: n.code,
          message: `Saltato: SKU non trovato nel catalogo locale. prezzo=${n.price}, ingrosso=${n.wholesalePrice ?? "-"}, qty=${n.stockQuantity}`,
        });
        continue;
      }

      const previous = existing[0];

      // Aggiorna solo prezzo, prezzo ingrosso e quantità disponibile.
      await db
        .update(products)
        .set({
          price: n.price,
          wholesalePrice: n.wholesalePrice ?? null,
          stockQuantity: n.stockQuantity,
          updatedAt: new Date(),
        })
        .where(eq(products.id, previous.id));
      stats.updated++;
      trace.push({
        level: "info",
        scope: "product",
        code: n.code,
        message:
          `Aggiornato: prezzo ${previous.price} -> ${n.price}, ` +
          `ingrosso ${previous.wholesalePrice ?? "-"} -> ${n.wholesalePrice ?? "-"}, ` +
          `qty ${previous.stockQuantity} -> ${n.stockQuantity}`,
      });
    }

    // La disattivazione automatica in modalità "full" è disabilitata:
    // la gestione dei prodotti avviene manualmente.

    trace.push({
      level: "info",
      scope: "import",
      message:
        `Import completato: updated=${stats.updated}, skipped=${stats.skipped}, ` +
        `deactivatedFull=${stats.deactivatedFull}, deactivatedDeleted=${stats.deactivatedDeleted}`,
    });

    return { ok: true, stats, mode, trace };
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Errore durante import catalogo";
    trace.push({
      level: "error",
      scope: "import",
      message: msg,
    });
    return { ok: false, message: msg, trace };
  }
}
