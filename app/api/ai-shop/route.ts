import { NextRequest, NextResponse } from "next/server";
import { generateSmartCartRecommendation } from "@/lib/ai-shop-assistant";
import { getPrintConfig } from "@/lib/print-options-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const formatHint = typeof body.formatHint === "string" ? body.formatHint : null;
    const productSlugHint = typeof body.productSlugHint === "string" ? body.productSlugHint : null;

    if (!prompt && !formatHint && !productSlugHint) {
      return NextResponse.json(
        { error: "Descrivi brevemente cosa vuoi realizzare con i tag NFC." },
        { status: 400 }
      );
    }

    const [recommendation, printConfig] = await Promise.all([
      generateSmartCartRecommendation(prompt || "Vorrei acquistare tessere NFC personalizzate", {
        formatHint,
        productSlugHint,
      }),
      getPrintConfig(),
    ]);

    return NextResponse.json({
      ...recommendation,
      printPrices: printConfig.prices,
    });
  } catch (err) {
    console.error("AI shop assistant error:", err);
    return NextResponse.json(
      { error: "Impossibile elaborare la richiesta in questo momento. Riprova." },
      { status: 500 }
    );
  }
}
