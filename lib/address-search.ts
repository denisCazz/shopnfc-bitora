import { italianProvinceCode } from "@/lib/italian-provinces";

export type AddressSuggestion = {
  label: string;
  address: string;
  city: string;
  zip: string;
  province: string;
  country: string;
  countryCode: string;
};

const COUNTRY_IT: Record<string, string> = {
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

type PhotonFeature = {
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    locality?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    type?: string;
  };
};

function houseFromQuery(query: string): string {
  const m = query.match(/(?:^|[\s,])(\d+[a-zA-Z]?)(?:\s|$|,)/);
  return m?.[1] ?? "";
}

function streetLine(props: NonNullable<PhotonFeature["properties"]>, query: string): string {
  const street = props.street || (props.type === "street" || props.type === "house" ? props.name : "");
  if (!street) return "";
  const number = props.housenumber || houseFromQuery(query);
  return [street, number].filter(Boolean).join(" ");
}

export function formatSuggestionLabel(s: AddressSuggestion): string {
  const loc = [s.zip, s.city].filter(Boolean).join(" ");
  const prov = s.province ? ` (${s.province})` : "";
  if (s.address && loc) return `${s.address}, ${loc}${prov}`;
  if (s.address) return `${s.address}${prov}`;
  return `${loc}${prov}`.trim() || s.country;
}

export function normalizePhotonFeatures(
  features: PhotonFeature[],
  query: string
): AddressSuggestion[] {
  const seen = new Set<string>();
  const out: AddressSuggestion[] = [];

  for (const feature of features) {
    const props = feature.properties;
    if (!props) continue;
    const countryCode = (props.countrycode || "").toUpperCase();
    const city =
      props.city ||
      (props.type === "city" || props.type === "locality" ? props.name : "") ||
      props.locality ||
      "";
    const zip = props.postcode || (/^\d{5}$/.test(query) && countryCode === "IT" ? query : "");
    const address = streetLine(props, query);
    if (!address && !city && !zip) continue;

    const suggestion: AddressSuggestion = {
      label: "",
      address,
      city,
      zip,
      province: countryCode === "IT" ? italianProvinceCode(props.county, props.state) : "",
      country: COUNTRY_IT[countryCode] || props.country || "",
      countryCode,
    };
    suggestion.label = formatSuggestionLabel(suggestion);
    if (!suggestion.label || seen.has(suggestion.label)) continue;
    seen.add(suggestion.label);
    out.push(suggestion);
  }

  return out;
}

export async function searchAddresses(
  query: string,
  country?: string | null
): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const params = new URLSearchParams({
    q,
    limit: "8",
  });

  const inItaly = !country || country === "Italia" || country === "IT";
  if (inItaly) {
    params.set("lat", "41.9");
    params.set("lon", "12.5");
  }

  const url = `https://photon.komoot.io/api/?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "ShopNFC-Bitora/1.0 (info@bitora.it)",
      Accept: "application/json",
    },
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`Address search failed (${res.status})`);
  }

  const data = (await res.json()) as { features?: PhotonFeature[] };
  let results = normalizePhotonFeatures(data.features || [], q);

  if (inItaly) {
    const italian = results.filter((s) => s.countryCode === "IT");
    if (italian.length) results = italian;
  }

  const cap = /^\d{5}$/.test(q);
  if (cap) {
    results.sort((a, b) => Number(b.zip === q) - Number(a.zip === q));
  }

  return results;
}
