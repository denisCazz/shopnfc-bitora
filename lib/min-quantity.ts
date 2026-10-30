export const DEFAULT_MIN_QUANTITY = 10;

export type KitProductHint = {
  sku?: string | null;
  slug?: string | null;
  name?: string | null;
  nameIt?: string | null;
  nameEn?: string | null;
};

/** Kit, sample packs, and similarly named products have no order minimum. */
const KIT_TOKEN = /(^|[^a-z0-9])kit([^a-z0-9]|$)/i;

export function isKitProduct(product: KitProductHint): boolean {
  const sku = product.sku?.trim() ?? "";
  if (/^kit($|[-_\s/])/i.test(sku)) return true;
  const texts = [product.slug, product.name, product.nameIt, product.nameEn];
  return texts.some((value) => {
    if (!value) return false;
    return KIT_TOKEN.test(value.replace(/[-_/]+/g, " "));
  });
}

export function normalizeMinQuantity(value: unknown): number {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_MIN_QUANTITY;
  return Math.floor(n);
}

export function minQuantityForProduct(value: unknown, product?: KitProductHint): number {
  if (product && isKitProduct(product)) return 1;
  return normalizeMinQuantity(value);
}

export function clampOrderQuantity(
  value: number,
  minQuantity: number,
  maxQuantity?: number
): number {
  const min = normalizeMinQuantity(minQuantity);
  const raw = Number.isFinite(value) ? Math.floor(value) : min;
  const next = Math.max(min, raw);
  if (maxQuantity === undefined || maxQuantity < min) return next;
  return Math.min(maxQuantity, next);
}

/** Keep only digits so a quantity field can be cleared and retyped freely. */
export function sanitizeQuantityDraft(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Positive integer typed in a free quantity field, or null while empty or zero. */
export function parseFreeQuantity(raw: string): number | null {
  const digits = sanitizeQuantityDraft(raw);
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

export function isBelowMinQuantity(
  quantity: number,
  minQuantity: number | null | undefined
): boolean {
  const min = Math.floor(Number(minQuantity));
  const floor = Number.isFinite(min) && min >= 1 ? min : 1;
  return !Number.isFinite(quantity) || Math.floor(quantity) < floor;
}
