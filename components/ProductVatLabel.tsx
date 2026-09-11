"use client";

import { useLocale } from "@/lib/locale-context";
import { useCatalogDisplayPrice } from "@/lib/use-catalog-display-price";

export default function ProductVatLabel() {
  const { t } = useLocale();
  const { pricesIncludeVat } = useCatalogDisplayPrice();

  return (
    <p className="text-xs text-muted">
      {t(pricesIncludeVat ? "product.vat" : "product.vat_excluded")}
    </p>
  );
}
