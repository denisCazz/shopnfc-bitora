"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ProductGrid from "@/components/ProductGrid";
import Sidebar from "@/components/Sidebar";
import CategoryPills from "@/components/CategoryPills";
import type { Product } from "@/data/products";
import type { Category } from "@/data/categories";
import { useLocale } from "@/lib/locale-context";
import type { AuthUser } from "@/lib/auth";

function getCategoryName(cat: Category, locale: string): string {
  const key = `name_${locale}` as keyof Category;
  return (cat[key] as string) || cat.name_it || cat.name;
}

export default function CategoryPageClient({
  category,
  products,
  categories,
  user,
}: {
  category: Category;
  products: Product[];
  categories: Category[];
  user?: AuthUser | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { locale } = useLocale();
  const router = useRouter();
  const categoryName = getCategoryName(category, locale);

  function handleCategorySelect(slug: string | null) {
    if (slug) {
      router.push(`/categories/${slug}`);
    } else {
      router.push("/");
    }
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
          <span className="text-foreground font-medium truncate">{categoryName}</span>
        </nav>

        <h1 className="text-2xl font-bold text-foreground mb-2">{categoryName}</h1>
        <p className="text-muted text-sm mb-8">
          {products.length} prodott{products.length === 1 ? "o" : "i"} disponibil{products.length === 1 ? "e" : "i"}
        </p>

        <div className="lg:hidden mb-4">
          <CategoryPills
            activeCategory={category.slug}
            onSelect={(slug) => handleCategorySelect(slug)}
            categories={categories}
          />
        </div>

        <div className="flex gap-8">
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            activeCategory={category.slug}
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
