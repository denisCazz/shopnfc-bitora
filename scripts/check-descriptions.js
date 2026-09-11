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
  const { data } = await sb.from('products').select('id, name_it, description_it, description_short_it').order('id').limit(15);
  
  console.log('=== Descriptions sample ===\n');
  data.forEach(p => {
    console.log(`--- id=${p.id} "${p.name_it}" ---`);
    console.log(`  short: ${(p.description_short_it || '(null)').substring(0, 120)}`);
    console.log(`  full:  ${(p.description_it || '(null)').substring(0, 120)}`);
    console.log();
  });

  // Check for any remaining HTML tags
  const { data: all } = await sb.from('products').select('id, name_it, description_it, description_short_it');
  const withHtml = all.filter(p => 
    (p.description_it && p.description_it.match(/<[a-z][^>]*>/i)) ||
    (p.description_short_it && p.description_short_it.match(/<[a-z][^>]*>/i))
  );
  console.log(`\n=== Products still containing HTML: ${withHtml.length} ===`);
  withHtml.slice(0, 5).forEach(p => {
    console.log(`  id=${p.id} "${p.name_it}"`);
    console.log(`    ${(p.description_short_it || p.description_it || '').substring(0, 100)}`);
  });

  // Check for "NULL" literal strings
  const withNull = all.filter(p =>
    p.description_it === 'NULL' || p.description_short_it === 'NULL'
  );
  console.log(`\n=== Products with literal "NULL" string: ${withNull.length} ===`);

  // Check for null descriptions
  const nullDesc = all.filter(p => !p.description_it && !p.description_short_it);
  console.log(`=== Products with no description at all: ${nullDesc.length} ===`);
})();
