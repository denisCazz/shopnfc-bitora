"use client";

import type { Category } from "@/data/categories";
import {
  Cog, Wind, Fan, Zap, Monitor, Cpu, Flame,
  Thermometer, CircleDot, RotateCw, Home, Package, Gauge, Wrench,
} from "lucide-react";
import { useLocale } from "@/lib/locale-context";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Cog, Wind, Fan, Zap, Monitor, Cpu, Flame,
  Thermometer, CircleDot, RotateCw, Home, Package, Gauge, Wrench,
};

function getCategoryName(cat: Category, locale: string): string {
  const key = `name_${locale}` as keyof Category;
  return (cat[key] as string) || cat.name_it || cat.name;
}

export default function CategoryPills({
  activeCategory,
  onSelect,
  categories,
}: {
  activeCategory: string | null;
  onSelect: (slug: string | null) => void;
  categories: Category[];
}) {
  const { t, locale } = useLocale();
  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-none">
      <div className="flex gap-2 min-w-max px-4 lg:px-0 lg:flex-wrap">
        <button
          onClick={() => onSelect(null)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
            activeCategory === null
              ? "bg-accent text-white shadow-md shadow-accent/20"
              : "bg-surface border border-border text-muted hover:bg-surface-hover hover:text-foreground hover:border-border-hover"
          }`}
        >
          {t("categories.all")}
        </button>
        {categories.map((cat) => {
          const Icon = cat.icon ? iconMap[cat.icon] : undefined;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(activeCategory === cat.slug ? null : cat.slug)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat.slug
                  ? "bg-accent text-white shadow-md shadow-accent/20"
                  : "bg-surface border border-border text-muted hover:bg-surface-hover hover:text-foreground hover:border-border-hover"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {getCategoryName(cat, locale)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
