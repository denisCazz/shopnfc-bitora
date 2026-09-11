import { NextRequest, NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getUser } from "@/lib/auth";
import { r2Client, R2_PUBLIC_URL, r2Bucket } from "@/lib/r2";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const categorySlug = req.nextUrl.searchParams.get("category");
  if (!categorySlug) {
    return NextResponse.json({ error: "Parametro category richiesto" }, { status: 400 });
  }

  const prefix = `products/${categorySlug}/`;

  try {
    const response = await r2Client().send(
      new ListObjectsV2Command({
        Bucket: r2Bucket(),
        Prefix: prefix,
        MaxKeys: 500,
      })
    );

    const images = (response.Contents || [])
      .filter((obj) => {
        const key = obj.Key || "";
        return /\.(jpg|jpeg|png|webp|gif|jpe|tif)$/i.test(key);
      })
      .map((obj) => {
        const key = obj.Key!;
        const filename = key.split("/").pop() || key;
        return {
          key,
          url: `${R2_PUBLIC_URL}/${key}`,
          filename,
          size: obj.Size || 0,
          lastModified: obj.LastModified?.toISOString() || null,
        };
      })
      .sort((a, b) => a.filename.localeCompare(b.filename));

    return NextResponse.json({ images, prefix, total: images.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Errore listing R2";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
