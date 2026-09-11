import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { appUsers, profiles, dealerProfiles } from "@/db/schema";
import type { UserRole } from "@/lib/types";

export type AuthUserPayload = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  dealerDiscount: number | null;
};

export class EmailNotVerifiedError extends Error {
  constructor() {
    super("email_not_verified");
    this.name = "EmailNotVerifiedError";
  }
}

export async function validateCredentials(
  email: string,
  password: string
): Promise<AuthUserPayload | null> {
  const db = getDb();
  const e = email.trim().toLowerCase();
  const row = await db
    .select({
      id: appUsers.id,
      email: appUsers.email,
      passwordHash: appUsers.passwordHash,
      name: appUsers.name,
      role: profiles.role,
      emailVerifiedAt: appUsers.emailVerifiedAt,
    })
    .from(appUsers)
    .innerJoin(profiles, eq(profiles.id, appUsers.id))
    .where(sql`lower(${appUsers.email}) = ${e}`)
    .limit(1)
    .then((r) => r[0]);

  if (!row?.passwordHash) return null;
  const ok = await bcrypt.compare(password, row.passwordHash);
  if (!ok) return null;

  if (!row.emailVerifiedAt) {
    throw new EmailNotVerifiedError();
  }

  let dealerDiscount: number | null = null;
  if (row.role === "dealer") {
    const d = await db
      .select({
        discountPercent: dealerProfiles.discountPercent,
        status: dealerProfiles.status,
      })
      .from(dealerProfiles)
      .where(eq(dealerProfiles.id, row.id))
      .limit(1)
      .then((r) => r[0]);
    if (d?.status === "approved") {
      dealerDiscount = d.discountPercent;
    }
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    dealerDiscount,
  };
}
