export const DEFAULT_MIN_QUANTITY = 10;

export function normalizeMinQuantity(value: unknown): number {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_MIN_QUANTITY;
  return Math.floor(n);
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
