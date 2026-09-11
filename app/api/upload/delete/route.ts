import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { asc, eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { getDb } from "@/db";
import { productImages, products } from "@/db/schema";
import { deleteFromR2, getR2KeyFromUrl } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { imageId } = await req.json();
  if (!imageId) {
    return NextResponse.json({ error: "imageId richiesto" }, { status: 400 });
  }

  const db = getDb();
  const image = await db
    .select()
    .from(productImages)
    .where(eq(productImages.id, imageId))
    .limit(1)
    .then((r) => r[0]);

  if (!image) {
    return NextResponse.json({ error: "Immagine non trovata" }, { status: 404 });
  }

  try {
    await db.delete(productImages).where(eq(productImages.id, imageId));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Errore" },
      { status: 500 }
    );
  }

  try {
    const r2Key = getR2KeyFromUrl(image.imageUrl);
    if (r2Key) {
      await deleteFromR2(r2Key);
    } else if (image.imageUrl.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", image.imageUrl);
      await unlink(filePath);
    }
  } catch {
    // ignore
  }

  if (image.sortOrder === 0) {
    const [nextImage] = await db
      .select({ imageUrl: productImages.imageUrl })
      .from(productImages)
      .where(eq(productImages.productId, image.productId))
      .orderBy(asc(productImages.sortOrder))
      .limit(1);
    await db
      .update(products)
      .set({ imageUrl: nextImage?.imageUrl ?? null, updatedAt: new Date() })
      .where(eq(products.id, image.productId));
  }

  return NextResponse.json({ success: true });
}
