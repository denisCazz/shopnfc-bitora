"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, User, ShoppingCart, Menu, X, LogOut, Shield, Loader2, Headphones, ChevronDown, Cpu, Truck, Sparkles } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";
import { useCart } from "@/lib/cart-context";
import { useLocale } from "@/lib/locale-context";
import { searchProducts, searchChips, type SearchResult, type ChipSearchResult } from "@/app/actions/search";
import { locales, type Locale } from "@/lib/i18n";
import { SITE } from "@/lib/site";

const languageFlags: Record<Locale, string> = {
  it: "https://flagcdn.com/w20/it.png",
  en: "https://flagcdn.com/w20/gb.png",
  fr: "https://flagcdn.com/w20/fr.png",
  es: "https://flagcdn.com/w20/es.png",
};

const languageLabels: Record<Locale, string> = {
  it: "IT",
  en: "EN",
  fr: "FR",
  es: "ES",
};

export default function Header({
  onToggleSidebar,
  sidebarOpen,
  user,
}: {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  user?: AuthUser | null;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currOpen, setCurrOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const currRef = useRef<HTMLDivElement>(null);
  const { totalItems, openCart } = useCart();
  const { locale, setLocale, currency, setCurrencyCode, currencies, t, formatPrice } = useLocale();

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [stoveResults, setStoveResults] = useState<ChipSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node))
        setLangOpen(false);
      if (currRef.current && !currRef.current.contains(e.target as Node))
        setCurrOpen(false);
      if (
        searchRef.current && !searchRef.current.contains(e.target as Node) &&
        mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
      if (
        !searchRef.current &&
        mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const doSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setStoveResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    setShowResults(true);
    debounceRef.current = setTimeout(async () => {
      const [res, chipHits] = await Promise.all([
        searchProducts(value, locale),
        searchChips(value),
      ]);
      setResults(res);
      setStoveResults(chipHits);
      setSearching(false);
    }, 300);
  }, [locale]);

  function handleResultClick() {
    setShowResults(false);
    setQuery("");
    setStoveResults([]);
    setMobileSearch(false);
  }

  const getStoveName = (s: ChipSearchResult) =>
    (locale === "en" && s.nameEn) ||
    (locale === "fr" && s.nameFr) ||
    (locale === "es" && s.nameEs) ||
    s.nameIt;

  const searchDropdown = (
    <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
      {/* Pinned stove entries */}
      {!searching && stoveResults.length > 0 && (
        <div className="border-b border-border/50">
          {stoveResults.map((s) => (
            <Link
              key={s.id}
              href={`/chip/${s.slug}`}
              onClick={handleResultClick}
              className="flex items-center gap-3 px-4 py-3 bg-sky-50/60 dark:bg-sky-950/20 hover:bg-sky-50 dark:hover:bg-sky-950/40 active:bg-sky-50 transition-colors border-b border-sky-100/60 dark:border-sky-900/30 last:border-0"
            >
              <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{getStoveName(s)}</p>
                <p className="text-xs text-accent">
                  Vedi tutti i {s.productCount} prodotti con questo chip &rarr;
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
      {searching ? (
        <div className="flex items-center justify-center gap-2 py-8 text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Ricerca...</span>
        </div>
      ) : results.length === 0 && stoveResults.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-muted">{t("search.no_results")} &ldquo;{query}&rdquo;</p>
        </div>
      ) : results.length > 0 ? (
        results.map((r) => (
          <Link
            key={r.id}
            href={`/products/${r.slug}`}
            onClick={handleResultClick}
            className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover active:bg-surface-hover transition-colors border-b border-border/30 last:border-0"
          >
            <div className="relative w-12 h-12 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-border overflow-hidden shrink-0">
              {r.image ? (
                <Image src={r.image} alt={r.name} fill sizes="48px" className="object-contain p-1" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-muted/30">{r.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
              <p className="text-xs text-muted">{r.category}</p>
            </div>
            <span className="text-sm font-bold text-accent shrink-0">
              {formatPrice(r.price)}{" "}
              <span className="text-[10px] font-semibold text-muted">{t("product.price_each")}</span>
            </span>
          </Link>
        ))
      ) : null}
    </div>
  );

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? "bg-surface/90 backdrop-blur-[20px] border-b border-border" : "bg-surface border-b border-border"
      }`}
    >
      {/* Main navbar */}
      <div className={scrolled ? "" : ""}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 flex items-center justify-between h-16 sm:h-[72px] gap-2 sm:gap-3">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 active:bg-slate-100 transition-colors shrink-0"
              aria-label={sidebarOpen ? "Chiudi menu" : "Apri menu"}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <Image
                src="/bitora.png"
                alt={SITE.name}
                width={40}
                height={40}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover"
                priority
              />
              <span className="hidden sm:flex items-baseline gap-1 tracking-tight">
                <span className="text-[15px] font-semibold text-foreground">Shop NFC</span>
                <span className="text-[15px] font-medium text-muted">Bitora</span>
              </span>
            </Link>
            <Link
              href="/assistente"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-accent hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Configura con AI
            </Link>
            <Link
              href="/assistenza"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-accent hover:bg-surface-hover transition-colors"
            >
              <Headphones className="w-4 h-4" />
              {t("nav.assistenza")}
            </Link>
            <Link
              href="/tracking"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:text-accent hover:bg-surface-hover transition-colors"
            >
              <Truck className="w-4 h-4" />
              Traccia ordine
            </Link>

            {/* Language selector */}
            <div className="relative hidden md:block" ref={langRef}>
              <button
                onClick={() => { setLangOpen(!langOpen); setCurrOpen(false); }}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-surface-hover active:bg-surface-hover transition-colors text-sm font-medium text-muted hover:text-foreground"
                aria-label="Lingua"
              >
                <img src={languageFlags[locale]} alt={locale} className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                <span>{languageLabels[locale]}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <div className="absolute left-0 top-full mt-1.5 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 min-w-[120px]">
                  {locales.map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLocale(l); setLangOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-surface-hover active:bg-surface-hover transition-colors ${
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

            {/* Currency selector */}
            <div className="relative hidden md:block" ref={currRef}>
              <button
                onClick={() => { setCurrOpen(!currOpen); setLangOpen(false); }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-surface-hover active:bg-surface-hover transition-colors"
                aria-label="Valuta"
              >
                <span className="text-base font-bold text-emerald-500 dark:text-emerald-400 leading-none">{currency.symbol}</span>
                <ChevronDown className={`w-3 h-3 text-muted transition-transform duration-200 ${currOpen ? "rotate-180" : ""}`} />
              </button>
              {currOpen && (
                <div className="absolute left-0 top-full mt-1.5 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 min-w-[90px]">
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { setCurrencyCode(c.code); setCurrOpen(false); }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-surface-hover active:bg-surface-hover transition-colors ${
                        currency.code === c.code ? "text-accent font-semibold bg-sky-50 dark:bg-sky-950/40" : "text-foreground"
                      }`}
                    >
                      {c.symbol} {c.code}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center: Desktop search */}
          <div className="flex-1 max-w-xl hidden md:block" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              {searching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted animate-spin" />}
              <input
                type="text"
                value={query}
                onChange={(e) => doSearch(e.target.value)}
                onFocus={() => { if (results.length > 0 || query.length >= 2) setShowResults(true); }}
                placeholder={t("search.placeholder")}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-background border text-sm text-foreground placeholder:text-muted focus:outline-none transition-all duration-200 border-border hover:border-border-hover focus:border-accent/50 focus:shadow-lg focus:shadow-accent/10 focus:ring-1 focus:ring-accent/20"
              />
              {showResults && query.length >= 2 && searchDropdown}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {/* Mobile search */}
            <button
              onClick={() => setMobileSearch(!mobileSearch)}
              className="md:hidden p-2 rounded-xl hover:bg-surface-hover active:bg-surface-hover transition-colors"
              aria-label="Cerca"
            >
              {mobileSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            {/* User menu / Login */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => { setUserMenuOpen(!userMenuOpen); }}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all duration-200 hover:bg-surface-hover active:bg-surface-hover ${userMenuOpen ? "bg-surface-hover" : ""}`}
                  aria-label="Menu utente"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center ring-2 ring-sky-300/40 dark:ring-sky-500/30 shadow-sm">
                      <span className="text-[13px] font-bold text-white leading-none">
                        {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                      </span>
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-surface rounded-full" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-foreground max-w-[100px] truncate">
                    {user.firstName || user.email.split("@")[0]}
                  </span>
                  <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-muted transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden z-50">
                    {/* Profile header */}
                    <div className="px-4 pt-4 pb-3 border-b border-border/60">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center ring-2 ring-sky-300/40 dark:ring-sky-500/30 shrink-0">
                          <span className="text-base font-bold text-white leading-none">
                            {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">
                            {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0]}
                          </div>
                          <div className="text-xs text-muted truncate">{user.email}</div>
                        </div>
                      </div>
                      {user.role === "admin" && (
                        <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-accent text-[11px] font-semibold">
                          <Shield className="w-3 h-3" />
                          Amministratore
                        </span>
                      )}
                    </div>

                    {/* Menu items */}
                    <div className="py-1.5">
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-surface-hover active:bg-surface-hover transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center">
                            <Shield className="w-3.5 h-3.5 text-accent" />
                          </div>
                          {t("auth.admin")}
                        </Link>
                      )}
                      <Link
                        href="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-surface-hover active:bg-surface-hover transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-muted" />
                        </div>
                        {t("auth.account")}
                      </Link>
                      <Link
                        href="/account/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-surface-hover active:bg-surface-hover transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                          <ShoppingCart className="w-3.5 h-3.5 text-muted" />
                        </div>
                        {t("account.orders")}
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-border/60 p-1.5">
                      <form action={logout}>
                        <button
                          type="submit"
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 active:bg-red-50 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                            <LogOut className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                          </div>
                          {t("auth.logout")}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-0.5">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-sm font-medium text-muted hover:text-accent hover:bg-surface-hover transition-colors"
                  aria-label={t("auth.login")}
                >
                  <User className="w-4.5 h-4.5" />
                  <span className="hidden sm:inline">{t("auth.login")}</span>
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline px-2 py-2 text-sm text-muted hover:text-accent transition-colors"
                  aria-label={t("auth.register")}
                >
                  {t("auth.register")}
                </Link>
              </div>
            )}

            {/* Spacer to push cart to far right */}
            <div className="w-px h-5 bg-border/60 mx-1 hidden sm:block" />

            {/* Cart — isolated far right */}
            <button
              onClick={openCart}
              className="relative p-2 rounded-xl hover:bg-surface-hover active:bg-surface-hover transition-colors"
              aria-label="Carrello"
            >
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {totalItems > 0 && (
                <span
                  key={totalItems}
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-accent rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none px-1 animate-cart-bounce"
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search expanded */}
      {mobileSearch && (
        <div className="md:hidden px-4 pb-3 border-b border-border/50bg-surface" ref={mobileSearchRef}>
          <div className="relative mt-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            {searching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted animate-spin" />}
            <input
              type="text"
              value={query}
              onChange={(e) => doSearch(e.target.value)}
              placeholder={t("search.placeholder.short")}
              autoFocus
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-background border border-border text-base placeholder:text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
            />
            {showResults && query.length >= 2 && searchDropdown}
          </div>
        </div>
      )}
    </header>
  );
}
