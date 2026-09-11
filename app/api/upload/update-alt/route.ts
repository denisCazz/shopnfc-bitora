import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { getDb } from "@/db";
import { productImages } from "@/db/schema";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { imageId, altText } = await req.json();
  if (!imageId) {
    return NextResponse.json({ error: "imageId richiesto" }, { status: 400 });
  }

  const db = getDb();
  try {
    await db
      .update(productImages)
      .set({ altText: altText || null })
      .where(eq(productImages.id, imageId));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Errore" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
