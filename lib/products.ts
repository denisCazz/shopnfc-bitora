import { unstable_cache } from "next/cache";
import { and, eq, ne, sql, count, getTableColumns, type SQL, asc, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { products, categories, productImages } from "@/db/schema";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { retailFromCatalog } from "@/lib/pricing";
import { getPricingConfig } from "@/lib/pricing-server";
import { normalizeMinQuantity } from "@/lib/min-quantity";

export interface ProductImage {
  id: number;
  image_url: string;
  sort_order: number;
  alt_text: string | null;
}

export interface ProductWithCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  descriptionShort: string;
  price: number;
  catalogPrice?: number;
  wholesalePrice: number | null;
  category: string;
  categorySlug: string;
  categoryId: number;
  image: string | null;
  images: ProductImage[];
  sku: string | null;
  ean13: string | null;
  brand: string | null;
  weight: number | null;
  stockQuantity: number;
  minQuantity: number;
  metaTitle: string | null;
  metaDescription: string | null;
  name_it?: string;
  name_en?: string;
  name_fr?: string;
  name_es?: string;
  description_it?: string;
  description_en?: string;
  description_fr?: string;
  description_es?: string;
  descriptionShort_it?: string;
  descriptionShort_en?: string;
  descriptionShort_fr?: string;
  descriptionShort_es?: string;
}

function num(v: string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return Number(v);
}

function numOrNull(v: string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return Number(v);
}

type PRow = {
  id: number;
  nameIt: string;
  slug: string;
  descriptionIt: string | null;
  descriptionShortIt: string | null;
  price: string;
  catalogPrice: string | null;
  wholesalePrice: string | null;
  categoryId: number;
  imageUrl: string | null;
  sku: string | null;
  ean13: string | null;
  brand: string | null;
  weight: string | null;
  stockQuantity: number;
  minQuantity: number;
  metaTitle: string | null;
  metaDescription: string | null;
  nameEn: string | null;
  nameFr: string | null;
  nameEs: string | null;
  descriptionEn: string | null;
  descriptionFr: string | null;
  descriptionEs: string | null;
  descriptionShortEn: string | null;
  descriptionShortFr: string | null;
  descriptionShortEs: string | null;
};

function mapProduct(
  pr: PRow,
  categoryName: string,
  categorySlug: string,
  images: ProductImage[]
): ProductWithCategory {
  return {
    id: pr.id,
    name: pr.nameIt,
    slug: pr.slug,
    description: pr.descriptionIt || "",
    descriptionShort: pr.descriptionShortIt || "",
    price: num(pr.price),
    catalogPrice: num(pr.catalogPrice) || num(pr.price),
    wholesalePrice: numOrNull(pr.wholesalePrice),
    category: categoryName,
    categorySlug,
    categoryId: pr.categoryId,
    image: images[0]?.image_url ?? null,
    images: images || [],
    sku: pr.sku,
    ean13: pr.ean13,
    brand: pr.brand,
    weight: numOrNull(pr.weight),
    stockQuantity: pr.stockQuantity,
    minQuantity: normalizeMinQuantity(pr.minQuantity),
    metaTitle: pr.metaTitle,
    metaDescription: pr.metaDescription,
    name_it: pr.nameIt || undefined,
    name_en: pr.nameEn ?? undefined,
    name_fr: pr.nameFr ?? undefined,
    name_es: pr.nameEs ?? undefined,
    description_it: pr.descriptionIt ?? undefined,
    description_en: pr.descriptionEn ?? undefined,
    description_fr: pr.descriptionFr ?? undefined,
    description_es: pr.descriptionEs ?? undefined,
    descriptionShort_it: pr.descriptionShortIt ?? undefined,
    descriptionShort_en: pr.descriptionShortEn ?? undefined,
    descriptionShort_fr: pr.descriptionShortFr ?? undefined,
    descriptionShort_es: pr.descriptionShortEs ?? undefined,
  };
}

async function fetchProducts(options?: {
  categorySlug?: string;
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<{ products: ProductWithCategory[]; total: number }> {
  const db = getDb();
  const p = getTableColumns(products);
  const conditions: SQL[] = [eq(products.active, true)];

  if (options?.categorySlug) {
    conditions.push(eq(categories.slug, options.categorySlug));
  }
  if (options?.search) {
    const term = options.search.trim();
    conditions.push(
      sql`products.search_vector @@ websearch_to_tsquery('italian', ${term})`
    );
  }
  const whereClause = and(...conditions)!;

  const [totalRes] = await db
    .select({ n: count() })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(whereClause);

  const baseQuery = db
    .select({
      ...p,
      catName: categories.nameIt,
      catSlug: categories.slug,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(whereClause)
    .orderBy(asc(products.id));

  const data =
    options?.limit != null
      ? await baseQuery
          .limit(options.limit)
          .offset(options.offset || 0)
      : await baseQuery;

  const ids = data.map((r) => r.id);
  const imgMap = new Map<number, ProductImage[]>();
  if (ids.length) {
    const imgs = await db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, ids));
    for (const i of imgs) {
      const list = imgMap.get(i.productId) || [];
      list.push({
        id: i.id,
        image_url: i.imageUrl,
        sort_order: i.sortOrder,
        alt_text: i.altText,
      });
      imgMap.set(i.productId, list);
    }
    for (const list of imgMap.values()) {
      list.sort((a, b) => a.sort_order - b.sort_order);
    }
  }

  const out: ProductWithCategory[] = data.map((row) => {
    const { catName, catSlug, ...rest } = row;
    const imgs = imgMap.get(row.id) || [];
    return mapProduct(rest as unknown as PRow, catName, catSlug, imgs);
  });

  return { products: out, total: Number(totalRes.n) };
}

async function withRetailMarkup(data: {
  products: ProductWithCategory[];
  total: number;
}): Promise<{ products: ProductWithCategory[]; total: number }> {
  const { markup } = await getPricingConfig();
  return {
    total: data.total,
    products: data.products.map((p) => ({
      ...p,
      price: retailFromCatalog(p.catalogPrice ?? p.price, markup),
    })),
  };
}

async function withRetailMarkupOne(
  product: ProductWithCategory | null
): Promise<ProductWithCategory | null> {
  if (!product) return null;
  const { markup } = await getPricingConfig();
  return {
    ...product,
    price: retailFromCatalog(product.catalogPrice ?? product.price, markup),
  };
}

export async function getProducts(options?: {
  categorySlug?: string;
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<{ products: ProductWithCategory[]; total: number }> {
  if (options?.search?.trim()) {
    return withRetailMarkup(await fetchProducts(options));
  }
  const cacheKey = [
    "products",
    options?.categorySlug ?? "all",
    String(options?.limit ?? "all"),
    String(options?.offset ?? 0),
  ];
  const data = await unstable_cache(() => fetchProducts(options), cacheKey, {
    revalidate: 120,
    tags: [CACHE_TAGS.products],
  })();
  return withRetailMarkup(data);
}

async function fetchProductBySlug(
  slug: string
): Promise<ProductWithCategory | null> {
  const db = getDb();
  const [row] = await db
    .select({
      ...getTableColumns(products),
      catName: categories.nameIt,
      catSlug: categories.slug,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.active, true)))
    .limit(1);

  if (!row) return null;

  const { catName, catSlug, ...pr } = row;
  const imgs = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, pr.id))
    .orderBy(asc(productImages.sortOrder));
  const images: ProductImage[] = imgs.map((i) => ({
    id: i.id,
    image_url: i.imageUrl,
    sort_order: i.sortOrder,
    alt_text: i.altText,
  }));

  return mapProduct(pr as unknown as PRow, catName, catSlug, images);
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithCategory | null> {
  const product = await unstable_cache(() => fetchProductBySlug(slug), ["product", slug], {
    revalidate: 120,
    tags: [CACHE_TAGS.products],
  })();
  return withRetailMarkupOne(product);
}

async function fetchRelatedProducts(
  productId: number,
  categoryId: number,
  limitN: number
): Promise<ProductWithCategory[]> {
  const db = getDb();
  const data = await db
    .select({
      ...getTableColumns(products),
      catName: categories.nameIt,
      catSlug: categories.slug,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.categoryId, categoryId),
        eq(products.active, true),
        ne(products.id, productId)
      )
    )
    .limit(limitN);

  const ids = data.map((r) => r.id);
  const imgMap = new Map<number, ProductImage[]>();
  if (ids.length) {
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

  return data.map((row) => {
    const { catName, catSlug, ...pr } = row;
    return mapProduct(pr as unknown as PRow, catName, catSlug, imgMap.get(row.id) || []);
  });
}

export async function getRelatedProducts(
  productId: number,
  categoryId: number,
  limitN = 4
): Promise<ProductWithCategory[]> {
  const rows = await unstable_cache(
    () => fetchRelatedProducts(productId, categoryId, limitN),
    ["related", String(productId), String(categoryId), String(limitN)],
    { revalidate: 120, tags: [CACHE_TAGS.products] }
  )();
  const { markup } = await getPricingConfig();
  return rows.map((p) => ({
    ...p,
    price: retailFromCatalog(p.catalogPrice ?? p.price, markup),
  }));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

export function applyDealerDiscount(
  price: number,
  discountPercent: number
): number {
  const safeDiscount = typeof discountPercent === "number" && isFinite(discountPercent)
    ? Math.max(0, Math.min(100, discountPercent))
    : 0;
  return price * (1 - safeDiscount / 100);
}
