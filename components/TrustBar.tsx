"use client";

import { CreditCard, Cpu, Headphones, Truck } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

const items = [
  { icon: Truck, key: "trust.shipping" },
  { icon: Cpu, key: "trust.programming" },
  { icon: CreditCard, key: "trust.payment" },
  { icon: Headphones, key: "trust.support" },
];

export default function TrustBar() {
  const { t } = useLocale();

  return (
    <div className="border-b border-border bg-surface">
      <ul className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-3 gap-y-2.5 px-5 py-3 md:grid-cols-4 md:gap-x-4 md:py-4 md:px-8">
        {items.map(({ icon: Icon, key }) => (
          <li key={key} className="flex items-center gap-2.5 md:gap-3">
            <span className="flex h-8 w-8 shrink-0 md:h-9 md:w-9 items-center justify-center rounded-xl bg-sky-50 text-accent dark:bg-sky-950/40">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-xs font-semibold text-foreground sm:text-sm">{t(`${key}_title`)}</span>
              <span className="hidden text-xs text-muted sm:block">{t(`${key}_text`)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
