import { unstable_cache } from "next/cache";
import { and, eq, asc, notInArray, exists } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { CACHE_TAGS } from "@/lib/cache-tags";

export interface CategoryWithCount {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  productCount?: number;
  name_it?: string;
  name_en?: string;
  name_fr?: string;
  name_es?: string;
}

function stripColon(s: string | null | undefined): string {
  return (s ?? "").trim().replace(/:+\s*$/, "");
}

function mapRow(row: {
  id: number;
  nameIt: string;
  nameEn: string | null;
  nameFr: string | null;
  nameEs: string | null;
  slug: string;
  icon: string | null;
}): CategoryWithCount {
  return {
    id: row.id,
    name: stripColon(row.nameIt),
    slug: row.slug,
    icon: row.icon,
    name_it: stripColon(row.nameIt) || undefined,
    name_en: stripColon(row.nameEn) || undefined,
    name_fr: stripColon(row.nameFr) || undefined,
    name_es: stripColon(row.nameEs) || undefined,
  };
}

// These slugs are full-product categories, not spare-parts filters
const HIDDEN_CATEGORY_SLUGS = ["stufe-a-pellet", "porta-pellet-aspiracenere"];

async function fetchCategories(): Promise<CategoryWithCount[]> {
  const db = getDb();
  const data = await db
    .select()
    .from(categories)
    .where(and(
      eq(categories.active, true),
      notInArray(categories.slug, HIDDEN_CATEGORY_SLUGS),
      exists(
        db.select({ id: products.id })
          .from(products)
          .where(and(eq(products.categoryId, categories.id), eq(products.active, true)))
      )
    ))
    .orderBy(asc(categories.sortOrder));
  return data.map((row) => mapRow(row));
}

export async function getCategories(): Promise<CategoryWithCount[]> {
  return unstable_cache(fetchCategories, ["categories-list"], {
    revalidate: 300,
    tags: [CACHE_TAGS.categories],
  })();
}

async function fetchCategoryBySlug(
  slug: string
): Promise<CategoryWithCount | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.active, true)))
    .limit(1);
  if (!row) return null;
  return mapRow(row);
}

export async function getCategoryBySlug(
  slug: string
): Promise<CategoryWithCount | null> {
  return unstable_cache(
    () => fetchCategoryBySlug(slug),
    ["category", slug],
    { revalidate: 300, tags: [CACHE_TAGS.categories] }
  )();
}

async function fetchCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const db = getDb();
  const cats = await db
    .select()
    .from(categories)
    .where(eq(categories.active, true))
    .orderBy(asc(categories.sortOrder));

  const prods = await db
    .select({ categoryId: products.categoryId })
    .from(products)
    .where(eq(products.active, true));

  const countMap = new Map<number, number>();
  for (const p of prods) {
    countMap.set(
      p.categoryId,
      (countMap.get(p.categoryId) || 0) + 1
    );
  }

  return cats.map((c) => ({
    ...mapRow(c),
    productCount: countMap.get(c.id) || 0,
  }));
}

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  return unstable_cache(fetchCategoriesWithCounts, ["categories-with-counts"], {
    revalidate: 300,
    tags: [CACHE_TAGS.categories],
  })();
}
