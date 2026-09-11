"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCart, cartLineId } from "@/lib/cart-context";
import { useLocale } from "@/lib/locale-context";
import { useCatalogDisplayPrice } from "@/lib/use-catalog-display-price";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalItems, totalPrice } = useCart();
  const { t } = useLocale();
  const { formatCatalogPrice } = useCatalogDisplayPrice();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full sm:max-w-md bg-surface shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-foreground">
              {t("cart.title")}{" "}
              {totalItems > 0 && (
                <span className="text-sm font-normal text-muted">
                  ({totalItems} {totalItems === 1 ? t("cart.item") : t("cart.items")})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-xl hover:bg-surface-hover transition-colors"
            aria-label="Chiudi carrello"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
            <div className="w-20 h-20 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
              <ShoppingBag className="w-9 h-9 text-muted/40" />
            </div>
            <p className="text-foreground font-semibold mb-1">{t("cart.empty")}</p>
            <p className="text-sm text-muted mb-6">{t("cart.empty.cta")}</p>
            <button
              onClick={closeCart}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-sky-500/25 transition-all"
            >
              {t("cart.continue")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={cartLineId(item)}
                  className="flex gap-3 bg-stone-50/60 dark:bg-stone-800/40 rounded-xl p-3 border border-border/50"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={closeCart}
                    className="relative w-20 h-20 rounded-lg bg-surface border border-border overflow-hidden shrink-0"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-muted/30">
                          {item.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="text-sm font-medium text-foreground line-clamp-2 hover:text-accent transition-colors"
                    >
                      {item.name}
                    </Link>
                    {item.lineNotes && (
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">{item.lineNotes}</p>
                    )}
                    <div className="text-accent font-bold text-sm mt-1">
                      {formatCatalogPrice(item.price)}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-0 border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => {
                            if (item.quantity <= 1) {
                              removeItem(item.id, item.lineKey);
                            } else {
                              updateQuantity(item.id, item.quantity - 1, item.lineKey);
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          aria-label="Diminuisci quantità"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-14 h-8 flex items-center justify-center text-sm font-medium border-x border-border bg-surface">
                          {item.quantity}
                          {item.lineKey === "unit:meter" ? " m" : ""}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.lineKey)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          aria-label="Aumenta quantità"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id, item.lineKey)}
                        className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        aria-label="Rimuovi prodotto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-5 py-4 space-y-3 bg-surface">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">{t("cart.subtotal")}</span>
                <span className="text-lg font-bold text-foreground">{formatCatalogPrice(totalPrice)}</span>
              </div>
              <p className="text-xs text-muted">{t("cart.shipping_note")}</p>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white font-semibold hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 block text-center"
              >
                {t("cart.checkout")}
              </Link>
              <button
                onClick={closeCart}
                className="w-full py-2.5 px-6 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-surface-hover transition-colors"
              >
                {t("cart.continue")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
