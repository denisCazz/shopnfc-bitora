/**
 * Shipping cost calculation for Shop NFC Bitora.
 *
 * Rates are stored in the `app_settings` table (key = "shipping").
 * Falls back to hardcoded defaults if the DB record is missing.
 *
 * Zones:
 *   - italy            : standard Italian mainland provinces
 *   - islands_calabria : Sicily, Sardinia + Calabria (surcharge)
 *   - europe           : all non-Italian countries
 */

import { getDb } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShippingZone = "italy" | "islands_calabria" | "europe";

export type ShippingTier = {
  maxKg: number;  // inclusive upper bound (kg)
  rate: number;   // net rate in EUR
};

export type ZoneConfig = {
  label: string;
  tiers: ShippingTier[];
  includesIva: boolean;
};

export type EuropeShippingMethod = "standard_10" | "standard_30" | "dhl";

export type ShippingConfig = {
  zones: Record<ShippingZone, ZoneConfig>;
  codSurcharge: number;
  ivaRate: number;
  islandsCalabriaProvincia: string[];
  dhlRate: number;
};

// ─── Hardcoded defaults ───────────────────────────────────────────────────────

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  zones: {
    italy: {
      label: "Italia",
      tiers: [{ maxKg: 10, rate: 8.5 }, { maxKg: 30, rate: 12.5 }],
      includesIva: true,
    },
    islands_calabria: {
      label: "Isole e Calabria",
      tiers: [{ maxKg: 10, rate: 12.5 }, { maxKg: 30, rate: 16.5 }],
      includesIva: true,
    },
    europe: {
      label: "Europa",
      tiers: [{ maxKg: 10, rate: 20.0 }, { maxKg: 30, rate: 30.0 }],
      includesIva: false,
    },
  },
  codSurcharge: 7.0,
  ivaRate: 0.22,
  dhlRate: 45.0,
  islandsCalabriaProvincia: [
    "AG", "CL", "CT", "EN", "ME", "PA", "RG", "SR", "TP",
    "CA", "CI", "MD", "NU", "OG", "OT", "OR", "SS", "SU", "VS",
    "CS", "CZ", "KR", "RC", "VV",
  ],
};

// ─── DB-backed config loader ──────────────────────────────────────────────────

let _cachedConfig: ShippingConfig | null = null;
let _cacheTs = 0;
const CACHE_TTL_MS = 60_000;

export async function getShippingConfig(): Promise<ShippingConfig> {
  const now = Date.now();
  if (_cachedConfig && now - _cacheTs < CACHE_TTL_MS) return _cachedConfig;

  try {
    const db = getDb();
    const [row] = await db
      .select({ value: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, "shipping"))
      .limit(1);

    if (row?.value) {
      _cachedConfig = row.value as unknown as ShippingConfig;
      _cacheTs = now;
      return _cachedConfig;
    }
  } catch {
    // DB unavailable – fall through to default
  }

  return DEFAULT_SHIPPING_CONFIG;
}

export function invalidateShippingConfigCache() {
  _cachedConfig = null;
  _cacheTs = 0;
}

// ─── Pure calculation helpers ─────────────────────────────────────────────────

export function getShippingZone(
  country: string,
  province?: string | null,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG
): ShippingZone {
  const isItaly =
    country === "Italia" ||
    country === "IT" ||
    country.toLowerCase() === "italia";

  if (!isItaly) return "europe";

  const provinces = new Set(config.islandsCalabriaProvincia);
  if (province && provinces.has(province.toUpperCase())) {
    return "islands_calabria";
  }

  return "italy";
}

export function calculateShippingCost(
  totalWeightKg: number,
  zone: ShippingZone,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG
): number {
  const weight = Math.max(totalWeightKg, 0.1);
  const zoneConfig = config.zones[zone];
  const sorted = [...zoneConfig.tiers].sort((a, b) => a.maxKg - b.maxKg);
  const tier = sorted.find((t) => weight <= t.maxKg) ?? sorted[sorted.length - 1];

  if (zoneConfig.includesIva) {
    return Math.round(tier.rate * (1 + config.ivaRate) * 100) / 100;
  }
  return tier.rate;
}

export function getShippingZoneLabel(
  zone: ShippingZone,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG
): string {
  return config.zones[zone]?.label ?? zone;
}

/**
 * Returns the net shipping cost (no IVA) for a specific Europe shipping method.
 * Used when the customer explicitly selects a method instead of weight-based calculation.
 */
export function calculateEuropeShippingCost(
  method: EuropeShippingMethod,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG
): number {
  if (method === "dhl") return config.dhlRate ?? 45.0;
  const sorted = [...config.zones.europe.tiers].sort((a, b) => a.maxKg - b.maxKg);
  if (method === "standard_10") return sorted[0]?.rate ?? 20.0;
  return sorted[1]?.rate ?? sorted[0]?.rate ?? 30.0;
}
