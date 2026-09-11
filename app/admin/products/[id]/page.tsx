import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, and, eq, notInArray } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { getDb } from "@/db";
import { products, categories, productImages, productChips, chips } from "@/db/schema";
import { productToFormData, productImagesToForm } from "@/lib/mappers";
import { updateProduct } from "@/app/admin/actions/products";
import ProductForm from "@/app/admin/products/ProductForm";
import { getPricingConfig } from "@/lib/pricing-server";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnPage?: string }>;
}) {
  const { id } = await params;
  const { returnPage } = await searchParams;
  const productId = parseInt(id, 10);
  if (isNaN(productId)) notFound();

  const db = getDb();
  const [productRow, catRows, imageRows, chipRows, selectedChipRows, pricing] = await Promise.all([
    db.select().from(products).where(eq(products.id, productId)).limit(1).then((r) => r[0]),
    db
      .select({ id: categories.id, nameIt: categories.nameIt, slug: categories.slug })
      .from(categories)
      .where(and(eq(categories.active, true), notInArray(categories.id, [17, 18])))
      .orderBy(asc(categories.sortOrder)),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.sortOrder)),
    db.select({ id: chips.id, nameIt: chips.nameIt }).from(chips).where(eq(chips.active, true)).orderBy(asc(chips.sortOrder)),
    db.select({ chipId: productChips.chipId }).from(productChips).where(eq(productChips.productId, productId)),
    getPricingConfig(),
  ]);

  if (!productRow) notFound();

  const product = productToFormData(productRow);
  const categoriesList = catRows.map((c) => ({
    id: c.id,
    name_it: c.nameIt,
    slug: c.slug,
  }));
  const initialImages = productImagesToForm(imageRows);
  const selectedChipIds = selectedChipRows.map((r) => r.chipId);

  async function action(_prev: { error?: string } | null, formData: FormData) {
    "use server";
    const result = await updateProduct(productId, formData);
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
        <h1 className="text-2xl font-bold text-foreground">
          Modifica: {product.name_it}
        </h1>
      </div>

      <ProductForm
        product={product}
        categories={categoriesList}
        chips={chipRows}
        selectedChipIds={selectedChipIds}
        productImages={initialImages}
        action={action}
        submitLabel="Salva Modifiche"
        returnPage={returnPage}
        markup={pricing.markup}
      />
    </div>
  );
}
