import { NextRequest, NextResponse } from "next/server";
import { lookupUnifiedTracking } from "@/lib/tracking-server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim() || "";
  if (!code) {
    return NextResponse.json(
      { error: "Inserisci un codice di tracking o un numero d'ordine." },
      { status: 400 }
    );
  }

  try {
    const tracking = await lookupUnifiedTracking(code);
    if (!tracking) {
      return NextResponse.json(
        {
          error:
            "Nessun ordine o spedizione trovata con questo codice. Verifica il codice (es. 15/A o BIT-2026-XXXXX) oppure contattaci su WhatsApp.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, tracking });
  } catch (err) {
    console.error("Tracking lookup error:", err);
    return NextResponse.json(
      { error: "Errore durante la ricerca del tracking. Riprova tra poco." },
      { status: 500 }
    );
  }
}
