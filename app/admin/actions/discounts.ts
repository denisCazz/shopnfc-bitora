"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { discountCodes } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { normalizeDiscountCode } from "@/lib/discount";
import type { DiscountType } from "@/lib/types";

async function requireAdmin() {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Non autorizzato");
}

const DISCOUNT_TYPES: DiscountType[] = ["percent", "fixed"];

function parseEnum<T extends string>(
  value: FormDataEntryValue | null,
  allowed: T[],
  fallback: T
): T {
  const v = typeof value === "string" ? value : "";
  return (allowed as string[]).includes(v) ? (v as T) : fallback;
}

function parseOptionalDate(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseForm(formData: FormData) {
  const code = normalizeDiscountCode((formData.get("code") as string) ?? "");
  const type = parseEnum(formData.get("type"), DISCOUNT_TYPES, "percent");
  const valueRaw = parseOptionalNumber(formData.get("value"));
  const minOrderAmount = parseOptionalNumber(formData.get("min_order_amount"));
  const maxUsesRaw = parseOptionalNumber(formData.get("max_uses"));
  const maxUses =
    maxUsesRaw == null ? null : Math.floor(maxUsesRaw);
  const startsAt = parseOptionalDate(formData.get("starts_at"));
  const endsAt = parseOptionalDate(formData.get("ends_at"));
  const active = formData.get("active") !== "false";
  const note = (formData.get("note") as string)?.trim() || null;

  if (!code) return { error: "Il codice è obbligatorio" as const };
  if (code.length > 40) return { error: "Il codice può avere al massimo 40 caratteri" as const };
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    return { error: "Usa solo lettere, numeri, trattino e underscore" as const };
  }
  if (valueRaw == null || valueRaw <= 0) {
    return { error: "Inserisci un valore sconto maggiore di zero" as const };
  }
  if (type === "percent" && valueRaw > 100) {
    return { error: "La percentuale non può superare 100" as const };
  }
  if (minOrderAmount != null && minOrderAmount < 0) {
    return { error: "L'importo minimo non può essere negativo" as const };
  }
  if (maxUses != null && maxUses < 1) {
    return { error: "Gli utilizzi massimi devono essere almeno 1, oppure vuoti (illimitati)" as const };
  }
  if (startsAt && endsAt && endsAt < startsAt) {
    return { error: "La data di fine deve essere successiva all'inizio" as const };
  }

  return {
    values: {
      code,
      type,
      value: String(Math.round(valueRaw * 100) / 100),
      minOrderAmount: minOrderAmount != null ? String(Math.round(minOrderAmount * 100) / 100) : null,
      maxUses,
      startsAt,
      endsAt,
      active,
      note,
      updatedAt: new Date(),
    },
  };
}

export async function getDiscountCodes() {
  await requireAdmin();
  return getDb().select().from(discountCodes).orderBy(desc(discountCodes.createdAt));
}

export async function createDiscountCode(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  try {
    await getDb().insert(discountCodes).values(parsed.values);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore";
    if (message.includes("discount_codes_code") || message.toLowerCase().includes("unique")) {
      return { error: "Esiste già un codice con questo nome" };
    }
    return { error: message };
  }
  revalidatePath("/admin/sconti");
  return {};
}

export async function updateDiscountCode(
  id: number,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  try {
    await getDb()
      .update(discountCodes)
      .set(parsed.values)
      .where(eq(discountCodes.id, id));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore";
    if (message.includes("discount_codes_code") || message.toLowerCase().includes("unique")) {
      return { error: "Esiste già un codice con questo nome" };
    }
    return { error: message };
  }
  revalidatePath("/admin/sconti");
  return {};
}

export async function deleteDiscountCode(id: number): Promise<{ error?: string }> {
  await requireAdmin();
  try {
    await getDb().delete(discountCodes).where(eq(discountCodes.id, id));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }
  revalidatePath("/admin/sconti");
  return {};
}
