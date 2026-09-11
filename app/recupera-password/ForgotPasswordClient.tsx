"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import { requestPasswordReset } from "@/app/(auth)/actions";
import { useLocale } from "@/lib/locale-context";

export default function ForgotPasswordClient() {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await requestPasswordReset(formData);
    setLoading(false);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-2xl shadow-lg shadow-black/5 border border-border p-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 mb-5 mx-auto">
            <Mail className="w-6 h-6 text-accent" />
          </div>

          <h1 className="text-xl font-bold text-foreground mb-2 text-center">{t("forgot_password.title")}</h1>
          <p className="text-sm text-muted text-center mb-6">
            {t("forgot_password.subtitle")}
          </p>

          {sent ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <p className="text-sm text-foreground font-medium">{t("forgot_password.sent_title")}</p>
              <p className="text-sm text-muted">
                {t("forgot_password.sent_text")}
              </p>
              <Link href="/login" className="mt-4 text-sm text-accent hover:underline">
                {t("forgot_password.back_to_login")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={t("forgot_password.email_placeholder")}
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm placeholder:text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {t("forgot_password.submit")}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t("forgot_password.back_to_login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
