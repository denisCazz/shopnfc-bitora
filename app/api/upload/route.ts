import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { desc, eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { getDb } from "@/db";
import { productImages, products } from "@/db/schema";
import { uploadToR2 } from "@/lib/r2";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const USE_R2 = !!process.env.R2_ACCOUNT_ID;

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const productId = formData.get("product_id") as string | null;

  if (!file || !productId) {
    return NextResponse.json(
      { error: "File e product_id richiesti" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato non supportato. Usa JPG, PNG, WebP o GIF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File troppo grande. Massimo 5 MB." },
      { status: 400 }
    );
  }

  const ext = path.extname(file.name).toLowerCase() || ".jpg";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pid = parseInt(productId, 10);

  let imageUrl: string;

  if (USE_R2) {
    const r2Key = `products/${productId}/${safeName}`;
    imageUrl = await uploadToR2(r2Key, Buffer.from(bytes), file.type);
  } else {
    const productDir = path.join(UPLOAD_DIR, productId);
    await mkdir(productDir, { recursive: true });
    const filePath = path.join(productDir, safeName);
    await writeFile(filePath, bytes);
    imageUrl = `/uploads/products/${productId}/${safeName}`;
  }

  const db = getDb();
  const [last] = await db
    .select({ sortOrder: productImages.sortOrder })
    .from(productImages)
    .where(eq(productImages.productId, pid))
    .orderBy(desc(productImages.sortOrder))
    .limit(1);
  const nextOrder = last ? last.sortOrder + 1 : 0;

  const [image] = await db
    .insert(productImages)
    .values({
      productId: pid,
      imageUrl,
      sortOrder: nextOrder,
    })
    .returning();

  if (!image) {
    return NextResponse.json({ error: "Insert fallito" }, { status: 500 });
  }

  if (nextOrder === 0) {
    await db
      .update(products)
      .set({ imageUrl, updatedAt: new Date() })
      .where(eq(products.id, pid));
  }

  return NextResponse.json({
    image: {
      id: image.id,
      image_url: image.imageUrl,
      sort_order: image.sortOrder,
      alt_text: image.altText,
    },
  });
}
