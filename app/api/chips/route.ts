import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { productChips, chips } from "@/db/schema";

export async function GET(req: NextRequest) {
  const productId = Number(req.nextUrl.searchParams.get("productId"));
  if (!productId || isNaN(productId)) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  const db = getDb();
  const rows = await db
    .select({
      id: chips.id,
      nameIt: chips.nameIt,
      nameEn: chips.nameEn,
      nameFr: chips.nameFr,
      nameEs: chips.nameEs,
    })
    .from(productChips)
    .innerJoin(chips, eq(productChips.chipId, chips.id))
    .where(eq(productChips.productId, productId));
  return NextResponse.json(rows);
}
