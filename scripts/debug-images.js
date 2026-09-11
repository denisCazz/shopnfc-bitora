const fs = require("fs");

const dumpPath = "c:/Users/U1795/Desktop/1699518820-90d2550.sql/1699518820-90d2550.sql";
const content = fs.readFileSync(dumpPath, "utf-8");

function findInsertData(tableName) {
  const lines = content.split("\n");
  const marker = "INSERT INTO `" + tableName + "` VALUES";
  let collecting = false;
  let buffer = "";
  const allRows = [];
  for (const line of lines) {
    if (line.startsWith(marker)) { collecting = true; buffer = line; }
    else if (collecting) { buffer += "\n" + line; }
    if (collecting && line.trimEnd().endsWith(";")) {
      const valIdx = buffer.indexOf("VALUES");
      if (valIdx !== -1) {
        const valStr = buffer.substring(valIdx + 6);
        let i = 0;
        while (i < valStr.length) {
          const start = valStr.indexOf("(", i);
          if (start === -1) break;
          let end = start + 1, inQuote = false, escaped = false;
          while (end < valStr.length) {
            const ch = valStr[end];
            if (escaped) { escaped = false; end++; continue; }
            if (ch === "\\") { escaped = true; end++; continue; }
            if (ch === "'") { inQuote = !inQuote; end++; continue; }
            if (ch === ")" && !inQuote) break;
            end++;
          }
          const rowStr = valStr.substring(start + 1, end);
          const values = [];
          let vi = 0;
          while (vi < rowStr.length) {
            while (vi < rowStr.length && rowStr[vi] === " ") vi++;
            if (vi >= rowStr.length) break;
            if (rowStr[vi] === "'") {
              let val = ""; vi++;
              while (vi < rowStr.length) {
                if (rowStr[vi] === "\\" && vi + 1 < rowStr.length) { val += rowStr[vi + 1]; vi += 2; }
                else if (rowStr[vi] === "'") { vi++; break; }
                else { val += rowStr[vi]; vi++; }
              }
              values.push(val);
            } else {
              let val = "";
              while (vi < rowStr.length && rowStr[vi] !== ",") { val += rowStr[vi]; vi++; }
              values.push(val.trim());
            }
            while (vi < rowStr.length && (rowStr[vi] === "," || rowStr[vi] === " ")) vi++;
          }
          allRows.push(values);
          i = end + 1;
        }
      }
      collecting = false; buffer = "";
    }
  }
  return allRows;
}

// Parse ps_image
// Check the CREATE TABLE to know column order
console.log("=== Checking ps_image structure ===");
const lines = content.split("\n");
let inCreateImage = false;
for (const line of lines) {
  if (line.includes("CREATE TABLE") && line.includes("ps_image")) { inCreateImage = true; }
  if (inCreateImage) {
    console.log(line);
    if (line.includes(";")) break;
  }
}

console.log("\n=== ps_image data (first 20 rows) ===");
const imgRows = findInsertData("ps_image");
console.log(`Total image rows: ${imgRows.length}`);
for (let i = 0; i < Math.min(20, imgRows.length); i++) {
  console.log(`  Row ${i}: [${imgRows[i].join(" | ")}]`);
}

// Build cover image map
const productCoverImage = {};
for (const row of imgRows) {
  const imgId = parseInt(row[0]);
  const prodId = parseInt(row[1]);
  const cover = row[3];
  if (cover === "1" || !productCoverImage[prodId]) {
    productCoverImage[prodId] = imgId;
  }
}

// Parse ps_product_lang for names + linkRewrite
const plRows = findInsertData("ps_product_lang");
const productNames = {};
const productSlugs = {};
for (const row of plRows) {
  const pid = parseInt(row[0]);
  const langId = parseInt(row[2]);
  if (langId === 1) {
    productNames[pid] = row[9];
    productSlugs[pid] = row[5];
  }
}

// Parse ps_product for all IDs
const prodRows = findInsertData("ps_product");
const seenIds = new Set();
const allProducts = [];
for (const row of prodRows) {
  const id = parseInt(row[0]);
  if (seenIds.has(id)) continue;
  seenIds.add(id);
  allProducts.push(id);
}

// Find products without cover image
console.log("\n=== Products WITHOUT cover image ===");
let noImageCount = 0;
for (const id of allProducts) {
  if (!productCoverImage[id]) {
    noImageCount++;
    console.log(`  Product ${id}: "${productNames[id] || '?'}" - slug: "${productSlugs[id] || '?'}" - NO IMAGE in ps_image`);
  }
}
console.log(`Total products without image: ${noImageCount}`);

// Find products with image but empty linkRewrite
console.log("\n=== Products WITH image but empty linkRewrite ===");
let emptySlugCount = 0;
for (const id of allProducts) {
  if (productCoverImage[id] && (!productSlugs[id] || productSlugs[id] === "")) {
    emptySlugCount++;
    console.log(`  Product ${id}: "${productNames[id] || '?'}" - imgId: ${productCoverImage[id]} - linkRewrite: "${productSlugs[id]}"`);
  }
}
console.log(`Total with image but empty slug: ${emptySlugCount}`);

// Show all product image URLs that would be generated
console.log("\n=== All products image URL status ===");
for (const id of allProducts.sort((a,b) => a-b)) {
  const coverImgId = productCoverImage[id];
  const slug = productSlugs[id];
  const name = productNames[id] || "?";
  if (coverImgId && slug) {
    // URL would be OK
  } else {
    console.log(`  Product ${id}: "${name}" - coverImgId: ${coverImgId || 'NONE'} - slug: "${slug || ''}" -> image_url: NULL`);
  }
}

// Also check ps_image_shop - maybe images are per-shop?
console.log("\n=== ps_image_shop (first 10) ===");
const imgShopRows = findInsertData("ps_image_shop");
console.log(`Total image_shop rows: ${imgShopRows.length}`);
for (let i = 0; i < Math.min(10, imgShopRows.length); i++) {
  console.log(`  [${imgShopRows[i].join(" | ")}]`);
}
