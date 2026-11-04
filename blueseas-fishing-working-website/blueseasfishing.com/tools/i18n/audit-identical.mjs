// tools/i18n/audit-identical.mjs — list cache entries where the "translation"
// equals the source. Most are legitimate (brands, place names, loanwords), so
// the report filters to sentence-like strings: end in '.', >=5 words. Those are
// the candidates for English that actually shipped into a locale file.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CACHE = join(dirname(fileURLToPath(import.meta.url)), 'cache');
let total = 0, sentenceLike = 0;
for (const f of readdirSync(CACHE).filter((x) => x.endsWith('.json'))) {
  const c = JSON.parse(readFileSync(join(CACHE, f), 'utf8'));
  const hits = [];
  for (const k in c) {
    const src = k.split('\t').slice(1).join('\t');
    if (c[k] !== src) continue;
    total++;
    if (src.trim().endsWith('.') && src.split(/\s+/).length >= 5) hits.push(src);
  }
  if (hits.length) {
    sentenceLike += hits.length;
    console.log(`\n${f} (${hits.length}):`);
    for (const h of hits.slice(0, 15)) console.log('  - ' + h.slice(0, 110));
    if (hits.length > 15) console.log(`  ... +${hits.length - 15} more`);
  }
}
console.log(`\nTOTAL identical-value entries: ${total}; sentence-like: ${sentenceLike}`);
