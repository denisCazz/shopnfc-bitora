/**
 * Retail prices are catalog (fornitore) × a global markup.
 * Catalog is stored on products.catalog_price; vetrina always uses the markup.
 */

export const DEFAULT_MARKUP = 1.8;
export const MIN_MARKUP = 1.2;
export const MAX_MARKUP = 3.0;

export type PricingConfig = {
  markup: number;
};

export function clampMarkup(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MARKUP;
  return Math.min(MAX_MARKUP, Math.max(MIN_MARKUP, Math.round(value * 100) / 100));
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function retailFromCatalog(catalog: number, markup = DEFAULT_MARKUP): number {
  if (!Number.isFinite(catalog) || catalog <= 0) return 0;
  return roundMoney(catalog * clampMarkup(markup));
}
