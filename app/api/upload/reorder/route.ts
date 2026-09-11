import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { getDb } from "@/db";
import { productImages, products } from "@/db/schema";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { images } = (await req.json()) as {
    images: { id: number; sort_order: number }[];
  };

  if (!images?.length) {
    return NextResponse.json({ error: "Nessuna immagine" }, { status: 400 });
  }

  const db = getDb();
  for (const img of images) {
    await db
      .update(productImages)
      .set({ sortOrder: img.sort_order })
      .where(eq(productImages.id, img.id));
  }

  const first = images.find((i) => i.sort_order === 0);
  if (first) {
    const firstImage = await db
      .select({
        imageUrl: productImages.imageUrl,
        productId: productImages.productId,
      })
      .from(productImages)
      .where(eq(productImages.id, first.id))
      .limit(1)
      .then((r) => r[0]);
    if (firstImage) {
      await db
        .update(products)
        .set({ imageUrl: firstImage.imageUrl, updatedAt: new Date() })
        .where(eq(products.id, firstImage.productId));
    }
  }

  return NextResponse.json({ success: true });
}
