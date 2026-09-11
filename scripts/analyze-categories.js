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

// Products in cat 2
const missingIds = [51,52,53,54,55,56,57,67,68,69,70,71,72,73,74,75,76,78,82,86,87,88,89,90,91,92,93,94,95,98,99,100,101,102,103,104,105,106,107,108,110,111,112,113,114,115,116,117,125,157,172,174,175];

// ps_category_product: id_category, id_product, position
console.log("=== ps_category_product for missing products ===");
const cpRows = findInsertData("ps_category_product");
const productCats = {};
for (const row of cpRows) {
  const catId = parseInt(row[0]);
  const prodId = parseInt(row[1]);
  if (missingIds.includes(prodId)) {
    if (!productCats[prodId]) productCats[prodId] = [];
    productCats[prodId].push(catId);
  }
}

// Category names
const catLangRows = findInsertData("ps_category_lang");
const catNames = {};
for (const row of catLangRows) {
  if (parseInt(row[2]) === 1) catNames[parseInt(row[0])] = row[3];
}

// Product names
const plRows = findInsertData("ps_product_lang");
const productNames = {};
for (const row of plRows) {
  if (parseInt(row[2]) === 1) productNames[parseInt(row[0])] = row[9];
}

console.log("\nProduct -> Categories mapping:");
for (const id of missingIds) {
  const cats = (productCats[id] || []).filter(c => c !== 2); // exclude "Home page"
  const catStr = cats.map(c => `${c}:${catNames[c] || '?'}`).join(", ");
  console.log(`  ${id} "${productNames[id]}" -> [${catStr || 'ONLY Home page'}]`);
}
