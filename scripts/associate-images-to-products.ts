/**
 * Script per associare le immagini R2 ai prodotti nel database.
 * 
 * Funzionamento:
 * 1. Legge il report generato da upload-images-to-r2.ts
 * 2. Per ogni categoria, cerca i prodotti corrispondenti nel DB
 * 3. Prova a fare match tra nome file immagine e nome/SKU prodotto
 * 4. Genera un file di mapping per review manuale + applica match sicuri
 *
 * Uso: npx tsx scripts/associate-images-to-products.ts [--apply]
 *
 * Prerequisiti:
 *   npm install @supabase/supabase-js dotenv
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const APPLY = process.argv.includes("--apply");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY richiesti");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface UploadResult {
  localPath: string;
  r2Key: string;
  r2Url: string;
  categoryId: number;
  categorySlug: string;
  filename: string;
  sizeMB: number;
}

interface UploadReport {
  byCategory: Record<string, UploadResult[]>;
}

interface ProductRow {
  id: number;
  name_it: string;
  slug: string;
  sku: string | null;
  ean13: string | null;
  category_id: number;
  image_url: string | null;
}

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

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáâã]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõ]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getFileNameWithoutExt(filename: string): string {
  return filename.substring(0, filename.lastIndexOf("."));
}

/** Rimuove suffissi come " (2)", " 2", "_1" dal nome file (varianti della stessa immagine) */
function stripVariantSuffix(name: string): string {
  return name
    .replace(/\s*\(\d+\)\s*$/, "")
    .replace(/\s+\d+\s*$/, "")
    .replace(/_\d+\s*$/, "")
    .replace(/-\d+\s*$/, "")
    .trim();
}

function matchImageToProduct(
  image: UploadResult,
  products: ProductRow[]
): ImageMatch {
  const fileBase = getFileNameWithoutExt(image.filename);
  const normalizedFile = normalizeForMatch(fileBase);
  const strippedFile = normalizeForMatch(stripVariantSuffix(fileBase));

  // Skip foto generiche (WhatsApp, GOPR, IMG_, uuid-like)
  const isGenericPhoto = /^(whatsapp image|gopr|img[_ ]|[0-9a-f]{8}-[0-9a-f]{4})/.test(normalizedFile);

  const baseResult: ImageMatch = {
    imageFile: image.filename,
    r2Url: image.r2Url,
    r2Key: image.r2Key,
    productId: null,
    productName: null,
    productSku: null,
    matchType: "unmatched",
    confidence: "none",
  };

  if (isGenericPhoto) return baseResult;

  // 1. Match per SKU
  for (const product of products) {
    if (product.sku) {
      const normalizedSku = normalizeForMatch(product.sku);
      if (normalizedSku && (normalizedFile.includes(normalizedSku) || normalizedSku.includes(normalizedFile))) {
        return {
          ...baseResult,
          productId: product.id,
          productName: product.name_it,
          productSku: product.sku,
          matchType: "sku",
          confidence: "high",
        };
      }
    }
  }

  // 2. Match per nome prodotto (esatto)
  for (const product of products) {
    const normalizedProduct = normalizeForMatch(product.name_it);
    if (normalizedFile === normalizedProduct || strippedFile === normalizedProduct) {
      return {
        ...baseResult,
        productId: product.id,
        productName: product.name_it,
        productSku: product.sku,
        matchType: "name-exact",
        confidence: "high",
      };
    }
  }

  // 3. Match per nome prodotto (parziale - il nome file contiene il nome prodotto o viceversa)
  let bestMatch: { product: ProductRow; score: number } | null = null;

  for (const product of products) {
    const normalizedProduct = normalizeForMatch(product.name_it);
    const productWords = normalizedProduct.split(" ").filter((w) => w.length > 2);
    const fileWords = strippedFile.split(" ").filter((w) => w.length > 2);

    if (productWords.length === 0 || fileWords.length === 0) continue;

    // Conta parole in comune
    const commonWords = productWords.filter((w) => fileWords.includes(w));
    const score = commonWords.length / Math.max(productWords.length, fileWords.length);

    if (score >= 0.5 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { product, score };
    }
  }

  if (bestMatch) {
    return {
      ...baseResult,
      productId: bestMatch.product.id,
      productName: bestMatch.product.name_it,
      productSku: bestMatch.product.sku,
      matchType: "name-partial",
      confidence: bestMatch.score >= 0.7 ? "medium" : "low",
    };
  }

  return baseResult;
}

async function main() {
  console.log("=== Associazione Immagini R2 → Prodotti DB ===\n");
  console.log(`Modalità: ${APPLY ? "APPLICA" : "SOLO PREVIEW"}\n`);

  // Carica report
  const reportPath = path.join(__dirname, "r2-upload-report.json");
  const dryReportPath = path.join(__dirname, "r2-upload-report-dry.json");

  const actualPath = fs.existsSync(reportPath) ? reportPath : dryReportPath;
  if (!fs.existsSync(actualPath)) {
    console.error("❌ Nessun report trovato. Esegui prima upload-images-to-r2.ts");
    process.exit(1);
  }

  const report: UploadReport = JSON.parse(fs.readFileSync(actualPath, "utf-8"));
  console.log(`Report caricato: ${actualPath}\n`);

  // Carica tutti i prodotti dal DB
  const { data: allProducts, error } = await supabase
    .from("products")
    .select("id, name_it, slug, sku, ean13, category_id, image_url")
    .eq("active", true);

  if (error) {
    console.error("❌ Errore caricamento prodotti:", error.message);
    process.exit(1);
  }

  console.log(`Prodotti nel DB: ${allProducts!.length}\n`);

  const allMatches: ImageMatch[] = [];
  const stats = { high: 0, medium: 0, low: 0, unmatched: 0 };

  for (const [categorySlug, images] of Object.entries(report.byCategory)) {
    const categoryProducts = allProducts!.filter((p) => {
      const mapping = Object.values(report.byCategory);
      // Trova categoryId dall'immagine
      const sampleImage = images[0];
      return sampleImage && p.category_id === sampleImage.categoryId;
    });

    console.log(`\n📁 ${categorySlug}: ${images.length} immagini, ${categoryProducts.length} prodotti`);

    for (const image of images) {
      const match = matchImageToProduct(image, categoryProducts);
      allMatches.push(match);
      stats[match.confidence === "none" ? "unmatched" : match.confidence]++;

      if (match.confidence !== "none") {
        console.log(
          `  ${match.confidence === "high" ? "✅" : match.confidence === "medium" ? "🟡" : "🔸"} ` +
          `${match.imageFile} → [${match.matchType}] ${match.productName} (ID: ${match.productId})`
        );
      }
    }
  }

  // Salva mapping completo per review
  const mappingPath = path.join(__dirname, "image-product-mapping.json");
  fs.writeFileSync(mappingPath, JSON.stringify(allMatches, null, 2));

  // Salva CSV per review facile
  const csvPath = path.join(__dirname, "image-product-mapping.csv");
  const csvHeader = "Immagine,R2 URL,Prodotto ID,Prodotto Nome,SKU,Match Type,Confidence\n";
  const csvRows = allMatches.map((m) =>
    `"${m.imageFile}","${m.r2Url}","${m.productId || ""}","${m.productName || ""}","${m.productSku || ""}","${m.matchType}","${m.confidence}"`
  ).join("\n");
  fs.writeFileSync(csvPath, csvHeader + csvRows);

  console.log("\n=== RIEPILOGO MATCH ===");
  console.log(`Alta confidenza (auto-applicabili): ${stats.high}`);
  console.log(`Media confidenza (da verificare): ${stats.medium}`);
  console.log(`Bassa confidenza (da verificare): ${stats.low}`);
  console.log(`Non matchati: ${stats.unmatched}`);
  console.log(`\nMapping salvato: ${mappingPath}`);
  console.log(`CSV per review: ${csvPath}`);

  // Applica match dal JSON pulito (clean-image-mapping.ts) se richiesto
  if (APPLY) {
    const cleanJsonPath = path.join(__dirname, "image-product-clean.json");
    if (!fs.existsSync(cleanJsonPath)) {
      console.error("\n❌ image-product-clean.json non trovato. Esegui prima: npx tsx scripts/clean-image-mapping.ts");
      process.exit(1);
    }

    const cleanMatches: ImageMatch[] = JSON.parse(fs.readFileSync(cleanJsonPath, "utf-8"));
    // Filtra solo high e manual-verified/manual-override
    const toApply = cleanMatches.filter(
      (m) => m.productId && ["high", "manual-verified", "manual-override"].includes((m as any).cleanConfidence || m.confidence)
    );

    console.log(`\n=== APPLICAZIONE ${toApply.length} MATCH VERIFICATI ===\n`);

    // Raggruppa per productId
    const byProduct = new Map<number, ImageMatch[]>();
    for (const match of toApply) {
      const existing = byProduct.get(match.productId!) || [];
      existing.push(match);
      byProduct.set(match.productId!, existing);
    }

    let applied = 0;
    for (const [productId, matches] of byProduct) {
      // Ordina: immagine senza suffisso numerico prima (è la "principale")
      matches.sort((a, b) => {
        const aHasNum = /\d+\.\w+$/.test(a.imageFile.replace(/\.\w+$/, ""));
        const bHasNum = /\d+\.\w+$/.test(b.imageFile.replace(/\.\w+$/, ""));
        return (aHasNum ? 1 : 0) - (bHasNum ? 1 : 0);
      });

      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];

        // Inserisci in product_images
        const { error: insertError } = await supabase
          .from("product_images")
          .insert({
            product_id: productId,
            image_url: match.r2Url,
            sort_order: i,
            alt_text: match.productName,
          });

        if (insertError) {
          console.error(`  ❌ product_images per ${productId}: ${insertError.message}`);
          continue;
        }

        // Se è la prima immagine, aggiorna anche image_url del prodotto
        if (i === 0) {
          const { error: updateError } = await supabase
            .from("products")
            .update({ image_url: match.r2Url })
            .eq("id", productId);

          if (updateError) {
            console.error(`  ❌ products.image_url per ${productId}: ${updateError.message}`);
          }
        }

        applied++;
        console.log(`  ✅ Prodotto ${productId}: ${match.r2Url} (sort: ${i})`);
      }
    }

    console.log(`\n→ ${applied} immagini associate a ${byProduct.size} prodotti.`);
  } else {
    console.log("\n💡 Esegui con --apply per applicare i match ad alta confidenza al DB.");
    console.log("   Rivedi prima il CSV per verificare i match.");
  }
}

main().catch(console.error);
