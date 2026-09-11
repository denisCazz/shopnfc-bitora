"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, resendVerificationEmail } from "@/app/(auth)/actions";
import { Eye, EyeOff, LogIn, AlertCircle, CheckCircle, MailWarning, RefreshCw } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import FlameEffect from "@/components/FlameEffect";
import FireBackground from "@/components/FireBackground";
import AuthTopBar from "@/components/AuthTopBar";

function LoginForm() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const registered = searchParams.get("registered");
  const dealerRegistered = searchParams.get("dealer_registered");
  const verified = searchParams.get("verified");
  const verifyError = searchParams.get("verify_error");

  const [error, setError] = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEmailNotVerified(false);
    setResendSent(false);

    const formData = new FormData(e.currentTarget);
    formData.set("redirectTo", redirectTo);

    const result = await login(formData);
    if (result?.error) {
      if (result.error === "email_not_verified") {
        setPendingEmail(formData.get("email") as string);
        setEmailNotVerified(true);
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!pendingEmail) return;
    setResendLoading(true);
    await resendVerificationEmail(pendingEmail);
    setResendLoading(false);
    setResendSent(true);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <FireBackground variant="full" />

      {/* Top bar */}
      <AuthTopBar backLabel={t("login.back_home")} />

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-10 relative z-10">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <FlameEffect />
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-4 mb-2 tracking-tight">
            {t("login.title")}
          </h1>
          <p className="text-foreground/50 text-sm">
            {t("login.no_account")}{" "}
            <Link href="/register" className="text-accent hover:underline font-medium">
              {t("login.register_link")}
            </Link>
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-md">
          <div className="rounded-3xl overflow-hidden border-2 border-border bg-surface shadow-md">
            {/* Color band */}
            <div className="h-2 w-full bg-gradient-to-r from-sky-500 to-amber-400" />

            <div className="p-8">

              {/* Notification banners */}
              {verified && (
                <div className="mb-5 flex items-start gap-2 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 p-3 rounded-xl text-sm border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{t("login.email_verified_success")}</span>
                </div>
              )}
              {verifyError && (
                <div className="mb-5 flex items-start gap-2 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 p-3 rounded-xl text-sm border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{verifyError === "expired" ? t("login.verify_link_expired") : t("login.verify_link_invalid")}</span>
                </div>
              )}
              {registered && (
                <div className="mb-5 flex items-start gap-2 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 p-3 rounded-xl text-sm border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{t("login.registered_success")}</span>
                </div>
              )}
              {dealerRegistered && (
                <div className="mb-5 flex items-start gap-2 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 p-3 rounded-xl text-sm border border-blue-200 dark:border-blue-800">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{t("login.dealer_registered_success")}</span>
                </div>
              )}
              {emailNotVerified && (
                <div className="mb-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 p-4 rounded-xl text-sm">
                  <div className="flex items-start gap-2 mb-3">
                    <MailWarning className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span>{t("login.email_not_verified")}</span>
                  </div>
                  {resendSent ? (
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      {t("login.resend_sent")}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendLoading}
                      className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium hover:underline disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${resendLoading ? "animate-spin" : ""}`} />
                      {t("login.resend_verification")}
                    </button>
                  )}
                </div>
              )}
              {error && (
                <div className="mb-5 flex items-start gap-2 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 p-3 rounded-xl text-sm border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error === "invalid_credentials" ? t("login.error_invalid_credentials") : error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
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
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
                    placeholder={t("login.email_placeholder")}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-sm font-medium text-foreground/70">
                      Password
                    </label>
                    <Link href="/recupera-password" className="text-xs text-muted hover:text-accent transition-colors">
                      {t("login.forgot_password")}
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      className="w-full px-4 py-3 pr-11 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      {t("login.submit")}
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

export default function LoginClient() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
