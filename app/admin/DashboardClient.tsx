"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Package, Users, Briefcase, ShoppingCart, X, Sparkles } from "lucide-react";

const DashboardCharts = dynamic(() => import("./DashboardCharts"), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-2xl h-[280px] animate-pulse" />
      <div className="bg-surface border border-border rounded-2xl h-[240px] animate-pulse" />
    </div>
  ),
});

export type Period = "1m" | "3m" | "12m" | "all";

export interface DailyStat {
  day: string;
  orders: number;
  revenue: number;
}

export interface TopProduct {
  name: string;
  qty: number;
  revenue: number;
}

export interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  pendingDealers: number;
  totalOrders: number;
  revenueThisMonth: number;
  ordersThisMonth: number;
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "1m", label: "1 mese" },
  { value: "3m", label: "3 mesi" },
  { value: "12m", label: "12 mesi" },
  { value: "all", label: "Tutto" },
];

export const PERIOD_LABELS: Record<Period, string> = {
  "1m": "ultimo mese",
  "3m": "ultimi 3 mesi",
  "12m": "ultimi 12 mesi",
  all: "di sempre",
};

function formatEur(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export default function DashboardClient({
  stats,
  dailyData,
  topProducts,
  period,
}: {
  stats: DashboardStats;
  dailyData: DailyStat[];
  topProducts: TopProduct[];
  period: Period;
}) {
  const [aiDismissed, setAiDismissed] = useState(true);
  const periodLabel = PERIOD_LABELS[period];

  useEffect(() => {
    setAiDismissed(localStorage.getItem("ai_popup_dismissed") === "1");
  }, []);

  function dismissAi() {
    localStorage.setItem("ai_popup_dismissed", "1");
    setAiDismissed(true);
  }

  const cards = [
    { label: "Prodotti", value: stats.totalProducts, icon: Package, href: "/admin/products", color: "bg-blue-50 dark:bg-blue-950/40 text-blue-600" },
    { label: "Utenti", value: stats.totalUsers, icon: Users, href: "/admin/users", color: "bg-green-50 dark:bg-green-950/40 text-green-600" },
    { label: "Dealer in attesa", value: stats.pendingDealers, icon: Briefcase, href: "/admin/dealers", color: "bg-sky-50 dark:bg-sky-950/40 text-sky-600" },
    { label: "Ordini totali", value: stats.totalOrders, icon: ShoppingCart, href: "/admin/orders", color: "bg-purple-50 dark:bg-purple-950/40 text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="flex rounded-xl bg-background border border-border overflow-hidden text-xs shrink-0">
          {PERIOD_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={opt.value === "1m" ? "/admin" : `/admin?period=${opt.value}`}
              scroll={false}
              className={`px-3 py-1.5 transition-colors ${
                period === opt.value
                  ? "bg-accent text-white font-medium"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* AI popup banner */}
      {!aiDismissed && (
        <div className="relative overflow-hidden rounded-2xl border border-sky-200 dark:border-sky-800 bg-gradient-to-r from-sky-50 via-amber-50 to-sky-50 dark:from-sky-950/30 dark:via-amber-950/20 dark:to-sky-950/30 p-5">
          <button
            onClick={dismissAi}
            className="absolute top-3 right-3 text-muted hover:text-foreground transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-4 pr-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-red-500 flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm mb-1">Potenzia il tuo negozio con l&apos;intelligenza artificiale</p>
              <p className="text-sm text-muted leading-relaxed">
                Integra l&apos;IA per ricevere consigli personalizzati su prezzi, promozioni e scorte — e non andare mai <em>out of stock</em> anticipando le tendenze dei tuoi clienti. Analisi automatica degli ordini, previsioni stagionali e suggerimenti in tempo reale.
              </p>
              <p className="text-xs text-accent font-medium mt-2 cursor-pointer hover:underline" onClick={dismissAi}>
                Capito, grazie →
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-surface border border-border rounded-2xl p-5 hover:border-accent/30 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground tabular-nums">{card.value}</div>
            <div className="text-sm text-muted mt-1">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">Fatturato {periodLabel}</p>
          <p className="text-3xl font-bold text-accent tabular-nums">{formatEur(stats.revenueThisMonth)}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">Ordini {periodLabel}</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">{stats.ordersThisMonth}</p>
        </div>
      </div>

      <DashboardCharts dailyData={dailyData} topProducts={topProducts} periodLabel={periodLabel} />
    </div>
  );
}
