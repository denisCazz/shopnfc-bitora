const fs = require('fs');
const path = require('path');
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
envFile.split(/\r?\n/).forEach(l => {
  const m = l.match(/^(\w+)=(.+)/);
  if (m) env[m[1]] = m[2].trim();
});

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  // Get sample prices from Supabase
  const { data } = await sb.from('products').select('id, name_it, price, wholesale_price').order('id').limit(30);
  console.log('=== Prices in Supabase (first 30) ===');
  data.forEach(p => {
    console.log(`  id=${p.id} price=${p.price}€ wholesale=${p.wholesale_price || '-'} "${p.name_it}"`);
  });

  // Check for zero prices
  const { data: zeroPrices } = await sb.from('products').select('id, name_it, price').eq('price', 0);
  console.log(`\n=== Products with price=0: ${zeroPrices.length} ===`);
  zeroPrices.forEach(p => console.log(`  id=${p.id} "${p.name_it}"`));

  // Price stats
  const { data: all } = await sb.from('products').select('price');
  const prices = all.map(p => p.price);
  console.log(`\n=== Price stats ===`);
  console.log(`  Min: ${Math.min(...prices)}€`);
  console.log(`  Max: ${Math.max(...prices)}€`);
  console.log(`  Avg: ${(prices.reduce((a,b) => a+b, 0) / prices.length).toFixed(2)}€`);
  console.log(`  Median: ${prices.sort((a,b) => a-b)[Math.floor(prices.length/2)]}€`);
})();
