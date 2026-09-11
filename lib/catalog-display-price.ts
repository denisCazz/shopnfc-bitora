import { italianVatIncludedOnProducts } from "@/lib/italian-vat";

export const ITALIAN_VAT_RATE = 0.22;

const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  IT: "Italia",
  AT: "Austria",
  BE: "Belgio",
  BG: "Bulgaria",
  HR: "Croazia",
  DK: "Danimarca",
  EE: "Estonia",
  FI: "Finlandia",
  FR: "Francia",
  DE: "Germania",
  GR: "Grecia",
  IE: "Irlanda",
  LV: "Lettonia",
  LT: "Lituania",
  LU: "Lussemburgo",
  MT: "Malta",
  NL: "Paesi Bassi",
  PL: "Polonia",
  PT: "Portogallo",
  CZ: "Repubblica Ceca",
  RO: "Romania",
  SK: "Slovacchia",
  SI: "Slovenia",
  ES: "Spagna",
  SE: "Svezia",
  HU: "Ungheria",
  GB: "Regno Unito",
  CH: "Svizzera",
};

function countryCodeToName(code: string | null | undefined): string {
  if (!code) return "Italia";
  const trimmed = code.trim();
  const upper = trimmed.toUpperCase();
  if (upper === "ITALIA" || upper === "ITALY") return "Italia";
  return COUNTRY_CODE_TO_NAME[upper] || trimmed;
}

export function grossToNetItalianVat(gross: number): number {
  return Math.round((gross / (1 + ITALIAN_VAT_RATE)) * 100) / 100;
}

/**
 * Catalogo: stessa logica del checkout, così i prezzi mostrati nello shop
 * coincidono con quelli applicati alla cassa.
 * - Ospiti → lordo IVA inclusa (paese sconosciuto durante la navigazione).
 * - Clienti registrati → si applica `italianVatIncludedOnProducts` sull'indirizzo
 *   di riferimento: un cliente estero vede il NETTO (IVA esclusa) anche nello
 *   shop, anche senza P.IVA/azienda nel profilo; un cliente italiano vede il
 *   lordo. Lo sconto dealer è indipendente e resta applicato a parte.
 */
export function catalogPricesIncludeItalianVat(opts: {
  isLoggedIn: boolean;
  company?: string | null;
  vatNumber?: string | null;
  country?: string | null;
}): boolean {
  if (!opts.isLoggedIn) return true;

  const vat = opts.vatNumber?.trim();
  return italianVatIncludedOnProducts(countryCodeToName(opts.country), vat || undefined);
}

/** Prezzo da mostrare in catalogo/carrello (DB = IVA italiana inclusa). */
export function catalogDisplayPrice(
  grossPrice: number,
  pricesIncludeVat: boolean
): number {
  return pricesIncludeVat ? grossPrice : grossToNetItalianVat(grossPrice);
}
