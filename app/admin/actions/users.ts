"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appUsers, profiles, dealerProfiles, orders } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { isValidItalianPartitaIva } from "@/lib/italian-vat";
import { sendDealerApprovedEmail } from "@/lib/email";
import type { UserRole } from "@/lib/types";

async function requireAdmin() {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    throw new Error("Non autorizzato");
  }
  return user;
}

export async function verifyUserEmail(userId: string) {
  await requireAdmin();
  const db = getDb();
  try {
    await db
      .update(appUsers)
      .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(appUsers.id, userId));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }
  revalidatePath("/admin/users");
}

export async function updateUserRole(userId: string, role: UserRole) {
  const admin = await requireAdmin();
  if (userId === admin.id) {
    return { error: "Non puoi modificare il tuo stesso ruolo" };
  }
  if (role === "dealer") {
    return {
      error:
        "Per impostare un rivenditore usa il modulo con ragione sociale e P.IVA.",
    };
  }

  const db = getDb();
  const target = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)
    .then((r) => r[0]);

  if (!target) {
    return { error: "Utente non trovato" };
  }
  if (target.role === "admin") {
    return { error: "Non puoi modificare il ruolo di un altro admin" };
  }

  try {
    await db.transaction(async (tx) => {
      await tx.delete(dealerProfiles).where(eq(dealerProfiles.id, userId));
      await tx
        .update(profiles)
        .set({ role, updatedAt: new Date() })
        .where(eq(profiles.id, userId));
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/dealers");
}

export async function promoteToDealer(
  userId: string,
  data: {
    companyName: string;
    vatNumber: string;
    vatCountry?: string;
    approveImmediately: boolean;
    discountPercent: number;
  }
) {
  const admin = await requireAdmin();
  if (userId === admin.id) {
    return { error: "Non puoi modificare il tuo stesso ruolo" };
  }

  const companyName = data.companyName.trim();
  const vatCountry = (data.vatCountry || "IT").trim().toUpperCase();
  // Per l'Italia rimuoviamo il prefisso IT; per gli altri paesi conserviamo il numero così com'è.
  const vatNumber = vatCountry === "IT"
    ? data.vatNumber.trim().replace(/^IT/i, "")
    : data.vatNumber.trim();

  if (!companyName) {
    return { error: "La ragione sociale è obbligatoria" };
  }
  if (!vatNumber) {
    return { error: "La Partita IVA è obbligatoria" };
  }
  if (vatCountry === "IT" && !isValidItalianPartitaIva(vatNumber)) {
    return {
      error:
        "Partita IVA italiana non valida. Inserisci 11 cifre con codice di controllo corretto.",
    };
  }
  // Per paesi esteri (UE o extra-UE) l'admin inserisce manualmente: nessuna validazione formato

  const discountPercent = Math.min(70, Math.max(0, data.discountPercent || 50));

  const db = getDb();
  const target = await db
    .select({
      role: profiles.role,
      email: profiles.email,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)
    .then((r) => r[0]);

  if (!target) {
    return { error: "Utente non trovato" };
  }
  if (target.role === "admin") {
    return { error: "Non puoi convertire un admin in rivenditore" };
  }

  const existingDealer = await db
    .select({ id: dealerProfiles.id })
    .from(dealerProfiles)
    .where(eq(dealerProfiles.id, userId))
    .limit(1)
    .then((r) => r[0]);

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(profiles)
        .set({
          role: "dealer",
          company: companyName,
          vatNumber,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId));

      if (existingDealer) {
        await tx
          .update(dealerProfiles)
          .set({
            companyName,
            vatNumber,
            status: data.approveImmediately ? "approved" : "pending",
            discountPercent,
            rejectionReason: null,
            approvedBy: data.approveImmediately ? admin.id : null,
            approvedAt: data.approveImmediately ? new Date() : null,
          })
          .where(eq(dealerProfiles.id, userId));
      } else {
        await tx.insert(dealerProfiles).values({
          id: userId,
          companyName,
          vatNumber,
          status: data.approveImmediately ? "approved" : "pending",
          discountPercent,
          approvedBy: data.approveImmediately ? admin.id : null,
          approvedAt: data.approveImmediately ? new Date() : null,
        });
      }
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }

  if (data.approveImmediately && target.email) {
    sendDealerApprovedEmail({
      dealerEmail: target.email,
      companyName,
      discountPercent,
    });
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/dealers");
  revalidatePath("/admin");
}

export async function deleteUser(userId: string) {
  const admin = await requireAdmin();
  if (userId === admin.id) {
    return { error: "Non puoi eliminare il tuo account" };
  }

  const db = getDb();
  const target = await db
    .select({ role: profiles.role, email: profiles.email })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)
    .then((r) => r[0]);

  if (!target) {
    return { error: "Utente non trovato" };
  }
  if (target.role === "admin") {
    return { error: "Non puoi eliminare un admin" };
  }

  try {
    await db.update(orders).set({ userId: null }).where(eq(orders.userId, userId));
    await db.delete(appUsers).where(eq(appUsers.id, userId));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/dealers");
}
