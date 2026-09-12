"use client";

import { ShoppingCart, Check, Zap } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useLocale } from "@/lib/locale-context";
import { useUser } from "@/lib/user-context";
import { minQuantityForProduct } from "@/lib/min-quantity";
import QuantityStepper from "@/components/QuantityStepper";

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
    sku?: string | null;
    categorySlug: string;
    price: number;
    image: string | null;
    weight?: number | null;
    stockQuantity?: number;
    minQuantity?: number;
  };
  showBuyNow?: boolean;
}) {
  const { addItem } = useCart();
  const { t, locale } = useLocale();
  const { dealerDiscount } = useUser();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const minQuantity = minQuantityForProduct(product.minQuantity, product);
  const [quantity, setQuantity] = useState(minQuantity);

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

  const maxQuantity =
    product.stockQuantity && product.stockQuantity >= minQuantity
      ? product.stockQuantity
      : undefined;

  function addToCart() {
    if (outOfStock) return;
    addItem(
      {
        ...product,
        name: localizedName,
        price: finalPrice,
        minQuantity,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleAddToCart() {
    addToCart();
  }

  function handleBuyNow() {
    if (outOfStock) return;
    addToCart();
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
      <div className="w-full p-3 rounded-xl border border-border bg-surface/70 space-y-1">
        <QuantityStepper
          value={quantity}
          min={minQuantity}
          max={maxQuantity}
          onChange={setQuantity}
          unit="pz"
          label={t("product.qty_label")}
        />
      </div>
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
