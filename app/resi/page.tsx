"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { getReturnsPolicy } from "@/lib/returns-policy";
import { SITE } from "@/lib/site";

export default function ResiPage() {
  const { t, locale } = useLocale();
  const policy = getReturnsPolicy(locale);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-foreground)]/60 hover:text-[var(--color-accent)] transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("checkout.back_shop")}
        </Link>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
            <RotateCcw className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
            {policy.title}
          </h1>
        </div>
        <p className="text-xs text-[var(--color-foreground)]/50 mb-8">{policy.updated}</p>

        <div className="bg-surface rounded-2xl border border-[var(--color-muted)]/30 p-6 sm:p-8 mb-6">
          <p className="text-sm text-[var(--color-foreground)]/70 leading-relaxed">
            {policy.intro}
          </p>
        </div>

        <div className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-3">
            {policy.highlightTitle}
          </h2>
          <ul className="list-disc space-y-2 ml-5 text-sm text-[var(--color-foreground)]/75 leading-relaxed">
            {policy.highlight.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="bg-surface rounded-2xl border border-[var(--color-muted)]/30 p-6 sm:p-8">
          <div className="prose prose-sm prose-stone max-w-none text-[var(--color-foreground)]/70 leading-relaxed space-y-8">
            {policy.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-3">
                  {section.title}
                </h2>
                {section.paragraphs.map((p) => (
                  <p key={p} className="mb-3 last:mb-0">
                    {p}
                  </p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="list-disc space-y-1.5 ml-5 my-3">
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.after?.map((p) => (
                  <p key={p} className="mb-3 last:mb-0">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>

        <p className="mt-8 text-sm text-[var(--color-foreground)]/60">
          <Link href="/come-acquistare" className="text-[var(--color-accent)] hover:underline">
            {t("footer.info_how_to_buy")}
          </Link>
          {" · "}
          <a href={`mailto:${SITE.email}`} className="text-[var(--color-accent)] hover:underline">
            {SITE.email}
          </a>
        </p>
      </div>
    </div>
  );
}
