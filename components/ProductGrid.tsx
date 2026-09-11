"use client";

import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import type { Product } from "@/data/products";
import { PackageOpen, ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

const PAGE_SIZE = 9;

export default function ProductGrid({
  activeCategory,
  activeStoveId,
  products,
}: {
  activeCategory: string | null;
  activeStoveId?: number | null;
  products: Product[];
}) {
  const { t } = useLocale();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory, activeStoveId]);

  let filtered = activeCategory
    ? products.filter((p) => p.categorySlug === activeCategory)
    : products;

  if (activeStoveId != null) {
    filtered = filtered.filter((p) => p.compatibleStoveIds?.includes(activeStoveId));
  }

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("grid.title")}</h2>
          <p className="text-sm text-muted mt-1">
            {filtered.length} {filtered.length === 1 ? t("cart.item") : t("cart.items")}{" "}
            {activeCategory ? t("grid.in_category") : t("grid.available")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border bg-surface text-sm font-medium text-foreground hover:bg-stone-50 dark:hover:bg-stone-800/50 hover:border-accent/30 transition-colors duration-200 shadow-sm"
          >
            <ChevronDown className="w-4 h-4" />
            {t("grid.load_more")}
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-border flex items-center justify-center">
            <PackageOpen className="w-7 h-7 text-muted/40" />
          </div>
          <p className="text-foreground text-lg font-medium">
            {t("grid.empty")}
          </p>
          <p className="text-muted text-sm mt-2">
            {t("grid.empty.hint")}
          </p>
        </div>
      )}
    </div>
  );
}
