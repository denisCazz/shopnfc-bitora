const fs = require("fs");
const path = require("path");

const dumpPath = "c:/Users/U1795/Desktop/1699518820-90d2550.sql/1699518820-90d2550.sql";
console.log("Reading dump...");
const content = fs.readFileSync(dumpPath, "utf-8");
console.log(`Read ${(content.length / 1024 / 1024).toFixed(1)} MB`);

// Line-based parsing: find INSERT INTO lines and collect data until ;
function findInsertData(tableName) {
  const lines = content.split("\n");
  const marker = "INSERT INTO `" + tableName + "` VALUES";
  let collecting = false;
  let buffer = "";
  const allRows = [];
  
  for (const line of lines) {
    if (line.startsWith(marker)) {
      collecting = true;
      buffer = line;
    } else if (collecting) {
      buffer += "\n" + line;
    }
    
    if (collecting && line.trimEnd().endsWith(";")) {
      // Parse the VALUES portion
      const valIdx = buffer.indexOf("VALUES");
      if (valIdx !== -1) {
        const valStr = buffer.substring(valIdx + 6);
        // Quick row extraction: find each (...) tuple 
        let i = 0;
        while (i < valStr.length) {
          const start = valStr.indexOf("(", i);
          if (start === -1) break;
          let end = start + 1;
          let inQuote = false;
          let escaped = false;
          while (end < valStr.length) {
            const ch = valStr[end];
            if (escaped) { escaped = false; end++; continue; }
            if (ch === "\\") { escaped = true; end++; continue; }
            if (ch === "'") { inQuote = !inQuote; end++; continue; }
            if (ch === ")" && !inQuote) break;
            end++;
          }
          const rowStr = valStr.substring(start + 1, end);
          // Parse values
          const values = [];
          let vi = 0;
          while (vi < rowStr.length) {
            while (vi < rowStr.length && rowStr[vi] === " ") vi++;
            if (vi >= rowStr.length) break;
            if (rowStr[vi] === "'") {
              let val = "";
              vi++;
              while (vi < rowStr.length) {
                if (rowStr[vi] === "\\" && vi + 1 < rowStr.length) {
                  val += rowStr[vi + 1];
                  vi += 2;
                } else if (rowStr[vi] === "'") {
                  vi++;
                  break;
                } else {
                  val += rowStr[vi];
                  vi++;
                }
              }
              values.push(val);
            } else {
              let val = "";
              while (vi < rowStr.length && rowStr[vi] !== ",") {
                val += rowStr[vi];
                vi++;
              }
              values.push(val.trim());
            }
            while (vi < rowStr.length && (rowStr[vi] === "," || rowStr[vi] === " ")) vi++;
          }
          allRows.push(values);
          i = end + 1;
        }
      }
      collecting = false;
      buffer = "";
    }
  }
  return allRows;
}

// ps_product - count unique products
console.log("\n=== ps_product ===");
const productRows = findInsertData("ps_product");
const prodIds = new Set();
const prodCategories = {};
for (const row of productRows) {
  const id = parseInt(row[0]);
  const catId = parseInt(row[3] || "0");
  if (!prodIds.has(id)) {
    prodIds.add(id);
    prodCategories[id] = catId;
  }
}
console.log(`Unique products: ${prodIds.size}`);
console.log(`Total rows (incl. per-shop): ${productRows.length}`);

// Count per category
const catCounts = {};
for (const [id, catId] of Object.entries(prodCategories)) {
  catCounts[catId] = (catCounts[catId] || 0) + 1;
}
console.log("Products per category_id:", JSON.stringify(catCounts, null, 2));

// ps_category_lang - get all category names
console.log("\n=== ps_category_lang (Italian, id_lang=1) ===");
const catLangRows = findInsertData("ps_category_lang");
const catNames = {};
for (const row of catLangRows) {
  const catId = parseInt(row[0]);
  const langId = parseInt(row[2]);
  if (langId === 1) {
    catNames[catId] = row[3];
  }
}
console.log("All categories:", JSON.stringify(catNames, null, 2));

// ps_image - count images
console.log("\n=== ps_image ===");
const imgRows = findInsertData("ps_image");
const imageProducts = new Set();
for (const row of imgRows) {
  imageProducts.add(parseInt(row[1]));
}
console.log(`Total images: ${imgRows.length}`);
console.log(`Products with images: ${imageProducts.size}`);
// Show sample: first 5
const imgSample = imgRows.slice(0, 5);
console.log("Sample (id_image, id_product, position, cover):", imgSample.map(r => r.slice(0, 4)));

// ps_feature_lang (features)
console.log("\n=== ps_feature_lang ===");
const featLangRows = findInsertData("ps_feature_lang");
const features = {};
for (const row of featLangRows) {
  if (parseInt(row[1]) === 1) { // id_lang=1
    features[parseInt(row[0])] = row[2];
  }
}
console.log("Features:", JSON.stringify(features, null, 2));

// ps_feature_value_lang
console.log("\n=== ps_feature_value_lang (sample) ===");
const fvlRows = findInsertData("ps_feature_value_lang");
console.log(`Total feature values: ${fvlRows.length}`);
console.log("Sample:", fvlRows.slice(0, 10).map(r => r.join(" | ")));

// ps_orders
console.log("\n=== ps_orders ===");
const orderRows = findInsertData("ps_orders");
console.log(`Total orders: ${orderRows.length}`);

// ps_customer
console.log("\n=== ps_customer ===");
const custRows = findInsertData("ps_customer");
console.log(`Total customers: ${custRows.length}`);

// ps_specific_price
console.log("\n=== ps_specific_price ===");
const spRows = findInsertData("ps_specific_price");
console.log(`Total specific prices: ${spRows.length}`);

// ps_product_comment
console.log("\n=== ps_product_comment ===");
const commRows = findInsertData("ps_product_comment");
console.log(`Total product comments: ${commRows.length}`);

// Which products are NOT in categories 6-20?
const knownCats = [6,7,8,9,10,11,12,13,14,16,17,18,19,20];
const missingProducts = [];
for (const [id, catId] of Object.entries(prodCategories)) {
  if (!knownCats.includes(catId)) {
    missingProducts.push({id: parseInt(id), catId});
  }
}
console.log(`\n=== Products NOT in migrated categories: ${missingProducts.length} ===`);
missingProducts.forEach(p => {
  console.log(`  Product ${p.id} -> category_id=${p.catId} (${catNames[p.catId] || 'unknown'})`);
});

// ps_product_lang - check product names for those missing
console.log("\n=== Missing product names ===");
const plRows = findInsertData("ps_product_lang");
const productNames = {};
for (const row of plRows) {
  const pid = parseInt(row[0]);
  const langId = parseInt(row[2]);
  if (langId === 1) {
    productNames[pid] = row[9]; // name field
  }
}
missingProducts.forEach(p => {
  console.log(`  Product ${p.id}: ${productNames[p.id] || 'no name'}`);
});
