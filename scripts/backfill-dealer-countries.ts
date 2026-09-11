/**
 * Corregge il campo `profiles.country` dei rivenditori già in DB,
 * derivandolo dal prefisso della P.IVA/VAT (es. FR… → FR, IT…/11 cifre → IT).
 *
 * Uso:
 *   npx tsx scripts/backfill-dealer-countries.ts          # anteprima (dry-run)
 *   npx tsx scripts/backfill-dealer-countries.ts --apply  # applica le correzioni
 */
import path from "node:path";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { dealerProfiles, profiles } from "../db/schema";
import { countryCodeFromEuVat } from "../lib/italian-vat";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const APPLY = process.argv.includes("--apply");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL non impostato (.env)");
    process.exit(1);
  }

  const db = getDb();
  const rows = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      companyName: dealerProfiles.companyName,
      vatNumber: dealerProfiles.vatNumber,
      country: profiles.country,
    })
    .from(dealerProfiles)
    .innerJoin(profiles, eq(dealerProfiles.id, profiles.id));

  const toFix = rows
    .map((r) => {
      const expected = countryCodeFromEuVat(r.vatNumber);
      const current = (r.country || "IT").trim().toUpperCase();
      return { ...r, expected, current };
    })
    .filter((r) => r.current !== r.expected);

  if (toFix.length === 0) {
    console.log(`Nessuna correzione necessaria su ${rows.length} rivenditori.`);
    return;
  }

  console.log(
    APPLY
      ? `Applico ${toFix.length} correzioni su ${rows.length} rivenditori:\n`
      : `Anteprima: ${toFix.length} rivenditori da correggere su ${rows.length} (dry-run, usa --apply per salvare):\n`
  );

  for (const r of toFix) {
    console.log(
      `  ${r.email} | ${r.companyName} | P.IVA ${r.vatNumber} | ${r.current} → ${r.expected}`
    );
  }

  if (!APPLY) {
    console.log("\nEsegui con --apply per aggiornare il database.");
    return;
  }

  const now = new Date();
  for (const r of toFix) {
    await db
      .update(profiles)
      .set({ country: r.expected, updatedAt: now })
      .where(eq(profiles.id, r.id));
  }

  console.log(`\nAggiornati ${toFix.length} profili rivenditori.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
