"use client";

import { useState } from "react";
import { ShoppingCart, Check, Zap, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useLocale } from "@/lib/locale-context";
import { useUser } from "@/lib/user-context";
import { normalizeMinQuantity } from "@/lib/min-quantity";
import QuantityStepper from "@/components/QuantityStepper";

type StoveRow = {
  id: number;
  nameIt: string;
  nameEn: string | null;
  nameFr: string | null;
  nameEs: string | null;
};

export default function ElectronicBoardCartSection({
  product,
  compatibleStoves,
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
    price: number;
    image: string | null;
    weight?: number | null;
    stockQuantity?: number;
    minQuantity?: number;
  };
  compatibleStoves: StoveRow[];
  showBuyNow?: boolean;
}) {
  const { addItem } = useCart();
  const { t, locale } = useLocale();
  const { dealerDiscount } = useUser();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const hasStoves = compatibleStoves.length > 0;
  const [variant, setVariant] = useState<"programmed" | "virgin">("programmed");
  const [stoveId, setStoveId] = useState<number | "">("");
  const [stoveText, setStoveText] = useState("");
  const [displayText, setDisplayText] = useState("");
  const minQuantity = normalizeMinQuantity(product.minQuantity);
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

  function stoveLabel(s: StoveRow): string {
    switch (locale) {
      case "en":
        return s.nameEn?.trim() || s.nameIt;
      case "fr":
        return s.nameFr?.trim() || s.nameIt;
      case "es":
        return s.nameEs?.trim() || s.nameIt;
      default:
        return s.nameIt;
    }
  }

  function buildLine(): { lineKey: string; lineNotes: string } | null {
    if (variant === "virgin") {
      return {
        lineKey: "board:virgin",
        lineNotes: t("product.board_option_notes_virgin"),
      };
    }
    // variant === "programmed"
    const display = displayText.trim();
    if (!display) return null;
    const displayNote = "\n" + t("product.board_option_notes_display").replace("{display}", display);
    const displayKey = `:disp:${display.toLowerCase().slice(0, 40)}`;
    if (hasStoves) {
      if (!stoveId) return null;
      const s = compatibleStoves.find((x) => x.id === stoveId);
      if (!s) return null;
      return {
        lineKey: `board:prog:${stoveId}${displayKey}`,
        lineNotes:
          t("product.board_option_notes_programmed").replace("{stove}", stoveLabel(s)) + displayNote,
      };
    } else {
      // no stoves list: free text
      const label = stoveText.trim();
      if (!label) return null;
      return {
        lineKey: `board:prog:custom${displayKey}`,
        lineNotes:
          t("product.board_option_notes_programmed").replace("{stove}", label) + displayNote,
      };
    }
  }

  function handleAddToCart() {
    if (outOfStock) return;
    const line = buildLine();
    if (!line) return;
    addItem({
      ...product,
      name: localizedName,
      price: finalPrice,
      minQuantity,
      lineKey: line.lineKey,
      lineNotes: line.lineNotes,
    }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    if (outOfStock) return;
    const line = buildLine();
    if (!line) return;
    addItem({
      ...product,
      name: localizedName,
      price: finalPrice,
      minQuantity,
      lineKey: line.lineKey,
      lineNotes: line.lineNotes,
    }, quantity);
    router.push("/checkout");
  }

  const needsStove = variant === "programmed" && hasStoves;
  const needsStoveText = variant === "programmed" && !hasStoves;
  const needsDisplay = variant === "programmed";
  const canAdd =
    variant === "virgin" ||
    (hasStoves ? stoveId !== "" : stoveText.trim() !== "") && displayText.trim() !== "";

  if (outOfStock) {
    return (
      <button
        type="button"
        disabled
        className="flex-1 py-3 px-6 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-semibold cursor-not-allowed flex items-center justify-center gap-2"
      >
        {t("product.out_of_stock")}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">{t("product.board_option_title")}</p>
        <div className="space-y-2">
          <label className="flex items-start gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="board_variant"
              className="mt-1"
              checked={variant === "programmed"}
              onChange={() => setVariant("programmed")}
            />
            <span>
              <span className="font-medium text-foreground">{t("product.board_option_programmed")}</span>
              <span className="block text-muted text-xs mt-0.5">{t("product.board_option_programmed_hint")}</span>
            </span>
          </label>
          {variant === "programmed" && hasStoves && (
            <div className="pl-6 pt-1">
              <label htmlFor="board_stove" className="block text-xs font-medium text-muted mb-1">
                {t("product.board_option_stove_label")}
              </label>
              <select
                id="board_stove"
                value={stoveId}
                onChange={(e) => setStoveId(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
              >
                <option value="">{t("product.board_option_stove_placeholder")}</option>
                {compatibleStoves.map((s) => (
                  <option key={s.id} value={s.id}>
                    {stoveLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          )}
          {variant === "programmed" && !hasStoves && (
            <div className="pl-6 pt-1">
              <label htmlFor="board_stove_text" className="block text-xs font-medium text-muted mb-1">
                {t("product.board_option_stove_label")}
              </label>
              <input
                id="board_stove_text"
                type="text"
                value={stoveText}
                onChange={(e) => setStoveText(e.target.value)}
                placeholder={t("product.board_option_stove_placeholder")}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted"
              />
            </div>
          )}
          {variant === "programmed" && (
            <div className="pl-6 pt-1">
              <label htmlFor="board_display_text" className="block text-xs font-medium text-muted mb-1">
                {t("product.board_option_display_label")}
              </label>
              <input
                id="board_display_text"
                type="text"
                value={displayText}
                onChange={(e) => setDisplayText(e.target.value)}
                placeholder={t("product.board_option_display_placeholder")}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted"
              />
              <span className="block text-muted text-xs mt-1">{t("product.board_option_display_hint")}</span>
            </div>
          )}
          <label className="flex items-start gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="board_variant"
              className="mt-1"
              checked={variant === "virgin"}
              onChange={() => {
                setVariant("virgin");
                setStoveId("");
                setStoveText("");
                setDisplayText("");
              }}
            />
            <span>
              <span className="font-medium text-foreground">{t("product.board_option_virgin")}</span>
              <span className="block text-muted text-xs mt-0.5">{t("product.board_option_virgin_hint")}</span>
            </span>
          </label>
        </div>
        {(needsStove && !stoveId) || (needsStoveText && !stoveText.trim()) ? (
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {t("product.board_option_stove_required")}
          </div>
        ) : null}
        {needsDisplay && !displayText.trim() && (hasStoves ? stoveId !== "" : stoveText.trim() !== "") ? (
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {t("product.board_option_display_required")}
          </div>
        ) : null}
      </div>

      <div className="w-full p-3 rounded-xl border border-border bg-surface/70 space-y-1">
        <QuantityStepper
          value={quantity}
          min={minQuantity}
          onChange={setQuantity}
          unit="pz"
          label={t("product.qty_label")}
        />
        <p className="text-xs text-muted">
          {t("product.min_qty").replace("{qty}", String(minQuantity))}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAdd}
          className={`flex-1 py-3 px-6 rounded-xl border-2 font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-2 ${
            added
              ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400"
              : "border-accent text-accent hover:bg-sky-50 dark:hover:bg-sky-950/20"
          } ${!canAdd ? "opacity-50 pointer-events-none" : ""}`}
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
            disabled={!canAdd}
            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white font-semibold hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Zap className="w-5 h-5" />
            {t("product.buy_now")}
          </button>
        )}
      </div>
    </div>
  );
}
