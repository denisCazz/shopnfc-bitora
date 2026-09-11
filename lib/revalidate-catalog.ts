import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

/** Invalidate DB cache + storefront after catalog mutations. */
export function revalidateCatalog() {
  revalidateTag(CACHE_TAGS.products, "max");
  revalidateTag(CACHE_TAGS.categories, "max");
  revalidateTag(CACHE_TAGS.pricing, "max");
  revalidatePath("/");
  revalidatePath("/tag-nfc");
  revalidatePath("/tag-nfc-personalizzati");
  revalidatePath("/sitemap.xml");
}
