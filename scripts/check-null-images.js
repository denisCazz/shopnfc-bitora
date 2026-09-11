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
  // Products with null image
  const { data: nullImg, error: e1 } = await sb.from('products').select('id, name_it, image_url, slug').is('image_url', null);
  if (e1) { console.log('ERROR:', e1); return; }
  console.log('=== Products with NULL image_url:', nullImg.length, '===');
  nullImg.forEach(p => console.log(`  id=${p.id} "${p.name_it}" slug=${p.slug}`));

  // Total products
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true });
  console.log('\nTotal products in DB:', count);

  // Products with image
  const { data: withImg } = await sb.from('products').select('id, name_it, image_url').not('image_url', 'is', null).limit(5);
  console.log('\nSample products WITH image:');
  withImg.forEach(p => console.log(`  id=${p.id} "${p.name_it}" -> ${p.image_url}`));

  // Check if any images are broken (URL pattern check)
  const { data: allProducts } = await sb.from('products').select('id, name_it, image_url, slug');
  const noImage = allProducts.filter(p => !p.image_url);
  const withImage = allProducts.filter(p => p.image_url);
  console.log(`\n=== Summary: ${withImage.length} have image, ${noImage.length} have no image ===`);

  // Check if image URLs are actually accessible (all products)
  console.log('\n=== Checking image URL accessibility (ALL products) ===');
  const results = [];
  for (let i = 0; i < withImage.length; i += 10) {
    const batch = withImage.slice(i, i + 10);
    const batchResults = await Promise.all(batch.map(async (p) => {
      try {
        const res = await fetch(p.image_url, { method: 'HEAD', redirect: 'follow' });
        return { id: p.id, name: p.name_it, status: res.status, url: p.image_url };
      } catch (e) {
        return { id: p.id, name: p.name_it, status: 'ERROR', url: p.image_url };
      }
    }));
    results.push(...batchResults);
  }
  const broken = results.filter(r => r.status !== 200);
  console.log(`\nTotal: ${results.length}, OK: ${results.length - broken.length}, Broken: ${broken.length}`);
  if (broken.length > 0) {
    console.log('\nBroken image URLs:');
    broken.forEach(r => console.log(`  id=${r.id} status=${r.status} "${r.name}" -> ${r.url}`));
  }
})();
