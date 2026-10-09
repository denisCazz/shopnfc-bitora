import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, MessageCircle } from "lucide-react";
import ClearCartOnSuccess from "./ClearCartOnSuccess";
import CheckoutProgress from "@/components/CheckoutProgress";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Ordine confermato",
};

const NEXT_STEPS = [
  "Ricevi subito l'email di conferma con il riepilogo dell'ordine.",
  "Se hai scelto la stampa, puoi caricare o sostituire la grafica da «I miei ordini» finché non entra in produzione.",
  "Prepariamo, programmiamo e spediamo: ti avvisiamo via email alla spedizione.",
];

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <ClearCartOnSuccess />
      <div className="w-full max-w-xl">
        <CheckoutProgress current={3} />
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Pagamento ricevuto!
          </h1>
          <p className="text-muted mb-8">
            Grazie per il tuo acquisto. Il pagamento è stato elaborato con successo.
          </p>
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
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/account/orders"
            className="inline-flex justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white font-semibold hover:shadow-lg hover:shadow-sky-500/25 transition-all"
          >
            I miei ordini
          </Link>
          <a
            href={whatsappUrl("Ciao, ho appena fatto un ordine su Shop NFC Bitora.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex justify-center items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-surface-hover"
          >
            <MessageCircle className="w-4 h-4 text-[#1f8f4e]" />
            Domande? WhatsApp
          </a>
          <Link
            href="/"
            className="inline-flex justify-center px-6 py-3 rounded-xl text-muted font-medium hover:text-accent"
          >
            Torna allo shop
          </Link>
        </div>
      </div>
    </div>
  );
}
