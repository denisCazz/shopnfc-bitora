"use server";

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { appSettings, appUsers, dealerProfiles, profiles } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { clampMarkup } from "@/lib/pricing";
import { invalidatePricingCache } from "@/lib/pricing-server";
import { revalidateCatalog } from "@/lib/revalidate-catalog";
import { isValidItalianPartitaIva } from "@/lib/italian-vat";
import { verifyStripeCredentials } from "@/lib/stripe";
import { validateVAT } from "@/lib/vies";
import { Resend } from "resend";
import type { UserRole } from "@/lib/types";

export type VatCheckResult = {
  status: "valid" | "invalid" | "unverifiable" | "error";
  message: string;
  companyName?: string;
};

export async function checkVatNumber(
  vatCountry: string,
  vatNumber: string
): Promise<VatCheckResult> {
  await requireAdmin();

  const country = vatCountry.trim().toUpperCase();
  const vat = vatNumber.trim();

  if (!vat) return { status: "error", message: "Inserisci il numero IVA." };

  // Extra-UE: non possiamo verificare
  if (country === "EXTRA") {
    return {
      status: "unverifiable",
      message: "Partita IVA extra-UE: impossibile verificare automaticamente. Controlla manualmente.",
    };
  }

  // Italia: verifica locale con cifra di controllo
  if (country === "IT") {
    const normalized = vat.replace(/^IT/i, "");
    if (isValidItalianPartitaIva(normalized)) {
      return { status: "valid", message: "Partita IVA italiana valida (cifra di controllo corretta)." };
    }
    return { status: "invalid", message: "Partita IVA italiana non valida. Controlla le 11 cifre e la cifra di controllo." };
  }

  // Paesi UE: verifica tramite VIES
  // VIES usa il prefisso EL per la Grecia (codice ISO GR)
  const viesCountry = country === "GR" ? "EL" : country;
  const vatForVies = vat.toUpperCase().startsWith(viesCountry) ? vat.slice(viesCountry.length) : vat;
  const result = await validateVAT(viesCountry, vatForVies);

  if (result.error) {
    return {
      status: "unverifiable",
      message: `Impossibile verificare tramite VIES (${result.error}). Controlla manualmente.`,
    };
  }
  if (result.valid) {
    const extra = result.name ? ` — ${result.name}` : "";
    return {
      status: "valid",
      message: `VAT verificata tramite VIES${extra}.`,
      companyName: result.name ?? undefined,
    };
  }
  return {
    status: "invalid",
    message: "VAT non risulta valida nel sistema VIES. Verifica il numero.",
  };
}

const SALT = 10;

async function requireAdmin() {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Non autorizzato");
}

export async function testDbConnection(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    const db = getDb();
    await db.execute("SELECT 1");
    return { ok: true, message: "Connessione al database OK" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

export async function testEmail(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return { ok: false, message: "ADMIN_EMAIL non configurata nelle variabili d'ambiente" };
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM_EMAIL || "Shop NFC <onboarding@resend.dev>";
    const { error } = await resend.emails.send({
      from,
      to: adminEmail,
      subject: "Test email — Shop NFC",
      html: `<p>Questa è un'email di prova inviata dal pannello admin di <strong>Shop NFC</strong>.</p><p>Se stai leggendo questo messaggio, la configurazione email funziona correttamente.</p>`,
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: `Email inviata con successo a ${adminEmail}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

export async function testStripeConnection(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const result = await verifyStripeCredentials();
  return { ok: result.ok, message: result.message };
}

export async function createUser(formData: FormData): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const firstName = (formData.get("firstName") as string)?.trim() || "";
  const lastName = (formData.get("lastName") as string)?.trim() || "";
  const role = (formData.get("role") as UserRole) || "customer";
  const companyName = (formData.get("companyName") as string)?.trim() || "";
  const vatCountry = ((formData.get("vatCountry") as string) || "IT").trim().toUpperCase();
  const vatRaw = ((formData.get("vatNumber") as string) || "").trim();
  // Per l'Italia rimuoviamo il prefisso IT prima di salvare; per gli altri paesi conserviamo il numero così com'è.
  const vatNumber = vatCountry === "IT" ? vatRaw.replace(/^IT/i, "") : vatRaw;

  if (!email || !password) {
    return { ok: false, message: "Email e password sono obbligatorie" };
  }
  if (password.length < 8) {
    return { ok: false, message: "La password deve essere di almeno 8 caratteri" };
  }
  if (role === "dealer") {
    if (!companyName) {
      return { ok: false, message: "La ragione sociale è obbligatoria per i rivenditori" };
    }
    if (!vatNumber) {
      return { ok: false, message: "La Partita IVA è obbligatoria per i rivenditori" };
    }
    if (vatCountry === "IT" && !isValidItalianPartitaIva(vatNumber)) {
      return { ok: false, message: "Partita IVA italiana non valida" };
    }
    // Per paesi esteri (UE o extra-UE) l'admin inserisce manualmente: nessuna validazione formato
  }

  const db = getDb();
  const existing = await db
    .select({ id: appUsers.id })
    .from(appUsers)
    .where(eq(appUsers.email, email))
    .limit(1)
    .then((r) => r[0]);

  if (existing) {
    return { ok: false, message: "Esiste già un utente con questa email" };
  }

  const passwordHash = await bcrypt.hash(password, SALT);

  await db.transaction(async (tx) => {
    const [u] = await tx
      .insert(appUsers)
      .values({ email, passwordHash, name: `${firstName} ${lastName}`.trim() || null, emailVerifiedAt: new Date() })
      .returning({ id: appUsers.id });
    if (!u) throw new Error("Errore inserimento utente");
    await tx.insert(profiles).values({
      id: u.id,
      email,
      firstName: firstName || null,
      lastName: lastName || null,
      role,
      company: role === "dealer" ? companyName : null,
      vatNumber: role === "dealer" ? vatNumber : null,
    });
    if (role === "dealer") {
      await tx.insert(dealerProfiles).values({
        id: u.id,
        companyName,
        vatNumber,
      });
    }
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/dealers");
  return {
    ok: true,
    message:
      role === "dealer"
        ? `Rivenditore ${email} creato. Approva la richiesta in Admin → Dealer.`
        : `Utente ${email} creato con ruolo "${role}"`,
  };
}

export async function savePricingMarkup(
  markupRaw: number
): Promise<{ ok: boolean; message: string; markup?: number }> {
  await requireAdmin();
  const markup = clampMarkup(markupRaw);

  try {
    const db = getDb();
    await db
      .insert(appSettings)
      .values({
        key: "pricing",
        value: { markup } as Record<string, unknown>,
        updatedAt: sql`NOW()`,
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          value: { markup } as Record<string, unknown>,
          updatedAt: sql`NOW()`,
        },
      });

    await db.execute(sql`
      UPDATE products
      SET
        catalog_price = COALESCE(catalog_price, price),
        price = ROUND(COALESCE(catalog_price, price) * ${markup}::numeric, 2),
        updated_at = NOW()
    `);

    invalidatePricingCache();
    revalidateCatalog();
    revalidatePath("/admin/settings");
    revalidatePath("/admin/products");
    return {
      ok: true,
      message: `Ricarico salvato: ×${markup.toFixed(2)} su tutti i prodotti`,
      markup,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Errore durante il salvataggio" };
  }
}
