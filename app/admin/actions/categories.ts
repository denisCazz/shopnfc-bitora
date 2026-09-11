    "use server";

import { revalidatePath } from "next/cache";
import { revalidateCatalog } from "@/lib/revalidate-catalog";
import { eq, asc, count } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { getUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Non autorizzato");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getCategories() {
  const db = getDb();
  const cats = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.nameIt));

  const counts = await db
    .select({ categoryId: products.categoryId, n: count() })
    .from(products)
    .where(eq(products.active, true))
    .groupBy(products.categoryId);

  const countMap = new Map(counts.map((c) => [c.categoryId, Number(c.n)]));

  return cats.map((c) => ({ ...c, productCount: countMap.get(c.id) ?? 0 }));
}

export async function createCategory(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const db = getDb();
  const nameIt = (formData.get("name_it") as string)?.trim();
  if (!nameIt) return { error: "Il nome (IT) è obbligatorio" };

  const slugInput = (formData.get("slug") as string)?.trim();
  const slug = slugInput ? slugify(slugInput) : slugify(nameIt) + "-" + Date.now();

  try {
    await db.insert(categories).values({
      nameIt,
      nameEn: (formData.get("name_en") as string) || null,
      nameFr: (formData.get("name_fr") as string) || null,
      nameEs: (formData.get("name_es") as string) || null,
      slug,
      icon: (formData.get("icon") as string) || null,
      sortOrder: parseInt(formData.get("sort_order") as string, 10) || 0,
      active: formData.get("active") !== "false",
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }
  revalidatePath("/admin/categories");
  revalidateCatalog();
  return {};
}

export async function updateCategory(id: number, formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const db = getDb();
  const nameIt = (formData.get("name_it") as string)?.trim();
  if (!nameIt) return { error: "Il nome (IT) è obbligatorio" };

  const slugInput = (formData.get("slug") as string)?.trim();
  const slug = slugInput ? slugify(slugInput) : slugify(nameIt);

  try {
    await db
      .update(categories)
      .set({
        nameIt,
        nameEn: (formData.get("name_en") as string) || null,
        nameFr: (formData.get("name_fr") as string) || null,
        nameEs: (formData.get("name_es") as string) || null,
        slug,
        icon: (formData.get("icon") as string) || null,
        sortOrder: parseInt(formData.get("sort_order") as string, 10) || 0,
        active: formData.get("active") === "true",
      })
      .where(eq(categories.id, id));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }
  revalidatePath("/admin/categories");
  revalidateCatalog();
  return {};
}

export async function deleteCategory(id: number): Promise<{ error?: string }> {
  await requireAdmin();
  const db = getDb();
  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore eliminazione (potrebbe avere prodotti associati)" };
  }
  revalidatePath("/admin/categories");
  revalidateCatalog();
  return {};
}
