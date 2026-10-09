"use client";

import { Check } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

const STEPS = ["progress.cart", "progress.details", "progress.payment", "progress.done"];

export default function CheckoutProgress({ current }: { current: 0 | 1 | 2 | 3 }) {
  const { t } = useLocale();

  return (
    <ol className="mb-8 flex items-center gap-2 sm:gap-3" aria-label={t("progress.label")}>
      {STEPS.map((key, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={key} className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                done
                  ? "bg-green-500 text-white"
                  : active
                    ? "bg-accent text-accent-foreground shadow-[0_0_0_4px_var(--color-accent-glow)]"
                    : "bg-surface border border-border text-muted"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={`hidden sm:block truncate text-sm ${
                active ? "font-semibold text-foreground" : "text-muted"
              }`}
            >
              {t(key)}
            </span>
            {i < STEPS.length - 1 && (
              <span className={`h-0.5 flex-1 rounded ${done ? "bg-green-500" : "bg-border"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
