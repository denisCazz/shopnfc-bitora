/**
 * Italian Partita IVA (11 digits): check digit per specifiche Agenzia delle Entrate.
 */
export function isValidItalianPartitaIva(raw: string): boolean {
  const normalized = raw.trim().replace(/^IT/i, "").replace(/\s/g, "");
  if (!/^\d{11}$/.test(normalized)) return false;

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const pos = i + 1;
    let d = parseInt(normalized[i], 10);
    if (pos % 2 === 1) {
      sum += d;
    } else {
      d *= 2;
      if (d > 9) d -= 9;
      sum += d;
    }
  }
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(normalized[10], 10);
}

/**
 * Formati VAT per i 27 paesi UE (parte dopo il prefisso di 2 lettere del paese).
 * Riferimento: specifiche VIES della Commissione Europea.
 */
const EU_VAT_PATTERNS: Record<string, RegExp> = {
  AT: /^U\d{8}$/,
  BE: /^0\d{9}$/,
  BG: /^\d{9,10}$/,
  CY: /^\d{8}[A-Z]$/,
  CZ: /^\d{8,10}$/,
  DE: /^\d{9}$/,
  DK: /^\d{8}$/,
  EE: /^\d{9}$/,
  EL: /^\d{9}$/,
  ES: /^[A-Z0-9]\d{7}[A-Z0-9]$/,
  FI: /^\d{8}$/,
  FR: /^[A-Z0-9]{2}\d{9}$/,
  HR: /^\d{11}$/,
  HU: /^\d{8}$/,
  IE: /^(\d{7}[A-Z]{1,2}|\d[A-Z]\d{5}[A-Z])$/,
  IT: /^\d{11}$/,
  LT: /^(\d{9}|\d{12})$/,
  LU: /^\d{8}$/,
  LV: /^\d{11}$/,
  MT: /^\d{8}$/,
  NL: /^\d{9}B\d{2}$/,
  PL: /^\d{10}$/,
  PT: /^\d{9}$/,
  RO: /^\d{2,10}$/,
  SE: /^\d{12}$/,
  SI: /^\d{8}$/,
  SK: /^\d{10}$/,
};

// La Grecia usa il prefisso EL per il VAT ma GR come codice ISO.
const COUNTRY_ALIASES: Record<string, string> = { GR: "EL" };

/**
 * Valida una Partita IVA / VAT number europeo.
 * - Se è italiana (prefisso IT o 11 cifre senza prefisso) applica anche la cifra di controllo.
 * - Per gli altri paesi UE verifica il formato in base al prefisso del paese.
 */
export function isValidEuVatNumber(raw: string): boolean {
  const cleaned = raw.trim().toUpperCase().replace(/[\s.\-]/g, "");

  const prefixMatch = cleaned.match(/^([A-Z]{2})(.+)$/);

  if (prefixMatch) {
    let [, country, rest] = prefixMatch;
    country = COUNTRY_ALIASES[country] ?? country;
    const pattern = EU_VAT_PATTERNS[country];
    if (!pattern) return false;
    if (!pattern.test(rest)) return false;
    if (country === "IT") return isValidItalianPartitaIva(rest);
    return true;
  }

  // Nessun prefisso: trattala come Partita IVA italiana (11 cifre).
  return isValidItalianPartitaIva(cleaned);
}

/** Prefisso paese su P.IVA / VAT (es. FR, DE). Null se assente o non riconosciuto. */
export function euVatCountryPrefix(vat: string): string | null {
  const cleaned = vat.trim().toUpperCase().replace(/[\s.\-]/g, "");
  const match = cleaned.match(/^([A-Z]{2})(.+)$/);
  if (!match) return null;
  const cc = match[1];
  return COUNTRY_ALIASES[cc] ?? cc;
}

/**
 * Codice paese ISO (2 lettere) per il profilo rivenditore, derivato dalla P.IVA/VAT.
 * - Prefisso UE (es. FR, DE) → codice ISO corrispondente (EL Grecia → GR).
 * - Nessun prefisso (P.IVA italiana a 11 cifre) → IT.
 */
export function countryCodeFromEuVat(vat: string): string {
  const prefix = euVatCountryPrefix(vat);
  if (!prefix) return "IT";
  if (prefix === "EL") return "GR";
  return prefix;
}

/**
 * IVA italiana inclusa sul prezzo prodotto?
 * - P.IVA italiana valida → sì
 * - P.IVA UE estera → no (cessione intracomunitaria)
 * - Privato / senza P.IVA e spedizione in Italia → sì
 * - Spedizione fuori Italia senza P.IVA italiana → no
 */
export function italianVatIncludedOnProducts(
  shippingCountry: string,
  billingVatNumber: string | undefined
): boolean {
  const vat = billingVatNumber?.trim();
  if (vat) {
    if (isValidItalianPartitaIva(vat)) return true;
    const prefix = euVatCountryPrefix(vat);
    if (prefix && prefix !== "IT") return false;
  }
  if (shippingCountry === "Italia") return true;
  return false;
}
