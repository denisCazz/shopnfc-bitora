"use client";

import { useUser } from "@/lib/user-context";
import { useLocale } from "@/lib/locale-context";
import { useCatalogDisplayPrice } from "@/lib/use-catalog-display-price";

function PriceEachSuffix() {
  const { t } = useLocale();
  return (
    <span className="ml-1 text-[0.55em] font-semibold tracking-wide text-muted align-baseline">
      {t("product.price_each")}
    </span>
  );
}

export default function PriceDisplay({
  price,
  className,
}: {
  price: number;
  className?: string;
}) {
  const { dealerDiscount } = useUser();
  const { formatCatalogPrice } = useCatalogDisplayPrice();

  if (dealerDiscount) {
    return (
      <span className={className}>
        <span className="line-through text-muted text-sm mr-2">{formatCatalogPrice(price)}</span>
        <span className="text-green-600">
          {formatCatalogPrice(price * (1 - dealerDiscount / 100))}
          <PriceEachSuffix />
        </span>
      </span>
    );
  }

  return (
    <span className={className}>
      {formatCatalogPrice(price)}
      <PriceEachSuffix />
    </span>
  );
}
