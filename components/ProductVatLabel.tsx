"use client";

import { useLocale } from "@/lib/locale-context";
import { useCatalogDisplayPrice } from "@/lib/use-catalog-display-price";
import { minQuantityForProduct } from "@/lib/min-quantity";

export default function ProductVatLabel({
  minQuantity,
  sku,
  slug,
  name,
}: {
  minQuantity?: number;
  sku?: string | null;
  slug?: string;
  name?: string;
}) {
  const { t } = useLocale();
  const { pricesIncludeVat } = useCatalogDisplayPrice();
  const qty = minQuantityForProduct(minQuantity, { sku, slug, name });
  const showMinQty = qty > 1;

  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted">
        {t(pricesIncludeVat ? "product.vat" : "product.vat_excluded")}
      </p>
      {showMinQty && (
        <p className="text-xs text-muted">
          {t("product.min_qty").replace("{qty}", String(qty))}
        </p>
      )}
    </div>
  );
}
