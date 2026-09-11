"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, Info, X, ShieldAlert } from "lucide-react";
import {
  availableAnnouncementLocales,
  dismissAnnouncement,
  isAnnouncementDismissed,
  localizedAnnouncementMessage,
  resolveAnnouncementViewLocale,
  type AnnouncementPayload,
} from "@/lib/announcement-dismiss";
import { useLocale } from "@/lib/locale-context";
import { t as translate, type Locale } from "@/lib/i18n";

const LOCALE_LABEL: Record<Locale, string> = {
  it: "IT",
  en: "EN",
  fr: "FR",
  es: "ES",
};

export default function AnnouncementPopup() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const surface = pathname?.startsWith("/admin") ? "admin" : "store";
  const [queue, setQueue] = useState<AnnouncementPayload[]>([]);
  const [current, setCurrent] = useState<AnnouncementPayload | null>(null);
  const [viewLocale, setViewLocale] = useState<Locale>(locale);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/announcements?surface=${surface}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { announcements?: AnnouncementPayload[] };
        if (cancelled) return;
        const pending = (data.announcements ?? []).filter((a) => !isAnnouncementDismissed(a));
        setQueue(pending);
        const first = pending[0] ?? null;
        setCurrent(first);
        if (first) setViewLocale(resolveAnnouncementViewLocale(first, locale));
      } catch {
        /* ignore network errors */
      }
    }

    setQueue([]);
    setCurrent(null);
    void load();

    return () => {
      cancelled = true;
    };
  }, [surface, locale]);

  function handleDismiss() {
    if (!current) return;
    dismissAnnouncement(current);
    const rest = queue.slice(1);
    setQueue(rest);
    const next = rest[0] ?? null;
    setCurrent(next);
    if (next) setViewLocale(resolveAnnouncementViewLocale(next, locale));
  }

  if (!current) return null;

  const t = (key: string) => translate(key, viewLocale);
  const langs = availableAnnouncementLocales(current);

  const titleKey =
    current.severity === "critical"
      ? "announcement.title_critical"
      : current.severity === "warning"
        ? "announcement.title_warning"
        : "announcement.title_info";

  const styles =
    current.severity === "critical"
      ? {
          iconBg: "bg-red-100 dark:bg-red-950/50",
          iconColor: "text-red-600 dark:text-red-400",
          accent: "bg-red-600 hover:bg-red-700",
          Icon: ShieldAlert,
        }
      : current.severity === "warning"
        ? {
            iconBg: "bg-amber-100 dark:bg-amber-950/50",
            iconColor: "text-amber-700 dark:text-amber-400",
            accent: "bg-amber-600 hover:bg-amber-700",
            Icon: AlertTriangle,
          }
        : {
            iconBg: "bg-sky-100 dark:bg-sky-950/50",
            iconColor: "text-sky-700 dark:text-sky-400",
            accent: "bg-sky-600 hover:bg-sky-700",
            Icon: Info,
          };

  const Icon = styles.Icon;
  const message = localizedAnnouncementMessage(current, viewLocale);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface shadow-xl p-6">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          aria-label={t("announcement.close")}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 mb-4 pr-6">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${styles.iconBg}`}
          >
            <Icon className={`w-5 h-5 ${styles.iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="announcement-title" className="text-lg font-semibold text-foreground">
              {t(titleKey)}
            </h2>
            {queue.length > 1 && (
              <p className="text-xs text-muted mt-0.5">
                {t("announcement.queue").replace("{n}", String(queue.length))}
              </p>
            )}
          </div>
        </div>

        {langs.length > 1 && (
          <div
            className="flex flex-wrap gap-1.5 mb-4"
            role="group"
            aria-label="Language"
          >
            {langs.map((code) => {
              const active = viewLocale === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setViewLocale(code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                    active
                      ? "bg-foreground text-background"
                      : "bg-background border border-border text-muted hover:text-foreground hover:border-foreground/30"
                  }`}
                  aria-pressed={active}
                >
                  {LOCALE_LABEL[code]}
                </button>
              );
            })}
          </div>
        )}

        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mb-6">
          {message}
        </p>

        <button
          type="button"
          onClick={handleDismiss}
          className={`w-full px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${styles.accent}`}
        >
          {t("announcement.dismiss")}
        </button>
      </div>
    </div>
  );
}
