import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ profile: null });
  }

  const db = getDb();
  const row = await db
    .select({
      first_name: profiles.firstName,
      last_name: profiles.lastName,
      email: profiles.email,
      phone: profiles.phone,
      company: profiles.company,
      vat_number: profiles.vatNumber,
      address_line1: profiles.addressLine1,
      address_line2: profiles.addressLine2,
      city: profiles.city,
      province: profiles.province,
      postal_code: profiles.postalCode,
      country: profiles.country,
    })
    .from(profiles)
    .where(eq(profiles.id, session.user.id))
    .limit(1)
    .then((r) => r[0]);

  return NextResponse.json({ profile: row ?? null });
}
