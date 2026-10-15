"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Palette, X } from "lucide-react";
import { type Product } from "@/data/products";
import { useCart } from "@/lib/cart-context";
import { useLocale } from "@/lib/locale-context";
import { useUser } from "@/lib/user-context";
import { productNeedsBoardProgrammingOption } from "@/lib/product-board-options";
import { productNeedsPrintOption } from "@/lib/print-options";
import { minQuantityForProduct } from "@/lib/min-quantity";
import PriceDisplay from "@/components/PriceDisplay";

export default function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const { addItem, openCart } = useCart();
  const { t, locale } = useLocale();
  const { dealerDiscount } = useUser();
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [boardVariant, setBoardVariant] = useState<"programmed" | "virgin">("programmed");
  const [boardStoveText, setBoardStoveText] = useState("");
  const [boardStoves, setBoardStoves] = useState<{ id: number; nameIt: string; nameEn: string | null }[]>([]);
  const [boardStovesLoading, setBoardStovesLoading] = useState(false);
  const [boardStoveId, setBoardStoveId] = useState<number | "">("");
  const [boardDisplayText, setBoardDisplayText] = useState("");
  const minQuantity = minQuantityForProduct(product.minQuantity, product);

  // Locale-aware name & description
  const localizedName = (locale !== "it" && product[`name_${locale}` as keyof typeof product] as string) || product.name;
  const discountedPrice = dealerDiscount
    ? product.price * (1 - dealerDiscount / 100)
    : product.price;


  const outOfStock = product.stockQuantity !== undefined && product.stockQuantity <= 0;

  const needsBoardOption = productNeedsBoardProgrammingOption({
    categorySlug: product.categorySlug,
    name_it: product.name,
  });
  const needsPrintOption = productNeedsPrintOption({
    categorySlug: product.categorySlug,
  });

  function doAddToCart(quantity = minQuantity, lineKey?: string, lineNotes?: string) {
    addItem({
      id: product.id,
      name: localizedName,
      slug: product.slug,
      price: discountedPrice,
      image: product.image,
      weight: product.weight,
      minQuantity,
      lineKey,
      lineNotes,
    }, quantity);
    openCart();
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    if (needsBoardOption) {
      setBoardVariant("programmed");
      setBoardStoveText("");
      setBoardStoveId("");
      setBoardDisplayText("");
      setBoardStoves([]);
      setShowBoardModal(true);
      setBoardStovesLoading(true);
      fetch(`/api/chips?productId=${product.id}`)
        .then((r) => r.json())
        .then((data) => setBoardStoves(Array.isArray(data) ? data : []))
        .catch(() => setBoardStoves([]))
        .finally(() => setBoardStovesLoading(false));
      return;
    }
    doAddToCart(minQuantity);
  }

  function handleBoardConfirm() {
    const hasStoves = boardStoves.length > 0;
    if (boardVariant === "programmed") {
      if (hasStoves && boardStoveId === "") return;
      if (!hasStoves && !boardStoveText.trim()) return;
      if (!boardDisplayText.trim()) return;
    }
    let lineKey: string;
    let lineNotes: string;
    if (boardVariant === "virgin") {
      lineKey = "board:virgin";
      lineNotes = t("product.board_option_notes_virgin");
    } else {
      const display = boardDisplayText.trim();
      const displayNote = "\n" + t("product.board_option_notes_display").replace("{display}", display);
      const displayKey = `:disp:${display.toLowerCase().slice(0, 40)}`;
      if (hasStoves) {
        const stove = boardStoves.find((s) => s.id === boardStoveId);
        const stoveName = stove?.nameIt ?? String(boardStoveId);
        lineKey = `board:prog:${boardStoveId}${displayKey}`;
        lineNotes =
          t("product.board_option_notes_programmed").replace("{stove}", stoveName) + displayNote;
      } else {
        lineKey = `board:prog:custom${displayKey}`;
        lineNotes =
          t("product.board_option_notes_programmed").replace("{stove}", boardStoveText.trim()) +
          displayNote;
      }
    }
    doAddToCart(minQuantity, lineKey, lineNotes);
    setShowBoardModal(false);
    setBoardStoveText("");
    setBoardStoveId("");
    setBoardDisplayText("");
  }

  const cardButtonClass = `mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200 sm:text-sm ${
    outOfStock
      ? "cursor-not-allowed bg-stone-200 text-stone-500"
      : "bg-sky-500 text-white hover:bg-sky-600 hover:shadow-lg hover:shadow-sky-500/25 active:scale-[0.98]"
  }`;

  return (
    <div
      className="product-card-in group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:border-accent/30 hover:shadow-xl hover:shadow-sky-500/10"
      style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
    >
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square overflow-hidden bg-white">
          {product.image && !imgError ? (
            <Image
              src={product.image}
              alt={localizedName}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 280px"
              quality={85}
              className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-muted/30">{localizedName.charAt(0)}</span>
            </div>
          )}

          {outOfStock && (
            <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              {t("product.out_of_stock")}
            </span>
          )}
          {!outOfStock && needsPrintOption && (
            <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-slate-950 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {t("card.printable")}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col px-3 pt-3 sm:px-4">
          <p className="mb-1 truncate text-[10px] font-semibold uppercase tracking-wider text-muted">
            {t(`cat.${product.categorySlug}`) || product.category}
          </p>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
            {localizedName}
          </h3>
          <div className="mt-auto pt-2">
            <PriceDisplay
              price={product.price}
              className={`text-lg font-bold tabular-nums ${dealerDiscount ? "" : "text-foreground"}`}
            />
            <p className="text-[11px] text-muted">
              {t("card.min_qty").replace("{n}", String(minQuantity))}
            </p>
          </div>
        </div>
      </Link>

      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        {needsPrintOption && !outOfStock ? (
          <Link href={`/products/${product.slug}`} className={cardButtonClass}>
            <Palette className="h-4 w-4" />
            {t("card.customize")}
          </Link>
        ) : (
          <button onClick={handleAddToCart} disabled={outOfStock} className={cardButtonClass}>
            <ShoppingCart className="h-4 w-4" />
            {outOfStock ? t("product.out_of_stock") : t("product.add")}
          </button>
        )}
      </div>

      {/* Board programming modal */}
      {showBoardModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowBoardModal(false)}
        >
          <div
            className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-sm p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">{t("product.board_option_title")}</p>
              <button
                type="button"
                onClick={() => setShowBoardModal(false)}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted line-clamp-2">{localizedName}</p>
            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="card_board_variant"
                  className="mt-1"
                  checked={boardVariant === "programmed"}
                  onChange={() => setBoardVariant("programmed")}
                />
                <span>
                  <span className="font-medium text-foreground">{t("product.board_option_programmed")}</span>
                  <span className="block text-muted text-xs mt-0.5">{t("product.board_option_programmed_hint")}</span>
                </span>
              </label>
              {boardVariant === "programmed" && (
                <div className="pl-6">
                  {boardStovesLoading ? (
                    <p className="text-xs text-muted animate-pulse">{t("common.loading") || "Caricamento..."}</p>
                  ) : boardStoves.length > 0 ? (
                    <select
                      value={boardStoveId}
                      onChange={(e) => setBoardStoveId(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
                      autoFocus
                    >
                      <option value="">{t("product.board_option_stove_placeholder")}</option>
                      {boardStoves.map((s) => (
                        <option key={s.id} value={s.id}>{s.nameIt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={boardStoveText}
                      onChange={(e) => setBoardStoveText(e.target.value)}
                      placeholder={t("product.board_option_stove_placeholder")}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted"
                      autoFocus
                    />
                  )}
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-muted mb-1">
                      {t("product.board_option_display_label")}
                    </label>
                    <input
                      type="text"
                      value={boardDisplayText}
                      onChange={(e) => setBoardDisplayText(e.target.value)}
                      placeholder={t("product.board_option_display_placeholder")}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted"
                    />
                  </div>
                </div>
              )}
              <label className="flex items-start gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="card_board_variant"
                  className="mt-1"
                  checked={boardVariant === "virgin"}
                  onChange={() => { setBoardVariant("virgin"); setBoardStoveText(""); setBoardDisplayText(""); }}
                />
                <span>
                  <span className="font-medium text-foreground">{t("product.board_option_virgin")}</span>
                  <span className="block text-muted text-xs mt-0.5">{t("product.board_option_virgin_hint")}</span>
                </span>
              </label>
            </div>
            <button
              type="button"
              onClick={handleBoardConfirm}
              disabled={
                boardVariant === "programmed" &&
                (boardStovesLoading ||
                  (boardStoves.length > 0 ? boardStoveId === "" : !boardStoveText.trim()) ||
                  !boardDisplayText.trim())
              }
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none hover:shadow-lg hover:shadow-sky-500/25 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              {t("product.add_to_cart")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
