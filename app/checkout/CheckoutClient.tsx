"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  Lock,
  Minus,
  Plus,
  Trash2,
  Loader2,
  CreditCard,
  User,
  Building2,
} from "lucide-react";
import { useCart, cartLineId } from "@/lib/cart-context";
import { useLocale } from "@/lib/locale-context";
import { useUser } from "@/lib/user-context";
import {
  euVatCountryPrefix,
  italianVatIncludedOnProducts,
  isValidItalianPartitaIva,
} from "@/lib/italian-vat";
import { grossToNetItalianVat } from "@/lib/catalog-display-price";
import type { EuropeShippingMethod } from "@/lib/shipping";

const STRIPE_RETURN_ERROR_KEYS: Record<string, string> = {
  stripe_cancelled: "checkout.stripe_cancelled",
  stripe_failed: "checkout.stripe_failed",
};

const COUNTRIES = [
  "Italia",
  "Austria",
  "Belgio",
  "Bulgaria",
  "Croazia",
  "Danimarca",
  "Estonia",
  "Finlandia",
  "Francia",
  "Germania",
  "Grecia",
  "Irlanda",
  "Lettonia",
  "Lituania",
  "Lussemburgo",
  "Malta",
  "Paesi Bassi",
  "Polonia",
  "Portogallo",
  "Repubblica Ceca",
  "Romania",
  "Slovacchia",
  "Slovenia",
  "Spagna",
  "Svezia",
  "Ungheria",
  "Regno Unito",
  "Svizzera",
];

const COUNTRY_TO_NAME: Record<string, string> = {
  IT: "Italia",
  AT: "Austria",
  BE: "Belgio",
  BG: "Bulgaria",
  HR: "Croazia",
  DK: "Danimarca",
  EE: "Estonia",
  FI: "Finlandia",
  FR: "Francia",
  DE: "Germania",
  GR: "Grecia",
  IE: "Irlanda",
  LV: "Lettonia",
  LT: "Lituania",
  LU: "Lussemburgo",
  MT: "Malta",
  NL: "Paesi Bassi",
  PL: "Polonia",
  PT: "Portogallo",
  CZ: "Repubblica Ceca",
  RO: "Romania",
  SK: "Slovacchia",
  SI: "Slovenia",
  ES: "Spagna",
  SE: "Svezia",
  HU: "Ungheria",
  GB: "Regno Unito",
  CH: "Svizzera",
};

interface Profile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  vat_number: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
}

interface ShippingCalc {
  zone: string;
  totalWeight: number;
  shippingCost: number;
  codSurcharge: number;
  fragileShippingCost: number;
}

export default function CheckoutClient() {
  const {
    items,
    loaded: cartLoaded,
    removeItem,
    updateQuantity,
    totalPrice,
    totalItems,
  } = useCart();
  const { t, formatPrice } = useLocale();
  const { dealerDiscount, isDealer, pricesIncludeVat } = useUser();
  const searchParams = useSearchParams();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [paying, setPaying] = useState(false);
  const payingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompany, setIsCompany] = useState(false);
  const [shippingCalc, setShippingCalc] = useState<ShippingCalc | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [europeShippingMethod, setEuropeShippingMethod] = useState<EuropeShippingMethod>("standard_10");

  // VIES lookup (optional): mostra ragione sociale UE; il totale IVA usa paese / P.IVA italiana
  const [viesStatus, setViesStatus] = useState<"idle" | "loading" | "valid" | "invalid">("idle");
  const [viesCompanyName, setViesCompanyName] = useState<string | null>(null);
  const [vatDraft, setVatDraft] = useState("");

  // Track country/province for shipping calculation
  const [selectedCountry, setSelectedCountry] = useState("Italia");
  const [selectedProvince, setSelectedProvince] = useState("");

  useEffect(() => {
    const code = searchParams.get("error");
    if (!code) return;
    const key = STRIPE_RETURN_ERROR_KEYS[code];
    setError(key ? t(key) : `Errore pagamento: ${code}`);
  }, [searchParams, t]);

  // Clienti registrati con indirizzo di riferimento: la spedizione è determinata
  // automaticamente dall'indirizzo salvato (paese/provincia), senza scelta di
  // zona né di metodo. Così un cliente estero non può finire sulla tariffa
  // italiana e un cliente sulle isole vede solo la tariffa Isole/Calabria.
  const lockShipping = profileLoaded && !!profile?.country;

  // Fetch user profile for pre-fill
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          // Set initial country/province from profile
          const country = data.profile.country
            ? COUNTRY_TO_NAME[data.profile.country] || data.profile.country
            : "Italia";
          setSelectedCountry(country);
          setSelectedProvince(data.profile.province || "");
          // Pre-fill company toggle
          if (data.profile.company || data.profile.vat_number) {
            setIsCompany(true);
          }
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoaded(true));
  }, []);

  // Calculate shipping when items/country/province/method change
  const calcShipping = useCallback(async () => {
    if (!items.length) return;
    setShippingLoading(true);
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          country: selectedCountry,
          province: selectedProvince,
          ...(selectedCountry !== "Italia" && !lockShipping && { europeShippingMethod }),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShippingCalc(data);
      }
    } catch {
      // Silently fail shipping calc
    } finally {
      setShippingLoading(false);
    }
  }, [items, selectedCountry, selectedProvince, europeShippingMethod, lockShipping]);

  useEffect(() => {
    if (profileLoaded) {
      setVatDraft(profile?.vat_number ?? "");
    }
  }, [profileLoaded, profile?.vat_number]);

  useEffect(() => {
    if (profileLoaded) {
      calcShipping();
    }
  }, [calcShipping, profileLoaded]);

  const billingVatForDisplay = useMemo(() => {
    if (isCompany && vatDraft.trim()) return vatDraft.trim();
    const profileVat = profile?.vat_number?.trim();
    if (profileVat && (profile?.company?.trim() || isDealer)) return profileVat;
    return undefined;
  }, [isCompany, vatDraft, profile, isDealer]);

  const italianVatIncluded = useMemo(() => {
    if (!profileLoaded && !billingVatForDisplay) return pricesIncludeVat;
    return italianVatIncludedOnProducts(selectedCountry, billingVatForDisplay);
  }, [profileLoaded, billingVatForDisplay, pricesIncludeVat, selectedCountry]);

  // totalPrice is already discounted (discount applied in AddToCartButton)
  const originalTotal = dealerDiscount
    ? Math.round((totalPrice / (1 - dealerDiscount / 100)) * 100) / 100
    : totalPrice;
  const dealerSaving = originalTotal - totalPrice;

  const shippingCost = shippingCalc?.shippingCost ?? 0;
  const fragileShippingCost = shippingCalc?.fragileShippingCost ?? 0;
  const effectiveShippingCost = fragileShippingCost > 0 ? fragileShippingCost : shippingCost;
  const baseTotal = totalPrice + effectiveShippingCost;
  const productsNetIt = grossToNetItalianVat(totalPrice);
  const grandTotal = italianVatIncluded
    ? Math.round(baseTotal * 100) / 100
    : Math.round((productsNetIt + effectiveShippingCost) * 100) / 100;

  // VIES validation handler
  async function checkVies(vatNumberValue: string) {
    if (!vatNumberValue || selectedCountry === "Italia") {
      setViesStatus("idle");
      setViesCompanyName(null);
      return;
    }

    // Map country name to ISO code for VIES
    const countryCodeMap: Record<string, string> = {
      Austria: "AT", Belgio: "BE", Bulgaria: "BG", Croazia: "HR",
      Danimarca: "DK", Estonia: "EE", Finlandia: "FI", Francia: "FR",
      Germania: "DE", Grecia: "EL", Irlanda: "IE", Lettonia: "LV",
      Lituania: "LT", Lussemburgo: "LU", Malta: "MT", "Paesi Bassi": "NL",
      Polonia: "PL", Portogallo: "PT", "Repubblica Ceca": "CZ", Romania: "RO",
      Slovacchia: "SK", Slovenia: "SI", Spagna: "ES", Svezia: "SE",
      Ungheria: "HU",
    };

    const cc = countryCodeMap[selectedCountry];
    if (!cc) {
      setViesStatus("idle");
      return;
    }

    // Strip country prefix if present
    const cleanVat = vatNumberValue.replace(/^[A-Z]{2}/i, "").trim();
    if (cleanVat.length < 4) return;

    setViesStatus("loading");
    try {
      const res = await fetch("/api/vies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode: cc, vatNumber: cleanVat }),
      });
      const data = await res.json();
      if (data.valid) {
        setViesStatus("valid");
        setViesCompanyName(data.name);
      } else {
        setViesStatus("invalid");
        setViesCompanyName(null);
      }
    } catch {
      setViesStatus("idle");
    }
  }

  useEffect(() => {
    if (selectedCountry === "Italia" || !isCompany) {
      setViesStatus("idle");
      setViesCompanyName(null);
    }
  }, [selectedCountry, isCompany]);

  if (!cartLoaded) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
        <p className="text-sm text-muted">
          {t("checkout.loading")}
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
          <ShoppingBag className="w-9 h-9 text-muted/40" />
        </div>
        {error && (
          <div className="mb-4 max-w-md px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 text-left">
            {error}
          </div>
        )}
        <p className="text-foreground font-semibold mb-1">
          {t("checkout.empty")}
        </p>
        <p className="text-sm text-muted mb-6">{t("cart.empty.cta")}</p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-sky-500/25 transition-all"
        >
          {t("checkout.empty.cta")}
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (payingRef.current) return;
    payingRef.current = true;
    setPaying(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const shippingInfo = {
      name: form.get("name") as string,
      email: form.get("email") as string,
      phone: form.get("phone") as string,
      address: form.get("address") as string,
      city: form.get("city") as string,
      zip: form.get("zip") as string,
      province: ((form.get("province") as string) || "").toUpperCase().slice(0, 2),
      country: form.get("country") as string,
      notes: form.get("notes") as string,
    };

    const billingInfo = isCompany
      ? {
          company: form.get("company") as string,
          vatNumber: form.get("vat_number") as string,
          sdiCode: form.get("sdi_code") as string,
          pec: form.get("pec") as string,
        }
      : undefined;

    const companyTrim = billingInfo?.company?.trim();
    if (companyTrim && shippingInfo.country === "Italia") {
      const vat = (billingInfo?.vatNumber || "").trim();
      const foreignPrefix = vat ? euVatCountryPrefix(vat) : null;
      const isForeignEuVat = !!(foreignPrefix && foreignPrefix !== "IT");
      if (!isForeignEuVat && !isValidItalianPartitaIva(vat)) {
        setError(t("checkout.vat_italy_company_required"));
        payingRef.current = false;
        setPaying(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
            lineKey: i.lineKey,
            lineNotes: i.lineNotes ?? null,
          })),
          shippingInfo,
          billingInfo,
          ...(shippingInfo.country !== "Italia" && !lockShipping && { europeShippingMethod }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Errore durante il pagamento");
        payingRef.current = false;
        setPaying(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setError("Errore inatteso");
      payingRef.current = false;
      setPaying(false);
    } catch {
      setError("Errore di connessione. Riprova.");
      payingRef.current = false;
      setPaying(false);
    }
  }

  // Default values from profile
  const defaults = {
    name: profile
      ? [profile.first_name, profile.last_name].filter(Boolean).join(" ")
      : "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    address: profile?.address_line1 || "",
    city: profile?.city || "",
    zip: profile?.postal_code || "",
    province: profile?.province || "",
    country: profile?.country
      ? COUNTRY_TO_NAME[profile.country] || profile.country
      : "Italia",
    company: profile?.company || "",
    vatNumber: profile?.vat_number || "",
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition";
  const lockedInputClass =
    inputClass + " bg-stone-100 dark:bg-stone-800/60 text-muted cursor-not-allowed";

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-10">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("checkout.back")}
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
        {t("checkout.title")}
      </h1>
      {!profile && profileLoaded && (
        <p className="text-sm text-muted mb-6">{t("checkout.guest_note")}</p>
      )}

      {/* Logged-in indicator */}
      {profile && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
          <User className="w-4 h-4" />
          {t("checkout.prefilled")}
        </div>
      )}

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form - takes 3 cols */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
          {/* Shipping info */}
          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <Truck className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-foreground">
                {t("checkout.shipping_info")}
              </h2>
            </div>

            {!profileLoaded ? (
              <div className="flex items-center justify-center py-8 text-muted">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                {t("checkout.loading")}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                    {t("checkout.name")} *
                  </label>
                  <input
                    required
                    type="text"
                    name="name"
                    autoComplete="name"
                    defaultValue={defaults.name}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                    {t("checkout.email")} *
                  </label>
                  <input
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    defaultValue={defaults.email}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                    {t("checkout.phone")}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    defaultValue={defaults.phone}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                    {t("checkout.address")} *
                  </label>
                  <input
                    required
                    type="text"
                    name="address"
                    autoComplete="street-address"
                    defaultValue={defaults.address}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                    {t("checkout.city")} *
                  </label>
                  <input
                    required
                    type="text"
                    name="city"
                    autoComplete="address-level2"
                    defaultValue={defaults.city}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                    {t("checkout.zip")} *
                  </label>
                  <input
                    required
                    type="text"
                    name="zip"
                    autoComplete="postal-code"
                    defaultValue={defaults.zip}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                    {t("checkout.country")} *
                  </label>
                  {lockShipping ? (
                    <>
                      <input type="hidden" name="country" value={selectedCountry} />
                      <input
                        type="text"
                        readOnly
                        value={selectedCountry}
                        className={lockedInputClass}
                      />
                      <p className="mt-1.5 text-[11px] text-muted">
                        {t("checkout.shipping_locked_note")}
                      </p>
                    </>
                  ) : (
                    <select
                      required
                      name="country"
                      defaultValue={defaults.country}
                      autoComplete="country-name"
                      onChange={(e) => {
                        setSelectedCountry(e.target.value);
                        if (e.target.value !== "Italia") {
                          setSelectedProvince("");
                        } else {
                          setEuropeShippingMethod("standard_10");
                        }
                      }}
                      className={inputClass}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {selectedCountry === "Italia" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                      {t("checkout.province")}
                    </label>
                    <input
                      type="text"
                      name="province"
                      autoComplete="address-level1"
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value.toUpperCase().slice(0, 2))}
                      maxLength={2}
                      readOnly={lockShipping}
                      className={(lockShipping ? lockedInputClass : inputClass) + " uppercase"}
                      placeholder="TV"
                    />
                  </div>
                )}
                {/* Europe / foreign shipping method selector (nascosto quando la
                    spedizione è bloccata sull'indirizzo di riferimento) */}
                {selectedCountry !== "Italia" && !lockShipping && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Metodo di spedizione *
                    </label>
                    <div className="space-y-2">
                      {[
                        {
                          value: "standard_10" as EuropeShippingMethod,
                          label: "Trasporto Estero 10 kg",
                          price: "€ 20,00",
                        },
                        {
                          value: "standard_30" as EuropeShippingMethod,
                          label: "Trasporto Estero 30 kg",
                          price: "€ 30,00",
                        },
                        {
                          value: "dhl" as EuropeShippingMethod,
                          label: "DHL Express",
                          price: "€ 45,00",
                        },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                            europeShippingMethod === opt.value
                              ? "border-accent bg-sky-50/50 dark:bg-sky-950/20"
                              : "border-border hover:border-accent/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="europeShippingMethodRadio"
                              value={opt.value}
                              checked={europeShippingMethod === opt.value}
                              onChange={() => setEuropeShippingMethod(opt.value)}
                              className="text-accent focus:ring-accent/30"
                            />
                            <span className="text-sm font-medium text-foreground">{opt.label}</span>
                          </div>
                          <span className="text-sm font-semibold text-accent">{opt.price}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-muted mt-1.5">Prezzi IVA esclusa</p>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                    {t("checkout.notes")}
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Billing / Company info (optional) */}
          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-bold text-foreground">
                  {t("checkout.billing_title")}
                </h2>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={isCompany}
                onChange={(e) => setIsCompany(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent/30"
              />
              <span className="text-sm text-foreground">
                {t("checkout.billing_invoice_toggle")}
              </span>
            </label>

            {isCompany && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5 mt-4">
                    {t("checkout.billing_company_name")} *
                  </label>
                  <input
                    required={isCompany}
                    type="text"
                    name="company"
                    defaultValue={defaults.company}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                    {t("checkout.billing_vat")} *
                  </label>
                  <div className="flex gap-2">
                    <input
                      required={isCompany}
                      type="text"
                      name="vat_number"
                      value={vatDraft}
                      onChange={(e) => setVatDraft(e.target.value)}
                      placeholder="IT01234567890"
                      className={`${inputClass} flex-1`}
                    />
                    {isCompany && selectedCountry !== "Italia" && (
                      <button
                        type="button"
                        onClick={() => {
                          checkVies(vatDraft);
                        }}
                        disabled={viesStatus === "loading"}
                        className="px-3 py-2 rounded-xl border border-border bg-surface text-xs font-semibold hover:bg-accent/5 hover:border-accent/30 transition-all shrink-0 disabled:opacity-50"
                      >
                        {viesStatus === "loading" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          t("checkout.billing_vies_check")
                        )}
                      </button>
                    )}
                  </div>
                  {/* VIES result */}
                  {viesStatus === "valid" && (
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-xs text-green-700 dark:text-green-400">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      <div>
                        <span className="font-semibold">
                          {t("checkout.billing_vies_valid")}
                        </span>
                        {viesCompanyName && <span className="ml-1">({viesCompanyName})</span>}
                      </div>
                    </div>
                  )}
                  {viesStatus === "invalid" && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                      {t("checkout.billing_vies_invalid")}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                    {t("checkout.billing_fiscal_code")}
                  </label>
                  <input
                    type="text"
                    name="fiscal_code"
                    placeholder={t("checkout.optional")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                    {t("checkout.billing_sdi")}
                  </label>
                  <input
                    type="text"
                    name="sdi_code"
                    placeholder={t("checkout.billing_sdi_placeholder")}
                    maxLength={7}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-1.5">
                    {t("checkout.billing_pec")}
                  </label>
                  <input
                    type="email"
                    name="pec"
                    placeholder="pec@azienda.it"
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-foreground">
                {t("checkout.payment")}
              </h2>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-accent bg-sky-50/50 dark:bg-sky-950/20">
              <Lock className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground text-sm">Stripe</p>
                <p className="text-xs text-muted mt-1">
                  {t("checkout.payment.stripe_description")}
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={paying || !profileLoaded}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white font-bold text-base hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {paying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("checkout.submitting_stripe")}
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                {t("checkout.pay_with_stripe").replace("{total}", formatPrice(grandTotal))}
              </>
            )}
          </button>

          <p className="text-xs text-muted text-center">
            {t("checkout.terms")}
          </p>
        </form>

        {/* Order summary - takes 2 cols */}
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-5">
              <ShoppingBag className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-foreground">
                {t("checkout.summary")} ({totalItems})
              </h2>
            </div>

            <div className="space-y-3 mb-5 max-h-[45vh] overflow-y-auto">
              {items.map((item) => (
                <div
                  key={cartLineId(item)}
                  className="flex gap-3 p-3 rounded-xl bg-stone-50/60 dark:bg-stone-800/40 border border-border/50"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative w-16 h-16 rounded-lg bg-surface border border-border overflow-hidden shrink-0"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-muted/30">
                          {item.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {item.name}
                    </p>
                    {item.lineNotes && (
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">{item.lineNotes}</p>
                    )}
                    <p className="text-sm font-bold text-accent mt-0.5">
                      {formatPrice(
                        italianVatIncluded ? item.price : grossToNetItalianVat(item.price)
                      )}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-0 border border-border rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1, item.lineKey)
                          }
                          className="w-7 h-7 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-14 h-7 flex items-center justify-center text-xs font-medium border-x border-border bg-surface">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1, item.lineKey)
                          }
                          className="w-7 h-7 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id, item.lineKey)}
                        className="p-1 rounded text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">{t("cart.subtotal")}</span>
                <span className="font-medium text-foreground">
                  {formatPrice(
                    italianVatIncluded
                      ? isDealer && dealerDiscount
                        ? originalTotal
                        : totalPrice
                      : isDealer && dealerDiscount
                        ? grossToNetItalianVat(originalTotal)
                        : productsNetIt
                  )}
                </span>
              </div>
              {isDealer && dealerDiscount && dealerSaving > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">
                    {t("checkout.dealer_discount").replace("{percent}", String(dealerDiscount))}
                  </span>
                  <span className="font-medium text-green-600">
                    -{formatPrice(italianVatIncluded ? dealerSaving : grossToNetItalianVat(dealerSaving))}
                  </span>
                </div>
              )}
              {fragileShippingCost > 0 ? (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Spedizioni per collo fragile (DHL)</span>
                  {shippingLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted" />
                  ) : (
                    <span className="font-medium text-foreground">
                      {formatPrice(fragileShippingCost)}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">{t("checkout.shipping")}</span>
                  {shippingLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted" />
                  ) : shippingCalc ? (
                    <span className="font-medium text-foreground">
                      {formatPrice(shippingCost)}
                    </span>
                  ) : (
                    <span className="text-muted text-xs">
                      {t("checkout.calculated")}
                    </span>
                  )}
                </div>
              )}
              <p className="text-xs text-muted pt-1">{t("checkout.delivery_note")}</p>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-bold text-foreground">
                  {t("checkout.total")}
                </span>
                <span className="text-xl font-bold text-accent">
                  {formatPrice(grandTotal)}
                </span>
              </div>
              {italianVatIncluded ? (
                <p className="text-[11px] text-muted">
                  {t("checkout.vat_included_note")}
                </p>
              ) : (
                <p className="text-[11px] text-muted">
                  {t("checkout.vat_net_products_note")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
