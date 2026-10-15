"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ExternalLink,
  MessageCircle,
  Cpu,
  Palette,
  Copy,
  Check,
  MapPin,
  Calendar,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  type UnifiedTrackingView,
  getTrackingStatusDef,
} from "@/lib/tracking";
import { whatsappUrl } from "@/lib/whatsapp";

const PIPELINE_STEPS = [
  {
    step: 1,
    title: "Ordine ricevuto",
    subtitle: "Registrazione e verifica",
    icon: Package,
  },
  {
    step: 2,
    title: "Verifica grafica fornitore",
    subtitle: "Controllo idoneità stampa",
    icon: Palette,
  },
  {
    step: 3,
    title: "Produzione & NFC",
    subtitle: "Stampa, codifica e test",
    icon: Cpu,
  },
  {
    step: 4,
    title: "Spedizione Corriere",
    subtitle: "Affidato al corriere espresso",
    icon: Truck,
  },
  {
    step: 5,
    title: "Consegnato",
    subtitle: "Consegna completata",
    icon: CheckCircle2,
  },
];

export default function TrackingClient({
  initialCode = "",
  initialTracking = null,
}: {
  initialCode?: string;
  initialTracking?: UnifiedTrackingView | null;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(initialCode);
  const [tracking, setTracking] = useState<UnifiedTrackingView | null>(initialTracking);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchTracking = useCallback(
    async (codeToSearch: string, updateUrl = true) => {
      const clean = codeToSearch.trim();
      if (!clean) {
        setError("Inserisci un numero d'ordine (es. 15/A) o un codice tracking (es. BIT-2026-XXXXX).");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/tracking?code=${encodeURIComponent(clean)}`);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setTracking(null);
          setError(
            data.error ||
              "Ordine non trovato. Verifica il codice inserito oppure contattaci su WhatsApp."
          );
          return;
        }
        setTracking(data.tracking);
        if (updateUrl) {
          router.replace(`/tracking?code=${encodeURIComponent(clean)}`, { scroll: false });
        }
      } catch {
        setError("Errore di connessione durante la ricerca. Riprova.");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    const urlCode = searchParams.get("code")?.trim();
    if (urlCode && urlCode !== initialCode) {
      setQuery(urlCode);
      void fetchTracking(urlCode, false);
    }
  }, [searchParams, initialCode, fetchTracking]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void fetchTracking(query, true);
  }

  function copyShareLink() {
    if (!tracking) return;
    const url = `${window.location.origin}/tracking?code=${encodeURIComponent(tracking.code)}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  const statusDef = tracking ? getTrackingStatusDef(tracking.trackingStatus) : null;
  const activeStep = statusDef?.stepIndex ?? 1;
  const isRejected =
    tracking?.trackingStatus === "graphic_rejected" ||
    tracking?.graphicStatus === "rejected";
  const isCancelled = tracking?.trackingStatus === "cancelled";
  const isException = tracking?.trackingStatus === "exception";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14 space-y-8">
      {/* Hero / Search Box */}
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 text-accent text-xs font-semibold mb-3">
            <Truck className="w-3.5 h-3.5" />
            Tracking Ordini &amp; Produzione NFC
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Traccia il tuo ordine in tempo reale
          </h1>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            Inserisci il <strong>numero d&apos;ordine</strong> (es.{" "}
            <code className="px-1.5 py-0.5 rounded bg-background border border-border text-xs">
              15/A
            </code>
            ), il <strong>codice tracking Bitora</strong> ricevuto su WhatsApp/email (es.{" "}
            <code className="px-1.5 py-0.5 rounded bg-background border border-border text-xs">
              BIT-2026-...
            </code>
            ) oppure il <strong>numero di spedizione del corriere</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Es. 15/A, BIT-2026-AB12C o codice corriere..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-sky-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Ricerca...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Cerca spedizione
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50/80 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">{error}</p>
              <p className="text-xs opacity-90">
                Hai ordinato direttamente via WhatsApp o telefono? Chiedici il tuo codice tracking personalizzato su{" "}
                <a
                  href={whatsappUrl("Ciao, vorrei conoscere lo stato e il codice tracking del mio ordine.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold"
                >
                  WhatsApp
                </a>
                .
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Results View */}
      {tracking && statusDef && (
        <div className="space-y-6">
          {/* Status Banner Card */}
          <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {tracking.source === "website_order" ? "Ordine Web" : "Ordine Diretto Bitora"}
                  </span>
                  <span className="text-lg font-mono font-bold text-foreground">
                    #{tracking.code}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusDef.badgeColor}`}
                  >
                    {statusDef.label}
                  </span>
                </div>
                <p className="text-sm text-muted mt-1">
                  Cliente: <strong className="text-foreground">{tracking.customerName}</strong>
                  {tracking.customerCompany ? ` · ${tracking.customerCompany}` : ""}
                  {tracking.shippingDestination ? ` · Destinazione: ${tracking.shippingDestination}` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={copyShareLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-surface-hover text-xs font-semibold text-foreground transition-colors self-start sm:self-auto"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    Link copiato!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-muted" />
                    Copia link tracking
                  </>
                )}
              </button>
            </div>

            {/* Alert if graphic is rejected */}
            {isRejected && (
              <div className="rounded-2xl border-2 border-red-300 dark:border-red-800 bg-red-50/90 dark:bg-red-950/40 p-4 sm:p-5 text-sm text-red-950 dark:text-red-100 space-y-3">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-base">
                      Attenzione: Grafica rifiutata dal fornitore — Richiesto nuovo file
                    </p>
                    <p className="text-xs sm:text-sm leading-relaxed">
                      {tracking.graphicNote ||
                        "Il file grafico inviato non rispetta i requisiti tecnici di stampa (risoluzione min. 300 DPI, margini di sicurezza 2 mm o formato PNG/PDF). L'accettazione dell'ordine è subordinata all'approvazione della grafica da parte del fornitore."}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2.5 pl-8">
                  {tracking.source === "website_order" && (
                    <Link
                      href="/account/orders"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
                    >
                      Sostituisci grafica da «I miei ordini» →
                    </Link>
                  )}
                  <a
                    href={whatsappUrl(
                      `Ciao, vi scrivo per l'ordine #${tracking.code} con grafica rifiutata per inviare il file corretto.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1f8f4e] hover:bg-[#22a358] text-white text-xs font-bold transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Invia nuova grafica su WhatsApp
                  </a>
                </div>
              </div>
            )}

            {/* Graphic Review Status Box (when order has custom print and is not rejected) */}
            {tracking.hasCustomPrint && !isRejected && (
              <div
                className={`rounded-2xl border p-4 text-xs sm:text-sm flex items-start gap-3 ${
                  tracking.graphicStatus === "accepted" ||
                  tracking.trackingStatus === "graphic_accepted" ||
                  activeStep >= 3
                    ? "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/25 text-emerald-950 dark:text-emerald-100"
                    : "border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100"
                }`}
              >
                <Palette className="w-5 h-5 shrink-0 mt-0.5 text-current opacity-80" />
                <div className="space-y-1">
                  <p className="font-bold">
                    {tracking.graphicStatus === "accepted" ||
                    tracking.trackingStatus === "graphic_accepted" ||
                    activeStep >= 3
                      ? "Stato Grafica Fornitore: Grafica Accettata ✓"
                      : tracking.graphicStatus === "pending_upload"
                        ? "Stato Grafica Fornitore: In attesa del file grafico definitivo"
                        : "Stato Grafica Fornitore: Grafica in revisione tecnica"}
                  </p>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {tracking.graphicNote ||
                      "Ricordiamo che non viene fornita anteprima grafica prima della produzione e che l'accettazione definitiva dell'ordine è subordinata all'accettazione della grafica da parte del nostro fornitore."}
                  </p>
                </div>
              </div>
            )}

            {/* Visual 5-Step Progress Pipeline */}
            {!isCancelled && (
              <div className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {PIPELINE_STEPS.map((s) => {
                    const Icon = s.icon;
                    const isCompleted = activeStep > s.step || tracking.trackingStatus === "delivered";
                    const isCurrent = activeStep === s.step && tracking.trackingStatus !== "delivered";
                    const isStepError =
                      isCurrent && (isRejected || isException);

                    return (
                      <div
                        key={s.step}
                        className={`relative rounded-2xl border p-3.5 transition-all ${
                          isStepError
                            ? "border-red-400 bg-red-50/60 dark:bg-red-950/30"
                            : isCurrent
                              ? "border-accent bg-sky-50/70 dark:bg-sky-950/30 ring-2 ring-accent/20"
                              : isCompleted
                                ? "border-emerald-300/80 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20"
                                : "border-border bg-background/50 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 sm:flex-col sm:items-start">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isStepError
                                ? "bg-red-600 text-white"
                                : isCompleted
                                  ? "bg-emerald-600 text-white"
                                  : isCurrent
                                    ? "bg-accent text-white"
                                    : "bg-stone-200 dark:bg-stone-800 text-muted"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <Icon className="w-4.5 h-4.5" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground leading-snug">
                              {s.title}
                            </p>
                            <p className="text-[11px] text-muted mt-0.5 leading-tight">
                              {s.subtitle}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current Status Explanation + Admin Public Note */}
            <div className="rounded-2xl border border-border bg-background p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-foreground">{statusDef.label}</p>
                {tracking.estimatedDelivery && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-lg">
                    <Calendar className="w-3.5 h-3.5" />
                    Consegna stimata: {tracking.estimatedDelivery}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                {statusDef.description}
              </p>
              {tracking.publicNote && (
                <div className="mt-2 pt-2 border-t border-border/60 text-xs sm:text-sm text-foreground">
                  <strong>Nota aggiornamento:</strong> {tracking.publicNote}
                </div>
              )}
            </div>

            {/* External Carrier Tracking Tools Section */}
            {tracking.carrierTrackingNumber && (
              <div className="rounded-2xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/20 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                      Tracciamento Corriere Espresso
                    </span>
                    <h3 className="text-base font-bold text-foreground mt-0.5">
                      {tracking.carrierName} · Codice:{" "}
                      <span className="font-mono text-accent select-all">
                        {tracking.carrierTrackingNumber}
                      </span>
                    </h3>
                  </div>

                  {tracking.carrierDirectUrl && (
                    <a
                      href={tracking.carrierDirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-xs sm:text-sm font-bold hover:opacity-95 transition-opacity self-start sm:self-auto"
                    >
                      Traccia sul sito {tracking.carrierName}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {tracking.externalTools && (
                  <div className="pt-3 border-t border-sky-200/70 dark:border-sky-800/50">
                    <p className="text-xs text-muted mb-2.5">
                      Oppure verifica la posizione in tempo reale sui portali di tracking universali gratuiti:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={tracking.externalTools.track17Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-surface hover:border-accent/50 text-xs font-semibold text-foreground transition-colors"
                      >
                        <span>17TRACK (Consigliato)</span>
                        <ExternalLink className="w-3.5 h-3.5 text-muted" />
                      </a>
                      <a
                        href={tracking.externalTools.parcelsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-surface hover:border-accent/50 text-xs font-semibold text-foreground transition-colors"
                      >
                        <span>ParcelsApp</span>
                        <ExternalLink className="w-3.5 h-3.5 text-muted" />
                      </a>
                      <a
                        href={tracking.externalTools.afterShipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-surface hover:border-accent/50 text-xs font-semibold text-foreground transition-colors"
                      >
                        <span>AfterShip</span>
                        <ExternalLink className="w-3.5 h-3.5 text-muted" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order Items & Timeline Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Cronologia Eventi */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  Cronologia aggiornamenti
                </h3>
                <div className="rounded-2xl border border-border bg-background p-4 space-y-4">
                  {tracking.history.map((ev, idx) => {
                    const evDef = getTrackingStatusDef(ev.status);
                    return (
                      <div key={ev.id || idx} className="relative flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-3 h-3 rounded-full mt-1.5 ${
                              idx === 0 ? "bg-accent ring-4 ring-accent/20" : "bg-stone-300 dark:bg-stone-700"
                            }`}
                          />
                          {idx < tracking.history.length - 1 && (
                            <div className="w-px flex-1 bg-border my-1" />
                          )}
                        </div>
                        <div className="pb-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="text-xs font-bold text-foreground">
                              {ev.title || evDef.label}
                            </span>
                            <span className="text-[11px] text-muted">
                              {new Date(ev.timestamp).toLocaleString("it-IT", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {ev.description && (
                            <p className="text-xs text-muted mt-0.5 leading-relaxed">
                              {ev.description}
                            </p>
                          )}
                          {ev.location && (
                            <p className="text-[11px] text-muted mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ev.location}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Riepilogo fornitura */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-accent" />
                  Riepilogo fornitura
                </h3>
                <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
                  {tracking.itemsSummary.length > 0 ? (
                    <ul className="divide-y divide-border/60 text-sm">
                      {tracking.itemsSummary.map((item, i) => (
                        <li key={i} className="py-2 first:pt-0 last:pb-0 flex justify-between gap-3">
                          <span className="text-foreground font-medium">{item.name}</span>
                          {item.quantity > 1 && (
                            <span className="text-muted font-semibold shrink-0">
                              × {item.quantity} pz
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted">Fornitura NFC personalizzata</p>
                  )}

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted">
                    <span>Data apertura ordine:</span>
                    <span className="font-medium text-foreground">
                      {new Date(tracking.createdAt).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <a
                      href={whatsappUrl(
                        `Ciao, vorrei informazioni sull'ordine #${tracking.code} (${statusDef.shortLabel}).`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1f8f4e] hover:bg-[#22a358] text-white text-xs font-semibold transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chiedi assistenza su questo ordine via WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info block on stages when no tracking is loaded yet */}
      {!tracking && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              1. Revisione grafica del fornitore
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Per gli ordini con stampa personalizzata non viene inviata anteprima: il file definitivo
              viene verificato direttamente dal nostro fornitore. L&apos;accettazione dell&apos;ordine è
              subordinata all&apos;idoneità tecnica della grafica.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              2. Produzione, Stampa e Codifica NFC
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Una volta accettata la grafica dal fornitore, stampiamo e programmiamo ogni singolo chip
              NFC (URL, vCard, seriali o NDEF) eseguendo il controllo qualità sul lotto.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/50 text-accent flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              3. Ordini Sito, WhatsApp o Email
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Anche se hai ordinato scrivendoci direttamente su WhatsApp, via email o telefono senza
              passare dal sito, ti forniamo un codice tracking dedicato per seguire ogni fase qui.
            </p>
          </div>
        </div>
      )}

      {/* Quick link to My Orders for registered users */}
      <div className="rounded-2xl border border-border bg-surface/60 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <span className="text-muted">
          Hai effettuato l&apos;ordine con un account registrato sul sito?
        </span>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline"
        >
          Vai a «I miei ordini»
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
