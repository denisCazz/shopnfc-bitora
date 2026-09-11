"use server";

import { revalidatePath } from "next/cache";
import { eq, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { stoves } from "@/db/schema";
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

export async function getStoves() {
  const db = getDb();
  return db.select().from(stoves).orderBy(asc(stoves.sortOrder), asc(stoves.nameIt));
}

export async function createStove(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const db = getDb();
  const nameIt = (formData.get("name_it") as string)?.trim();
  if (!nameIt) return { error: "Il nome (IT) è obbligatorio" };
  const slug = slugify(nameIt) + "-" + Date.now();
  try {
    await db.insert(stoves).values({
      nameIt,
      nameEn: (formData.get("name_en") as string) || null,
      nameFr: (formData.get("name_fr") as string) || null,
      nameEs: (formData.get("name_es") as string) || null,
      slug,
      active: formData.get("active") !== "false",
      sortOrder: parseInt(formData.get("sort_order") as string, 10) || 0,
      categoria: (formData.get("categoria") as string) || null,
      potenza: (formData.get("potenza") as string) || null,
      dimensioni: (formData.get("dimensioni") as string) || null,
      peso: (formData.get("peso") as string) || null,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }
  revalidatePath("/admin/stufe");
  return {};
}

export async function updateStove(id: number, formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const db = getDb();
  const nameIt = (formData.get("name_it") as string)?.trim();
  if (!nameIt) return { error: "Il nome (IT) è obbligatorio" };
  try {
    await db
      .update(stoves)
      .set({
        nameIt,
        nameEn: (formData.get("name_en") as string) || null,
        nameFr: (formData.get("name_fr") as string) || null,
        nameEs: (formData.get("name_es") as string) || null,
        active: formData.get("active") !== "false",
        sortOrder: parseInt(formData.get("sort_order") as string, 10) || 0,
        categoria: (formData.get("categoria") as string) || null,
        potenza: (formData.get("potenza") as string) || null,
        dimensioni: (formData.get("dimensioni") as string) || null,
        peso: (formData.get("peso") as string) || null,
      })
      .where(eq(stoves.id, id));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }
  revalidatePath("/admin/stufe");
  return {};
}

export async function deleteStove(id: number): Promise<{ error?: string }> {
  await requireAdmin();
  const db = getDb();
  try {
    await db.delete(stoves).where(eq(stoves.id, id));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore" };
  }
  revalidatePath("/admin/stufe");
  return {};
}
