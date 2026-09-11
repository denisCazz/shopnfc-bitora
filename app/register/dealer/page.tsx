"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { registerDealer } from "../../(auth)/actions";
import { Eye, EyeOff, Building2, AlertCircle, ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { isValidEuVatNumber } from "@/lib/italian-vat";

export default function DealerRegisterPage() {
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

    const vatRaw = ((formData.get("vatNumber") as string) || "").trim();
    if (!vatRaw) {
      setError(t("dealer.vat_required"));
      setLoading(false);
      return;
    }
    if (!isValidEuVatNumber(vatRaw)) {
      setError(t("dealer.vat_invalid"));
      setLoading(false);
      return;
    }

    const result = await registerDealer(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
            <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/bitora.png"
              alt="Shop NFC"
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover mx-auto"
              priority
            />
          </Link>
        </div>

        <div className="bg-surface rounded-2xl shadow-lg shadow-black/5 border border-[var(--color-muted)]/30 p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[var(--color-accent)]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6 text-[var(--color-accent)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-foreground)]">
              {t("dealer.title")}
            </h2>
            <p className="text-sm text-[var(--color-foreground)]/60 mt-1">
              {t("dealer.subtitle")}
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 p-3 rounded-lg text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                  {t("register.first_name")}
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  autoComplete="given-name"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-muted)]/40 bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                  {t("register.last_name")}
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  autoComplete="family-name"
                  className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-muted)]/40 bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                {t("dealer.company_name")}
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-muted)]/40 bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition"
              />
            </div>

            <div>
              <label htmlFor="vatNumber" className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                {t("dealer.vat_number")}
              </label>
              <input
                id="vatNumber"
                name="vatNumber"
                type="text"
                required
                maxLength={18}
                autoComplete="off"
                title={t("dealer.vat_hint")}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-muted)]/40 bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition"
                placeholder="IT02450960261"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                {t("checkout.phone")}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-muted)]/40 bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition"
                placeholder="+39 xxx xxx xxxx"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-muted)]/40 bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
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
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-[var(--color-muted)]/40 bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition"
                  placeholder={t("register.password_placeholder")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-foreground)]/40 hover:text-[var(--color-foreground)]/60"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                {t("register.confirm_password")}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-muted)]/40 bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  {t("dealer.submit")}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--color-foreground)]/60">
            {t("register.has_account")}{" "}
            <Link href="/login" className="text-[var(--color-accent)] hover:underline font-medium">
              {t("login.submit")}
            </Link>
          </div>

          <div className="mt-3 text-center text-sm text-[var(--color-foreground)]/60">
            {t("dealer.not_dealer")}{" "}
            <Link href="/register" className="text-[var(--color-accent)] hover:underline font-medium">
              {t("dealer.normal_register")}
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Torna alla Home
          </Link>
        </div>
      </div>
    </div>
  );
}
