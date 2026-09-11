import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { catalogPricesIncludeItalianVat } from "@/lib/catalog-display-price";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ dealerDiscount: null, pricesIncludeVat: true });
  }

  const db = getDb();
  const profile = await db
    .select({
      company: profiles.company,
      vatNumber: profiles.vatNumber,
      country: profiles.country,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)
    .then((r) => r[0]);

  const pricesIncludeVat = catalogPricesIncludeItalianVat({
    isLoggedIn: true,
    company: profile?.company,
    vatNumber: profile?.vatNumber,
    country: profile?.country,
  });

  return NextResponse.json({
    dealerDiscount: user.dealerDiscount,
    pricesIncludeVat,
  });
}
