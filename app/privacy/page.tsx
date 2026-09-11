"use client";

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export default function PrivacyPage() {
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
            <Shield className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
            {t("privacy.title")}
          </h1>
        </div>

        <div className="bg-surface rounded-2xl border border-[var(--color-muted)]/30 p-6 sm:p-8">
          <div className="prose prose-sm prose-stone max-w-none text-[var(--color-foreground)]/70 leading-relaxed space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">{t("privacy.controller_title")}</h2>
              <p>{t("privacy.controller_text")}</p>
              <p className="font-medium text-[var(--color-foreground)]">
                Bitora di Denis Cazzulo<br />
                Carmagnola, 10022 Carmagnola (TO)<br />
                P.IVA 03771060260<br />
                Email: info@bitora.it
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">{t("privacy.data_collected_title")}</h2>
              <p>{t("privacy.data_collected_text")}</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{t("privacy.data_personal")}</li>
                <li>{t("privacy.data_contact")}</li>
                <li>{t("privacy.data_payment")}</li>
                <li>{t("privacy.data_navigation")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">{t("privacy.purpose_title")}</h2>
              <p>{t("privacy.purpose_text")}</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{t("privacy.purpose_orders")}</li>
                <li>{t("privacy.purpose_support")}</li>
                <li>{t("privacy.purpose_legal")}</li>
                <li>{t("privacy.purpose_marketing")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">{t("privacy.rights_title")}</h2>
              <p>{t("privacy.rights_text")}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">{t("privacy.retention_title")}</h2>
              <p>{t("privacy.retention_text")}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">{t("privacy.contact_title")}</h2>
              <p>{t("privacy.contact_text")}</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
