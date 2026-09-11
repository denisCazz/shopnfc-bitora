"use server";

import { getDb } from "@/db";
import { appSettings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import {
  DEFAULT_SHIPPING_CONFIG,
  invalidateShippingConfigCache,
  type ShippingConfig,
} from "@/lib/shipping";

export async function getShippingSettings(): Promise<ShippingConfig> {
  try {
    const db = getDb();
    const [row] = await db
      .select({ value: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, "shipping"))
      .limit(1);
    if (row?.value) return row.value as unknown as ShippingConfig;
  } catch {
    // fall through
  }
  return DEFAULT_SHIPPING_CONFIG;
}

export async function saveShippingSettings(
  config: ShippingConfig
): Promise<{ ok: boolean; message: string }> {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return { ok: false, message: "Non autorizzato" };
  }

  // Basic sanity checks
  const zones = ["italy", "islands_calabria", "europe"] as const;
  for (const z of zones) {
    const zone = config.zones[z];
    if (!zone?.tiers?.length) {
      return { ok: false, message: `Zona ${z}: almeno un scaglione richiesto` };
    }
    for (const tier of zone.tiers) {
      if (isNaN(tier.maxKg) || isNaN(tier.rate) || tier.rate < 0) {
        return { ok: false, message: `Zona ${z}: valori non validi` };
      }
    }
  }
  if (isNaN(config.codSurcharge) || config.codSurcharge < 0) {
    return { ok: false, message: "Supplemento contrassegno non valido" };
  }
  if (config.dhlRate != null && (isNaN(config.dhlRate) || config.dhlRate < 0)) {
    return { ok: false, message: "Tariffa DHL non valida" };
  }
  if (isNaN(config.ivaRate) || config.ivaRate < 0 || config.ivaRate > 1) {
    return { ok: false, message: "Aliquota IVA non valida (usare decimale, es. 0.22)" };
  }

  try {
    const db = getDb();
    await db
      .insert(appSettings)
      .values({
        key: "shipping",
        value: config as unknown as Record<string, unknown>,
        updatedAt: sql`NOW()`,
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          value: config as unknown as Record<string, unknown>,
          updatedAt: sql`NOW()`,
        },
      });

    invalidateShippingConfigCache();
    return { ok: true, message: "Tariffe spedizione salvate" };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "Errore durante il salvataggio" };
  }
}
