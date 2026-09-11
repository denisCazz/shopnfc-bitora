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
import type { CategorySeoContent } from "@/lib/seo-content";
import SeoContentBlock from "@/components/SeoContentBlock";

function getCategoryName(cat: Category, locale: string): string {
  const key = `name_${locale}` as keyof Category;
  return (cat[key] as string) || cat.name_it || cat.name;
}

const RELATED_LABELS: Record<string, string> = {
  "tag-nfc-personalizzati": "Tag NFC personalizzati",
  "sticker-nfc": "Sticker NFC",
  "tessere-nfc": "Tessere NFC",
  "braccialetti-nfc": "Braccialetti NFC",
  "tag-industriali": "Tag industriali",
  "tag-schermati": "Tag schermati",
  "gadget-nfc": "Gadget NFC",
  "lettori-nfc": "Lettori NFC",
  "soluzioni-nfc": "Soluzioni NFC",
  ntag213: "Chip NTAG213",
};

export default function CategoryPageClient({
  category,
  products,
  categories,
  user,
  seoContent,
}: {
  category: Category;
  products: Product[];
  categories: Category[];
  user?: AuthUser | null;
  seoContent?: CategorySeoContent | null;
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
            useLinks
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
          <div className="flex-1 min-w-0">
            <ProductGrid activeCategory={null} products={products} />
            {seoContent && (
              <SeoContentBlock
                intro={seoContent.intro}
                guideTitle={seoContent.guideTitle}
                guide={seoContent.guide}
                applicationsTitle={seoContent.applicationsTitle}
                applications={seoContent.applications}
                faq={seoContent.faq}
                relatedLinks={seoContent.relatedSlugs.map((s) => ({
                  href: s === "tag-nfc-personalizzati" ? "/tag-nfc-personalizzati" : s.startsWith("ntag") ? `/chip/${s}` : `/categories/${s}`,
                  label: RELATED_LABELS[s] || s,
                }))}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
