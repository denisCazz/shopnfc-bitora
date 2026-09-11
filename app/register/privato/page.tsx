"use client";

import { useState } from "react";
import Link from "next/link";
import { register } from "../../(auth)/actions";
import { Eye, EyeOff, UserPlus, AlertCircle } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import FlameEffect from "@/components/FlameEffect";
import FireBackground from "@/components/FireBackground";
import AuthTopBar from "@/components/AuthTopBar";

export default function RegisterPrivatoPage() {
  const { t } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError(t("register.passwords_mismatch"));
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError(t("register.password_min_length"));
      setLoading(false);
      return;
    }

    const result = await register(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <FireBackground variant="full" />

      <AuthTopBar backHref="/register" backLabel={t("register.back_to_choice")} />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-10 relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <FlameEffect />
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-4 mb-2 tracking-tight">
            {t("register.title")}
          </h1>
          <p className="text-muted text-sm">
            {t("register.has_account")}{" "}
            <Link href="/login" className="text-accent hover:underline font-medium">
              {t("login.submit")}
            </Link>
          </p>
        </div>

        <div className="w-full max-w-md">
          <div className="rounded-3xl overflow-hidden border-2 border-border bg-surface shadow-md">
            <div className="h-2 w-full bg-gradient-to-r from-sky-500 to-amber-400" />

            <div className="p-8">
              {error && (
                <div className="mb-4 flex items-start gap-2 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 p-3 rounded-xl text-sm border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-foreground/70 mb-1.5">
                      {t("register.first_name")}
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      autoComplete="given-name"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-foreground/70 mb-1.5">
                      {t("register.last_name")}
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      autoComplete="family-name"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground/70 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
                    placeholder={t("login.email_placeholder")}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground/70 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
                      placeholder={t("register.password_placeholder")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground/70 mb-1.5">
                    {t("register.confirm_password")}
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
                    placeholder={t("register.confirm_placeholder")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-accent text-accent-foreground font-medium hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      {t("register.submit")}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
