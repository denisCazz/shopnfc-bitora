"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { getDb } from "@/db";
import { appUsers, profiles, dealerProfiles } from "@/db/schema";
import { sendDealerRegistrationNotification, sendEmailVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { signPayload, verifyPayload } from "@/lib/signed-payload";
import { isValidEuVatNumber, countryCodeFromEuVat } from "@/lib/italian-vat";

const SALT = 10;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://shopnfc.bitora.it";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildVerificationUrl(userId: string): string {
  const token = signPayload({
    sub: userId,
    exp: Date.now() + 24 * 60 * 60 * 1000,
    purpose: "email-verify",
  });
  return `${APP_URL}/api/auth/verify-email?token=${token}`;
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";

  try {
    await signIn("credentials", {
      email: normalizeEmail(email),
      password,
      redirect: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const causeMessage =
      err instanceof Error && err.cause instanceof Error
        ? err.cause.message
        : "";
    if (
      message.includes("email_not_verified") ||
      causeMessage.includes("email_not_verified")
    ) {
      return { error: "email_not_verified" as const };
    }
    return { error: "invalid_credentials" };
  }

  redirect(redirectTo);
}

export async function register(formData: FormData) {
  const email = normalizeEmail(formData.get("email") as string);
  const password = formData.get("password") as string;
  const firstName = (formData.get("firstName") as string) || "";
  const lastName = (formData.get("lastName") as string) || "";

  const db = getDb();
  const existing = await db
    .select({ id: appUsers.id })
    .from(appUsers)
    .where(eq(appUsers.email, email))
    .limit(1)
    .then((r) => r[0]);

  if (existing) {
    return { error: "Questa email è già registrata. Prova ad accedere o usa un'altra email." };
  }

  const passwordHash = await bcrypt.hash(password, SALT);

  await db.transaction(async (tx) => {
    const [u] = await tx
      .insert(appUsers)
      .values({ email, passwordHash, name: `${firstName} ${lastName}`.trim() || null })
      .returning({ id: appUsers.id });
    if (!u) throw new Error("insert user");
    await tx.insert(profiles).values({
      id: u.id,
      email,
      firstName: firstName || null,
      lastName: lastName || null,
      role: "customer",
    });
    const verificationUrl = buildVerificationUrl(u.id);
    await sendEmailVerificationEmail({
      to: email,
      verificationUrl,
      name: `${firstName} ${lastName}`.trim() || null,
    });
  });

  redirect("/login?registered=true");
}

export async function logout() {
  await signOut({ redirect: false });
  redirect("/");
}

export async function registerDealer(formData: FormData): Promise<{ error: string } | void> {
  const email = normalizeEmail(formData.get("email") as string);
  const password = formData.get("password") as string;
  const firstName = (formData.get("firstName") as string) || "";
  const lastName = (formData.get("lastName") as string) || "";
  const companyName = (formData.get("companyName") as string) || "";
  const vatNumber = ((formData.get("vatNumber") as string) || "").trim();
  const phone = (formData.get("phone") as string) || "";

  if (!vatNumber) {
    return { error: "La Partita IVA è obbligatoria per la registrazione rivenditore." };
  }
  if (!isValidEuVatNumber(vatNumber)) {
    return { error: "Partita IVA / numero VAT non valido. Per l'Italia inserisci 11 cifre (es. IT02450960261); per gli altri paesi UE indica il prefisso del paese (es. FR12345678901)." };
  }

  const db = getDb();
  const existing = await db
    .select({ id: appUsers.id })
    .from(appUsers)
    .where(eq(appUsers.email, email))
    .limit(1)
    .then((r) => r[0]);

  if (existing) {
    return { error: "Questa email è già registrata. Prova ad accedere o usa un'altra email." };
  }

  const passwordHash = await bcrypt.hash(password, SALT);

  await db.transaction(async (tx) => {
    const [u] = await tx
      .insert(appUsers)
      .values({ email, passwordHash, name: `${firstName} ${lastName}`.trim() || null })
      .returning({ id: appUsers.id });
    if (!u) throw new Error("insert user");
    await tx.insert(profiles).values({
      id: u.id,
      email,
      firstName: firstName || null,
      lastName: lastName || null,
      company: companyName,
      vatNumber: vatNumber,
      phone: phone || null,
      country: countryCodeFromEuVat(vatNumber),
      role: "dealer",
    });
    await tx.insert(dealerProfiles).values({
      id: u.id,
      companyName,
      vatNumber,
    });
    const verificationUrl = buildVerificationUrl(u.id);
    await sendEmailVerificationEmail({
      to: email,
      verificationUrl,
      name: `${firstName} ${lastName}`.trim() || null,
    });
  });

  await sendDealerRegistrationNotification({
    companyName,
    vatNumber,
    dealerName: `${firstName} ${lastName}`.trim(),
    dealerEmail: email,
    phone,
  });

  redirect("/login?dealer_registered=true");
}

export async function resendVerificationEmail(email: string): Promise<{ success?: boolean; error?: string }> {
  const normalizedEmail = normalizeEmail(email);
  const db = getDb();

  const user = await db
    .select({ id: appUsers.id, name: appUsers.name, emailVerifiedAt: appUsers.emailVerifiedAt })
    .from(appUsers)
    .where(eq(appUsers.email, normalizedEmail))
    .limit(1)
    .then((r) => r[0]);

  if (!user) {
    // Don't reveal whether the email exists
    return { success: true };
  }

  if (user.emailVerifiedAt) {
    return { error: "Email già verificata." };
  }

  const verificationUrl = buildVerificationUrl(user.id);
  await sendEmailVerificationEmail({
    to: normalizedEmail,
    verificationUrl,
    name: user.name,
  });

  return { success: true };
}

export async function requestPasswordReset(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const email = normalizeEmail(formData.get("email") as string);
  const db = getDb();

  const user = await db
    .select({ id: appUsers.id, name: appUsers.name, passwordHash: appUsers.passwordHash })
    .from(appUsers)
    .where(eq(appUsers.email, email))
    .limit(1)
    .then((r) => r[0]);

  // Always return success to avoid revealing whether email exists
  if (!user) return { success: true };

  const hint = (user.passwordHash ?? "").slice(-8);
  const token = signPayload({ email, exp: Date.now() + 60 * 60 * 1000, hint, purpose: "password-reset" });
  const resetUrl = `${APP_URL}/reimposta-password?token=${token}`;

  await sendPasswordResetEmail({ to: email, resetUrl, name: user.name });

  return { success: true };
}

export async function resetPassword(token: string, newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    return { error: "La password deve essere di almeno 8 caratteri" };
  }

  type ResetPayload = { email: string; exp: number; hint: string; purpose: string };
  const payload = verifyPayload<ResetPayload>(token);

  if (!payload || payload.purpose !== "password-reset") {
    return { error: "Link non valido o già utilizzato" };
  }
  if (Date.now() > payload.exp) {
    return { error: "Il link è scaduto. Richiedi un nuovo reset." };
  }

  const db = getDb();
  const user = await db
    .select({ id: appUsers.id, passwordHash: appUsers.passwordHash })
    .from(appUsers)
    .where(eq(appUsers.email, payload.email))
    .limit(1)
    .then((r) => r[0]);

  if (!user) return { error: "Utente non trovato" };

  // Verify hint matches current hash (token is invalidated after password change)
  const currentHint = (user.passwordHash ?? "").slice(-8);
  if (currentHint !== payload.hint) {
    return { error: "Link non valido o già utilizzato" };
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT);
  await db.update(appUsers).set({ passwordHash }).where(eq(appUsers.id, user.id));

  return { success: true };
}
