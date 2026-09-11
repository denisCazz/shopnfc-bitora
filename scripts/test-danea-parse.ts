/**
 * Smoke test: parse Danea sample XML (no DB). Run: npx tsx scripts/test-danea-parse.ts
 */
import {
  applyCatalogVat,
  parseEasyfattProductsXml,
  resolveCatalogPrice,
} from "../lib/danea-import";

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<EasyfattProducts AppVersion="2" Mode="incremental">
  <UpdatedProducts>
    <Product>
      <Code>95100300</Code>
      <Description>Ricambio test</Description>
      <Category>Ricambi</Category>
      <Vat Perc="22" Class="Imponibile" Description="IVA 22%">22</Vat>
      <NetPrice1>57.38</NetPrice1>
      <GrossPrice1>70</GrossPrice1>
      <NetPrice2>114.75</NetPrice2>
      <GrossPrice2>140</GrossPrice2>
      <AvailableQty>5</AvailableQty>
    </Product>
  </UpdatedProducts>
</EasyfattProducts>`;

const bundle = parseEasyfattProductsXml(xml);
const product = bundle.toUpsert[0];
const catalogPrice = resolveCatalogPrice(product);

// eslint-disable-next-line no-console
console.log("catalog price:", catalogPrice, "expected 140 (listino 2)");
// eslint-disable-next-line no-console
console.assert(catalogPrice === "140.00" || catalogPrice === "140", "listino 2 catalogo");
// eslint-disable-next-line no-console
console.assert(applyCatalogVat("100", 0.22) === "122.00", "IVA 22%");
// eslint-disable-next-line no-console
console.log("parse:", JSON.stringify(bundle, null, 2));
