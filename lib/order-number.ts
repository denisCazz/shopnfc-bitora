/**
 * Numerazione ordini mostrata a video e nelle email.
 *
 * Nel database manteniamo la numerazione progressiva (intero `orders.id`).
 * Verso l'esterno il numero viene mostrato con il sezionale, es. l'ordine 11
 * diventa "11/A".
 */

export const ORDER_NUMBERING_SUFFIX = "/A";

/** Numero ordine formattato per la visualizzazione, es. 11 -> "11/A". */
export function formatOrderNumber(id: number | string): string {
  return `${id}${ORDER_NUMBERING_SUFFIX}`;
}
