"use client";

import { useState, useTransition } from "react";
import {
  Truck,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Info,
  Euro,
  Globe,
  MapPin,
} from "lucide-react";
import { saveShippingSettings } from "@/app/admin/actions/shipping";
import type { ShippingConfig, ShippingZone, ShippingTier } from "@/lib/shipping";

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-muted uppercase tracking-wide">{children}</span>;
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  className = "",
}: {
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      step={type === "number" ? "0.01" : undefined}
      min={type === "number" ? "0" : undefined}
      className={`px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 ${className}`}
    />
  );
}

function Card({
  title,
  icon: Icon,
  children,
  accent,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className={`flex items-center gap-3 px-5 py-4 border-b border-border ${accent ?? ""}`}>
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-accent" />
        </div>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Zone rate editor ─────────────────────────────────────────────────────────

function ZoneEditor({
  zone,
  tiers,
  includesIva,
  ivaRate,
  onChange,
}: {
  zone: ShippingZone;
  tiers: ShippingTier[];
  includesIva: boolean;
  ivaRate: number;
  onChange: (tiers: ShippingTier[]) => void;
}) {
  function updateTier(idx: number, field: keyof ShippingTier, raw: string) {
    const val = parseFloat(raw);
    if (isNaN(val)) return;
    const next = tiers.map((t, i) =>
      i === idx ? { ...t, [field]: val } : t
    );
    onChange(next);
  }

  function addTier() {
    const last = tiers[tiers.length - 1];
    onChange([...tiers, { maxKg: (last?.maxKg ?? 10) + 10, rate: last?.rate ?? 0 }]);
  }

  function removeTier(idx: number) {
    if (tiers.length <= 1) return;
    onChange(tiers.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs text-muted font-medium mb-1">
        <span>Peso max (kg)</span>
        <span>Tariffa netta (€){includesIva ? ` + IVA ${(ivaRate * 100).toFixed(0)}%` : " (flat)"}</span>
        <span />
      </div>
      {tiers.map((tier, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          <Input
            type="number"
            value={tier.maxKg}
            onChange={(v) => updateTier(idx, "maxKg", v)}
            placeholder="es. 10"
          />
          <div className="relative">
            <Input
              type="number"
              value={tier.rate}
              onChange={(v) => updateTier(idx, "rate", v)}
              placeholder="es. 8.50"
              className="w-full pr-20"
            />
            {includesIva && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted pointer-events-none">
                → {(tier.rate * (1 + ivaRate)).toFixed(2)} €
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => removeTier(idx)}
            disabled={tiers.length <= 1}
            className="p-2 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-30"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {tiers.length > 0 && (
        <p className="text-xs text-muted mt-1 italic">
          L&apos;ultimo scaglione vale per tutti i pesi superiori al penultimo
        </p>
      )}
      <button
        type="button"
        onClick={addTier}
        className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 mt-2"
      >
        <Plus className="w-3.5 h-3.5" />
        Aggiungi scaglione
      </button>
    </div>
  );
}

// ─── Province editor ──────────────────────────────────────────────────────────

function ProvinceEditor({
  provinces,
  onChange,
}: {
  provinces: string[];
  onChange: (p: string[]) => void;
}) {
  const raw = provinces.join(", ");
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>Province soggette alla tariffa &ldquo;Isole e Calabria&rdquo;. Usa sigle maiuscole separate da virgola (es. AG, PA, SS).</span>
      </div>
      <textarea
        rows={3}
        value={raw}
        onChange={(e) =>
          onChange(
            e.target.value
              .split(",")
              .map((s) => s.trim().toUpperCase())
              .filter(Boolean)
          )
        }
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
      <p className="text-xs text-muted">{provinces.length} province configurate</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const ZONE_LABELS: Record<ShippingZone, string> = {
  italy: "Italia (penisola)",
  islands_calabria: "Isole e Calabria",
  europe: "Europa / Estero",
};

const ZONE_ICONS: Record<ShippingZone, React.ElementType> = {
  italy: Truck,
  islands_calabria: MapPin,
  europe: Globe,
};

export default function ShippingAdminClient({
  initialConfig,
}: {
  initialConfig: ShippingConfig;
}) {
  const [config, setConfig] = useState<ShippingConfig>(
    JSON.parse(JSON.stringify(initialConfig))
  );
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function updateZoneTiers(zone: ShippingZone, tiers: ShippingTier[]) {
    setConfig((c) => ({
      ...c,
      zones: { ...c.zones, [zone]: { ...c.zones[zone], tiers } },
    }));
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveShippingSettings(config);
      setResult(res);
      setTimeout(() => setResult(null), 4000);
    });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Tempi di spedizione soggetti a disponibilità. Chiamare per conferma — solitamente entro 7 giorni.
        </span>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tariffe Spedizione</h1>
          <p className="text-sm text-muted mt-0.5">Gestisci i costi di consegna per zona geografica</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white font-semibold text-sm shadow hover:shadow-lg hover:shadow-sky-500/25 transition-all disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {pending ? "Salvataggio..." : "Salva modifiche"}
        </button>
      </div>

      {/* Result banner */}
      {result && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${
            result.ok
              ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
          }`}
        >
          {result.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          {result.message}
        </div>
      )}

      {/* Zone cards */}
      <div className="grid gap-5">
        {(["italy", "islands_calabria", "europe"] as ShippingZone[]).map((zone) => {
          const ZoneIcon = ZONE_ICONS[zone];
          const zoneConfig = config.zones[zone];
          return (
            <Card key={zone} title={ZONE_LABELS[zone]} icon={ZoneIcon}>
              <ZoneEditor
                zone={zone}
                tiers={zoneConfig.tiers}
                includesIva={zoneConfig.includesIva}
                ivaRate={config.ivaRate}
                onChange={(tiers) => updateZoneTiers(zone, tiers)}
              />
            </Card>
          );
        })}
      </div>

      {/* Province mapping */}
      <Card title="Province Isole + Calabria" icon={MapPin}>
        <ProvinceEditor
          provinces={config.islandsCalabriaProvincia}
          onChange={(p) => setConfig((c) => ({ ...c, islandsCalabriaProvincia: p }))}
        />
      </Card>

      {/* COD + IVA */}
      <Card title="Impostazioni aggiuntive" icon={Euro}>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label>Tariffa DHL Estero (€, netta)</Label>
            <Input
              type="number"
              value={config.dhlRate ?? 45}
              onChange={(v) => {
                const n = parseFloat(v);
                if (!isNaN(n) && n >= 0) setConfig((c) => ({ ...c, dhlRate: n }));
              }}
              placeholder="es. 45.00"
              className="w-full"
            />
            <p className="text-xs text-muted">Opzione DHL Express per spedizioni estero (IVA esclusa)</p>
          </div>
          <div className="space-y-1.5">
            <Label>Aliquota IVA (decimale)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={config.ivaRate}
                onChange={(v) => {
                  const n = parseFloat(v);
                  if (!isNaN(n) && n >= 0 && n <= 1)
                    setConfig((c) => ({ ...c, ivaRate: n }));
                }}
                placeholder="es. 0.22"
                className="w-full"
              />
              <span className="text-sm text-muted whitespace-nowrap">
                = {(config.ivaRate * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-muted">Applicata alle zone Italia/Isole (non Europa)</p>
          </div>
        </div>
      </Card>

      {/* Live preview */}
      <Card title="Anteprima tariffe finali (IVA inclusa)" icon={Truck}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted font-medium">Zona</th>
                {config.zones.italy.tiers.map((_, i) => (
                  <th key={i} className="text-right py-2 px-3 text-muted font-medium">
                    Scaglione {i + 1} (≤{config.zones.italy.tiers[i]?.maxKg ?? "?"}kg)
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(["italy", "islands_calabria", "europe"] as ShippingZone[]).map((zone) => {
                const z = config.zones[zone];
                return (
                  <tr key={zone} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pr-4 font-medium text-foreground">{z.label}</td>
                    {z.tiers.map((tier, i) => {
                      const final = z.includesIva
                        ? (tier.rate * (1 + config.ivaRate)).toFixed(2)
                        : tier.rate.toFixed(2);
                      return (
                        <td key={i} className="py-2.5 px-3 text-right tabular-nums text-accent font-semibold">
                          € {final}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted mt-3">
          IVA {(config.ivaRate * 100).toFixed(0)}% inclusa nelle tariffe Italia/Isole
        </p>
      </Card>
    </div>
  );
}
