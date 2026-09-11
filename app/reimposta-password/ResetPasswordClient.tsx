"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { resetPassword } from "@/app/(auth)/actions";
import { useLocale } from "@/lib/locale-context";

export default function ResetPasswordClient() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;

    if (password !== confirm) {
      setError(t("reset_password.passwords_mismatch"));
      return;
    }

    setLoading(true);
    const result = await resetPassword(token, password);
    setLoading(false);

    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setDone(true);
      setTimeout(() => router.push("/login?password_reset=1"), 2500);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface rounded-2xl border border-border p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
          <p className="text-sm text-foreground font-medium mb-2">{t("reset_password.invalid_link_title")}</p>
          <p className="text-sm text-muted mb-4">{t("reset_password.invalid_link_text")}</p>
          <Link href="/recupera-password" className="text-sm text-accent hover:underline">
            {t("reset_password.request_new_link")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-2xl shadow-lg shadow-black/5 border border-border p-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 mb-5 mx-auto">
            <Lock className="w-6 h-6 text-accent" />
          </div>

          <h1 className="text-xl font-bold text-foreground mb-2 text-center">{t("reset_password.title")}</h1>
          <p className="text-sm text-muted text-center mb-6">{t("reset_password.subtitle")}</p>

          {done ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <p className="text-sm text-foreground font-medium">{t("reset_password.done_title")}</p>
              <p className="text-sm text-muted">{t("reset_password.done_text")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                  {t("reset_password.label_new")}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder={t("reset_password.placeholder_new")}
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm placeholder:text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                />
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-foreground mb-1.5">
                  {t("reset_password.label_confirm")}
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder={t("reset_password.placeholder_confirm")}
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {t("reset_password.submit")}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t("reset_password.back_to_login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
