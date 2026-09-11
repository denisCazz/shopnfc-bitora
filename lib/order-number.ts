/**
 * Numerazione ordini mostrata a video ed esportata verso Danea Easyfatt.
 *
 * Nel database manteniamo la nostra numerazione progressiva (intero `orders.id`).
 * Verso l'esterno (UI, email, export Danea) il numero viene mostrato con il
 * sezionale alfanumerico, es. l'ordine 11 diventa "11/A".
 *
 * Per l'export Easyfatt il numero va inviato come `<Number>` (parte numerica)
 * + `<Numbering>` (sezionale, es. "/A"): vedi ORDER_NUMBERING_SUFFIX.
 */

/** Sezionale di numerazione usato per gli ordini (campo Numbering di Easyfatt). */
export const ORDER_NUMBERING_SUFFIX = "/A";

/** Numero ordine formattato per la visualizzazione, es. 11 -> "11/A". */
export function formatOrderNumber(id: number | string): string {
  return `${id}${ORDER_NUMBERING_SUFFIX}`;
}
