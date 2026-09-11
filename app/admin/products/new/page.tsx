import Link from "next/link";
import { asc, and, eq, notInArray } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { getDb } from "@/db";
import { categories, chips } from "@/db/schema";
import { createProduct } from "../../actions/products";
import ProductForm from "../ProductForm";
import { getPricingConfig } from "@/lib/pricing-server";

export default async function NewProductPage() {
  const db = getDb();
  const [catRows, chipRows, pricing] = await Promise.all([
    db
      .select({ id: categories.id, nameIt: categories.nameIt, slug: categories.slug })
      .from(categories)
      .where(and(eq(categories.active, true), notInArray(categories.id, [17, 18])))
      .orderBy(asc(categories.sortOrder)),
    db.select({ id: chips.id, nameIt: chips.nameIt }).from(chips).where(eq(chips.active, true)).orderBy(asc(chips.sortOrder)),
    getPricingConfig(),
  ]);

  const categoriesList = catRows.map((c) => ({
    id: c.id,
    name_it: c.nameIt,
    slug: c.slug,
  }));

  async function action(_prev: { error?: string } | null, formData: FormData) {
    "use server";
    const result = await createProduct(formData);
    return result ?? null;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Torna ai prodotti
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Nuovo Prodotto</h1>
      </div>

      <ProductForm
        categories={categoriesList}
        chips={chipRows}
        action={action}
        submitLabel="Crea Prodotto"
        markup={pricing.markup}
      />
    </div>
  );
}
