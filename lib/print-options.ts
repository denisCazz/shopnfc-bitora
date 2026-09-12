import { roundMoney } from "@/lib/pricing";

export const PRINTABLE_CATEGORY_SLUG = "tessere-nfc";

export const PRINT_OPTIONS = ["none", "black", "color1", "color2"] as const;
export type PrintOption = (typeof PRINT_OPTIONS)[number];

export type PrintPrices = {
  black: number;
  color1: number;
  color2: number;
};

/** Prezzi unitari IVA inclusa (come il listino vetrina). */
export const DEFAULT_PRINT_PRICES: PrintPrices = {
  black: 0.15,
  color1: 0.8,
  color2: 1.4,
};

export type PrintConfig = {
  prices: PrintPrices;
};

export function productNeedsPrintOption(p: { categorySlug: string }): boolean {
  return p.categorySlug === PRINTABLE_CATEGORY_SLUG;
}

export function isPrintOption(value: unknown): value is PrintOption {
  return (
    typeof value === "string" &&
    (PRINT_OPTIONS as readonly string[]).includes(value)
  );
}

export function parsePrintOption(value: unknown): PrintOption {
  return isPrintOption(value) ? value : "none";
}

export function printSurcharge(
  option: PrintOption,
  prices: PrintPrices = DEFAULT_PRINT_PRICES
): number {
  if (option === "none") return 0;
  const extra = prices[option];
  return Number.isFinite(extra) && extra > 0 ? roundMoney(extra) : 0;
}

export function clampPrintPrice(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return roundMoney(Math.min(n, 50));
}

export function normalizePrintPrices(raw?: Partial<PrintPrices> | null): PrintPrices {
  return {
    black: clampPrintPrice(raw?.black, DEFAULT_PRINT_PRICES.black),
    color1: clampPrintPrice(raw?.color1, DEFAULT_PRINT_PRICES.color1),
    color2: clampPrintPrice(raw?.color2, DEFAULT_PRINT_PRICES.color2),
  };
}

export function printOptionLineKey(option: PrintOption): string | undefined {
  return option === "none" ? undefined : `print:${option}`;
}
