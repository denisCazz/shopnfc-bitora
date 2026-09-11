const fs = require('fs');
const path = require('path');

const dumpPath = path.join(__dirname, '..', 'prestashop_dump.sql');
const sqlContent = fs.readFileSync(dumpPath, 'utf-8');

// Check ps_product table structure
const createProduct = sqlContent.match(/CREATE TABLE `ps_product`\s*\([^;]+;/is);
if (createProduct) {
  console.log('=== ps_product table structure ===');
  console.log(createProduct[0]);
}

// Check ps_product_shop table structure
const createProductShop = sqlContent.match(/CREATE TABLE `ps_product_shop`\s*\([^;]+;/is);
if (createProductShop) {
  console.log('\n=== ps_product_shop table structure ===');
  console.log(createProductShop[0]);
}

// Check ps_specific_price table structure
const createSpecPrice = sqlContent.match(/CREATE TABLE `ps_specific_price`\s*\([^;]+;/is);
if (createSpecPrice) {
  console.log('\n=== ps_specific_price table structure ===');
  console.log(createSpecPrice[0]);
}

// Now parse a few rows from ps_product to see actual data
function findInsert(sql, tableName) {
  const prefix = `INSERT INTO \`${tableName}\``;
  let searchFrom = 0;
  const statements = [];
  while (true) {
    const idx = sql.indexOf(prefix, searchFrom);
    if (idx === -1) break;
    let i = idx + prefix.length;
    let inQuote = false, escaped = false;
    while (i < sql.length) {
      const ch = sql[i];
      if (escaped) { escaped = false; i++; continue; }
      if (ch === '\\') { escaped = true; i++; continue; }
      if (ch === "'") { inQuote = !inQuote; i++; continue; }
      if (ch === ';' && !inQuote) break;
      i++;
    }
    statements.push(sql.substring(idx, i + 1));
    searchFrom = i + 1;
  }
  return statements;
}

// Get the first INSERT INTO ps_product and show raw first row data
const productInserts = findInsert(sqlContent, 'ps_product');
console.log(`\n=== ps_product INSERT statements: ${productInserts.length} ===`);
if (productInserts.length > 0) {
  // Just show first 1000 chars of first insert
  console.log('\nFirst INSERT (first 1500 chars):');
  console.log(productInserts[0].substring(0, 1500));
}

// Similarly for ps_product_shop
const shopInserts = findInsert(sqlContent, 'ps_product_shop');
console.log(`\n=== ps_product_shop INSERT statements: ${shopInserts.length} ===`);
if (shopInserts.length > 0) {
  console.log('\nFirst INSERT (first 1500 chars):');
  console.log(shopInserts[0].substring(0, 1500));
}

// Check ps_specific_price
const specPriceInserts = findInsert(sqlContent, 'ps_specific_price');
console.log(`\n=== ps_specific_price INSERT statements: ${specPriceInserts.length} ===`);
if (specPriceInserts.length > 0) {
  console.log('\nFirst INSERT (first 1000 chars):');
  console.log(specPriceInserts[0].substring(0, 1000));
}
