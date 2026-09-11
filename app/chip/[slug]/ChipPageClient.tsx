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
import type { ChipSeoContent } from "@/lib/seo-content";

interface ChipInfo {
  id: number;
  nameIt: string;
  nameEn: string | null;
  nameFr: string | null;
  nameEs: string | null;
  slug: string;
}

export default function ChipPageClient({
  chip,
  products,
  categories,
  user,
  seoContent,
}: {
  chip: ChipInfo;
  products: Product[];
  categories: Category[];
  user?: AuthUser | null;
  seoContent?: ChipSeoContent | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { locale } = useLocale();
  const router = useRouter();

  const chipName =
    (locale === "en" && chip.nameEn) ||
    (locale === "fr" && chip.nameFr) ||
    (locale === "es" && chip.nameEs) ||
    chip.nameIt;

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
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-muted mb-6 overflow-x-auto scrollbar-none lowercase">
          <Link href="/" className="hover:text-accent transition-colors shrink-0">home</Link>
          <span className="text-border shrink-0">/</span>
          <Link href="/tag-nfc" className="hover:text-accent transition-colors shrink-0">tag nfc</Link>
          <span className="text-border shrink-0">/</span>
          <span className="text-foreground font-medium truncate">{chipName}</span>
        </nav>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center shrink-0">
            <Cpu className="w-4.5 h-4.5 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{chipName}</h1>
        </div>
        <p className="text-muted text-sm mb-8 ml-12">
          {products.length} prodott{products.length === 1 ? "o" : "i"} con questo chip
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
          <div className="flex-1 min-w-0">
            <ProductGrid activeCategory={null} products={products} />

            {seoContent && (
              <section className="mt-16 border-t border-border pt-12 space-y-8 text-sm text-muted leading-relaxed">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-3">Informazioni sul chip</h2>
                  <p>{seoContent.intro}</p>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-3">Specifiche tecniche</h2>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {seoContent.specs.map((spec) => (
                      <div key={spec.label} className="bg-surface border border-border rounded-lg px-4 py-3">
                        <dt className="text-xs font-medium text-foreground">{spec.label}</dt>
                        <dd className="mt-0.5">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-3">Casi d&apos;uso</h2>
                  <ul className="list-disc pl-5 space-y-1.5">
                    {seoContent.useCases.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                {seoContent.compatibleCategories.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-3">Categorie correlate</h2>
                    <ul className="flex flex-wrap gap-3">
                      {seoContent.compatibleCategories.map((catSlug) => (
                        <li key={catSlug}>
                          <Link href={`/categories/${catSlug}`} className="text-accent hover:underline">
                            {catSlug.replace(/-/g, " ")}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
