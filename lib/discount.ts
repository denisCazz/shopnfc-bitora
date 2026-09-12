import type { DiscountType } from "@/lib/types";

export function normalizeDiscountCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeDiscountAmount(
  subtotal: number,
  type: DiscountType,
  value: number
): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (type === "percent") {
    const pct = Math.max(0, Math.min(100, value));
    return roundMoney((subtotal * pct) / 100);
  }
  return roundMoney(Math.min(value, subtotal));
}
