import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = {};
fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).forEach(l => {
  const m = l.match(/^(\w+)=(.+)/);
  if (m) env[m[1]] = m[2].trim();
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from('products').select('id,name_it,sku').limit(20);
console.log('Samples:');
data.forEach(p => console.log(`  id=${p.id} sku=${JSON.stringify(p.sku)} name=${p.name_it.substring(0,40)}`));

const { data: withSku } = await sb.from('products').select('id,sku').not('sku','is',null);
const notNullString = withSku.filter(p => p.sku !== 'null' && p.sku !== 'NULL' && p.sku !== '');
console.log(`\nTotal non-null sku: ${withSku.length}`);
console.log(`Total with real sku value: ${notNullString.length}`);
if (notNullString.length > 0) console.log('Examples:', notNullString.slice(0,5));
