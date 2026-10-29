"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, CreditCard, Palette, Truck } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

const STEPS = [
  { icon: Sparkles, key: "steps.choose", href: "/assistente" },
  { icon: Palette, key: "steps.customize", href: "/assistente" },
  { icon: CreditCard, key: "steps.order", href: "/checkout" },
  { icon: Truck, key: "steps.ship", href: "/come-acquistare" },
];

export default function PurchaseSteps() {
  const { t } = useLocale();

  return (
    <section className="border-b border-border bg-surface">
      <div className="max-w-[1120px] mx-auto px-4 md:px-8 py-10 md:py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-7">
          <div>
            <p className="eyebrow mb-2">{t("steps.eyebrow")}</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t("steps.title")}</h2>
          </div>
          <a
            href="/assistente"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
          >
            Configura il carrello con l&apos;AI
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, key, href }, i) => (
            <li key={key}>
              <Link
                href={href}
                className="group relative flex h-full flex-col rounded-2xl border border-border bg-background p-5 transition hover:border-accent/40 hover:shadow-lg hover:shadow-sky-500/10"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/50 text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-3xl font-bold text-border tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <p className="font-semibold text-foreground group-hover:text-accent transition-colors">
                  {t(`${key}_title`)}
                </p>
                <p className="mt-1 text-sm text-muted leading-relaxed">{t(`${key}_text`)}</p>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
