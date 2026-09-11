"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import Sidebar from "@/components/Sidebar";
import CategoryPills from "@/components/CategoryPills";
import { Cpu } from "lucide-react";
import type { Product } from "@/data/products";
import type { Category } from "@/data/categories";
import { useLocale } from "@/lib/locale-context";
import type { AuthUser } from "@/lib/auth";

interface StoveInfo {
  id: number;
  nameIt: string;
  nameEn: string | null;
  nameFr: string | null;
  nameEs: string | null;
  slug: string;
}

export default function StovePageClient({
  stove,
  products,
  categories,
  user,
}: {
  stove: StoveInfo;
  products: Product[];
  categories: Category[];
  user?: AuthUser | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { locale } = useLocale();
  const router = useRouter();

  const stoveName =
    (locale === "en" && stove.nameEn) ||
    (locale === "fr" && stove.nameFr) ||
    (locale === "es" && stove.nameEs) ||
    stove.nameIt;

  function handleCategorySelect(slug: string | null) {
    if (slug) router.push(`/categories/${slug}`);
    else router.push("/");
    setSidebarOpen(false);
  }

  return (
    <>
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        user={user}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-muted mb-6 overflow-x-auto scrollbar-none lowercase">
          <Link href="/" className="hover:text-accent transition-colors shrink-0">home</Link>
          <span className="text-border shrink-0">/</span>
          <span className="text-foreground font-medium truncate">{stoveName}</span>
        </nav>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center shrink-0">
            <Cpu className="w-4.5 h-4.5 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{stoveName}</h1>
        </div>
        <p className="text-muted text-sm mb-8 ml-12">
          {products.length} ricamb{products.length === 1 ? "io" : "i"} compatibil{products.length === 1 ? "e" : "i"}
        </p>

        <div className="lg:hidden mb-4">
          <CategoryPills
            activeCategory={null}
            onSelect={(slug) => handleCategorySelect(slug)}
            categories={categories}
          />
        </div>

        <div className="flex gap-8">
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            activeCategory={null}
            onSelect={handleCategorySelect}
            categories={categories}
            products={products}
          />
          <ProductGrid activeCategory={null} products={products} />
        </div>
      </main>
    </>
  );
}
