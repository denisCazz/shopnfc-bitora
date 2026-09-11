import { NextResponse } from "next/server";
import { and, count, eq, sql } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { getDb } from "@/db";
import { productImages, products } from "@/db/schema";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { productId, imageUrl, altText, sortOrder } = await request.json();

  if (!productId || !imageUrl) {
    return NextResponse.json(
      { error: "productId e imageUrl sono obbligatori" },
      { status: 400 }
    );
  }

  const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";
  if (R2_PUBLIC_URL && !imageUrl.startsWith(R2_PUBLIC_URL)) {
    return NextResponse.json(
      { error: "URL immagine non valido" },
      { status: 400 }
    );
  }

  const db = getDb();
  const existing = await db
    .select({ id: productImages.id })
    .from(productImages)
    .where(
      and(
        eq(productImages.productId, productId),
        eq(productImages.imageUrl, imageUrl)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (existing) {
    return NextResponse.json(
      { error: "Immagine già associata a questo prodotto" },
      { status: 409 }
    );
  }

  const [image] = await db
    .insert(productImages)
    .values({
      productId,
      imageUrl,
      altText: altText || null,
      sortOrder: sortOrder ?? 0,
    })
    .returning();

  if (!image) {
    return NextResponse.json({ error: "Insert fallito" }, { status: 500 });
  }

  const [cnt] = await db
    .select({ c: count(sql`1`) })
    .from(productImages)
    .where(eq(productImages.productId, productId));

  if (Number(cnt.c) === 1) {
    await db
      .update(products)
      .set({ imageUrl, updatedAt: new Date() })
      .where(eq(products.id, productId));
  }

  return NextResponse.json({
    success: true,
    image: {
      id: image.id,
      image_url: image.imageUrl,
      sort_order: image.sortOrder,
      alt_text: image.altText,
    },
  });
}
