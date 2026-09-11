"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appUsers, profiles, dealerProfiles, orders } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { sendDealerApprovedEmail, sendDealerRejectedEmail } from "@/lib/email";

async function requireAdmin() {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    throw new Error("Non autorizzato");
  }
  return user;
}

export async function approveDealer(dealerId: string, discountPercent: number) {
  const admin = await requireAdmin();
  const db = getDb();
  try {
    await db
      .update(dealerProfiles)
      .set({
        status: "approved",
        discountPercent,
        approvedBy: admin.id,
        approvedAt: new Date(),
      })
      .where(eq(dealerProfiles.id, dealerId));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }

  const p = await db
    .select({ email: profiles.email })
    .from(profiles)
    .where(eq(profiles.id, dealerId))
    .limit(1)
    .then((r) => r[0]);
  const d = await db
    .select({ companyName: dealerProfiles.companyName })
    .from(dealerProfiles)
    .where(eq(dealerProfiles.id, dealerId))
    .limit(1)
    .then((r) => r[0]);

  if (p?.email && d?.companyName) {
    sendDealerApprovedEmail({
      dealerEmail: p.email,
      companyName: d.companyName,
      discountPercent,
    });
  }

  revalidatePath("/admin/dealers");
  revalidatePath("/admin");
}

export async function rejectDealer(dealerId: string, reason: string) {
  await requireAdmin();
  const db = getDb();
  try {
    await db
      .update(dealerProfiles)
      .set({
        status: "rejected",
        rejectionReason: reason || null,
      })
      .where(eq(dealerProfiles.id, dealerId));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }

  const p = await db
    .select({ email: profiles.email })
    .from(profiles)
    .where(eq(profiles.id, dealerId))
    .limit(1)
    .then((r) => r[0]);
  const d = await db
    .select({ companyName: dealerProfiles.companyName })
    .from(dealerProfiles)
    .where(eq(dealerProfiles.id, dealerId))
    .limit(1)
    .then((r) => r[0]);

  if (p?.email && d?.companyName) {
    sendDealerRejectedEmail({
      dealerEmail: p.email,
      companyName: d.companyName,
      reason: reason || null,
    });
  }

  revalidatePath("/admin/dealers");
  revalidatePath("/admin");
}

export async function updateDealerDiscount(
  dealerId: string,
  discountPercent: number
) {
  await requireAdmin();
  const db = getDb();
  try {
    await db
      .update(dealerProfiles)
      .set({ discountPercent })
      .where(eq(dealerProfiles.id, dealerId));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }
  revalidatePath("/admin/dealers");
}

export async function updateDealerData(
  dealerId: string,
  data: {
    companyName: string;
    vatNumber: string;
    firstName: string;
    lastName: string;
    phone: string;
    addressLine1?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    discountPercent: number;
  }
) {
  await requireAdmin();
  const db = getDb();
  try {
    await db
      .update(dealerProfiles)
      .set({
        companyName: data.companyName,
        vatNumber: data.vatNumber,
        discountPercent: data.discountPercent,
      })
      .where(eq(dealerProfiles.id, dealerId));
    await db
      .update(profiles)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        company: data.companyName,
        vatNumber: data.vatNumber,
        addressLine1: data.addressLine1?.trim() || null,
        city: data.city?.trim() || null,
        province: (data.province || "").trim().toUpperCase().slice(0, 2) || null,
        postalCode: data.postalCode?.trim() || null,
        country: data.country?.trim() || "IT",
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, dealerId));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }
  revalidatePath("/admin/dealers");
}

export async function deleteDealer(dealerId: string) {
  await requireAdmin();
  const db = getDb();
  try {
    await db.update(orders).set({ userId: null }).where(eq(orders.userId, dealerId));
    await db.delete(appUsers).where(eq(appUsers.id, dealerId));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }
  revalidatePath("/admin/dealers");
}
