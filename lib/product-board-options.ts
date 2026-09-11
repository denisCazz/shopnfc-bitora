/** Categoria che contiene schede e centraline (non tutti i prodotti richiedono la scelta). */
export const ELECTRONIC_BOARDS_CATEGORY_SLUG = "schede-elettroniche-sensori";

/** Scheda/centralina elettronica: richiede scelta programmata vs vergine. */
export function productNeedsBoardProgrammingOption(p: {
  categorySlug: string;
  name_it: string;
}): boolean {
  if (p.categorySlug !== ELECTRONIC_BOARDS_CATEGORY_SLUG) return false;
  const n = p.name_it.toUpperCase();
  // Solo SCHEDA e CENTRALINA richiedono la scelta; connettori, sensori, ecc. no
  return (
    (n.includes("SCHEDA") || n.includes("CENTRALINA")) &&
    !n.includes("CONNETTORE")
  );
}
