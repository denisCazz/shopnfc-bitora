"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  isBelowMinQuantity,
  parseFreeQuantity,
  sanitizeQuantityDraft,
} from "@/lib/min-quantity";

type Variant = "assistant" | "checkout" | "drawer";

const BOX: Record<Variant, string> = {
  assistant:
    "inline-flex items-center rounded-xl border bg-slate-900 overflow-hidden",
  checkout:
    "inline-flex items-center gap-0 border rounded-lg overflow-hidden bg-surface",
  drawer:
    "inline-flex items-center gap-0 border rounded-lg overflow-hidden bg-surface",
};

const BUTTON: Record<Variant, string> = {
  assistant:
    "h-9 w-9 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 transition",
  checkout:
    "w-7 h-7 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-35 disabled:cursor-not-allowed transition-colors",
  drawer:
    "w-8 h-8 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-35 disabled:cursor-not-allowed transition-colors",
};

const INPUT: Record<Variant, string> = {
  assistant:
    "h-9 w-20 bg-transparent text-center text-sm font-bold text-white focus:outline-none border-x border-white/15",
  checkout:
    "w-16 h-7 text-center text-xs font-semibold border-x border-border bg-surface text-foreground focus:outline-none",
  drawer:
    "w-16 h-8 text-center text-sm font-semibold border-x border-border bg-surface text-foreground focus:outline-none focus:bg-sky-50/40 dark:focus:bg-sky-950/30",
};

const ERROR: Record<Variant, string> = {
  assistant: "mt-1 text-[11px] font-medium text-red-300",
  checkout: "mt-1 text-[11px] font-medium text-red-600 dark:text-red-400",
  drawer: "mt-1 text-[11px] font-medium text-red-600 dark:text-red-400",
};

export default function FreeQuantityInput({
  value,
  min,
  onChange,
  step = 1,
  minError,
  variant,
  decreaseLabel,
  increaseLabel,
}: {
  value: number;
  min: number;
  onChange: (next: number) => void;
  step?: number;
  minError: string;
  variant: Variant;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(value);
  const parsed = parseFreeQuantity(shown);
  const current = parsed ?? value;
  const belowMin = parsed != null && isBelowMinQuantity(parsed, min);

  function commit(raw: string) {
    const cleaned = sanitizeQuantityDraft(raw);
    const next = parseFreeQuantity(cleaned);
    if (next == null) {
      setDraft(cleaned);
      return;
    }
    setDraft(null);
    if (next !== value) onChange(next);
  }

  function stepBy(delta: number) {
    const next = Math.max(1, current + delta);
    setDraft(null);
    if (next !== value) onChange(next);
  }

  return (
    <div>
      <div
        className={`${BOX[variant]} ${
          belowMin ? "border-red-400" : variant === "assistant" ? "border-white/20" : "border-border"
        }`}
      >
        <button
          type="button"
          onClick={() => stepBy(-step)}
          disabled={current <= 1}
          className={BUTTON[variant]}
          aria-label={decreaseLabel}
        >
          <Minus className={variant === "assistant" ? "h-3.5 w-3.5" : "w-3 h-3"} />
        </button>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={shown}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setDraft(null)}
          aria-label="Quantità"
          aria-invalid={belowMin}
          className={INPUT[variant]}
        />
        <button
          type="button"
          onClick={() => stepBy(step)}
          className={BUTTON[variant]}
          aria-label={increaseLabel}
        >
          <Plus className={variant === "assistant" ? "h-3.5 w-3.5" : "w-3 h-3"} />
        </button>
      </div>
      {belowMin ? <p className={ERROR[variant]}>{minError}</p> : null}
    </div>
  );
}
