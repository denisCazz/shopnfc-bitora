const fs = require('fs');
const path = require('path');

const dumpPath = path.join(__dirname, '..', 'prestashop_dump.sql');
const sqlContent = fs.readFileSync(dumpPath, 'utf-8');

// Find CREATE TABLE for ps_product_lang
const createMatch = sqlContent.match(/CREATE TABLE `ps_product_lang`[^;]+;/is);
if (createMatch) {
  console.log('=== ps_product_lang table structure ===');
  console.log(createMatch[0]);
}

// Now find the INSERT and check a few sample rows
const insertMatch = sqlContent.match(/INSERT INTO `ps_product_lang`\s+VALUES\s*/i);
if (insertMatch) {
  const startIdx = insertMatch.index + insertMatch[0].length;
  // Get first 2000 chars of values
  console.log('\n=== First 2000 chars of VALUES ===');
  console.log(sqlContent.substring(startIdx, startIdx + 2000));
}

// Parse a few rows to see actual structure
function parseInsertValues(sql) {
  const rows = [];
  const valuesMatch = sql.match(/VALUES\s*([\s\S]+)/i);
  if (!valuesMatch) return rows;
  const valuesStr = valuesMatch[1];
  let i = 0;
  let count = 0;
  while (i < valuesStr.length && count < 10) {
    const start = valuesStr.indexOf("(", i);
    if (start === -1) break;
    let end = start + 1;
    let inQuote = false;
    let escaped = false;
    while (end < valuesStr.length) {
      const ch = valuesStr[end];
      if (escaped) { escaped = false; end++; continue; }
      if (ch === "\\") { escaped = true; end++; continue; }
      if (ch === "'") { inQuote = !inQuote; end++; continue; }
      if (ch === ")" && !inQuote) break;
      end++;
    }
    const rowStr = valuesStr.substring(start + 1, end);
    const values = [];
    let vi = 0;
    while (vi < rowStr.length) {
      while (vi < rowStr.length && rowStr[vi] === " ") vi++;
      if (rowStr[vi] === "'") {
        let val = "";
        vi++;
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
    rows.push(values);
    i = end + 1;
    count++;
  }
  return rows;
}

// Find all INSERT statements for ps_product_lang
const regex = /INSERT INTO `ps_product_lang`[^;]+;/gis;
let match;
let allRows = [];
while ((match = regex.exec(sqlContent)) !== null) {
  allRows = allRows.concat(parseInsertValues(match[0]));
}

console.log('\n=== Total ps_product_lang rows:', allRows.length, '===');
console.log('\n=== First 5 rows (column values) ===');
for (let i = 0; i < Math.min(5, allRows.length); i++) {
  const r = allRows[i];
  console.log(`Row ${i}: ${r.length} columns`);
  r.forEach((v, j) => {
    const display = v.length > 80 ? v.substring(0, 80) + '...' : v;
    console.log(`  [${j}] = "${display}"`);
  });
}

// Check how many unique products we have lang data for
const prodIds = new Set(allRows.map(r => r[0]));
console.log('\n=== Unique product IDs with lang data:', prodIds.size, '===');

// Check product 52 specifically (one of the broken ones)
const prod52 = allRows.filter(r => r[0] === '52');
console.log('\n=== Product 52 lang rows:', prod52.length, '===');
prod52.forEach((r, i) => {
  console.log(`  Row ${i}: id_product=${r[0]}, id_shop=${r[1]}, id_lang=${r[2]}`);
  console.log(`    name=[${r.length > 9 ? r[9] : 'N/A'}], linkRewrite=[${r.length > 5 ? r[5] : 'N/A'}]`);
});

// Check product 35 (another broken one)
const prod35 = allRows.filter(r => r[0] === '35');
console.log('\n=== Product 35 lang rows:', prod35.length, '===');
prod35.forEach((r, i) => {
  console.log(`  Row ${i}: id_product=${r[0]}, id_shop=${r[1]}, id_lang=${r[2]}`);
  console.log(`    name=[${r.length > 9 ? r[9] : 'N/A'}], linkRewrite=[${r.length > 5 ? r[5] : 'N/A'}]`);
});
