import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products, categories, chips } from "@/db/schema";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = SITE.url.replace(/\/$/, "");
  const db = getDb();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/tag-nfc`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/tag-nfc-personalizzati`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/assistenza`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/come-acquistare`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/cookie-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const [prodRows, catRows, chipRows] = await Promise.all([
    db
      .select({ slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.active, true)),
    db
      .select({ slug: categories.slug })
      .from(categories)
      .where(eq(categories.active, true)),
    db
      .select({ slug: chips.slug })
      .from(chips)
      .where(eq(chips.active, true)),
  ]);

  const productPages: MetadataRoute.Sitemap = prodRows.map((p) => ({
    url: `${siteUrl}/products/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = catRows.map((c) => ({
    url: `${siteUrl}/categories/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const chipPages: MetadataRoute.Sitemap = chipRows.map((c) => ({
    url: `${siteUrl}/chip/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...chipPages, ...productPages];
}
