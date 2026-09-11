export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  categorySlug: string;
  image: string | null;
  weight?: number | null;
  stockQuantity?: number;
  minQuantity?: number;
  name_it?: string;
  name_en?: string;
  name_fr?: string;
  name_es?: string;
  description_it?: string;
  description_en?: string;
  description_fr?: string;
  description_es?: string;
  compatibleChipIds?: number[];
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}
