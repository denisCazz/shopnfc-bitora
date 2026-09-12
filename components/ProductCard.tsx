"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Eye, X } from "lucide-react";
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
  const { addItem } = useCart();
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
  const localizedDescription = (locale !== "it" && product[`description_${locale}` as keyof typeof product] as string) || product.description;

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

  return (
    <div
      className="product-card-in group relative bg-surface border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-sky-500/10"
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-stone-50 to-sky-50/30 overflow-hidden">
          {product.image && !imgError ? (
            <Image
              src={product.image}
              alt={localizedName}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              quality={85}
              className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-6">
                <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-border flex items-center justify-center">
                  <span className="text-xl font-bold text-muted/40">
                    {localizedName.charAt(0)}
                  </span>
                </div>
                <p className="text-[11px] text-muted/50">{t("product.image_na")}</p>
              </div>
            </div>
          )}

          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-surface/90 backdrop-blur-md text-[11px] font-medium text-muted border border-border/50 shadow-sm z-10">
            {t(`cat.${product.categorySlug}`) || product.category}
          </span>

          {/* Out of stock badge */}
          {product.stockQuantity !== undefined && product.stockQuantity <= 0 && (
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold uppercase shadow-sm z-10">
              {t("product.out_of_stock")}
            </span>
          )}

          {/* Desktop hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-end justify-center pb-5 z-10">
            <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface/90 backdrop-blur-md text-sm font-medium text-foreground border border-surface/50 shadow-sm">
              <Eye className="w-4 h-4" />
              {t("product.details")}
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-sm leading-snug mb-1.5 line-clamp-2 text-foreground group-hover:text-accent transition-colors duration-200">
            {localizedName}
          </h3>
          <p className="text-xs text-muted line-clamp-2 mb-4 leading-relaxed">
            {localizedDescription}
          </p>
        </div>
      </Link>

      <div className="px-4 pb-4 flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <PriceDisplay
            price={product.price}
            className={`tabular-nums ${
              dealerDiscount ? "text-lg font-bold" : "text-lg font-bold text-accent"
            }`}
          />
          {needsPrintOption && (
            <span className="text-[11px] text-muted">{t("print.option_title")}</span>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          disabled={outOfStock}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-semibold transition-all duration-200 shrink-0 ${
            outOfStock
              ? "bg-stone-400 cursor-not-allowed opacity-60"
              : "bg-gradient-to-r from-sky-400 to-sky-600 hover:shadow-lg hover:shadow-sky-500/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {outOfStock ? t("product.out_of_stock") : t("product.add")}
          </span>
        </button>
      </div>

      {/* Mobile: view details button */}
      <div className="px-4 pb-4 md:hidden">
        <Link
          href={`/products/${product.slug}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-accent/30 text-accent text-xs font-semibold hover:bg-accent/5 transition-colors duration-200"
        >
          <Eye className="w-3.5 h-3.5" />
          {t("product.details")}
        </Link>
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
