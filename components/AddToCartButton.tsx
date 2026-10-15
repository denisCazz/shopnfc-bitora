"use client";

import { ShoppingCart, Check, Zap, Cpu, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useLocale } from "@/lib/locale-context";
import { useUser } from "@/lib/user-context";
import { minQuantityForProduct } from "@/lib/min-quantity";
import { useCatalogDisplayPrice } from "@/lib/use-catalog-display-price";
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
  const { addItem, openCart } = useCart();
  const { t, locale } = useLocale();
  const { dealerDiscount } = useUser();
  const { formatCatalogPrice } = useCatalogDisplayPrice();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const minQuantity = minQuantityForProduct(product.minQuantity, product);
  const [quantity, setQuantity] = useState(minQuantity);
  const [nfcMode, setNfcMode] = useState<"virgin" | "programmed">("virgin");
  const [nfcPayload, setNfcPayload] = useState("");

  const outOfStock = product.stockQuantity !== undefined && product.stockQuantity <= 0;
  const isReaderCategory = product.categorySlug === "lettori-nfc";

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
    if (outOfStock) return false;
    const trimmedPayload = nfcPayload.trim();
    const lineKey =
      !isReaderCategory && nfcMode === "programmed"
        ? `nfc:prog:${trimmedPayload.slice(0, 40) || "tbd"}`
        : undefined;
    const lineNotes =
      !isReaderCategory && nfcMode === "programmed"
        ? trimmedPayload
          ? `Programmazione NFC: ${trimmedPayload}`
          : "Programmazione NFC richiesta (dati da inviare)"
        : null;

    addItem(
      {
        ...product,
        name: localizedName,
        price: finalPrice,
        minQuantity,
        lineKey,
        lineNotes,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    return true;
  }

  function handleAddToCart() {
    if (addToCart()) {
      openCart();
    }
  }

  function handleBuyNow() {
    if (outOfStock) return;
    if (addToCart()) {
      router.push("/checkout");
    }
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
      {!isReaderCategory && (
        <div className="w-full p-3.5 rounded-xl border border-border bg-surface/70 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-accent" />
              Programmazione chip NFC
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Inclusa nel prezzo
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setNfcMode("virgin")}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold text-left transition-all ${
                nfcMode === "virgin"
                  ? "border-accent bg-sky-50/70 dark:bg-sky-950/30 text-accent"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              <span className="block">Chip vergini</span>
              <span className="block text-[10px] font-normal opacity-80">Pronti da codificare</span>
            </button>
            <button
              type="button"
              onClick={() => setNfcMode("programmed")}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold text-left transition-all ${
                nfcMode === "programmed"
                  ? "border-accent bg-sky-50/70 dark:bg-sky-950/30 text-accent"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              <span className="block">Già programmati</span>
              <span className="block text-[10px] font-normal opacity-80">Link, vCard o testo</span>
            </button>
          </div>
          {nfcMode === "programmed" && (
            <div className="pt-1">
              <input
                type="text"
                value={nfcPayload}
                onChange={(e) => setNfcPayload(e.target.value)}
                placeholder="Inserisci link (https://...), vCard o nota (oppure invia CSV dopo l'ordine)"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
          )}
        </div>
      )}

      <div className="w-full p-3.5 rounded-xl border border-border bg-surface/70 space-y-2">
        <QuantityStepper
          value={quantity}
          min={minQuantity}
          max={maxQuantity}
          onChange={setQuantity}
          unit="pz"
          label={t("product.qty_label")}
        />
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-sm">
          <span className="text-xs text-muted">
            Totale per <strong className="text-foreground">{quantity} pz</strong>:
          </span>
          <span className="text-base font-bold text-accent tabular-nums">
            {formatCatalogPrice(finalPrice * quantity)}
          </span>
        </div>
      </div>

      {minQuantity >= 10 && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/40 text-xs">
          <span className="text-muted flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
            Ti servono <strong className="text-foreground">100, 500 o 1.000+ pezzi</strong>? Scaglioni dedicati B2B.
          </span>
          <Link
            href={`/preventivo?prodotto=${encodeURIComponent(product.slug)}`}
            className="font-semibold text-accent hover:underline shrink-0"
          >
            Chiedi sconto volume →
          </Link>
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
