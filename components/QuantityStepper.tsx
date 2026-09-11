"use client";

import { Minus, Plus } from "lucide-react";
import { clampOrderQuantity } from "@/lib/min-quantity";

export default function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  unit,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
  unit?: string;
  label?: string;
}) {
  function set(next: number) {
    onChange(clampOrderQuantity(next, min, max));
  }

  return (
    <div>
      {label ? <label className="block text-xs text-muted mb-2">{label}</label> : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => set(value - 1)}
          className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800"
          aria-label="Diminuisci quantità"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => {
            const parsed = Number.parseInt(e.target.value || String(min), 10);
            set(Number.isFinite(parsed) ? parsed : min);
          }}
          className="w-24 h-10 text-center px-2 rounded-lg border border-border bg-background text-foreground"
        />
        <button
          type="button"
          onClick={() => set(value + 1)}
          className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800"
          aria-label="Aumenta quantità"
        >
          <Plus className="w-4 h-4" />
        </button>
        {unit ? <span className="text-sm text-muted">{unit}</span> : null}
      </div>
    </div>
  );
}
