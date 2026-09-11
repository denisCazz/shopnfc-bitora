"use client";

import Link from "next/link";
import { ArrowLeft, Cookie } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export default function CookiePolicyPage() {
  const { t } = useLocale();

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

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
            <Cookie className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
            Cookie Policy
          </h1>
        </div>

        <div className="bg-surface rounded-2xl border border-[var(--color-muted)]/30 p-6 sm:p-8">
          <div className="prose prose-sm prose-stone max-w-none text-[var(--color-foreground)]/70 leading-relaxed space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">{t("cookie_policy.what_title")}</h2>
              <p>{t("cookie_policy.what_text")}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">{t("cookie_policy.types_title")}</h2>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <span className="font-medium text-[var(--color-foreground)]">{t("cookie_policy.technical_title")}</span>
                  <br /><span className="ml-5">{t("cookie_policy.technical_text")}</span>
                </li>
                <li>
                  <span className="font-medium text-[var(--color-foreground)]">{t("cookie_policy.analytics_title")}</span>
                  <br /><span className="ml-5">{t("cookie_policy.analytics_text")}</span>
                </li>
                <li>
                  <span className="font-medium text-[var(--color-foreground)]">{t("cookie_policy.profiling_title")}</span>
                  <br /><span className="ml-5">{t("cookie_policy.profiling_text")}</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">{t("cookie_policy.manage_title")}</h2>
              <p>{t("cookie_policy.manage_text")}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">{t("cookie_policy.contact_title")}</h2>
              <p>{t("cookie_policy.contact_text")}</p>
              <p>Email: <a href="mailto:info@bitora.it" className="text-[var(--color-accent)] hover:underline">info@bitora.it</a></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
