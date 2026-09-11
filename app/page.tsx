import HomeClient from "./HomeClient";
import { getProducts } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import { getUser } from "@/lib/auth";
import { getDb } from "@/db";
import { stoves, productStoves } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = getDb();
  const [{ products: dbProducts }, dbCategories, user, dbStoves, dbProductStoves] = await Promise.all([
    getProducts(),
    getCategories(),
    getUser(),
    db.select({ id: stoves.id, nameIt: stoves.nameIt, nameEn: stoves.nameEn, nameFr: stoves.nameFr, nameEs: stoves.nameEs }).from(stoves).where(eq(stoves.active, true)),
    db.select({ productId: productStoves.productId, stoveId: productStoves.stoveId }).from(productStoves),
  ]);

  // Build stoveId → productIds map for counting
  const productStoveMap: Record<number, number[]> = {};
  for (const ps of dbProductStoves) {
    if (!productStoveMap[ps.stoveId]) productStoveMap[ps.stoveId] = [];
    productStoveMap[ps.stoveId].push(ps.productId);
  }

  // Build productId → stoveIds map
  const productToStoves: Record<number, number[]> = {};
  for (const ps of dbProductStoves) {
    if (!productToStoves[ps.productId]) productToStoves[ps.productId] = [];
    productToStoves[ps.productId].push(ps.stoveId);
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
    name_it: p.name_it,
    name_en: p.name_en,
    name_fr: p.name_fr,
    name_es: p.name_es,
    description_it: p.descriptionShort_it || p.description_it,
    description_en: p.descriptionShort_en || p.description_en,
    description_fr: p.descriptionShort_fr || p.description_fr,
    description_es: p.descriptionShort_es || p.description_es,
    compatibleStoveIds: productToStoves[p.id] || [],
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

  const stoveList = dbStoves.map((s) => ({
    id: s.id,
    nameIt: s.nameIt,
    nameEn: s.nameEn,
    nameFr: s.nameFr,
    nameEs: s.nameEs,
    productCount: (productStoveMap[s.id] || []).length,
  }));

  return <HomeClient products={products} categories={categories} user={user} stoves={stoveList} />;
}
