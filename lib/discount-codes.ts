import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { discountCodes, orders } from "@/db/schema";
import {
  computeDiscountAmount,
  normalizeDiscountCode,
  roundMoney,
} from "@/lib/discount";
import type { DiscountType } from "@/lib/types";

export type DiscountLookupError =
  | "invalid"
  | "inactive"
  | "expired"
  | "not_started"
  | "exhausted"
  | "min_order";

export type DiscountCodeRecord = typeof discountCodes.$inferSelect;

export function discountErrorMessage(error: DiscountLookupError, minOrderAmount?: number): string {
  switch (error) {
    case "inactive":
      return "Questo codice non è più attivo";
    case "expired":
      return "Questo codice è scaduto";
    case "not_started":
      return "Questo codice non è ancora valido";
    case "exhausted":
      return "Questo codice ha raggiunto il numero massimo di utilizzi";
    case "min_order":
      return minOrderAmount != null
        ? `Ordine minimo ${minOrderAmount.toFixed(2)} € sui prodotti`
        : "Ordine minimo non raggiunto";
    default:
      return "Codice sconto non valido";
  }
}

export async function findDiscountCode(code: string): Promise<DiscountCodeRecord | null> {
  const normalized = normalizeDiscountCode(code);
  if (!normalized) return null;
  const [row] = await getDb()
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.code, normalized))
    .limit(1);
  return row ?? null;
}

export function validateDiscountCode(
  row: DiscountCodeRecord,
  subtotal: number,
  now = new Date()
): { ok: true } | { ok: false; error: DiscountLookupError; minOrderAmount?: number } {
  if (!row.active) return { ok: false, error: "inactive" };
  if (row.startsAt && now < row.startsAt) return { ok: false, error: "not_started" };
  if (row.endsAt && now > row.endsAt) return { ok: false, error: "expired" };
  if (row.maxUses != null && row.usedCount >= row.maxUses) {
    return { ok: false, error: "exhausted" };
  }
  const minOrder = row.minOrderAmount != null ? Number(row.minOrderAmount) : 0;
  if (minOrder > 0 && subtotal + 1e-9 < minOrder) {
    return { ok: false, error: "min_order", minOrderAmount: minOrder };
  }
  return { ok: true };
}

export async function resolveCheckoutDiscount(
  rawCode: string | null | undefined,
  subtotal: number
): Promise<
  | { applied: false }
  | {
      applied: true;
      id: number;
      code: string;
      type: DiscountType;
      value: number;
      amount: number;
    }
  | { applied: false; error: DiscountLookupError; minOrderAmount?: number }
> {
  if (rawCode == null || !normalizeDiscountCode(rawCode)) {
    return { applied: false };
  }

  const row = await findDiscountCode(rawCode);
  if (!row) return { applied: false, error: "invalid" };

  const valid = validateDiscountCode(row, subtotal);
  if (!valid.ok) return { applied: false, error: valid.error, minOrderAmount: valid.minOrderAmount };

  const type = row.type;
  const value = Number(row.value);
  const amount = computeDiscountAmount(subtotal, type, value);
  if (amount <= 0) return { applied: false, error: "invalid" };

  return {
    applied: true,
    id: row.id,
    code: row.code,
    type,
    value,
    amount: roundMoney(amount),
  };
}

export async function redeemDiscountCode(orderId: number): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    const claimed = await tx
      .update(orders)
      .set({ discountRedeemed: true, updatedAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.discountRedeemed, false)))
      .returning({ discountCodeId: orders.discountCodeId });
    const codeId = claimed[0]?.discountCodeId;
    if (!codeId) return;
    await tx
      .update(discountCodes)
      .set({
        usedCount: sql`${discountCodes.usedCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(discountCodes.id, codeId));
  });
}

export async function unredeemDiscountCode(orderId: number): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    const released = await tx
      .update(orders)
      .set({ discountRedeemed: false, updatedAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.discountRedeemed, true)))
      .returning({ discountCodeId: orders.discountCodeId });
    const codeId = released[0]?.discountCodeId;
    if (!codeId) return;
    await tx
      .update(discountCodes)
      .set({
        usedCount: sql`GREATEST(${discountCodes.usedCount} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(discountCodes.id, codeId));
  });
}
