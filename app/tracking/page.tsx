import { Suspense } from "react";
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import LandingHeader from "@/components/LandingHeader";
import { getUser } from "@/lib/auth";
import { lookupUnifiedTracking } from "@/lib/tracking-server";
import TrackingClient from "./TrackingClient";

export const metadata: Metadata = {
  title: "Traccia il tuo ordine — Tracking Produzione & Corriere",
  description:
    "Segui in tempo reale lo stato del tuo ordine NFC Bitora: verifica grafica fornitore, programmazione chip NFC e tracciamento corriere espresso.",
};

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const user = await getUser();
  const params = await searchParams;
  const code = params.code?.trim() || "";
  const initialTracking = code ? await lookupUnifiedTracking(code) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader user={user} />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="max-w-4xl mx-auto px-4 py-12 text-sm text-muted">
              Caricamento tracking…
            </div>
          }
        >
          <TrackingClient initialCode={code} initialTracking={initialTracking} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
