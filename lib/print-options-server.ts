import { getDb } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  DEFAULT_PRINT_PRICES,
  normalizePrintPrices,
  type PrintConfig,
  type PrintPrices,
} from "@/lib/print-options";

let cached: PrintConfig | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;

export function invalidatePrintConfigCache() {
  cached = null;
  cachedAt = 0;
}

export async function getPrintConfig(): Promise<PrintConfig> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) return cached;

  try {
    const db = getDb();
    const [row] = await db
      .select({ value: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, "print"))
      .limit(1);
    const raw = row?.value as Partial<PrintPrices> | undefined;
    cached = { prices: normalizePrintPrices(raw) };
    cachedAt = now;
    return cached;
  } catch {
    cached = { prices: DEFAULT_PRINT_PRICES };
    cachedAt = now;
    return cached;
  }
}
