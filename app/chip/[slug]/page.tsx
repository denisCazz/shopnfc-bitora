import { notFound } from "next/navigation";
import { eq, asc, getTableColumns } from "drizzle-orm";
import { getDb } from "@/db";
import { chips, productChips, products, categories, productImages } from "@/db/schema";
import { getCategories } from "@/lib/categories";
import { getUser } from "@/lib/auth";
import Footer from "@/components/Footer";
import ChipPageClient from "./ChipPageClient";
import { retailFromCatalog } from "@/lib/pricing";
import { getPricingConfig } from "@/lib/pricing-server";
import { minQuantityForProduct } from "@/lib/min-quantity";
import { buildPageMetadata, breadcrumbJsonLd, chipPageJsonLd } from "@/lib/seo";
import { getChipSeo } from "@/lib/seo-content";
import JsonLd from "@/components/JsonLd";

export async function generateStaticParams() {
  const db = getDb();
  const rows = await db
    .select({ slug: chips.slug })
    .from(chips)
    .where(eq(chips.active, true));
  return rows.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const [chip] = await db
    .select({ nameIt: chips.nameIt })
    .from(chips)
    .where(eq(chips.slug, slug))
    .limit(1);
  if (!chip) return { title: "Chip non trovato" };
  const seo = getChipSeo(slug);
  return buildPageMetadata({
    title: seo?.title || `Prodotti con chip ${chip.nameIt}`,
    description:
      seo?.metaDescription ||
      `Tag, card e gadget NFC con chip ${chip.nameIt}. Catalogo B2B Shop NFC Bitora.`,
    path: `/chip/${slug}`,
  });
}

export default async function ChipPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getDb();
  const p = getTableColumns(products);

  const [chipRow] = await db
    .select()
    .from(chips)
    .where(eq(chips.slug, slug))
    .limit(1);

  if (!chipRow) notFound();

  const [allCategories, user, productRows] = await Promise.all([
    getCategories(),
    getUser(),
    db
      .select({
        ...p,
        catName: categories.nameIt,
        catSlug: categories.slug,
      })
      .from(productChips)
      .innerJoin(products, eq(productChips.productId, products.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(productChips.chipId, chipRow.id))
      .orderBy(asc(products.id)),
  ]);

  const ids = productRows.map((r) => r.id);
  const imgMap = new Map<number, { id: number; image_url: string; sort_order: number; alt_text: string | null }[]>();
  if (ids.length) {
    const { inArray } = await import("drizzle-orm");
    const imgs = await db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, ids));
    for (const i of imgs) {
      const list = imgMap.get(i.productId) || [];
      list.push({ id: i.id, image_url: i.imageUrl, sort_order: i.sortOrder, alt_text: i.altText });
      imgMap.set(i.productId, list);
    }
    for (const list of imgMap.values()) list.sort((a, b) => a.sort_order - b.sort_order);
  }

  const { markup } = await getPricingConfig();
  const mappedProducts = productRows.map(({ catName, catSlug, ...r }) => ({
    id: r.id,
    name: r.nameIt,
    slug: r.slug,
    description: r.descriptionShortIt || r.descriptionIt || "",
    price: retailFromCatalog(Number(r.catalogPrice ?? r.price), markup),
    category: catName,
    categorySlug: catSlug,
    image: imgMap.get(r.id)?.[0]?.image_url ?? null,
    weight: r.weight ? Number(r.weight) : null,
    stockQuantity: r.stockQuantity,
    minQuantity: minQuantityForProduct(r.minQuantity, {
      sku: r.sku,
      slug: r.slug,
      nameIt: r.nameIt,
      nameEn: r.nameEn,
    }),
    name_it: r.nameIt ?? undefined,
    name_en: r.nameEn ?? undefined,
    name_fr: r.nameFr ?? undefined,
    name_es: r.nameEs ?? undefined,
    description_it: r.descriptionShortIt || r.descriptionIt || undefined,
    description_en: r.descriptionShortEn || r.descriptionEn || undefined,
    description_fr: r.descriptionShortFr || r.descriptionFr || undefined,
    description_es: r.descriptionShortEs || r.descriptionEs || undefined,
  }));

  const mappedCategories = allCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon || "Package",
    name_it: c.name_it,
    name_en: c.name_en,
    name_fr: c.name_fr,
    name_es: c.name_es,
  }));

  const seo = getChipSeo(slug);
  const chipName = chipRow.nameIt;

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Tag NFC", path: "/tag-nfc" },
            { name: chipName, path: `/chip/${slug}` },
          ]),
          chipPageJsonLd({
            name: chipName,
            description: seo?.metaDescription || `Prodotti con chip ${chipName}`,
            slug,
            products: mappedProducts.map((p) => ({ name: p.name, slug: p.slug })),
          }),
        ]}
      />
      <ChipPageClient
        chip={{
          id: chipRow.id,
          nameIt: chipRow.nameIt,
          nameEn: chipRow.nameEn,
          nameFr: chipRow.nameFr,
          nameEs: chipRow.nameEs,
          slug: chipRow.slug,
        }}
        products={mappedProducts}
        categories={mappedCategories}
        user={user}
        seoContent={seo}
      />
      <Footer />
    </div>
  );
}
