import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { productStoves, stoves } from "@/db/schema";

export async function GET(req: NextRequest) {
  const productId = Number(req.nextUrl.searchParams.get("productId"));
  if (!productId || isNaN(productId)) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  const db = getDb();
  const rows = await db
    .select({
      id: stoves.id,
      nameIt: stoves.nameIt,
      nameEn: stoves.nameEn,
      nameFr: stoves.nameFr,
      nameEs: stoves.nameEs,
    })
    .from(productStoves)
    .innerJoin(stoves, eq(productStoves.stoveId, stoves.id))
    .where(eq(productStoves.productId, productId));
  return NextResponse.json(rows);
}
