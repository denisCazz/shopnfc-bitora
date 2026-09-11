"use server";

import { and, or, ilike, eq, asc, getTableColumns, exists, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { products, categories, chips, productChips } from "@/db/schema";
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
              .select({ id: chips.id })
              .from(productChips)
              .innerJoin(chips, eq(productChips.chipId, chips.id))
              .where(
                and(
                  eq(productChips.productId, products.id),
                  or(
                    ilike(chips.nameIt, term),
                    ilike(chips.nameEn, term),
                    ilike(chips.nameFr, term),
                    ilike(chips.nameEs, term)
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

export interface ChipSearchResult {
  id: number;
  nameIt: string;
  nameEn: string | null;
  nameFr: string | null;
  nameEs: string | null;
  slug: string;
  productCount: number;
}

export async function searchChips(query: string): Promise<ChipSearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  const term = `%${query.trim()}%`;
  const db = getDb();
  const rows = await db
    .select({
      id: chips.id,
      nameIt: chips.nameIt,
      nameEn: chips.nameEn,
      nameFr: chips.nameFr,
      nameEs: chips.nameEs,
      slug: chips.slug,
    })
    .from(chips)
    .where(
      and(
        eq(chips.active, true),
        or(
          ilike(chips.nameIt, term),
          ilike(chips.nameEn, term),
          ilike(chips.nameFr, term),
          ilike(chips.nameEs, term)
        )
      )
    )
    .orderBy(asc(chips.nameIt))
    .limit(3);

  if (rows.length === 0) return [];

  const { count: countFn } = await import("drizzle-orm");
  const counts = await db
    .select({ chipId: productChips.chipId, n: countFn() })
    .from(productChips)
    .innerJoin(products, and(eq(productChips.productId, products.id), eq(products.active, true)))
    .where(
      or(...rows.map((r) => eq(productChips.chipId, r.id)))
    )
    .groupBy(productChips.chipId);

  const countMap = new Map(counts.map((c) => [c.chipId, Number(c.n)]));

  return rows.map((r) => ({
    ...r,
    productCount: countMap.get(r.id) ?? 0,
  }));
}
