const METER_PRODUCT_CATEGORY_SLUGS = new Set([
  "guarnizioni-silicone",
]);

const METER_PRODUCT_NAME_KEYWORDS = [
  "CORDINO",
  "TRECCIA",
  "NASTRO",
  "NASTRI",
  "GUARNIZIONE",
];

/**
 * Alcuni articoli (es. cordini/trecce) sono venduti al metro.
 * In checkout la quantità rappresenta i metri richiesti.
 */
export function productSoldByMeter(p: {
  categorySlug: string;
  nameIt: string;
}): boolean {
  if (METER_PRODUCT_CATEGORY_SLUGS.has(p.categorySlug)) return true;
  const upperName = p.nameIt.toUpperCase();
  return METER_PRODUCT_NAME_KEYWORDS.some((k) => upperName.includes(k));
}
