"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Sun, Moon, Monitor } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { useTheme } from "@/lib/theme-context";
import { locales, type Locale } from "@/lib/i18n";

const languageFlags: Record<Locale, string> = {
  it: "https://flagcdn.com/w20/it.png",
  en: "https://flagcdn.com/w20/gb.png",
  fr: "https://flagcdn.com/w20/fr.png",
  es: "https://flagcdn.com/w20/es.png",
};

const languageLabels: Record<Locale, string> = {
  it: "Italiano",
  en: "English",
  fr: "Français",
  es: "Español",
};

export default function AuthTopBar({
  backHref = "/",
  backLabel = "Torna alla Home",
  rightSlot,
}: {
  backHref?: string;
  backLabel?: string;
  rightSlot?: React.ReactNode;
}) {
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">{backLabel}</span>
      </Link>

      <div className="flex items-center gap-2">
        {rightSlot}

        {/* Language selector */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-surface-hover text-sm font-medium text-muted hover:text-foreground transition-colors border border-transparent hover:border-border"
            aria-label="Lingua"
          >
            <img src={languageFlags[locale]} alt={locale} className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
            <span className="uppercase text-xs font-semibold tracking-wide">{locale}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 min-w-[140px]">
              {locales.map((l) => (
                <button
                  key={l}
                  onClick={() => { setLocale(l as Locale); setLangOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-surface-hover transition-colors ${
                    locale === l ? "text-accent font-semibold bg-sky-50 dark:bg-sky-950/40" : "text-foreground"
                  }`}
                >
                  <img src={languageFlags[l]} alt={l} className="w-5 h-3.5 object-cover rounded-sm shadow-sm shrink-0" />
                  {languageLabels[l]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => {
            const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
            setTheme(next);
          }}
          className="p-1.5 rounded-lg text-muted hover:bg-surface-hover hover:text-foreground transition-colors border border-transparent hover:border-border"
          aria-label="Cambia tema"
        >
          {theme === "dark" ? <Moon className="w-4 h-4" /> : theme === "light" ? <Sun className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
