"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { type Locale, defaultLocale, t as translate } from "@/lib/i18n";

export interface Currency {
  code: string;
  symbol: string;
  rate: number; // rate relative to EUR
}

const CURRENCIES: Currency[] = [
  { code: "EUR", symbol: "€", rate: 1 },
  { code: "GBP", symbol: "£", rate: 0.86 },
  { code: "USD", symbol: "$", rate: 1.08 },
];

// Fallback rates (sensible defaults as of 2025)
const FALLBACK_RATES: Record<string, number> = {
  EUR: 1,
  GBP: 0.86,
  USD: 1.08,
};

const STORAGE_KEY = "shopnfc_locale";
const RATES_CACHE_KEY = "shopnfc_rates";
const RATES_TTL = 1000 * 60 * 60; // 1 hour

interface LocaleContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  currency: Currency;
  setCurrencyCode: (code: string) => void;
  currencies: Currency[];
  t: (key: string) => string;
  formatPrice: (eurPrice: number) => string;
  isItalianLocale: boolean;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

function loadPrefs(): { locale: Locale; currency: string } {
  if (typeof window === "undefined") return { locale: defaultLocale, currency: "EUR" };
  // 1. Check localStorage (manual user preference)
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { locale: parsed.locale || defaultLocale, currency: parsed.currency || "EUR" };
    }
  } catch { /* ignore */ }
  // 2. Fallback to auto-detected cookie from middleware
  try {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const detected = cookies.find((c) => c.startsWith("shopnfc_detected="));
    if (detected) {
      const value = decodeURIComponent(detected.split("=").slice(1).join("="));
      const parsed = JSON.parse(value);
      return {
        locale: (parsed.locale as Locale) || defaultLocale,
        currency: parsed.currency || "EUR",
      };
    }
  } catch { /* ignore */ }
  return { locale: defaultLocale, currency: "EUR" };
}

function savePrefs(locale: Locale, currency: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ locale, currency }));
  } catch { /* ignore */ }
}

interface CachedRates {
  rates: Record<string, number>;
  ts: number;
}

function loadCachedRates(): Record<string, number> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (raw) {
      const cached: CachedRates = JSON.parse(raw);
      if (Date.now() - cached.ts < RATES_TTL) return cached.rates;
    }
  } catch { /* ignore */ }
  return null;
}

function saveCachedRates(rates: Record<string, number>) {
  try {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ rates, ts: Date.now() }));
  } catch { /* ignore */ }
}

async function fetchLiveRates(): Promise<Record<string, number> | null> {
  try {
    // Free API, no key required — European Central Bank data
    const res = await fetch(
      "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=GBP,USD",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.rates) {
      return { EUR: 1, ...data.rates };
    }
  } catch { /* network error — use fallback */ }
  return null;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [currencyCode, setCurrencyCodeState] = useState("EUR");
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [loaded, setLoaded] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const prefs = loadPrefs();
    setLocaleState(prefs.locale);
    setCurrencyCodeState(prefs.currency);
    setLoaded(true);
  }, []);

  // Fetch live rates
  useEffect(() => {
    const cached = loadCachedRates();
    if (cached) {
      setRates((prev) => ({ ...prev, ...cached }));
      return;
    }
    fetchLiveRates().then((liveRates) => {
      if (liveRates) {
        setRates((prev) => ({ ...prev, ...liveRates }));
        saveCachedRates(liveRates);
      }
    });
  }, []);

  // Persist preferences
  useEffect(() => {
    if (loaded) savePrefs(locale, currencyCode);
  }, [locale, currencyCode, loaded]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.documentElement.lang = l;
  }, []);

  const setCurrencyCode = useCallback((code: string) => {
    setCurrencyCodeState(code);
  }, []);

  const currencies: Currency[] = CURRENCIES.map((c) => ({
    ...c,
    rate: rates[c.code] ?? c.rate,
  }));

  const currency = currencies.find((c) => c.code === currencyCode) || currencies[0];

  const tFn = useCallback(
    (key: string) => translate(key, locale),
    [locale]
  );

  const formatPrice = useCallback(
    (eurPrice: number) => {
      const converted = eurPrice * currency.rate;
      return new Intl.NumberFormat(locale === "en" ? "en-GB" : `${locale}-${locale === "it" ? "IT" : locale === "fr" ? "FR" : "ES"}`, {
        style: "currency",
        currency: currency.code,
      }).format(converted);
    },
    [currency, locale]
  );

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        currency,
        setCurrencyCode,
        currencies,
        t: tFn,
        formatPrice,
        isItalianLocale: locale === "it",
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
