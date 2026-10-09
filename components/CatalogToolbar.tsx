"use client";

import type { Category } from "@/data/categories";
import type { Product } from "@/data/products";
import type { ChipFilter } from "@/lib/types";
import { useLocale } from "@/lib/locale-context";

function categoryName(cat: Category, locale: string): string {
  return (cat[`name_${locale}` as keyof Category] as string) || cat.name_it || cat.name;
}

export default function CatalogToolbar({
  categories,
  products,
  chips,
  activeCategory,
  activeChipId,
  onSelectCategory,
  onSelectChip,
}: {
  categories: Category[];
  products: Product[];
  chips: ChipFilter[];
  activeCategory: string | null;
  activeChipId: number | null;
  onSelectCategory: (slug: string | null) => void;
  onSelectChip: (id: number | null) => void;
}) {
  const { t, locale } = useLocale();
  const withProducts = categories.filter((c) => products.some((p) => p.categorySlug === c.slug));

  const pill = (active: boolean) =>
    `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      active
        ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
        : "border border-border bg-surface text-foreground hover:border-slate-400"
    }`;

  return (
    <div className="sticky top-16 z-30 -mx-5 border-b border-border bg-background/95 px-5 py-3 backdrop-blur-md sm:top-[72px] md:-mx-8 md:px-8">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto scrollbar-none">
          <button type="button" onClick={() => onSelectCategory(null)} className={pill(!activeCategory)}>
            {t("categories.all")}
          </button>
          {withProducts.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(activeCategory === cat.slug ? null : cat.slug)}
              className={pill(activeCategory === cat.slug)}
            >
              {categoryName(cat, locale)}
            </button>
          ))}
        </div>
        {chips.length > 0 && (
          <select
            value={activeChipId ?? ""}
            onChange={(e) => onSelectChip(e.target.value === "" ? null : Number(e.target.value))}
            aria-label={t("sidebar.filter_by_stove")}
            className="hidden shrink-0 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground md:block"
          >
            <option value="">{t("sidebar.filter_by_stove")}</option>
            {chips.map((chip) => (
              <option key={chip.id} value={chip.id}>
                {(locale === "en" && chip.nameEn) ||
                  (locale === "fr" && chip.nameFr) ||
                  (locale === "es" && chip.nameEs) ||
                  chip.nameIt}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
