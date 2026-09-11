/**
 * EU VIES VAT validation
 * Uses the European Commission's VIES SOAP service
 */

const VIES_URL = "https://ec.europa.eu/taxation_customs/vies/services/checkVatService";

interface ViesResult {
  valid: boolean;
  name: string | null;
  address: string | null;
  error?: string;
}

// Simple in-memory cache (24h TTL)
const cache = new Map<string, { result: ViesResult; expiry: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function validateVAT(
  countryCode: string,
  vatNumber: string
): Promise<ViesResult> {
  // Sanitize input
  const cc = countryCode.toUpperCase().trim().slice(0, 2);
  const vat = vatNumber.replace(/[\s\-.]/g, "").trim();

  if (!cc || !vat) {
    return { valid: false, name: null, address: null, error: "Dati mancanti" };
  }

  // Check cache
  const cacheKey = `${cc}:${vat}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.result;
  }

  const soapBody = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
      <soapenv:Header/>
      <soapenv:Body>
        <urn:checkVat>
          <urn:countryCode>${cc}</urn:countryCode>
          <urn:vatNumber>${vat}</urn:vatNumber>
        </urn:checkVat>
      </soapenv:Body>
    </soapenv:Envelope>
  `;

  try {
    const response = await fetch(VIES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml;charset=UTF-8",
        SOAPAction: "",
      },
      body: soapBody,
      signal: AbortSignal.timeout(10000),
    });

    const xml = await response.text();

    // VIES risponde con tag namespaced (es. <ns2:valid>), quindi il prefisso è opzionale.
    const validMatch = xml.match(/<(?:\w+:)?valid>(true|false)<\/(?:\w+:)?valid>/i);
    const nameMatch = xml.match(/<(?:\w+:)?name>([^<]*)<\/(?:\w+:)?name>/i);
    const addressMatch = xml.match(/<(?:\w+:)?address>([^<]*)<\/(?:\w+:)?address>/i);

    if (!validMatch) {
      // Check for SOAP fault
      const faultMatch = xml.match(/<(?:\w+:)?faultstring>([^<]*)<\/(?:\w+:)?faultstring>/i);
      return {
        valid: false,
        name: null,
        address: null,
        error: faultMatch?.[1] || "Errore di validazione VIES",
      };
    }

    // VIES usa "---" quando il dato non è divulgato: trattalo come assente.
    const clean = (v?: string) => {
      const t = v?.trim();
      return t && t !== "---" ? t : null;
    };

    const result: ViesResult = {
      valid: validMatch[1].toLowerCase() === "true",
      name: clean(nameMatch?.[1]),
      address: clean(addressMatch?.[1]),
    };

    // Cache result
    cache.set(cacheKey, { result, expiry: Date.now() + CACHE_TTL });

    return result;
  } catch (error) {
    console.error("VIES validation error:", error);
    return {
      valid: false,
      name: null,
      address: null,
      error: "Servizio VIES non disponibile. Riprova più tardi.",
    };
  }
}
