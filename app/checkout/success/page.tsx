import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, MessageCircle, Building2, Upload, PackageSearch, AlertTriangle } from "lucide-react";
import ClearCartOnSuccess from "./ClearCartOnSuccess";
import CheckoutProgress from "@/components/CheckoutProgress";
import { whatsappUrl } from "@/lib/whatsapp";
import { formatOrderNumber } from "@/lib/order-number";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ordine confermato",
};

const NEXT_STEPS = [
  "Ricevi subito l'email di conferma con il riepilogo dell'ordine.",
  "Se hai scelto la stampa personalizzata, puoi caricare o sostituire la grafica da «I miei ordini». Ricorda che non viene inviata anteprima e l'accettazione dell'ordine è subordinata all'approvazione della grafica da parte del nostro fornitore.",
  "Segui in tempo reale la revisione grafica, la produzione NFC e la spedizione nella pagina Tracking Ordini.",
];

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; method?: string; t?: string }>;
}) {
  const params = await searchParams;
  const orderIdNum = params.order ? Number.parseInt(params.order, 10) : null;
  const orderCode =
    orderIdNum && Number.isFinite(orderIdNum) ? formatOrderNumber(orderIdNum) : null;
  const isBankTransfer = params.method === "bank_transfer";
  const receiptToken = params.t || "";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-10">
      <ClearCartOnSuccess />
      <div className="w-full max-w-xl">
        <CheckoutProgress current={3} />
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isBankTransfer ? "Ordine registrato!" : "Pagamento ricevuto!"}
          </h1>
          {orderCode && (
            <p className="text-sm font-mono font-semibold text-accent mb-2">
              Ordine #{orderCode}
            </p>
          )}
          <p className="text-muted mb-6">
            {isBankTransfer
              ? "Grazie per il tuo ordine. Effettua il bonifico bancario seguendo le coordinate qui sotto."
              : "Grazie per il tuo acquisto. Il pagamento è stato elaborato con successo."}
          </p>
        </div>

        {isBankTransfer && (
          <div className="mb-6 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/35 p-5 space-y-3 text-sm text-amber-950 dark:text-amber-100">
            <div className="flex items-center gap-2 font-bold text-base">
              <Building2 className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              Coordinate per il Bonifico Bancario
            </div>
            <div className="space-y-1 text-xs sm:text-sm">
              <p>
                <strong>Intestatario:</strong> {SITE.bankHolder}
              </p>
              <p>
                <strong>IBAN:</strong>{" "}
                <span className="font-mono font-bold select-all">
                  IT76S0708461620000000920491
                </span>
              </p>
              <p>
                <strong>Causale:</strong>{" "}
                <span className="font-mono font-semibold">
                  Ordine #{orderCode || params.order || ""}
                </span>
              </p>
            </div>
            {orderIdNum && receiptToken && (
              <div className="pt-2">
                <Link
                  href={`/ordine/${orderIdNum}/contabile?t=${encodeURIComponent(receiptToken)}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Carica contabile bonifico per velocizzare l&apos;ordine
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20 px-4 py-3 text-xs text-amber-950 dark:text-amber-100 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Nota stampa personalizzata:</strong> non viene inviata anteprima o bozza grafica.
            L&apos;accettazione definitiva dell&apos;ordine è subordinata alla verifica e all&apos;accettazione
            della grafica da parte del nostro fornitore.
          </span>
        </div>

        <ol className="space-y-3 mb-8 rounded-2xl border border-border bg-surface p-5">
          {NEXT_STEPS.map((text, i) => (
            <li key={text} className="flex gap-3 items-start">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-bold">
                {i + 1}
              </span>
              <span className="text-sm text-foreground pt-1">{text}</span>
            </li>
          ))}
        </ol>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
          <Link
            href={orderCode ? `/tracking?code=${encodeURIComponent(orderCode)}` : "/tracking"}
            className="inline-flex justify-center items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white font-semibold hover:shadow-lg hover:shadow-sky-500/25 transition-all"
          >
            <PackageSearch className="w-4 h-4" />
            Traccia il tuo ordine
          </Link>
          <Link
            href="/account/orders"
            className="inline-flex justify-center px-5 py-3 rounded-xl border border-border bg-surface text-foreground font-semibold hover:bg-surface-hover transition-all"
          >
            I miei ordini
          </Link>
          <a
            href={whatsappUrl(
              `Ciao, ho appena fatto un ordine${orderCode ? ` (#${orderCode})` : ""} su Shop NFC Bitora.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex justify-center items-center gap-2 px-5 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-surface-hover"
          >
            <MessageCircle className="w-4 h-4 text-[#1f8f4e]" />
            WhatsApp
          </a>
          <Link
            href="/"
            className="inline-flex justify-center px-4 py-3 rounded-xl text-muted font-medium hover:text-accent"
          >
            Torna allo shop
          </Link>
        </div>
      </div>
    </div>
  );
}
