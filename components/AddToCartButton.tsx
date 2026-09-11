"use client";

import { ShoppingCart, Check, Zap, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useLocale } from "@/lib/locale-context";
import { useUser } from "@/lib/user-context";
import { productSoldByMeter } from "@/lib/product-meter-options";

export default function AddToCartButton({
  product,
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
    categorySlug: string;
    price: number;
    image: string | null;
    weight?: number | null;
    stockQuantity?: number;
  };
  showBuyNow?: boolean;
}) {
  const { addItem } = useCart();
  const { t, locale } = useLocale();
  const { dealerDiscount } = useUser();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [meters, setMeters] = useState(1);

  const outOfStock = product.stockQuantity !== undefined && product.stockQuantity <= 0;

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

  const finalPrice = dealerDiscount
    ? product.price * (1 - dealerDiscount / 100)
    : product.price;

  const soldByMeter = productSoldByMeter({
    categorySlug: product.categorySlug,
    nameIt: product.name_it || product.name,
  });

  const maxMeters = product.stockQuantity && product.stockQuantity > 0
    ? product.stockQuantity
    : undefined;

  function clampMeters(v: number): number {
    const int = Math.max(1, Math.floor(v));
    if (maxMeters === undefined) return int;
    return Math.min(maxMeters, int);
  }

  function handleAddToCart() {
    if (outOfStock) return;
    const qty = soldByMeter ? clampMeters(meters) : 1;
    addItem(
      {
        ...product,
        name: localizedName,
        price: finalPrice,
        lineKey: soldByMeter ? "unit:meter" : undefined,
        lineNotes: soldByMeter ? "Vendita al metro (quantità in metri)" : undefined,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    if (outOfStock) return;
    const qty = soldByMeter ? clampMeters(meters) : 1;
    addItem(
      {
        ...product,
        name: localizedName,
        price: finalPrice,
        lineKey: soldByMeter ? "unit:meter" : undefined,
        lineNotes: soldByMeter ? "Vendita al metro (quantità in metri)" : undefined,
      },
      qty
    );
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
    <div className="w-full space-y-3">
      {soldByMeter && (
        <div className="w-full p-3 rounded-xl border border-border bg-surface/70">
          <label className="block text-xs text-muted mb-2">Metri da acquistare</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMeters((m) => clampMeters(m - 1))}
              className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800"
              aria-label="Diminuisci metri"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min={1}
              max={maxMeters}
              step={1}
              value={meters}
              onChange={(e) => {
                const next = Number.parseInt(e.target.value || "1", 10);
                setMeters(clampMeters(Number.isFinite(next) ? next : 1));
              }}
              className="w-24 h-10 text-center px-2 rounded-lg border border-border bg-background text-foreground"
            />
            <button
              type="button"
              onClick={() => setMeters((m) => clampMeters(m + 1))}
              className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800"
              aria-label="Aumenta metri"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-sm text-muted">m</span>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
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
