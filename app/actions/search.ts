"use server";

import { and, or, ilike, eq, asc, getTableColumns, exists, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { products, categories, stoves, productStoves } from "@/db/schema";
import { retailFromCatalog } from "@/lib/pricing";
import { getPricingConfig } from "@/lib/pricing-server";

export interface SearchResult {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  category: string;
}

export async function searchProducts(query: string, locale: string = "it"): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  const term = `%${query.trim()}%`;
  const db = getDb();
  const p = getTableColumns(products);
  const rows = await db
    .select({
      id: p.id,
      nameIt: p.nameIt,
      nameEn: p.nameEn,
      nameFr: p.nameFr,
      nameEs: p.nameEs,
      slug: p.slug,
      price: p.price,
      catalogPrice: p.catalogPrice,
      imageUrl: p.imageUrl,
      firstImageUrl: sql<string | null>`(SELECT image_url FROM product_images WHERE product_id = products.id ORDER BY sort_order ASC, id ASC LIMIT 1)`,
      catNameIt: categories.nameIt,
      catNameEn: categories.nameEn,
      catNameFr: categories.nameFr,
      catNameEs: categories.nameEs,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.active, true),
        or(
          ilike(products.nameIt, term),
          ilike(products.nameEn, term),
          ilike(products.nameFr, term),
          ilike(products.nameEs, term),
          ilike(products.sku, term),
          ilike(products.descriptionIt, term),
          ilike(products.descriptionEn, term),
          ilike(products.descriptionFr, term),
          ilike(products.descriptionEs, term),
          exists(
            db
              .select({ id: stoves.id })
              .from(productStoves)
              .innerJoin(stoves, eq(productStoves.stoveId, stoves.id))
              .where(
                and(
                  eq(productStoves.productId, products.id),
                  or(
                    ilike(stoves.nameIt, term),
                    ilike(stoves.nameEn, term),
                    ilike(stoves.nameFr, term),
                    ilike(stoves.nameEs, term)
                  )
                )
              )
          )
        )
      )
    )
    .orderBy(asc(products.id))
    .limit(8);

  const { markup } = await getPricingConfig();
  return rows.map((row) => ({
    id: row.id,
    name: (locale === "en" && row.nameEn) || (locale === "fr" && row.nameFr) || (locale === "es" && row.nameEs) || row.nameIt,
    slug: row.slug,
    price: retailFromCatalog(Number(row.catalogPrice ?? row.price), markup),
    image: row.firstImageUrl ?? row.imageUrl ?? null,
    category: (locale === "en" && row.catNameEn) || (locale === "fr" && row.catNameFr) || (locale === "es" && row.catNameEs) || row.catNameIt,
  }));
}

export interface StoveSearchResult {
  id: number;
  nameIt: string;
  nameEn: string | null;
  nameFr: string | null;
  nameEs: string | null;
  slug: string;
  productCount: number;
}

export async function searchStoves(query: string): Promise<StoveSearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  const term = `%${query.trim()}%`;
  const db = getDb();
  const rows = await db
    .select({
      id: stoves.id,
      nameIt: stoves.nameIt,
      nameEn: stoves.nameEn,
      nameFr: stoves.nameFr,
      nameEs: stoves.nameEs,
      slug: stoves.slug,
    })
    .from(stoves)
    .where(
      and(
        eq(stoves.active, true),
        or(
          ilike(stoves.nameIt, term),
          ilike(stoves.nameEn, term),
          ilike(stoves.nameFr, term),
          ilike(stoves.nameEs, term)
        )
      )
    )
    .orderBy(asc(stoves.nameIt))
    .limit(3);

  if (rows.length === 0) return [];

  // Count products per stove
  const { count: countFn } = await import("drizzle-orm");
  const counts = await db
    .select({ stoveId: productStoves.stoveId, n: countFn() })
    .from(productStoves)
    .innerJoin(products, and(eq(productStoves.productId, products.id), eq(products.active, true)))
    .where(
      or(...rows.map((r) => eq(productStoves.stoveId, r.id)))
    )
    .groupBy(productStoves.stoveId);

  const countMap = new Map(counts.map((c) => [c.stoveId, Number(c.n)]));

  return rows.map((r) => ({
    ...r,
    productCount: countMap.get(r.id) ?? 0,
  }));
}
