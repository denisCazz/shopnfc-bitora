import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, dealerProfiles } from "@/db/schema";
import { AuthUser } from "./auth-types";

export type { AuthUser } from "./auth-types";

/**
 * Carica il profilo (sconto rivenditore aggiornato) dal DB, non solo dal JWT.
 */
export async function getUser(): Promise<AuthUser | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const db = getDb();
  const profile = await db
    .select({
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      email: profiles.email,
      role: profiles.role,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)
    .then((r) => r[0]);

  if (!profile) return null;

  let dealerDiscount: number | null = null;
  if (profile.role === "dealer") {
    const d = await db
      .select({
        discountPercent: dealerProfiles.discountPercent,
        status: dealerProfiles.status,
      })
      .from(dealerProfiles)
      .where(eq(dealerProfiles.id, userId))
      .limit(1)
      .then((r) => r[0]);
    if (d?.status === "approved") {
      dealerDiscount = d.discountPercent;
    }
  }

  return {
    id: userId,
    email: profile.email,
    role: profile.role,
    firstName: profile.firstName,
    lastName: profile.lastName,
    dealerDiscount,
  };
}
