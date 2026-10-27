import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { getUser } from "@/lib/auth";
import { buildQuotePdfDocument, type QuotePdfData } from "@/lib/quote-pdf";

let cachedLogoDataUrl: string | null = null;

async function getServerLogoDataUrl(): Promise<string | null> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    const logoPath = path.join(process.cwd(), "public", "bitora.png");
    const rawBuffer = await readFile(logoPath);
    const resizedBuffer = await sharp(rawBuffer)
      .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    cachedLogoDataUrl = `data:image/png;base64,${resizedBuffer.toString("base64")}`;
    return cachedLogoDataUrl;
  } catch (err) {
    console.warn("Could not load Bitora logo for PDF:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as QuotePdfData & { inline?: boolean };
    const logoDataUrl = (await getServerLogoDataUrl()) || body.logoDataUrl || null;

    const doc = buildQuotePdfDocument({
      ...body,
      logoDataUrl,
    });

    const arrayBuffer = doc.output("arraybuffer");
    const pdfBytes = Buffer.from(arrayBuffer);

    const safeQuote = (body.quoteNumber || "PREVENTIVO").replace(
      /[^a-zA-Z0-9_-]+/g,
      "_"
    );
    const safeCustomer = `${(body.firstName || "").trim()}_${(body.lastName || "").trim()}`
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const fileName = `Preventivo_Bitora_${safeQuote}${
      safeCustomer ? `_${safeCustomer}` : ""
    }.pdf`;

    const disposition = body.inline ? "inline" : "attachment";

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Failed to generate quote PDF:", err);
    return NextResponse.json(
      { error: "Errore durante la generazione del PDF" },
      { status: 500 }
    );
  }
}
