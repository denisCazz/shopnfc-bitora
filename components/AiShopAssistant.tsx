"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ShoppingCart,
  Zap,
  Plus,
  Trash2,
  Check,
  Loader2,
  Cpu,
  Palette,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";
import { useCart, type CartItem } from "@/lib/cart-context";
import { useUser } from "@/lib/user-context";
import { useCatalogDisplayPrice } from "@/lib/use-catalog-display-price";
import {
  DEFAULT_PRINT_PRICES,
  parsePrintOption,
  printOptionLineKey,
  printSurcharge,
  productNeedsPrintOption,
  type PrintOption,
  type PrintPrices,
} from "@/lib/print-options";
import { roundMoney } from "@/lib/pricing";
import { isBelowMinQuantity } from "@/lib/min-quantity";
import type { AiCartRecommendation } from "@/lib/ai-shop-assistant";
import FreeQuantityInput from "@/components/FreeQuantityInput";

const QUICK_PROMPTS = [
  {
    label: "Biglietti da visita NFC col mio logo",
    prompt: "Vorrei 30 biglietti da visita NFC personalizzati a colori col mio logo e contatto vCard",
  },
  {
    label: "50 Badge dipendenti + Lettore PC",
    prompt: "Mi servono 50 badge tessere NFC per controllo accessi e marcatempo dipendenti + 1 lettore USB per PC",
  },
  {
    label: "Recensioni Google / Menu al tavolo",
    prompt: "Vorrei 25 tag adesivi con logo NFC per far lasciare recensioni Google e aprire il menu nel mio locale",
  },
  {
    label: "100 Braccialetti piscina / evento",
    prompt: "Mi servono 100 braccialetti NFC in silicone impermeabili per piscina, villaggio o palestra",
  },
  {
    label: "Tag NFC su superfici in metallo",
    prompt: "Devo applicare 50 tag NFC su macchinari, scaffali o attrezzature in metallo e acciaio",
  },
  {
    label: "Portachiavi NFC per B&B / Hotel",
    prompt: "Vorrei 20 portachiavi NFC impermeabili per le camere del mio B&B / hotel",
  },
];

const PRINT_OPTION_LABELS: { value: PrintOption; label: string }[] = [
  { value: "none", label: "Neutre (senza stampa)" },
  { value: "black", label: "Stampa nero 1 lato" },
  { value: "color1", label: "Stampa colori 1 lato" },
  { value: "color2", label: "Stampa colori fronte/retro" },
];

export default function AiShopAssistant({
  initialPrompt = "",
  formatHint = null,
  productSlugHint = null,
  autoRunOnMount = false,
  variant = "hero",
}: {
  initialPrompt?: string;
  formatHint?: string | null;
  productSlugHint?: string | null;
  autoRunOnMount?: boolean;
  variant?: "hero" | "standalone";
}) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [useCaseLabel, setUseCaseLabel] = useState<string | null>(null);
  const [items, setItems] = useState<AiCartRecommendation[]>([]);
  const [alternatives, setAlternatives] = useState<AiCartRecommendation[]>([]);
  const [printPrices, setPrintPrices] = useState<PrintPrices>(DEFAULT_PRINT_PRICES);
  const [nfcPayload, setNfcPayload] = useState("");
  const [justFilled, setJustFilled] = useState(false);

  const { replaceCart, openCart } = useCart();
  const { dealerDiscount } = useUser();
  const { formatCatalogPrice } = useCatalogDisplayPrice();
  const router = useRouter();
  const resultRef = useRef<HTMLDivElement>(null);
  const didAutoRun = useRef(false);

  function computeEffectiveUnitPrice(item: AiCartRecommendation): number {
    const discountedBase = dealerDiscount
      ? roundMoney(item.basePrice * (1 - dealerDiscount / 100))
      : item.basePrice;
    const isPrintable = productNeedsPrintOption({ categorySlug: item.categorySlug });
    const extra = isPrintable ? printSurcharge(item.printOption, printPrices) : 0;
    return roundMoney(discountedBase + extra);
  }

  function buildCartItemsList(list: AiCartRecommendation[]): CartItem[] {
    const trimmedPayload = nfcPayload.trim();
    return list.map((item) => {
      const unitPrice = computeEffectiveUnitPrice(item);
      const isPrintable = productNeedsPrintOption({ categorySlug: item.categorySlug });
      const extra = isPrintable ? printSurcharge(item.printOption, printPrices) : 0;

      const noteParts: string[] = [];
      if (isPrintable && item.printOption !== "none") {
        const optLabel =
          PRINT_OPTION_LABELS.find((o) => o.value === item.printOption)?.label ?? "";
        if (optLabel) noteParts.push(optLabel);
      }
      if (item.categorySlug !== "lettori-nfc") {
        if (trimmedPayload) {
          noteParts.push(`Programmazione NFC: ${trimmedPayload}`);
        } else if (item.lineNotes && item.lineNotes.includes("Programmazione NFC")) {
          const progPart = item.lineNotes
            .split(" · ")
            .find((p) => p.includes("Programmazione NFC"));
          if (progPart) noteParts.push(progPart);
        }
      }

      const nfcKey =
        item.categorySlug !== "lettori-nfc" && trimmedPayload
          ? `:nfc:${trimmedPayload.slice(0, 28)}`
          : "";
      const pKey = isPrintable ? printOptionLineKey(item.printOption) ?? "" : "";
      const lineKey = `${pKey}${nfcKey}` || item.lineKey;

      return {
        id: item.productId,
        name: item.name,
        slug: item.slug,
        price: unitPrice,
        image: item.image,
        weight: item.weight,
        quantity: Math.max(1, Math.floor(item.quantity) || 1),
        minQuantity: item.minQuantity,
        lineKey,
        lineNotes: noteParts.length > 0 ? noteParts.join(" · ") : null,
        printOption: isPrintable ? item.printOption : "none",
        printSurcharge: extra,
      };
    });
  }

  async function runAssistant(customPrompt?: string) {
    const textToUse = (customPrompt ?? prompt).trim();
    if (!textToUse && !formatHint && !productSlugHint) {
      setError("Scrivi cosa ti serve o clicca su uno degli esempi rapidi qui sotto.");
      return;
    }
    setError(null);
    setLoading(true);
    setJustFilled(false);

    try {
      const res = await fetch("/api/ai-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToUse,
          formatHint,
          productSlugHint,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Errore durante la configurazione del carrello.");
        return;
      }

      const nextPrices: PrintPrices = data.printPrices || DEFAULT_PRINT_PRICES;
      setPrintPrices(nextPrices);
      setSummary(data.summary || null);
      setUseCaseLabel(data.detectedIntent?.useCase || null);
      const recommended: AiCartRecommendation[] = Array.isArray(data.items) ? data.items : [];
      setItems(recommended);
      setAlternatives(Array.isArray(data.alternatives) ? data.alternatives : []);

      // Automatically pre-fill the user's cart immediately so it's ready to buy!
      if (recommended.length > 0) {
        const cartPayload: CartItem[] = recommended.map((item) => {
          const discountedBase = dealerDiscount
            ? roundMoney(item.basePrice * (1 - dealerDiscount / 100))
            : item.basePrice;
          const isPrintable = productNeedsPrintOption({ categorySlug: item.categorySlug });
          const extra = isPrintable ? printSurcharge(item.printOption, nextPrices) : 0;
          return {
            id: item.productId,
            name: item.name,
            slug: item.slug,
            price: roundMoney(discountedBase + extra),
            image: item.image,
            weight: item.weight,
            quantity: Math.max(1, Math.floor(item.quantity) || 1),
            minQuantity: item.minQuantity,
            lineKey: item.lineKey,
            lineNotes: item.lineNotes ?? null,
            printOption: isPrintable ? item.printOption : "none",
            printSurcharge: extra,
          };
        });
        replaceCart(cartPayload);
        setJustFilled(true);
      }

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    } catch {
      setError("Impossibile contattare l'assistente. Riprova tra un istante.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autoRunOnMount && !didAutoRun.current && (initialPrompt || formatHint || productSlugHint)) {
      didAutoRun.current = true;
      void runAssistant(initialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRunOnMount, initialPrompt, formatHint, productSlugHint]);

  // Sync changes to local items directly into the global cart so the user's cart is always up-to-date
  function syncToGlobalCart(nextItems: AiCartRecommendation[]) {
    setItems(nextItems);
    if (nextItems.length > 0) {
      replaceCart(buildCartItemsList(nextItems));
    }
  }

  function handleQuantityChange(productId: number, nextQty: number) {
    const updated = items.map((item) => {
      if (item.productId !== productId) return item;
      const quantity = Math.max(1, Math.floor(nextQty) || 1);
      return { ...item, quantity };
    });
    syncToGlobalCart(updated);
  }

  function handlePrintChange(productId: number, option: PrintOption) {
    const updated = items.map((item) => {
      if (item.productId !== productId) return item;
      const parsed = parsePrintOption(option);
      const extra = printSurcharge(parsed, printPrices);
      return {
        ...item,
        printOption: parsed,
        printSurcharge: extra,
        unitPrice: roundMoney(item.basePrice + extra),
      };
    });
    syncToGlobalCart(updated);
  }

  function handleRemoveRecommendation(productId: number) {
    const updated = items.filter((i) => i.productId !== productId);
    syncToGlobalCart(updated);
  }

  function handleAddAlternative(alt: AiCartRecommendation) {
    const next = [...items, alt];
    setAlternatives((prev) => prev.filter((a) => a.productId !== alt.productId));
    syncToGlobalCart(next);
  }

  const hasQuantityBelowMin = items.some((item) =>
    isBelowMinQuantity(item.quantity, item.minQuantity)
  );

  function handleProceedToCheckout() {
    if (items.length === 0 || hasQuantityBelowMin) return;
    replaceCart(buildCartItemsList(items));
    router.push("/checkout");
  }

  function handleOpenCartDrawer() {
    if (items.length === 0) return;
    replaceCart(buildCartItemsList(items));
    openCart();
  }

  const grandTotal = items.reduce(
    (sum, item) => sum + computeEffectiveUnitPrice(item) * item.quantity,
    0
  );
  const totalPieces = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="w-full">
      {/* Main AI Input Box */}
      <div
        className={`rounded-3xl border transition-all ${
          variant === "hero"
            ? "border-sky-400/30 bg-slate-900/90 p-5 md:p-7 shadow-[0_20px_60px_rgba(14,165,233,0.18)] backdrop-blur-md"
            : "border-sky-500/30 bg-slate-950 text-white p-5 md:p-8 shadow-2xl"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-500/15 border border-sky-400/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-sky-300">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            AI Shop Assistant · Carrello Istantaneo
          </span>
          <span className="text-xs text-slate-300 font-medium">
            Zero attese per i preventivi: descrivi, verifica il prezzo e acquista subito
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runAssistant();
          }}
          className="space-y-3"
        >
          <div className="relative">
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void runAssistant();
                }
              }}
              placeholder="Descrivi cosa vuoi fare: es. 'Mi servono 50 tessere NFC stampate col mio logo per i dipendenti + un lettore USB' oppure '30 adesivi NFC per menu e recensioni Google al tavolo'..."
              className="w-full rounded-2xl border border-white/15 bg-slate-950/90 px-4 py-3.5 text-sm md:text-base text-white placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
                Esempi rapidi:
              </span>
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => {
                    setPrompt(q.prompt);
                    void runAssistant(q.prompt);
                  }}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-sky-400/50 hover:bg-sky-500/15 hover:text-white"
                >
                  {q.label}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-400 to-sky-600 px-6 py-3.5 text-sm md:text-base font-bold text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5 hover:from-sky-300 hover:to-sky-500 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparo il carrello...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Pre-compila il Carrello
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-3 rounded-xl border border-red-400/40 bg-red-950/50 px-4 py-2.5 text-xs text-red-200">
            {error}
          </p>
        )}

        {/* Pre-filled Cart Result Box */}
        {items.length > 0 && (
          <div
            ref={resultRef}
            className="mt-6 rounded-2xl border border-sky-400/40 bg-slate-950/95 p-4 md:p-6 text-white space-y-5 animate-fade-in"
          >
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {justFilled && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                      <Check className="h-3 w-3" />
                      Carrello pre-compilato e pronto!
                    </span>
                  )}
                  {useCaseLabel && (
                    <span className="text-xs font-semibold text-sky-300">
                      {useCaseLabel}
                    </span>
                  )}
                </div>
                {summary && (
                  <p className="text-sm text-slate-200 leading-relaxed">{summary}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setItems([]);
                  setSummary(null);
                  setJustFilled(false);
                }}
                className="self-start md:self-center inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Nuova ricerca
              </button>
            </div>

            {/* Recommended Cart Items */}
            <div className="space-y-3">
              {items.map((item) => {
                const effectiveUnit = computeEffectiveUnitPrice(item);
                const lineTotal = roundMoney(effectiveUnit * item.quantity);
                const isPrintable = productNeedsPrintOption({ categorySlug: item.categorySlug });

                return (
                  <div
                    key={item.productId}
                    className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <Link
                        href={`/products/${item.slug}`}
                        className="relative h-20 w-20 rounded-xl bg-white p-1.5 shrink-0 overflow-hidden"
                      >
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-contain p-1"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400 font-bold">
                            {item.name.charAt(0)}
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.badge && (
                            <span className="rounded-md bg-sky-500/25 border border-sky-400/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-200">
                              {item.badge}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                            {item.category}
                          </span>
                        </div>

                        <Link
                          href={`/products/${item.slug}`}
                          className="block text-base font-bold text-white hover:text-sky-300 transition truncate"
                        >
                          {item.name}
                        </Link>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {item.reason}
                        </p>

                        {/* Print Option Selector for Printable Cards */}
                        {isPrintable && (
                          <div className="pt-2 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-300 mr-1">
                              <Palette className="h-3 w-3" />
                              Personalizzazione grafica:
                            </span>
                            {PRINT_OPTION_LABELS.map((opt) => {
                              const extra = printSurcharge(opt.value, printPrices);
                              const active = item.printOption === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => handlePrintChange(item.productId, opt.value)}
                                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                                    active
                                      ? "border-sky-400 bg-sky-500 text-white"
                                      : "border-white/15 bg-white/5 text-slate-300 hover:border-white/30"
                                  }`}
                                >
                                  {opt.label}{" "}
                                  {extra > 0 ? `(+${formatCatalogPrice(extra)})` : "(inclusa)"}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity & Line Total Controls */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t border-white/10 lg:border-t-0">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                          Quantità (min. {item.minQuantity} pz)
                        </span>
                        <FreeQuantityInput
                          value={item.quantity}
                          min={item.minQuantity}
                          step={1}
                          variant="assistant"
                          minError={`Quantità minima ${item.minQuantity} pz`}
                          decreaseLabel="Riduci quantità"
                          increaseLabel="Aumenta quantità"
                          onChange={(next) => handleQuantityChange(item.productId, next)}
                        />
                      </div>

                      <div className="text-right min-w-[110px]">
                        <div className="text-xs text-slate-400">
                          {formatCatalogPrice(effectiveUnit)} / pz
                        </div>
                        <div className="text-lg font-extrabold text-sky-300 tabular-nums">
                          {formatCatalogPrice(lineTotal)}
                        </div>
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRecommendation(item.productId)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                          aria-label="Rimuovi dal carrello"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optional NFC Programming Link/Note Input */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <Cpu className="h-4 w-4 text-sky-400" />
                <span className="text-xs font-semibold text-white">
                  Programmazione chip NFC (inclusa gratis):
                </span>
              </div>
              <input
                type="text"
                value={nfcPayload}
                onChange={(e) => {
                  setNfcPayload(e.target.value);
                }}
                onBlur={() => syncToGlobalCart(items)}
                placeholder="Opzionale: incolla qui il link (https://...), vCard o nota da programmare nei tag"
                className="flex-1 rounded-lg border border-white/15 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
              />
            </div>

            {/* Optional Complementary / Alternative Items */}
            {alternatives.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Puoi aggiungere o valutare anche:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {alternatives.map((alt) => (
                    <div
                      key={alt.productId}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{alt.name}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{alt.reason}</p>
                        <p className="text-xs font-semibold text-sky-300 mt-0.5">
                          {formatCatalogPrice(computeEffectiveUnitPrice(alt))} / pz · min. {alt.minQuantity} pz
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddAlternative(alt)}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-sky-400/40 bg-sky-500/15 px-3 py-1.5 text-xs font-bold text-sky-200 hover:bg-sky-500 hover:text-white transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Aggiungi
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Checkout Action Bar */}
            <div className="rounded-2xl bg-gradient-to-r from-sky-500/20 via-sky-500/10 to-emerald-500/15 border border-sky-400/30 p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                    Totale Carrello ({totalPieces} {totalPieces === 1 ? "pezzo" : "pezzi"}):
                  </span>
                  <span className="text-2xl md:text-3xl font-extrabold text-white tabular-nums">
                    {formatCatalogPrice(grandTotal)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    Prezzo finale trasparente
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Palette className="h-3.5 w-3.5 text-sky-400" />
                    Logo caricabile al checkout o dopo l&apos;ordine
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5 text-sky-400" />
                    Spedizione rapida
                  </span>
                </div>
                {hasQuantityBelowMin && (
                  <p className="mt-2 text-xs font-medium text-red-300">
                    Una o più quantità sono sotto il minimo. Correggile per andare al checkout.
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenCartDrawer}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 transition cursor-pointer"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Rivedi nel Carrello ({totalPieces})
                </button>
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  disabled={hasQuantityBelowMin}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm md:text-base font-extrabold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 hover:-translate-y-0.5 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <Zap className="h-4 w-4" />
                  Acquista Ora al Checkout →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
