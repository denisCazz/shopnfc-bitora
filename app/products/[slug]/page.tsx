import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products, productChips, chips } from "@/db/schema";
import { getUser } from "@/lib/auth";
import Footer from "@/components/Footer";
import ProductDetailClient from "./ProductDetailClient";
import AddToCartButton from "@/components/AddToCartButton";
import ElectronicBoardCartSection from "@/components/ElectronicBoardCartSection";
import PrintOptionsCartSection from "@/components/PrintOptionsCartSection";
import { productNeedsBoardProgrammingOption } from "@/lib/product-board-options";
import { productNeedsPrintOption } from "@/lib/print-options";
import { getPrintConfig } from "@/lib/print-options-server";
import PriceDisplay from "@/components/PriceDisplay";
import ProductVatLabel from "@/components/ProductVatLabel";
import TranslatedText from "@/components/TranslatedText";
import LocalizedText from "@/components/LocalizedText";
import ProductImageCarousel from "@/components/ProductImageCarousel";
import { SITE } from "@/lib/site";
import { buildPageMetadata, breadcrumbJsonLd, productJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

export async function generateStaticParams() {
  const db = getDb();
  const rows = await db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.active, true));
  return rows.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Prodotto non trovato" };
  const title = product.metaTitle?.trim() || product.name;
  const description =
    product.metaDescription?.trim() ||
    product.descriptionShort ||
    product.description ||
    `${product.name} — tag NFC per aziende su Shop NFC.`;
  return buildPageMetadata({
    title,
    description,
    path: `/products/${slug}`,
    image: product.image,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, user, categories, compatibleStoves, printConfig] = await Promise.all([
    getRelatedProducts(product.id, product.categoryId, 4),
    getUser(),
    getCategories(),
    getDb()
      .select({ id: chips.id, nameIt: chips.nameIt, nameEn: chips.nameEn, nameFr: chips.nameFr, nameEs: chips.nameEs, slug: chips.slug })
      .from(productChips)
      .innerJoin(chips, eq(productChips.chipId, chips.id))
      .where(eq(productChips.productId, product.id)),
    getPrintConfig(),
  ]);

  const productName = product.name_it || product.name;
  const productDescription = product.descriptionShort || product.description;

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: product.category, path: `/categories/${product.categorySlug}` },
            { name: productName, path: `/products/${product.slug}` },
          ]),
          productJsonLd({
            name: productName,
            description: productDescription,
            slug: product.slug,
            image: product.image,
            sku: product.sku,
            ean13: product.ean13,
            brand: product.brand,
            price: product.price,
            inStock: product.stockQuantity > 0,
            categoryName: product.category,
          }),
        ]}
      />
      <ProductDetailClient user={user} categories={categories}>
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-muted mb-6 overflow-x-auto scrollbar-none lowercase">
            <Link href="/" className="hover:text-accent transition-colors shrink-0"><TranslatedText k="breadcrumb.home" /></Link>
            <span className="text-border shrink-0">/</span>
            <Link href={`/categories/${product.categorySlug}`} className="hover:text-accent transition-colors shrink-0">
              <TranslatedText k={`cat.${product.categorySlug}`} />
            </Link>
            <span className="text-border shrink-0">/</span>
            <span className="text-foreground font-medium truncate">
              <LocalizedText
                it={product.name_it}
                en={product.name_en}
                fr={product.name_fr}
                es={product.name_es}
                fallback={product.name}
              />
            </span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Images */}
            <div>
              {product.images.length > 0 ? (
                <ProductImageCarousel
                  images={product.images}
                  productName={product.name}
                />
              ) : (
                <div className="relative aspect-square bg-gradient-to-br from-stone-50 to-sky-50/30 rounded-2xl border border-border overflow-hidden">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain p-8"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold text-muted/20">{product.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
              )}
              {(product.images.length > 0 || product.image) && (
                <TranslatedText
                  k="product.image_disclaimer"
                  as="p"
                  className="mt-3 text-xs text-muted leading-relaxed"
                />
              )}
            </div>

            {/* Info */}
            <div>
              <span className="inline-block px-3 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-accent text-xs font-medium mb-3">
                <TranslatedText k={`cat.${product.categorySlug}`} />
              </span>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                <LocalizedText
                  it={product.name_it}
                  en={product.name_en}
                  fr={product.name_fr}
                  es={product.name_es}
                  fallback={product.name}
                />
              </h1>
              {product.sku && product.sku.trim().toLowerCase() !== "null" && product.sku.trim() !== "" && (
                <p className="text-xs text-muted mb-3">SKU: <span className="font-mono">{product.sku.trim()}</span></p>
              )}
              <p className="text-muted leading-relaxed mb-6 whitespace-pre-line">
                <LocalizedText
                  it={product.description_it || product.descriptionShort_it}
                  en={product.description_en || product.descriptionShort_en}
                  fr={product.description_fr || product.descriptionShort_fr}
                  es={product.description_es || product.descriptionShort_es}
                  fallback={product.description || product.descriptionShort}
                />
              </p>

              <div className="border-t border-border pt-6 mb-6">
                <div className="text-3xl font-bold text-accent mb-1">
                  <PriceDisplay price={product.price} />
                </div>
                <ProductVatLabel
                  minQuantity={product.minQuantity}
                  sku={product.sku}
                  slug={product.slug}
                  name={product.name_it || product.name}
                />
              </div>

              <div className="w-full">
                {productNeedsBoardProgrammingOption({
                  categorySlug: product.categorySlug,
                  name_it: product.name_it || product.name,
                }) ? (
                  <ElectronicBoardCartSection
                    showBuyNow
                    compatibleStoves={compatibleStoves}
                    product={{
                      id: product.id,
                      name: product.name,
                      name_it: product.name_it,
                      name_en: product.name_en,
                      name_fr: product.name_fr,
                      name_es: product.name_es,
                      sku: product.sku,
                      slug: product.slug,
                      price: product.price,
                      image: product.image,
                      weight: product.weight,
                      stockQuantity: product.stockQuantity,
                      minQuantity: product.minQuantity,
                    }}
                  />
                ) : productNeedsPrintOption({ categorySlug: product.categorySlug }) ? (
                  <PrintOptionsCartSection
                    showBuyNow
                    printPrices={printConfig.prices}
                    product={{
                      id: product.id,
                      name: product.name,
                      name_it: product.name_it,
                      name_en: product.name_en,
                      name_fr: product.name_fr,
                      name_es: product.name_es,
                      sku: product.sku,
                      slug: product.slug,
                      price: product.price,
                      image: product.image,
                      weight: product.weight,
                      stockQuantity: product.stockQuantity,
                      minQuantity: product.minQuantity,
                    }}
                  />
                ) : (
                  <AddToCartButton
                    showBuyNow
                    product={{
                      id: product.id,
                      name: product.name,
                      name_it: product.name_it,
                      name_en: product.name_en,
                      name_fr: product.name_fr,
                      name_es: product.name_es,
                      sku: product.sku,
                      slug: product.slug,
                      categorySlug: product.categorySlug,
                      price: product.price,
                      image: product.image,
                      weight: product.weight,
                      stockQuantity: product.stockQuantity,
                      minQuantity: product.minQuantity,
                    }}
                  />
                )}
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted">
                  <span className={`w-2 h-2 rounded-full ${product.stockQuantity > 0 ? "bg-green-500" : "bg-red-500"}`} />
                  {product.stockQuantity > 0 ? (
                    <span>
                      <TranslatedText k="product.available" />
                      {" · "}
                      <a href={`tel:${SITE.phoneTel}`} className="text-accent hover:underline">
                        {SITE.phone}
                      </a>
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 font-medium">Esaurito</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <TranslatedText k={product.categorySlug === "resistenze-accensione" ? "product.warranty_ignition" : "product.warranty"} />
                </div>
              </div>

              {compatibleStoves.length > 0 && (
                <div className="mt-6 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/40 rounded-xl p-4">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Chip compatibili</p>
                  <div className="flex flex-wrap gap-2">
                    {compatibleStoves.map((s) => (
                      <Link
                        key={s.id}
                        href={`/chip/${s.slug}`}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-background border border-border text-sm text-foreground hover:border-accent/40 transition-colors"
                      >
                        <LocalizedText it={s.nameIt} en={s.nameEn ?? undefined} fr={s.nameFr ?? undefined} es={s.nameEs ?? undefined} fallback={s.nameIt} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {related.length > 0 && (
            <section className="mt-16">
              <TranslatedText k="product.related" as="h2" className="text-xl font-bold text-foreground mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {related.map((rp) => (
                  <Link
                    key={rp.id}
                    href={`/products/${rp.slug}`}
                    className="group bg-surface border border-border rounded-2xl overflow-hidden hover:border-accent/30 hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300"
                  >
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-stone-50 to-sky-50/30">
                      {rp.image ? (
                        <Image
                          src={rp.image}
                          alt={rp.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 25vw"
                          className="object-contain p-4"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-muted/20">{rp.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                        <LocalizedText
                          it={rp.name_it}
                          en={rp.name_en}
                          fr={rp.name_fr}
                          es={rp.name_es}
                          fallback={rp.name}
                        />
                      </h3>
                      <PriceDisplay price={rp.price} className="text-accent font-bold text-sm mt-1 block" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </ProductDetailClient>
      <Footer />
    </div>
  );
}
