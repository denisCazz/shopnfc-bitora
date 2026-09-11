/**
 * PrestaShop to Supabase Migration Script
 *
 * Usage:
 *   1. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   2. Place your PrestaShop SQL dump as `prestashop_dump.sql` in project root
 *   3. Run: npx tsx scripts/migrate-prestashop.ts
 *
 * This script:
 *   - Parses INSERT statements from the PrestaShop SQL dump
 *   - Migrates categories (with multilingual names)
 *   - Migrates products (with multilingual names, descriptions, prices)
 *   - Skips customers (PrestaShop passwords are MD5, can't migrate)
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load .env.local since tsx doesn't auto-load it
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    process.env[key] = value;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Category slug mapping from PrestaShop IDs
const CATEGORY_SLUGS: Record<number, string> = {
  6: "motoriduttori",
  7: "ventilatori-fumi",
  8: "ventilatori-aria",
  9: "resistenze-accensione",
  10: "display-cavi-telecomandi",
  11: "schede-elettroniche-sensori",
  12: "bracieri-camere-combustione",
  13: "sonde-depressori-termostati",
  14: "guarnizioni-silicone",
  16: "coclee",
  17: "stufe-a-pellet",
  18: "porta-pellet-aspiracenere",
  19: "pompe-sensori",
  20: "accessori",
};

// Manual category overrides for products with only "Home page" as default
const PRODUCT_CATEGORY_OVERRIDES: Record<number, number> = {
  174: 6,  // MOTORE COCLEA 1,5 RPM GGM -> Motoriduttori
  175: 12, // BRACIERE IN GHISA -> Bracieri
};

const CATEGORY_ICONS: Record<number, string> = {
  6: "Cog",
  7: "Wind",
  8: "Fan",
  9: "Zap",
  10: "Monitor",
  11: "Cpu",
  12: "Flame",
  13: "Thermometer",
  14: "CircleDot",
  16: "RotateCw",
  17: "Home",
  18: "Package",
  19: "Gauge",
  20: "Wrench",
};

// Parse a MySQL INSERT statement and extract row values
function parseInsertValues(sql: string): string[][] {
  const rows: string[][] = [];
  // Match the VALUES portion
  const valuesMatch = sql.match(/VALUES\s*([\s\S]+)/i);
  if (!valuesMatch) return rows;

  const valuesStr = valuesMatch[1];
  let i = 0;
  while (i < valuesStr.length) {
    // Find next opening paren
    const start = valuesStr.indexOf("(", i);
    if (start === -1) break;

    // Find matching closing paren, respecting quotes
    let end = start + 1;
    let inQuote = false;
    let escaped = false;
    while (end < valuesStr.length) {
      const ch = valuesStr[end];
      if (escaped) {
        escaped = false;
        end++;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        end++;
        continue;
      }
      if (ch === "'") {
        inQuote = !inQuote;
        end++;
        continue;
      }
      if (ch === ")" && !inQuote) {
        break;
      }
      end++;
    }

    const rowStr = valuesStr.substring(start + 1, end);
    // Parse individual values from the row
    const values: string[] = [];
    let vi = 0;
    while (vi < rowStr.length) {
      // Skip whitespace
      while (vi < rowStr.length && rowStr[vi] === " ") vi++;

      if (rowStr[vi] === "'") {
        // Quoted string
        let val = "";
        vi++; // skip opening quote
        while (vi < rowStr.length) {
          if (rowStr[vi] === "\\" && vi + 1 < rowStr.length) {
            const next = rowStr[vi + 1];
            if (next === "n") val += "\n";
            else if (next === "r") val += "\r";
            else if (next === "t") val += "\t";
            else if (next === "0") val += "\0";
            else val += next; // handles \\, \', etc.
            vi += 2;
          } else if (rowStr[vi] === "'") {
            vi++; // skip closing quote
            break;
          } else {
            val += rowStr[vi];
            vi++;
          }
        }
        values.push(val);
      } else {
        // Unquoted value (number or NULL)
        let val = "";
        while (vi < rowStr.length && rowStr[vi] !== ",") {
          val += rowStr[vi];
          vi++;
        }
        values.push(val.trim());
      }

      // Skip comma
      while (vi < rowStr.length && (rowStr[vi] === "," || rowStr[vi] === " ")) vi++;
    }
    rows.push(values);
    i = end + 1;
  }
  return rows;
}

function findInsertData(
  sqlContent: string,
  tableName: string
): string[][] {
  const allRows: string[][] = [];
  const prefix = `INSERT INTO \`${tableName}\``;
  let searchFrom = 0;

  while (true) {
    const idx = sqlContent.indexOf(prefix, searchFrom);
    if (idx === -1) break;

    // Find the end of the INSERT statement, respecting quoted strings
    let i = idx + prefix.length;
    let inQuote = false;
    let escaped = false;
    while (i < sqlContent.length) {
      const ch = sqlContent[i];
      if (escaped) {
        escaped = false;
        i++;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        i++;
        continue;
      }
      if (ch === "'") {
        inQuote = !inQuote;
        i++;
        continue;
      }
      if (ch === ";" && !inQuote) {
        break;
      }
      i++;
    }

    const statement = sqlContent.substring(idx, i + 1);
    allRows.push(...parseInsertValues(statement));
    searchFrom = i + 1;
  }

  return allRows;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")    // <br> → newline
    .replace(/<\/p>/gi, "\n")         // </p> → newline
    .replace(/<[^>]+>/g, "")          // strip all other tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\r\n/g, "\n")           // normalize CRLF
    .replace(/\n{3,}/g, "\n\n")       // collapse multiple newlines
    .trim();
}

function sqlVal(val: string | undefined): string | null {
  if (!val || val === "NULL") return null;
  return val;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 128);
}

async function migrateCategories(sqlContent: string) {
  console.log("Migrating categories...");

  // Parse ps_category_lang for Italian names (id_lang=1)
  const catLangRows = findInsertData(sqlContent, "ps_category_lang");
  // Columns: id_category, id_shop, id_lang, name, description, link_rewrite, meta_title, meta_keywords, meta_description
  const catNames: Record<number, Record<number, string>> = {};

  for (const row of catLangRows) {
    const catId = parseInt(row[0]);
    const langId = parseInt(row[2]);
    const name = row[3];
    if (catId >= 6 && catId <= 20 && catId !== 15) {
      if (!catNames[catId]) catNames[catId] = {};
      catNames[catId][langId] = name;
    }
  }

  const categories = Object.entries(catNames).map(([idStr, names], idx) => {
    const id = parseInt(idStr);
    return {
      id,
      name_it: names[1] || "",
      name_en: names[2] || null,
      name_fr: names[3] || null,
      name_es: names[4] || null,
      slug: CATEGORY_SLUGS[id] || slugify(names[1] || ""),
      icon: CATEGORY_ICONS[id] || null,
      sort_order: idx,
      active: true,
    };
  });

  const { error } = await supabase.from("categories").upsert(categories, {
    onConflict: "slug",
  });

  if (error) {
    console.error("Error migrating categories:", error);
  } else {
    console.log(`  Migrated ${categories.length} categories`);
  }
}

async function migrateProducts(sqlContent: string) {
  console.log("Migrating products...");

  // Parse ps_product for base product data
  const productRows = findInsertData(sqlContent, "ps_product");
  // ps_product columns (from CREATE TABLE):
  // [0] id_product, [1] id_supplier, [2] id_manufacturer, [3] id_category_default,
  // [4] id_shop_default, [5] id_tax_rules_group, [6] on_sale, [7] online_only,
  // [8] ean13, [9] upc, [10] ecotax, [11] quantity, [12] minimal_quantity,
  // [13] price, [14] wholesale_price, [15] unity, [16] unit_price_ratio,
  // [17] additional_shipping_cost, [18] reference, [19] supplier_reference,
  // [20] location, [21] width, [22] height, [23] depth, [24] weight, ...

  // Parse ps_product_lang for names/descriptions
  const productLangRows = findInsertData(sqlContent, "ps_product_lang");
  // Columns: id_product, id_shop, id_lang, description, description_short, link_rewrite, meta_description, meta_keywords, meta_title, name, ...

  // Build language maps
  const productLang: Record<
    number,
    Record<number, { name: string; description: string; descriptionShort: string; linkRewrite: string; metaTitle: string; metaDescription: string }>
  > = {};

  for (const row of productLangRows) {
    const productId = parseInt(row[0]);
    const langId = parseInt(row[2]);
    if (!productLang[productId]) productLang[productId] = {};
    const rawDesc = sqlVal(row[3]);
    const rawShort = sqlVal(row[4]);
    productLang[productId][langId] = {
      description: rawDesc ? stripHtml(rawDesc) : "",
      descriptionShort: rawShort ? stripHtml(rawShort) : "",
      linkRewrite: row[5] || "",
      metaDescription: sqlVal(row[6]) || "",
      metaTitle: sqlVal(row[8]) || "",
      name: sqlVal(row[9]) || "",
    };
  }

  // Parse ps_category_product for real category assignments
  // Columns: id_category, id_product, position
  const catProdRows = findInsertData(sqlContent, "ps_category_product");
  const productRealCats: Record<number, number[]> = {};
  for (const row of catProdRows) {
    const catId = parseInt(row[0]);
    const prodId = parseInt(row[1]);
    if (!productRealCats[prodId]) productRealCats[prodId] = [];
    productRealCats[prodId].push(catId);
  }

  // Parse ps_stock_available for stock quantities
  const stockRows = findInsertData(sqlContent, "ps_stock_available");
  const stockMap: Record<number, number> = {};
  for (const row of stockRows) {
    const productId = parseInt(row[0]);
    const quantity = parseInt(row[3] || "0");
    stockMap[productId] = (stockMap[productId] || 0) + quantity;
  }

  // Parse ps_image for cover images
  // Columns: id_image, id_product, position, cover
  const imageRows = findInsertData(sqlContent, "ps_image");
  const productCoverImage: Record<number, number> = {};
  for (const row of imageRows) {
    const imgId = parseInt(row[0]);
    const prodId = parseInt(row[1]);
    const cover = row[3];
    if (cover === "1" || !productCoverImage[prodId]) {
      productCoverImage[prodId] = imgId;
    }
  }

  const productsRaw = [];
  const seenIds = new Set<number>();
  for (const row of productRows) {
    const id = parseInt(row[0]);
    
    // Skip duplicates (PrestaShop has per-shop rows)
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    
    let categoryId = parseInt(row[3] || "0");

    // If default category is not in our known categories, find a real one from ps_category_product or overrides
    if (!CATEGORY_SLUGS[categoryId]) {
      if (PRODUCT_CATEGORY_OVERRIDES[id]) {
        categoryId = PRODUCT_CATEGORY_OVERRIDES[id];
      } else {
        const realCats = (productRealCats[id] || []).filter(c => CATEGORY_SLUGS[c]);
        if (realCats.length > 0) {
          categoryId = realCats[0];
        } else {
          // Skip products with no valid category (e.g. "test prodotto")
          console.log(`  Skipping product ${id} (no valid category, default=${categoryId})`);
          continue;
        }
      }
    }

    const lang = productLang[id] || {};
    const it = lang[1] || { name: "", description: "", descriptionShort: "", linkRewrite: "", metaTitle: "", metaDescription: "" };

    // Skip test products
    if (it.name.toLowerCase().includes("test prodotto")) {
      console.log(`  Skipping test product ${id}: "${it.name}"`);
      continue;
    }

    const price = parseFloat(row[13] || "0");
    const wholesalePrice = parseFloat(row[14] || "0");
    const width = parseFloat(row[21] || "0");
    const height = parseFloat(row[22] || "0");
    const depth = parseFloat(row[23] || "0");
    const weight = parseFloat(row[24] || "0");
    const ean13 = row[8] || null;
    const reference = row[18] || null;

    // Build image URL from ps_image cover
    const coverImgId = productCoverImage[id];
    const imageUrl = coverImgId
      ? `https://shopnfc.bitora.it/shopnfc/${coverImgId}-home_default/${it.linkRewrite}.jpg`
      : null;

    productsRaw.push({
      id,
      category_id: categoryId,
      sku: reference,
      ean13: ean13 !== "0" ? ean13 : null,
      name_it: it.name,
      name_en: lang[2]?.name || null,
      name_fr: lang[3]?.name || null,
      name_es: lang[4]?.name || null,
      description_it: it.description || null,
      description_en: sqlVal(lang[2]?.description) || null,
      description_fr: sqlVal(lang[3]?.description) || null,
      description_es: sqlVal(lang[4]?.description) || null,
      description_short_it: it.descriptionShort || null,
      description_short_en: sqlVal(lang[2]?.descriptionShort) || null,
      description_short_fr: sqlVal(lang[3]?.descriptionShort) || null,
      description_short_es: sqlVal(lang[4]?.descriptionShort) || null,
      slug: it.linkRewrite || slugify(it.name),
      price: Math.round(price * 122) / 100, // Add 22% IVA
      wholesale_price: wholesalePrice > 0 ? wholesalePrice : null,
      weight: weight > 0 ? weight : null,
      width: width > 0 ? width : null,
      height: height > 0 ? height : null,
      depth: depth > 0 ? depth : null,
      stock_quantity: stockMap[id] || 0,
      active: true,
      brand: null,
      meta_title: sqlVal(it.metaTitle) || null,
      meta_description: sqlVal(it.metaDescription) || null,
      image_url: imageUrl,
    });
  }

  // Deduplicate by slug (append product ID if duplicate)
  const seenSlugs = new Set<string>();
  const products = productsRaw.map((p) => {
    let slug = p.slug;
    if (seenSlugs.has(slug)) {
      slug = `${slug}-${p.id}`;
    }
    seenSlugs.add(slug);
    return { ...p, slug };
  });

  console.log(`  Found ${products.length} unique products`);


  // Insert in batches of 50
  const batchSize = 50;
  let total = 0;

  // Delete existing products first (clean re-import)
  const { error: delError } = await supabase.from("products").delete().gte("id", 0);
  if (delError) {
    console.error("Error deleting existing products:", delError);
  }

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const { error } = await supabase.from("products").upsert(batch, {
      onConflict: "id",
    });
    if (error) {
      console.error(`Error migrating products batch ${i}:`, error);
    } else {
      total += batch.length;
    }
  }

  console.log(`  Migrated ${total} products`);
}

async function main() {
  const dumpPath = path.resolve(process.cwd(), "prestashop_dump.sql");

  if (!fs.existsSync(dumpPath)) {
    console.error(`SQL dump not found at ${dumpPath}`);
    console.error("Place your PrestaShop SQL dump as 'prestashop_dump.sql' in the project root.");
    process.exit(1);
  }

  console.log("Reading SQL dump...");
  const sqlContent = fs.readFileSync(dumpPath, "utf-8");
  console.log(`  Read ${(sqlContent.length / 1024 / 1024).toFixed(1)} MB`);

  await migrateCategories(sqlContent);
  await migrateProducts(sqlContent);

  console.log("\nMigration complete!");
}

main().catch(console.error);
