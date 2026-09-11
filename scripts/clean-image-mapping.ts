/**
 * Script per pulire e separare il mapping immagini-prodotti.
 * 
 * - Genera "image-product-matched.csv" con le associazioni trovate (nomi puliti)
 * - Genera "image-product-unmatched.csv" con le immagini senza match (per review manuale)
 * - Corregge match errati noti (es. "stufa-a-pellet-11kw-sara" → non è "MARY")
 *
 * Uso: npx tsx scripts/clean-image-mapping.ts
 */

import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

interface ImageMatch {
  imageFile: string;
  r2Url: string;
  r2Key: string;
  productId: number | null;
  productName: string | null;
  productSku: string | null;
  matchType: "sku" | "name-exact" | "name-partial" | "unmatched";
  confidence: "high" | "medium" | "low" | "none";
}

// =====================================================
// CORREZIONI MANUALI: match errati da scartare
// =====================================================
const FALSE_MATCHES: Array<{ imagePattern: RegExp; wrongProductId: number }> = [
  // "stufa-a-pellet-11kw-sara" NON è "STUFA A PELLET PUNTOFUOCO 13,5 KW MARY"
  { imagePattern: /stufa-a-pellet-11kw-sara/i, wrongProductId: 101 },
  // "SCHEDA ELETTRONICA CEZA" NON è "SCHEDA ELETTRONICA DUEPI"
  { imagePattern: /SCHEDA ELETTRONICA CEZA/i, wrongProductId: 38 },
  // "VENTILATORE FUMI EBM SENZA ENCODER" NON è "VENTILATORE FUMI CON ENCODER"
  { imagePattern: /VENTILATORE FUMI EBM SENZA ENCODER/i, wrongProductId: 15 },
  { imagePattern: /ventilatore-fumi-ebm-senza-encoder/i, wrongProductId: 15 },
  { imagePattern: /ventilatore-fumi-ebm\.jpg/i, wrongProductId: 15 },
  // "TELECOMANDO RADIO SILENCE" NON è "TELECOMANDO RADIO MICRONOVA"
  { imagePattern: /TELECOMANDO RADIO SILENCE/i, wrongProductId: 33 },
  // "TELECOMANDO RADIO RAFFAELLO-GIOTTO" NON è "TELECOMANDO RADIO MICRONOVA"
  { imagePattern: /TELECOMANDO RADIO RAFFAELLO/i, wrongProductId: 33 },
  // "CONNETTORE 2 POLI" NON è "CONNETTORE SCHEDA 10 POLI"
  { imagePattern: /^CONNETTORE 2 POLI/i, wrongProductId: 70 },
  // "resistenza-elettrica-9,9mm-170mm" NON è "12,5 mm LUNGH.130 mm"
  { imagePattern: /resistenza-elettrica-9,9mm-170mm/i, wrongProductId: 23 },
  // "SCHEDA MICRONOVA UO47" NON è "SCHEDA ELETTRONICA MICRONOVA I023"
  { imagePattern: /SCHEDA MICRONOVA UO47/i, wrongProductId: 35 },
  // "SENSORE LIVELLO PELLET" NON è "SENSORE DEBIMETRO"
  { imagePattern: /SENSORE LIVELLO PELLET/i, wrongProductId: 52 },
  // "VENTILATORE TANGENZIALE (2)" / "VENTILATORE TANGENZIALE.jpg" senza GRANDE/PICCOLO → ambiguo
  { imagePattern: /^VENTILATORE TANGENZIALE(\s*\(2\))?\.jpg$/i, wrongProductId: 18 },
  // "MOTORIDUTTORE PER STUFE A PELLET MELLOR 2 RPM" NON è "MELLOR 4 RPM"
  { imagePattern: /MOTORIDUTTORE PER STUFE A PELLET MELLOR 2 RPM/i, wrongProductId: 14 },
  { imagePattern: /MOTORIDUTTORE PER STUFE A PELLET MELLOR 3 RPM/i, wrongProductId: 14 },
  // "motoriduttore-per-stufe-a-pellet-mellor-3.jpg" troppo generico
  { imagePattern: /motoriduttore-per-stufe-a-pellet-mellor-3\.jpg/i, wrongProductId: 14 },
];

// =====================================================
// OVERRIDE MANUALI: associazioni corrette note
// =====================================================
const MANUAL_OVERRIDES: Array<{ imagePattern: RegExp; productId: number; productName: string }> = [
  // LCD Micronova BLU e DIETRO → sono varianti dello stesso display LCD
  { imagePattern: /DISPLAY LCD A 6 TASTI MICRONOVA BLU/i, productId: 27, productName: "DISPLAY LCD A 6 TASTI MICRONOVA" },
  { imagePattern: /DISPLAY LCD A 6 TASTI MICRONOVA DIETRO/i, productId: 27, productName: "DISPLAY LCD A 6 TASTI MICRONOVA" },
  // LED 6 tasti verticale → è un prodotto diverso ma il match a 28 è ragionevole come variante
  { imagePattern: /DISPLAY LED A 6 TASTI VERTICALE/i, productId: 28, productName: "DISPLAY LED A 6 TASTI MICRONOVA" },
  // Braciere SUSY-PERLA-CATRIA → match a 56 è corretto
  { imagePattern: /BRACIERE SUSY-PERLA-CATRIA EVACALOR/i, productId: 56, productName: "BRACIERE SUSY-PERLA 7,5 KW EVACALOR" },
  // RESISTENZA CERAMICA ATTACCO 38 → 51 è corretto
  { imagePattern: /RESISTENZA CERAMICA ATTACCO 38/i, productId: 51, productName: "RESISTENZA CERAMICA ATTACCO 3/8" },
  // RESISTENZA 9,9 mm x 140 mm → 25 è corretto
  { imagePattern: /RESISTENZA ELETTRICA.*9,9 mm x 140/i, productId: 25, productName: "RESISTENZA ELETTRICA Ø 9,9 mm x 140 mm ATTACCO A FILETTO 3/8" },
  // RESISTENZA 12,5 mm 160MM ATTACCO FILETTO → 59 è corretto
  { imagePattern: /RESISTENZA ELETTRICA.*12,5 mm LUNGH\.160MM ATTACCO/i, productId: 59, productName: "RESISTENZA ELETTRICA Ø 12,5 mm LUNGH.160mm 350w ATTACCO A FILETTO 1/2" },
  // SCHEDA MICRONOVA → 35 è ragionevole
  { imagePattern: /SCHEDA ELETTRONICA MICRONOVA\.jpg/i, productId: 35, productName: "SCHEDA ELETTRONICA MICRONOVA I023" },
  { imagePattern: /SCHEDA ELETTRONICA I023/i, productId: 35, productName: "SCHEDA ELETTRONICA MICRONOVA I023" },
  // motoriduttore mellor 3 RPM con sensore → 122
  { imagePattern: /motoriduttore.*mellor.*3.*rpm.*sensore/i, productId: 122, productName: "MOTORE COCLEA PER STUFE A PELLET 3 RPM CON SENSORE GIRI" },
  // VENTILATORE ARIA CENTRIFUGO RLH → 54
  { imagePattern: /VENTILATORE ARIA CENTRIFUGO RLH/i, productId: 54, productName: "VENTILATORE ARIA CENTRIFUGO RLH120/0038-3038LH" },
  // wifi duepi → 177
  { imagePattern: /wifi duepi/i, productId: 177, productName: "MODULO WIFI DUEPI" },
  // PARAFIAMMA HYDRO → 98
  { imagePattern: /PARAFIAMMA HYDRO/i, productId: 98, productName: "PARAFIAMMA STUFE HYDRO" },
  // display duepi 3 tasti → 30
  { imagePattern: /display.*duepi.*3.*tasti/i, productId: 30, productName: "DISPLAY LED A 3 TASTI DUEPI" },
  // duepi 3 tasti led → 30
  { imagePattern: /duepi 3 tasti led/i, productId: 30, productName: "DISPLAY LED A 3 TASTI DUEPI" },
  // BOCCOLA PER COCLEA → 110
  { imagePattern: /BOCCOLA PER COCLEA/i, productId: 110, productName: "BOCCOLA PER COCLEA FEMMINA" },
  // telecomando Micronova → 33
  { imagePattern: /^telecomando Micronova/i, productId: 33, productName: "TELECOMANDO RADIO MICRONOVA" },
  // display vert micro 6 tasti → 28
  { imagePattern: /display vert.*micro.*6 tasti/i, productId: 28, productName: "DISPLAY LED A 6 TASTI MICRONOVA" },
  { imagePattern: /display verticale micro 6 tasti/i, productId: 28, productName: "DISPLAY LED A 6 TASTI MICRONOVA" },
  // Misure Braciere → 175
  { imagePattern: /Misure Braciere/i, productId: 175, productName: "BRACIERE IN GHISA" },
];

function isFalseMatch(match: ImageMatch): boolean {
  return FALSE_MATCHES.some(
    (fm) => fm.imagePattern.test(match.imageFile) && match.productId === fm.wrongProductId
  );
}

function getManualOverride(match: ImageMatch): { productId: number; productName: string } | null {
  for (const ov of MANUAL_OVERRIDES) {
    if (ov.imagePattern.test(match.imageFile)) {
      return { productId: ov.productId, productName: ov.productName };
    }
  }
  return null;
}

function extractCategoryFromR2Url(url: string): string {
  // https://...r2.dev/products/CATEGORY/file.jpg → CATEGORY
  const match = url.match(/\/products\/([^/]+)\//);
  return match ? match[1] : "sconosciuta";
}

function main() {
  console.log("=== Pulizia mapping immagini-prodotti ===\n");

  const mappingPath = path.join(__dirname, "image-product-mapping.json");
  if (!fs.existsSync(mappingPath)) {
    console.error("❌ image-product-mapping.json non trovato. Esegui prima associate-images-to-products.ts");
    process.exit(1);
  }

  const allMatches: ImageMatch[] = JSON.parse(fs.readFileSync(mappingPath, "utf-8"));
  console.log(`Totale immagini: ${allMatches.length}\n`);

  const matched: Array<ImageMatch & { cleanConfidence: string }> = [];
  const unmatched: ImageMatch[] = [];

  let falseMatchesRemoved = 0;
  let overridesApplied = 0;

  for (const m of allMatches) {
    // 1. Se era unmatched → vai in unmatched
    if (m.confidence === "none") {
      // Ma controlla se c'è un override manuale
      const override = getManualOverride(m);
      if (override) {
        matched.push({
          ...m,
          productId: override.productId,
          productName: override.productName,
          matchType: "name-partial",
          confidence: "medium",
          cleanConfidence: "manual-override",
        });
        overridesApplied++;
        continue;
      }
      unmatched.push(m);
      continue;
    }

    // 2. Controlla se è un falso match
    if (isFalseMatch(m)) {
      // Controlla se c'è un override
      const override = getManualOverride(m);
      if (override) {
        matched.push({
          ...m,
          productId: override.productId,
          productName: override.productName,
          confidence: "medium",
          cleanConfidence: "manual-override",
        });
        overridesApplied++;
      } else {
        unmatched.push({ ...m, productId: null, productName: null, confidence: "none", matchType: "unmatched" });
      }
      falseMatchesRemoved++;
      continue;
    }

    // 3. Controlla se c'è un override che migliora il match
    const override = getManualOverride(m);
    if (override) {
      matched.push({
        ...m,
        productId: override.productId,
        productName: override.productName,
        cleanConfidence: m.confidence === "high" ? "high" : "manual-verified",
      });
      if (override.productId !== m.productId) overridesApplied++;
      continue;
    }

    // 4. Match valido, tieni così
    matched.push({ ...m, cleanConfidence: m.confidence });
  }

  // === Salva MATCHED CSV ===
  const matchedCsvPath = path.join(__dirname, "image-product-matched.csv");
  const matchedHeader = "Categoria,Immagine,R2 URL,Prodotto ID,Prodotto Nome,Match Type,Confidence\n";
  const matchedRows = matched
    .sort((a, b) => {
      // Ordina per prodotto, poi per confidence
      const pA = a.productId || 9999;
      const pB = b.productId || 9999;
      if (pA !== pB) return pA - pB;
      return a.imageFile.localeCompare(b.imageFile);
    })
    .map((m) => {
      const cat = extractCategoryFromR2Url(m.r2Url);
      return `"${cat}","${m.imageFile}","${m.r2Url}","${m.productId}","${m.productName}","${m.matchType}","${m.cleanConfidence}"`;
    })
    .join("\n");
  fs.writeFileSync(matchedCsvPath, matchedHeader + matchedRows);

  // === Salva UNMATCHED CSV ===
  const unmatchedCsvPath = path.join(__dirname, "image-product-unmatched.csv");
  const unmatchedHeader = "Categoria,Immagine,R2 URL,Note\n";
  const unmatchedRows = unmatched
    .sort((a, b) => {
      const catA = extractCategoryFromR2Url(a.r2Url);
      const catB = extractCategoryFromR2Url(b.r2Url);
      if (catA !== catB) return catA.localeCompare(catB);
      return a.imageFile.localeCompare(b.imageFile);
    })
    .map((m) => {
      const cat = extractCategoryFromR2Url(m.r2Url);
      const note = /^(whatsapp|gopr|img[_ ]|[0-9a-f]{8}-)/i.test(m.imageFile)
        ? "foto generica"
        : /^\d+(\.\w+)?$/.test(m.imageFile.replace(/\.\w+$/, ""))
          ? "solo numero"
          : "da associare manualmente";
      return `"${cat}","${m.imageFile}","${m.r2Url}","${note}"`;
    })
    .join("\n");
  fs.writeFileSync(unmatchedCsvPath, unmatchedHeader + unmatchedRows);

  // === Salva JSON pulito per lo script --apply ===
  const cleanJsonPath = path.join(__dirname, "image-product-clean.json");
  fs.writeFileSync(cleanJsonPath, JSON.stringify(matched, null, 2));

  // === Riepilogo ===
  console.log("=== RIEPILOGO ===\n");
  console.log(`✅ Matchate (pulite):    ${matched.length}`);
  console.log(`❓ Non matchate:         ${unmatched.length}`);
  console.log(`🔧 Falsi match rimossi:  ${falseMatchesRemoved}`);
  console.log(`📌 Override manuali:     ${overridesApplied}`);

  // Stats per confidence
  const confStats: Record<string, number> = {};
  for (const m of matched) {
    confStats[m.cleanConfidence] = (confStats[m.cleanConfidence] || 0) + 1;
  }
  console.log("\nPer livello di confidenza:");
  for (const [conf, count] of Object.entries(confStats).sort()) {
    console.log(`  ${conf}: ${count}`);
  }

  // Stats unmatched per tipo
  const unmatchedNotes: Record<string, number> = {};
  for (const row of unmatched) {
    const note = /^(whatsapp|gopr|img[_ ]|[0-9a-f]{8}-)/i.test(row.imageFile)
      ? "foto generica"
      : /^\d+(\.\w+)?$/.test(row.imageFile.replace(/\.\w+$/, ""))
        ? "solo numero"
        : "da associare";
    unmatchedNotes[note] = (unmatchedNotes[note] || 0) + 1;
  }
  console.log("\nNon matchate per tipo:");
  for (const [note, count] of Object.entries(unmatchedNotes).sort()) {
    console.log(`  ${note}: ${count}`);
  }

  // Prodotti con immagini
  const productIds = new Set(matched.map((m) => m.productId));
  console.log(`\n📦 Prodotti con almeno un'immagine: ${productIds.size}`);

  console.log(`\n📄 File generati:`);
  console.log(`  ${matchedCsvPath}`);
  console.log(`  ${unmatchedCsvPath}`);
  console.log(`  ${cleanJsonPath}`);
}

main();
