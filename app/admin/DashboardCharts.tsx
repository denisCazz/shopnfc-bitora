"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { DailyStat, TopProduct } from "./DashboardClient";

function formatEur(n: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const isRevenue = p.dataKey === "revenue";
  return (
    <div className="bg-surface border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-muted mb-0.5">{label}</p>
      <p className="font-semibold text-foreground">
        {isRevenue ? formatEur(p.value) : `${p.value} ordini`}
      </p>
    </div>
  );
}

export default function DashboardCharts({
  dailyData,
  topProducts,
  periodLabel,
}: {
  dailyData: DailyStat[];
  topProducts: TopProduct[];
  periodLabel: string;
}) {
  const [chartMode, setChartMode] = useState<"revenue" | "orders">("revenue");

  return (
    <>
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <h2 className="font-semibold text-foreground text-sm">Andamento {periodLabel}</h2>
          </div>
          <div className="flex rounded-xl bg-background border border-border overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setChartMode("revenue")}
              className={`px-3 py-1.5 transition-colors ${chartMode === "revenue" ? "bg-accent text-white font-medium" : "text-muted hover:text-foreground"}`}
            >
              Fatturato
            </button>
            <button
              type="button"
              onClick={() => setChartMode("orders")}
              className={`px-3 py-1.5 transition-colors ${chartMode === "orders" ? "bg-accent text-white font-medium" : "text-muted hover:text-foreground"}`}
            >
              Ordini
            </button>
          </div>
        </div>
        {dailyData.length === 0 ? (
          <p className="text-center text-muted text-sm py-12">Nessun dato disponibile</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={chartMode === "revenue" ? (v) => `€${v}` : undefined}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey={chartMode}
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#0ea5e9" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {topProducts.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-foreground text-sm mb-5">Top prodotti ({periodLabel})</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) => (v.length > 22 ? `${v.slice(0, 22)}…` : v)}
              />
              <Tooltip
                formatter={(value) => [`${value} pz`, "Qtà"]}
                contentStyle={{ borderRadius: "12px", fontSize: 12, border: "1px solid #e5e7eb" }}
              />
              <Bar dataKey="qty" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}
