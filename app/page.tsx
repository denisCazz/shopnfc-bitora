import HomeClient from "./HomeClient";
import { getProducts } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import { getUser } from "@/lib/auth";
import { getDb } from "@/db";
import { chips, productChips } from "@/db/schema";
import { eq } from "drizzle-orm";
import { buildPageMetadata, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

export const revalidate = 300;

export const metadata = buildPageMetadata({
  title: "Shop NFC | Tag, card e lettori NFC per aziende",
  description:
    "Catalogo NFC Bitora: sticker, tessere, braccialetti, tag industriali, gadget e lettori. Programmazione inclusa. Spedizione soggetta a disponibilità, solitamente entro 7 giorni.",
  path: "/",
});

export default async function HomePage() {
  const db = getDb();
  const [{ products: dbProducts }, dbCategories, user, dbChips, dbProductChips] = await Promise.all([
    getProducts(),
    getCategories(),
    getUser(),
    db.select({ id: chips.id, nameIt: chips.nameIt, nameEn: chips.nameEn, nameFr: chips.nameFr, nameEs: chips.nameEs }).from(chips).where(eq(chips.active, true)),
    db.select({ productId: productChips.productId, chipId: productChips.chipId }).from(productChips),
  ]);

  const productChipMap: Record<number, number[]> = {};
  for (const ps of dbProductChips) {
    if (!productChipMap[ps.chipId]) productChipMap[ps.chipId] = [];
    productChipMap[ps.chipId].push(ps.productId);
  }

  const productToChips: Record<number, number[]> = {};
  for (const ps of dbProductChips) {
    if (!productToChips[ps.productId]) productToChips[ps.productId] = [];
    productToChips[ps.productId].push(ps.chipId);
  }

  // Map to the shape components expect
  const products = dbProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.descriptionShort || p.description,
    price: p.price,
    category: p.category,
    categorySlug: p.categorySlug,
    image: p.image,
    weight: p.weight,
    stockQuantity: p.stockQuantity,
    minQuantity: p.minQuantity,
    name_it: p.name_it,
    name_en: p.name_en,
    name_fr: p.name_fr,
    name_es: p.name_es,
    description_it: p.descriptionShort_it || p.description_it,
    description_en: p.descriptionShort_en || p.description_en,
    description_fr: p.descriptionShort_fr || p.description_fr,
    description_es: p.descriptionShort_es || p.description_es,
    compatibleChipIds: productToChips[p.id] || [],
  }));

  const categories = dbCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon || "Package",
    name_it: c.name_it,
    name_en: c.name_en,
    name_fr: c.name_fr,
    name_es: c.name_es,
  }));

  const chipList = dbChips.map((s) => ({
    id: s.id,
    nameIt: s.nameIt,
    nameEn: s.nameEn,
    nameFr: s.nameFr,
    nameEs: s.nameEs,
    productCount: (productChipMap[s.id] || []).length,
  }));

  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <HomeClient products={products} categories={categories} user={user} chips={chipList} />
    </>
  );
}
