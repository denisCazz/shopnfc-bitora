"use client";

import { useCallback } from "react";
import { useLocale } from "@/lib/locale-context";
import { useUser } from "@/lib/user-context";
import { catalogDisplayPrice } from "@/lib/catalog-display-price";

export function useCatalogDisplayPrice() {
  const { formatPrice } = useLocale();
  const { pricesIncludeVat } = useUser();

  const toDisplayPrice = useCallback(
    (gross: number) => catalogDisplayPrice(gross, pricesIncludeVat),
    [pricesIncludeVat]
  );

  const formatCatalogPrice = useCallback(
    (gross: number) => formatPrice(toDisplayPrice(gross)),
    [formatPrice, toDisplayPrice]
  );

  return { toDisplayPrice, formatCatalogPrice, pricesIncludeVat };
}
