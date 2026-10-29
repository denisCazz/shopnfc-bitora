"use client";

import Link from "next/link";
import { CheckCircle2, FileText, ShieldCheck, Sparkles, Zap } from "lucide-react";
import AiShopAssistant from "@/components/AiShopAssistant";
import type { QuoteFormat } from "@/lib/quote-request";

export default function AssistenteClient({
  initialFormat,
  product,
}: {
  initialFormat: QuoteFormat | null;
  product: { name: string; slug: string; minQuantity: number } | null;
}) {
  const defaultPrompt = product
    ? `Vorrei acquistare ${Math.max(product.minQuantity, 20)} pezzi di ${product.name}`
    : initialFormat === "bracelet"
      ? "Mi servono 50 braccialetti NFC impermeabili pronti all'uso"
      : initialFormat === "sticker"
        ? "Mi servono 50 sticker NFC adesivi compatibili con smartphone"
        : initialFormat === "card"
          ? "Vorrei 30 tessere NFC personalizzate col mio logo pronte all'uso"
          : "";

  return (
    <main className="flex-1 bg-slate-950 text-white">
      <div className="mx-auto max-w-[1120px] px-5 py-8 md:px-8 md:py-12 space-y-6">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-sky-200">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            Assistente AI · Carrello pronto da acquistare
          </p>
          <h1 className="max-w-3xl text-[clamp(1.9rem,4vw,2.9rem)] font-bold leading-[1.04] tracking-[-0.04em]">
            Descrivi cosa ti serve: l&apos;AI prepara il carrello con i prodotti Shop NFC
          </h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Scrivi l&apos;uso (biglietti da visita, recensioni al tavolo, badge dipendenti, braccialetti, tag su metallo).
            L&apos;assistente sceglie dal catalogo, calcola il prezzo e ti porta al checkout.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {[
              { icon: Zap, label: "Prezzo immediato e carrello già pronto" },
              { icon: CheckCircle2, label: "Programmazione NFC inclusa" },
              { icon: ShieldCheck, label: "Logo al checkout o dopo l'ordine" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-slate-200">
                <Icon className="h-4 w-4 shrink-0 text-sky-400" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {product && (
          <p className="rounded-xl border border-sky-400/25 bg-sky-400/10 px-4 py-3 text-sm text-slate-100">
            Parti da{" "}
            <Link href={`/products/${product.slug}`} className="font-semibold text-sky-300 hover:underline">
              {product.name}
            </Link>
          </p>
        )}

        <AiShopAssistant
          initialPrompt={defaultPrompt}
          formatHint={initialFormat}
          productSlugHint={product?.slug ?? null}
          autoRunOnMount={defaultPrompt.length > 0}
          variant="standalone"
        />

        <p className="text-sm text-slate-400">
          Ordine fuori catalogo o oltre 1.000 pezzi?{" "}
          <Link href="/preventivo" className="inline-flex items-center gap-1 font-semibold text-sky-300 hover:underline">
            <FileText className="h-3.5 w-3.5" />
            Richiedi un preventivo
          </Link>
        </p>
      </div>
    </main>
  );
}
