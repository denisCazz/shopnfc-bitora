"use client";

import Link from "next/link";
import { User, Building2, Star } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import FlameEffect from "@/components/FlameEffect";
import FireBackground from "@/components/FireBackground";
import AuthTopBar from "@/components/AuthTopBar";

export default function RegisterPage() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <FireBackground variant="full" />

      <AuthTopBar />

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12 relative z-10">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <FlameEffect />
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-4 mb-3 tracking-tight">
            {t("register.title")}
          </h1>
          <p className="text-muted text-base max-w-xs">
            {t("register.choose_subtitle")}
          </p>
          <p className="mt-2 text-sm text-muted">
            {t("register.has_account")}{" "}
            <Link href="/login" className="text-accent hover:underline font-medium">
              {t("login.submit")}
            </Link>
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">

          {/* ── Privati ── */}
          <Link
            href="/register/privato"
            className="group relative flex flex-col rounded-3xl overflow-hidden border-2 border-border hover:border-accent bg-surface shadow-md hover:shadow-xl hover:shadow-accent/10 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="h-2 w-full bg-gradient-to-r from-sky-500 to-amber-400" />

            <div className="flex flex-col flex-1 p-7 gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-accent/15 flex items-center justify-center shrink-0">
                  <User className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground leading-tight">{t("register.private_title")}</h2>
                  <p className="text-xs text-muted mt-0.5">{t("register.private_subtitle")}</p>
                </div>
              </div>

              <p className="text-sm text-muted leading-relaxed">
                {t("register.private_desc")}
              </p>

              <div className="mt-auto">
                <div className="w-full py-3 px-5 rounded-xl bg-accent group-hover:bg-accent-hover text-accent-foreground font-semibold text-sm text-center transition-colors duration-200">
                  {t("register.private_cta")}
                </div>
              </div>
            </div>
          </Link>

          {/* ── Azienda ── */}
          <Link
            href="/register/dealer"
            className="group relative flex flex-col rounded-3xl overflow-hidden border-2 border-border hover:border-blue-500 bg-surface shadow-md hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="h-2 w-full bg-gradient-to-r from-blue-600 to-indigo-500" />

            <div className="flex flex-col flex-1 p-7 gap-5">
              <div className="absolute top-5 right-5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-semibold tracking-wide">
                  <Star className="w-3 h-3" />
                  {t("register.reserved_badge")}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-400/15 flex items-center justify-center shrink-0">
                  <Building2 className="w-7 h-7 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground leading-tight">{t("register.company_title")}</h2>
                  <p className="text-xs text-muted mt-0.5">{t("register.company_subtitle")}</p>
                </div>
              </div>

              <p className="text-sm text-muted leading-relaxed">
                {t("register.company_desc")}
              </p>

              <div className="mt-auto">
                <div className="w-full py-3 px-5 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-semibold text-sm text-center transition-colors duration-200">
                  {t("register.company_cta")}
                </div>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
