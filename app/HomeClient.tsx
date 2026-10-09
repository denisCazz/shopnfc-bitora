"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ProductGrid from "@/components/ProductGrid";
import CatalogToolbar from "@/components/CatalogToolbar";
import TrustBar from "@/components/TrustBar";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import PurchaseSteps from "@/components/PurchaseSteps";
import { useLocale } from "@/lib/locale-context";
import type { Product } from "@/data/products";
import type { Category } from "@/data/categories";
import type { AuthUser } from "@/lib/auth";
import type { ChipFilter } from "@/lib/types";

export type { ChipFilter };

export default function HomeClient({
  products,
  categories,
  user,
  chips = [],
}: {
  products: Product[];
  categories: Category[];
  user: AuthUser | null;
  chips?: ChipFilter[];
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeChipId, setActiveChipId] = useState<number | null>(null);
  const { t } = useLocale();

  function selectCategory(slug: string | null) {
    setActiveCategory(slug);
    setActiveChipId(null);
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-background">
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        user={user}
      />
      <Hero />
      <TrustBar />

      <main id="prodotti" className="flex-1 max-w-[1200px] mx-auto w-full px-5 md:px-8 pt-7 pb-14 scroll-mt-16">
        <div className="mb-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t("grid.title")}</h2>
          <p className="hidden text-sm text-muted sm:block">{t("home.catalog_sub")}</p>
        </div>
        <CatalogToolbar
          categories={categories}
          products={products}
          chips={chips}
          activeCategory={activeCategory}
          activeChipId={activeChipId}
          onSelectCategory={selectCategory}
          onSelectChip={(id) => { setActiveChipId(id); setActiveCategory(null); }}
        />
        <Sidebar
          mobileOnly
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeCategory={activeCategory}
          onSelect={selectCategory}
          categories={categories}
          products={products}
          chips={chips}
          activeChipId={activeChipId}
          onSelectChip={(id) => { setActiveChipId(id); setActiveCategory(null); }}
        />
        <div className="pt-5">
          <ProductGrid activeCategory={activeCategory} activeChipId={activeChipId} products={products} />
        </div>
      </main>

      <PurchaseSteps />

      <Footer />
    </div>
  );
}
