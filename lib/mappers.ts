import { productImages, products } from "@/db/schema";

type P = typeof products.$inferSelect;
type Img = typeof productImages.$inferSelect;

export function productToFormData(p: P) {
  return {
    id: p.id,
    name_it: p.nameIt,
    name_en: p.nameEn,
    name_fr: p.nameFr,
    name_es: p.nameEs,
    category_id: p.categoryId,
    catalog_price: Number(p.catalogPrice ?? p.price),
    price: Number(p.price),
    stock_quantity: p.stockQuantity,
    min_quantity: p.minQuantity,
    sku: p.sku,
    ean13: p.ean13,
    brand: p.brand,
    weight: p.weight != null ? Number(p.weight) : null,
    width: p.width != null ? Number(p.width) : null,
    height: p.height != null ? Number(p.height) : null,
    depth: p.depth != null ? Number(p.depth) : null,
    description_it: p.descriptionIt,
    description_en: p.descriptionEn,
    description_fr: p.descriptionFr,
    description_es: p.descriptionEs,
    description_short_it: p.descriptionShortIt,
    description_short_en: p.descriptionShortEn,
    description_short_fr: p.descriptionShortFr,
    description_short_es: p.descriptionShortEs,
    image_url: p.imageUrl,
    meta_title: p.metaTitle,
    meta_description: p.metaDescription,
    active: p.active,
    fragile_shipping: p.fragileShipping,
    fragile_shipping_cost: p.fragileShippingCost != null ? Number(p.fragileShippingCost) : null,
  };
}

export function productImagesToForm(images: Img[]) {
  return images.map((i) => ({
    id: i.id,
    image_url: i.imageUrl,
    sort_order: i.sortOrder,
    alt_text: i.altText,
  }));
}
