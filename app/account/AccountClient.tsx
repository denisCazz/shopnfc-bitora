"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Save,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Clock,
  ShieldCheck,
  XCircle,
  BadgePercent,
  Sun,
  Moon,
  Monitor,
  Globe,
  Coins,
  Package,
} from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { useTheme } from "@/lib/theme-context";
import { locales } from "@/lib/i18n";
import { updateProfile } from "./actions";

interface ProfileData {
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
    country: string | null;
    role: string;
  };
  dealerInfo: {
    company_name: string;
    vat_number: string;
    status: string;
    discount_percent: number;
  } | null;
  role: string;
}

export default function AccountClient({
  data,
  email,
}: {
  data: ProfileData;
  email: string;
}) {
  const { t, locale, setLocale, currency, setCurrencyCode, currencies } = useLocale();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { profile, dealerInfo, role } = data;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  }

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg border border-[var(--color-muted)]/40 bg-[var(--color-background)] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition text-sm";

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-foreground)]/60 hover:text-[var(--color-accent)] transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("checkout.back_shop")}
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
            <User className="w-6 h-6 text-[var(--color-accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
              {t("account.title")}
            </h1>
            <p className="text-sm text-[var(--color-foreground)]/60">{email}</p>
          </div>
        </div>

        {/* Dealer status badge */}
        {dealerInfo && (
          <div
            className={`mb-6 rounded-xl border p-4 ${
              dealerInfo.status === "approved"
                ? "bg-green-50 border-green-200 dark:border-green-800"
                : dealerInfo.status === "pending"
                ? "bg-yellow-50 border-yellow-200 dark:border-yellow-800"
                : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-3">
              {dealerInfo.status === "approved" ? (
                <ShieldCheck className="w-5 h-5 text-green-600" />
              ) : dealerInfo.status === "pending" ? (
                <Clock className="w-5 h-5 text-yellow-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p
                  className={`text-sm font-semibold ${
                    dealerInfo.status === "approved"
                      ? "text-green-800"
                      : dealerInfo.status === "pending"
                      ? "text-yellow-800"
                      : "text-red-800"
                  }`}
                >
                  {t(`account.dealer_${dealerInfo.status}`)}
                </p>
                <p className="text-xs text-[var(--color-foreground)]/50 mt-0.5">
                  {dealerInfo.company_name} — P.IVA {dealerInfo.vat_number}
                </p>
              </div>
              {dealerInfo.status === "approved" && (
                <div className="ml-auto flex items-center gap-1.5 bg-green-100 px-3 py-1 rounded-full">
                  <BadgePercent className="w-4 h-4 text-green-700" />
                  <span className="text-sm font-bold text-green-700">
                    -{dealerInfo.discount_percent}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Orders link */}
        <Link
          href="/account/orders"
          className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-surface border border-[var(--color-muted)]/30 hover:border-[var(--color-accent)]/50 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-accent)] transition-colors">
              I miei ordini
            </p>
            <p className="text-xs text-[var(--color-foreground)]/50">
              Visualizza lo stato dei tuoi ordini e traccia le spedizioni
            </p>
          </div>
          <ArrowLeft className="w-4 h-4 text-[var(--color-foreground)]/30 rotate-180" />
        </Link>

        {/* Success / Error messages */}
        {success && (
          <div className="mb-6 flex items-center gap-2 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 p-3 rounded-lg text-sm">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{t("account.saved")}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 p-3 rounded-lg text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal info */}
          <div className="bg-surface rounded-2xl border border-[var(--color-muted)]/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-sm font-semibold text-[var(--color-foreground)] uppercase tracking-wide">
                {t("account.personal_info")}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                  {t("register.first_name")}
                </label>
                <input
                  name="firstName"
                  type="text"
                  required
                  defaultValue={profile.first_name || ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                  {t("register.last_name")}
                </label>
                <input
                  name="lastName"
                  type="text"
                  required
                  defaultValue={profile.last_name || ""}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                Email
              </label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-muted)]/40 bg-stone-50 dark:bg-stone-800/50 text-sm text-[var(--color-foreground)]/50">
                <Mail className="w-4 h-4" />
                {email}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                {t("checkout.phone")}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-foreground)]/30" />
                <input
                  name="phone"
                  type="tel"
                  defaultValue={profile.phone || ""}
                  className={`${inputClass} pl-10`}
                  placeholder="+39 xxx xxx xxxx"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-surface rounded-2xl border border-[var(--color-muted)]/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-sm font-semibold text-[var(--color-foreground)] uppercase tracking-wide">
                {t("account.address")}
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                  {t("checkout.address")}
                </label>
                <input
                  name="addressLine1"
                  type="text"
                  defaultValue={profile.address_line1 || ""}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                  {t("account.address_line2")}
                </label>
                <input
                  name="addressLine2"
                  type="text"
                  defaultValue={profile.address_line2 || ""}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                    {t("checkout.city")}
                  </label>
                  <input
                    name="city"
                    type="text"
                    defaultValue={profile.city || ""}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                    {t("account.province")}
                  </label>
                  <input
                    name="province"
                    type="text"
                    defaultValue={profile.province || ""}
                    className={inputClass + " uppercase"}
                    placeholder="TV"
                    maxLength={2}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                    {t("checkout.zip")}
                  </label>
                  <input
                    name="postalCode"
                    type="text"
                    defaultValue={profile.postal_code || ""}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                    {t("checkout.country")}
                  </label>
                  <input
                    name="country"
                    type="text"
                    defaultValue={profile.country || "Italia"}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dealer company info (read-only) */}
          {dealerInfo && (
            <div className="bg-surface rounded-2xl border border-[var(--color-muted)]/30 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-[var(--color-accent)]" />
                <h2 className="text-sm font-semibold text-[var(--color-foreground)] uppercase tracking-wide">
                  {t("account.dealer_info")}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                    {t("dealer.company_name")}
                  </label>
                  <div className="px-4 py-2.5 rounded-lg border border-[var(--color-muted)]/40 bg-stone-50 dark:bg-stone-800/50 text-sm text-[var(--color-foreground)]/50">
                    {dealerInfo.company_name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-1.5">
                    {t("dealer.vat_number")}
                  </label>
                  <div className="px-4 py-2.5 rounded-lg border border-[var(--color-muted)]/40 bg-stone-50 dark:bg-stone-800/50 text-sm text-[var(--color-foreground)]/50">
                    {dealerInfo.vat_number}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences */}
          <div className="bg-surface rounded-2xl border border-[var(--color-muted)]/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-sm font-semibold text-[var(--color-foreground)] uppercase tracking-wide">
                {t("account.preferences")}
              </h2>
            </div>

            {/* Theme */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-2">
                {t("account.theme")}
              </label>
              <div className="flex gap-2">
                {([
                  { value: "light" as const, label: t("account.theme_light"), Icon: Sun },
                  { value: "dark" as const, label: t("account.theme_dark"), Icon: Moon },
                  { value: "system" as const, label: t("account.theme_system"), Icon: Monitor },
                ]).map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
                      theme === value
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium"
                        : "border-[var(--color-muted)]/40 text-[var(--color-foreground)]/60 hover:border-[var(--color-accent)]/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-2">
                {t("account.language")}
              </label>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[var(--color-foreground)]/30" />
                <div className="flex gap-2">
                  {locales.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLocale(l)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase transition-colors ${
                        locale === l
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                          : "border-[var(--color-muted)]/40 text-[var(--color-foreground)]/60 hover:border-[var(--color-accent)]/50"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]/70 mb-2">
                {t("account.currency")}
              </label>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-[var(--color-foreground)]/30" />
                <div className="flex gap-2">
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCurrencyCode(c.code)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        currency.code === c.code
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                          : "border-[var(--color-muted)]/40 text-[var(--color-foreground)]/60 hover:border-[var(--color-accent)]/50"
                      }`}
                    >
                      {c.symbol} {c.code}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t("account.save")}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
