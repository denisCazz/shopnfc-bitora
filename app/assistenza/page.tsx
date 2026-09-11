"use client";

import Link from "next/link";
import { ArrowLeft, Phone, Mail, Clock, MapPin } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export default function AssistenzaPage() {
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

        <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-2">
          {t("assistenza.title")}
        </h1>
        <p className="text-sm text-[var(--color-foreground)]/60 mb-8">
          {t("assistenza.subtitle")}
        </p>

        <div className="space-y-6">
          {/* Telefono */}
          <section className="bg-surface rounded-2xl border border-[var(--color-muted)]/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                {t("assistenza.phone_title")}
              </h2>
            </div>
            <p className="text-sm text-[var(--color-foreground)]/70 mb-3">
              {t("assistenza.phone_text")}
            </p>
            <a
              href="tel:+393514979670"
              className="inline-flex items-center gap-2 text-[var(--color-accent)] font-semibold hover:underline"
            >
              <Phone className="w-4 h-4" />
              351 497 9670
            </a>
          </section>

          {/* Email */}
          <section className="bg-surface rounded-2xl border border-[var(--color-muted)]/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                {t("assistenza.email_title")}
              </h2>
            </div>
            <p className="text-sm text-[var(--color-foreground)]/70 mb-3">
              {t("assistenza.email_text")}
            </p>
            <a
              href="mailto:info@bitora.it"
              className="inline-flex items-center gap-2 text-[var(--color-accent)] font-semibold hover:underline"
            >
              <Mail className="w-4 h-4" />
              info@bitora.it
            </a>
          </section>

          {/* Orari */}
          <section className="bg-surface rounded-2xl border border-[var(--color-muted)]/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                {t("assistenza.hours_title")}
              </h2>
            </div>
            <p className="text-sm text-[var(--color-foreground)]/70 whitespace-pre-line">
              {t("assistenza.hours_text")}
            </p>
          </section>

          {/* Vieni a trovarci */}
          <section className="bg-surface rounded-2xl border border-[var(--color-muted)]/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                {t("assistenza.visit_title")}
              </h2>
            </div>
            <p className="text-sm text-[var(--color-foreground)]/70 mb-3">
              {t("assistenza.visit_text")}
            </p>
            <p className="text-sm font-medium text-[var(--color-foreground)]">
              Bitora di Denis Cazzulo — Carmagnola, 10022 Carmagnola (TO)
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Bitora+snc+Viale+Istria+1+Conegliano+TV"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white text-xs font-semibold hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            >
              <MapPin className="w-4 h-4" />
              {t("footer.find_us")}
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
