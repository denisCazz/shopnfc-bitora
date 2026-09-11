import { getDb } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { clampMarkup, DEFAULT_MARKUP, type PricingConfig } from "@/lib/pricing";

let cached: PricingConfig | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;

export function invalidatePricingCache() {
  cached = null;
  cachedAt = 0;
}

export async function getPricingConfig(): Promise<PricingConfig> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) return cached;

  try {
    const db = getDb();
    const [row] = await db
      .select({ value: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, "pricing"))
      .limit(1);

    const raw = row?.value as { markup?: unknown } | undefined;
    const markup = clampMarkup(Number(raw?.markup ?? DEFAULT_MARKUP));
    cached = { markup };
    cachedAt = now;
    return cached;
  } catch {
    cached = { markup: DEFAULT_MARKUP };
    cachedAt = now;
    return cached;
  }
}
