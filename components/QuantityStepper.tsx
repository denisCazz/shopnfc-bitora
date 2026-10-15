"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { clampOrderQuantity } from "@/lib/min-quantity";

export default function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  unit,
  label,
  showQuickChips = true,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
  unit?: string;
  label?: string;
  showQuickChips?: boolean;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function set(next: number) {
    const clamped = clampOrderQuantity(next, min, max);
    setDraft(String(clamped));
    onChange(clamped);
  }

  const quickPresets =
    min >= 10
      ? [10, 25, 50, 100, 250, 500].filter((q) => q >= min && (!max || q <= max))
      : [1, 5, 10, 25, 50].filter((q) => q >= min && (!max || q <= max));

  const atMin = value <= min;
  const atMax = max !== undefined && value >= max;

  return (
    <div className="space-y-2">
      {label ? <label className="block text-xs font-medium text-muted">{label}</label> : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => set(value - 1)}
          disabled={atMin}
          className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Diminuisci quantità"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          min={min}
          max={max}
          step={1}
          value={draft}
          onChange={(e) => {
            const raw = e.target.value;
            setDraft(raw);
            const parsed = Number.parseInt(raw, 10);
            if (Number.isFinite(parsed) && parsed >= min) {
              onChange(clampOrderQuantity(parsed, min, max));
            }
          }}
          onBlur={() => {
            const parsed = Number.parseInt(draft, 10);
            set(Number.isFinite(parsed) ? parsed : min);
          }}
          className="w-24 h-10 text-center font-semibold px-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
        <button
          type="button"
          onClick={() => set(value + 1)}
          disabled={atMax}
          className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Aumenta quantità"
        >
          <Plus className="w-4 h-4" />
        </button>
        {unit ? <span className="text-sm text-muted">{unit}</span> : null}
      </div>
      {showQuickChips && quickPresets.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-muted mr-0.5">Scelta rapida:</span>
          {quickPresets.map((preset) => {
            const active = value === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => set(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? "bg-accent text-white shadow-sm"
                    : "bg-background border border-border text-muted hover:text-foreground hover:border-accent/40"
                }`}
              >
                {preset} {unit || "pz"}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
