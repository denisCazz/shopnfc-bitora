import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { getDb } from "@/db";
import { categories, discountCodes, products } from "@/db/schema";
import { getPricingConfig } from "@/lib/pricing-server";
import { getPrintConfig } from "@/lib/print-options-server";
import { getShippingConfig } from "@/lib/shipping";
import { retailFromCatalog } from "@/lib/pricing";
import { minQuantityForProduct } from "@/lib/min-quantity";
import PreventiviAdminClient, {
  type AdminQuoteProduct,
  type AdminQuoteDiscountCode,
} from "./PreventiviAdminClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Generatore Preventivi PDF | Admin" };

export default async function AdminPreventiviPage() {
  const user = await getUser();
  if (!user || user.role !== "admin") redirect("/admin");

  const db = getDb();

  const [productRows, discountRows, pricingConfig, printConfig, shippingConfig] =
    await Promise.all([
      db
        .select({
          id: products.id,
          nameIt: products.nameIt,
          slug: products.slug,
          sku: products.sku,
          price: products.price,
          catalogPrice: products.catalogPrice,
          wholesalePrice: products.wholesalePrice,
          weight: products.weight,
          minQuantity: products.minQuantity,
          stockQuantity: products.stockQuantity,
          active: products.active,
          fragileShipping: products.fragileShipping,
          fragileShippingCost: products.fragileShippingCost,
          categoryId: products.categoryId,
          categoryName: categories.nameIt,
          categorySlug: categories.slug,
        })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .orderBy(asc(categories.sortOrder), asc(products.nameIt)),
      db
        .select({
          id: discountCodes.id,
          code: discountCodes.code,
          type: discountCodes.type,
          value: discountCodes.value,
          minOrderAmount: discountCodes.minOrderAmount,
          active: discountCodes.active,
          note: discountCodes.note,
        })
        .from(discountCodes)
        .where(eq(discountCodes.active, true))
        .orderBy(asc(discountCodes.code)),
      getPricingConfig(),
      getPrintConfig(),
      getShippingConfig(),
    ]);

  const mappedProducts: AdminQuoteProduct[] = productRows.map((p) => {
    const rawCatalog = Number(p.catalogPrice ?? p.price);
    const retailPrice = retailFromCatalog(rawCatalog, pricingConfig.markup);
    return {
      id: p.id,
      nameIt: p.nameIt,
      slug: p.slug,
      sku: p.sku,
      retailPrice,
      catalogPrice: rawCatalog,
      wholesalePrice: p.wholesalePrice != null ? Number(p.wholesalePrice) : null,
      weightKg: p.weight != null ? Number(p.weight) : 0.05,
      minQuantity: minQuantityForProduct(p.minQuantity, {
        sku: p.sku,
        slug: p.slug,
        nameIt: p.nameIt,
      }),
      stockQuantity: p.stockQuantity,
      active: p.active,
      fragileShipping: p.fragileShipping,
      fragileShippingCost:
        p.fragileShippingCost != null ? Number(p.fragileShippingCost) : 0,
      categoryId: p.categoryId,
      categoryName: p.categoryName,
      categorySlug: p.categorySlug,
    };
  });

  const mappedDiscounts: AdminQuoteDiscountCode[] = discountRows.map((d) => ({
    id: d.id,
    code: d.code,
    type: d.type,
    value: Number(d.value),
    minOrderAmount: d.minOrderAmount != null ? Number(d.minOrderAmount) : null,
    note: d.note,
  }));

  return (
    <PreventiviAdminClient
      products={mappedProducts}
      discountCodes={mappedDiscounts}
      markup={pricingConfig.markup}
      printPrices={printConfig.prices}
      shippingConfig={shippingConfig}
    />
  );
}
