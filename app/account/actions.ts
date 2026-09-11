"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, dealerProfiles } from "@/db/schema";
import { getUser } from "@/lib/auth";

export async function updateProfile(formData: FormData) {
  const user = await getUser();
  if (!user) return { error: "Non autenticato" };

  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || undefined;
  const addressLine1 = (formData.get("addressLine1") as string)?.trim() || undefined;
  const addressLine2 = (formData.get("addressLine2") as string)?.trim() || undefined;
  const city = (formData.get("city") as string)?.trim() || undefined;
  const province = ((formData.get("province") as string)?.trim() || "").toUpperCase().slice(0, 2) || undefined;
  const postalCode = (formData.get("postalCode") as string)?.trim() || undefined;
  const country = (formData.get("country") as string)?.trim() || undefined;

  if (!firstName || !lastName) {
    return { error: "Nome e cognome sono obbligatori" };
  }

  const db = getDb();
  try {
    await db
      .update(profiles)
      .set({
        firstName,
        lastName,
        phone: phone || null,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city: city || null,
        province: province || null,
        postalCode: postalCode || null,
        country: country || "IT",
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));
  } catch {
    return { error: "Errore durante l'aggiornamento del profilo" };
  }

  revalidatePath("/account");
  return { success: true };
}

export async function getProfile() {
  const user = await getUser();
  if (!user) return null;

  const db = getDb();
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)
    .then((r) => r[0]);

  if (!profile) return null;

  let dealerInfo: {
    company_name: string;
    vat_number: string;
    status: string;
    discount_percent: number;
  } | null = null;
  if (user.role === "dealer") {
    const d = await db
      .select({
        companyName: dealerProfiles.companyName,
        vatNumber: dealerProfiles.vatNumber,
        status: dealerProfiles.status,
        discountPercent: dealerProfiles.discountPercent,
      })
      .from(dealerProfiles)
      .where(eq(dealerProfiles.id, user.id))
      .limit(1)
      .then((r) => r[0] ?? null);
    if (d) {
      dealerInfo = {
        company_name: d.companyName,
        vat_number: d.vatNumber,
        status: d.status,
        discount_percent: d.discountPercent,
      };
    }
  }

  const profileRow = {
    first_name: profile.firstName,
    last_name: profile.lastName,
    email: profile.email,
    role: profile.role,
    company: profile.company,
    vat_number: profile.vatNumber,
    phone: profile.phone,
    address_line1: profile.addressLine1,
    address_line2: profile.addressLine2,
    city: profile.city,
    province: profile.province,
    postal_code: profile.postalCode,
    country: profile.country,
  };

  return { profile: profileRow, dealerInfo, role: user.role };
}
