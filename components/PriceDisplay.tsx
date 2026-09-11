"use client";

import { useUser } from "@/lib/user-context";
import { useCatalogDisplayPrice } from "@/lib/use-catalog-display-price";

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
        </span>
      </span>
    );
  }

  return <span className={className}>{formatCatalogPrice(price)}</span>;
}
