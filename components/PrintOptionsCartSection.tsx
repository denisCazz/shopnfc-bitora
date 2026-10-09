"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Check, Zap, AlertCircle, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useLocale } from "@/lib/locale-context";
import { useUser } from "@/lib/user-context";
import { minQuantityForProduct } from "@/lib/min-quantity";
import QuantityStepper from "@/components/QuantityStepper";
import PrintConditionsAcceptance from "@/components/PrintConditionsAcceptance";
import {
  DEFAULT_PRINT_PRICES,
  parsePrintOption,
  printOptionLineKey,
  printSurcharge,
  type PrintOption,
  type PrintPrices,
} from "@/lib/print-options";
import { roundMoney } from "@/lib/pricing";

const OPTION_KEYS: { value: PrintOption; label: string; hint: string }[] = [
  { value: "none", label: "print.option_none", hint: "print.option_none_hint" },
  { value: "black", label: "print.option_black", hint: "print.option_black_hint" },
  { value: "color1", label: "print.option_color1", hint: "print.option_color1_hint" },
  { value: "color2", label: "print.option_color2", hint: "print.option_color2_hint" },
];

export default function PrintOptionsCartSection({
  product,
  printPrices = DEFAULT_PRINT_PRICES,
  showBuyNow = false,
}: {
  product: {
    id: number;
    name: string;
    name_it?: string;
    name_en?: string;
    name_fr?: string;
    name_es?: string;
    slug: string;
    sku?: string | null;
    price: number;
    image: string | null;
    weight?: number | null;
    stockQuantity?: number;
    minQuantity?: number;
  };
  printPrices?: PrintPrices;
  showBuyNow?: boolean;
}) {
  const { addItem, openCart } = useCart();
  const { t, locale, formatPrice } = useLocale();
  const { dealerDiscount } = useUser();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [printOption, setPrintOption] = useState<PrintOption>("none");
  const [printTermsAccepted, setPrintTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const minQuantity = minQuantityForProduct(product.minQuantity, product);
  const [quantity, setQuantity] = useState(minQuantity);

  const outOfStock = product.stockQuantity !== undefined && product.stockQuantity <= 0;
  const needsPrint = printOption !== "none";
  const surcharge = printSurcharge(printOption, printPrices);

  const localizedName =
    (locale !== "it" &&
      (product[
        `name_${locale}` as keyof Pick<
          typeof product,
          "name_it" | "name_en" | "name_fr" | "name_es"
        >
      ] as string | undefined)) ||
    product.name_it ||
    product.name;

  const productPrice = dealerDiscount
    ? roundMoney(product.price * (1 - dealerDiscount / 100))
    : product.price;
  const unitPrice = roundMoney(productPrice + surcharge);

  const maxQuantity =
    product.stockQuantity && product.stockQuantity >= minQuantity
      ? product.stockQuantity
      : undefined;

  const lineNotes = useMemo(() => {
    if (printOption === "none") return null;
    return t(OPTION_KEYS.find((o) => o.value === printOption)?.label ?? "print.option_none");
  }, [printOption, t]);

  function addToCart() {
    if (outOfStock) return false;
    if (needsPrint && !printTermsAccepted) {
      setError(t("print.conditions_required"));
      return false;
    }
    setError(null);
    addItem(
      {
        ...product,
        name: localizedName,
        price: unitPrice,
        minQuantity,
        lineKey: printOptionLineKey(printOption),
        lineNotes,
        printOption,
        printSurcharge: surcharge,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    return true;
  }

  function handleAddToCart() {
    if (addToCart()) openCart();
  }

  function handleBuyNow() {
    if (!addToCart()) return;
    router.push("/checkout");
  }

  if (outOfStock) {
    return (
      <button
        disabled
        className="flex-1 py-3 px-6 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-semibold cursor-not-allowed flex items-center justify-center gap-2"
      >
        {t("product.out_of_stock")}
      </button>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="w-full p-4 rounded-xl border border-border bg-surface/70 space-y-3">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <StepBadge n={1} />
          {t("print.option_title")}
        </p>
        <div className="space-y-2">
          {OPTION_KEYS.map((opt) => {
            const extra = printSurcharge(opt.value, printPrices);
            const selected = printOption === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex items-start justify-between gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                  selected
                    ? "border-accent bg-sky-50/60 dark:bg-sky-950/20"
                    : "border-border hover:border-accent/30"
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <input
                    type="radio"
                    name="printOption"
                    className="mt-1"
                    checked={selected}
                    onChange={() => {
                      const next = parsePrintOption(opt.value);
                      setPrintOption(next);
                      if (next === "none") {
                        setPrintTermsAccepted(false);
                        setError(null);
                      }
                    }}
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">
                      {t(opt.label)}
                    </span>
                    <span className="block text-xs text-muted mt-0.5">{t(opt.hint)}</span>
                  </span>
                </div>
                <span className="text-sm font-semibold text-accent shrink-0 tabular-nums">
                  {extra > 0 ? `+${formatPrice(extra)}` : t("print.option_included")}
                </span>
              </label>
            );
          })}
        </div>
        {needsPrint && (
          <Link
            href={`/preventivo?prodotto=${encodeURIComponent(product.slug)}&formato=card`}
            className="flex items-center gap-2 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-800/40 px-3 py-2.5 text-sm font-medium text-accent hover:underline"
          >
            <FileText className="w-4 h-4 shrink-0" />
            {t("print.preview_link")}
          </Link>
        )}
        {needsPrint && (
          <PrintConditionsAcceptance
            checked={printTermsAccepted}
            onChange={(v) => {
              setPrintTermsAccepted(v);
              if (v) setError(null);
            }}
          />
        )}
      </div>

      <div className="w-full p-3 rounded-xl border border-border bg-surface/70 space-y-1">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
          <StepBadge n={2} />
          {t("product.qty_label")}
        </p>
        <QuantityStepper
          value={quantity}
          min={minQuantity}
          max={maxQuantity}
          onChange={setQuantity}
          unit="pz"
        />
      </div>

      <div className="flex items-baseline justify-between gap-3 px-1">
        <span className="text-sm text-muted">{t("print.unit_total")}</span>
        <span className="text-2xl font-bold text-accent tabular-nums">{formatPrice(unitPrice)}</span>
      </div>
      {surcharge > 0 && (
        <p className="text-xs text-muted px-1">
          {t("print.surcharge_included").replace("{amount}", formatPrice(surcharge))}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 flex items-start gap-1.5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      <p className="text-sm font-semibold text-foreground flex items-center gap-2 px-1">
        <StepBadge n={3} />
        {t("print.step_order")}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          className={`flex-1 py-3 px-6 rounded-xl border-2 font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-2 ${
            added
              ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400"
              : "border-accent text-accent hover:bg-sky-50 dark:hover:bg-sky-950/20"
          }`}
        >
          {added ? (
            <>
              <Check className="w-5 h-5" />
              {t("product.added")}
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              {t("product.add_to_cart")}
            </>
          )}
        </button>
        {showBuyNow && (
          <button
            type="button"
            onClick={handleBuyNow}
            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white font-semibold hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            {t("product.buy_now")}
          </button>
        )}
      </div>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold">
      {n}
    </span>
  );
}
