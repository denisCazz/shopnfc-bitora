"use client";

import Link from "next/link";
import { CheckCircle, LogIn } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export default function RegistrazioneEffettuataPage() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
              Ricambi<span className="text-[var(--color-accent)]">X</span>Stufe
            </h1>
          </Link>
        </div>

        <div className="bg-surface rounded-2xl shadow-lg shadow-black/5 border border-[var(--color-muted)]/30 p-8">
          <div className="w-16 h-16 bg-green-50 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          <h2 className="text-xl font-bold text-[var(--color-foreground)] mb-3">
            {t("registration_done.title")}
          </h2>

          <p className="text-sm text-[var(--color-foreground)]/60 mb-6 leading-relaxed">
            {t("registration_done.message")}
          </p>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent)]/90 transition"
          >
            <LogIn className="w-4 h-4" />
            {t("registration_done.go_login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
