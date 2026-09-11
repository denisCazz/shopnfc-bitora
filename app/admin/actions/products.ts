"use server";

import { revalidatePath } from "next/cache";
import { revalidateCatalog } from "@/lib/revalidate-catalog";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products, productStoves } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { retailFromCatalog } from "@/lib/pricing";
import { getPricingConfig } from "@/lib/pricing-server";

async function requireAdmin() {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    throw new Error("Non autorizzato");
  }
  return user;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function pricesFromForm(formData: FormData) {
  const catalog =
    parseFloat(String(formData.get("catalog_price") || formData.get("price") || "0")) || 0;
  const { markup } = await getPricingConfig();
  return {
    catalogPrice: String(catalog),
    price: String(retailFromCatalog(catalog, markup)),
  };
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const db = getDb();

  const nameIt = formData.get("name_it") as string;
  const slug = slugify(nameIt) || `product-${Date.now()}`;
  const { catalogPrice, price } = await pricesFromForm(formData);

  try {
    await db.insert(products).values({
      nameIt,
      nameEn: (formData.get("name_en") as string) || null,
      nameFr: (formData.get("name_fr") as string) || null,
      nameEs: (formData.get("name_es") as string) || null,
      slug,
      categoryId: parseInt(formData.get("category_id") as string, 10),
      catalogPrice,
      price,
      stockQuantity: parseInt(formData.get("stock_quantity") as string, 10) || 0,
      sku: (formData.get("sku") as string) || null,
      ean13: (formData.get("ean13") as string) || null,
      brand: (formData.get("brand") as string) || null,
      weight: formData.get("weight")
        ? String(parseFloat(formData.get("weight") as string))
        : null,
      width: formData.get("width")
        ? String(parseFloat(formData.get("width") as string))
        : null,
      height: formData.get("height")
        ? String(parseFloat(formData.get("height") as string))
        : null,
      depth: formData.get("depth")
        ? String(parseFloat(formData.get("depth") as string))
        : null,
      descriptionIt: (formData.get("description_it") as string) || null,
      descriptionEn: (formData.get("description_en") as string) || null,
      descriptionFr: (formData.get("description_fr") as string) || null,
      descriptionEs: (formData.get("description_es") as string) || null,
      descriptionShortIt: (formData.get("description_short_it") as string) || null,
      descriptionShortEn: (formData.get("description_short_en") as string) || null,
      descriptionShortFr: (formData.get("description_short_fr") as string) || null,
      descriptionShortEs: (formData.get("description_short_es") as string) || null,
      imageUrl: (formData.get("image_url") as string) || null,
      metaTitle: (formData.get("meta_title") as string) || null,
      metaDescription: (formData.get("meta_description") as string) || null,
      active: formData.get("active") === "on",
      fragileShipping: formData.get("fragile_shipping") === "on",
      fragileShippingCost: formData.get("fragile_shipping_cost")
        ? String(parseFloat(formData.get("fragile_shipping_cost") as string))
        : null,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }

  // Save compatible stoves: get the newly inserted product id
  const stoveIds = formData.getAll("compatible_stove_ids").map(Number).filter(Boolean);
  if (stoveIds.length > 0) {
    const [inserted] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slugify(formData.get("name_it") as string)))
      .limit(1);
    if (inserted) {
      await db.insert(productStoves).values(stoveIds.map((sid) => ({ productId: inserted.id, stoveId: sid })));
    }
  }

  const categoryId = formData.get("category_id") as string;
  revalidatePath("/admin/products");
  revalidateCatalog();
  redirect(categoryId ? `/admin/products?category=${categoryId}` : "/admin/products");
}

export async function updateProduct(id: number, formData: FormData) {
  await requireAdmin();
  const db = getDb();

  const nameIt = formData.get("name_it") as string;
  const slug = slugify(nameIt) || `product-${id}`;
  const { catalogPrice, price } = await pricesFromForm(formData);

  try {
    await db
      .update(products)
      .set({
        nameIt,
        nameEn: (formData.get("name_en") as string) || null,
        nameFr: (formData.get("name_fr") as string) || null,
        nameEs: (formData.get("name_es") as string) || null,
        slug,
        categoryId: parseInt(formData.get("category_id") as string, 10),
        catalogPrice,
        price,
        stockQuantity: parseInt(formData.get("stock_quantity") as string, 10) || 0,
        sku: (formData.get("sku") as string) || null,
        ean13: (formData.get("ean13") as string) || null,
        brand: (formData.get("brand") as string) || null,
        weight: formData.get("weight")
          ? String(parseFloat(formData.get("weight") as string))
          : null,
        width: formData.get("width")
          ? String(parseFloat(formData.get("width") as string))
          : null,
        height: formData.get("height")
          ? String(parseFloat(formData.get("height") as string))
          : null,
        depth: formData.get("depth")
          ? String(parseFloat(formData.get("depth") as string))
          : null,
        descriptionIt: (formData.get("description_it") as string) || null,
        descriptionEn: (formData.get("description_en") as string) || null,
        descriptionFr: (formData.get("description_fr") as string) || null,
        descriptionEs: (formData.get("description_es") as string) || null,
        descriptionShortIt: (formData.get("description_short_it") as string) || null,
        descriptionShortEn: (formData.get("description_short_en") as string) || null,
        descriptionShortFr: (formData.get("description_short_fr") as string) || null,
        descriptionShortEs: (formData.get("description_short_es") as string) || null,
        imageUrl: (formData.get("image_url") as string) || null,
        metaTitle: (formData.get("meta_title") as string) || null,
        metaDescription: (formData.get("meta_description") as string) || null,
        active: formData.get("active") === "on",
        fragileShipping: formData.get("fragile_shipping") === "on",
        fragileShippingCost: formData.get("fragile_shipping_cost")
          ? String(parseFloat(formData.get("fragile_shipping_cost") as string))
          : null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }

  // Replace compatible stoves
  const stoveIds = formData.getAll("compatible_stove_ids").map(Number).filter(Boolean);
  await db.delete(productStoves).where(eq(productStoves.productId, id));
  if (stoveIds.length > 0) {
    await db.insert(productStoves).values(stoveIds.map((sid) => ({ productId: id, stoveId: sid })));
  }

  const categoryId = formData.get("category_id") as string;
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidateCatalog();
  redirect(categoryId ? `/admin/products?category=${categoryId}` : "/admin/products");
}

export async function toggleProductActive(id: number, active: boolean) {
  await requireAdmin();
  const db = getDb();
  try {
    await db
      .update(products)
      .set({ active, updatedAt: new Date() })
      .where(eq(products.id, id));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }
  revalidatePath("/admin/products");
  revalidateCatalog();
}

export async function deleteProduct(id: number) {
  await requireAdmin();
  const db = getDb();
  try {
    await db.delete(products).where(eq(products.id, id));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }
  revalidatePath("/admin/products");
  revalidateCatalog();
}
