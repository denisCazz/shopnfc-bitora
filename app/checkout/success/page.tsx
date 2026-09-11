import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import ClearCartOnSuccess from "./ClearCartOnSuccess";

export const metadata: Metadata = {
  title: "Ordine confermato",
};

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <ClearCartOnSuccess />
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Pagamento ricevuto!
        </h1>
        <p className="text-muted mb-8">
          Grazie per il tuo acquisto. Il pagamento è stato elaborato con
          successo. Riceverai una conferma via email con tutti i dettagli
          dell&apos;ordine e le informazioni sulla spedizione.
        </p>
        <Link
          href="/"
          className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white font-semibold hover:shadow-lg hover:shadow-sky-500/25 transition-all"
        >
          Torna allo shop
        </Link>
      </div>
    </div>
  );
}
