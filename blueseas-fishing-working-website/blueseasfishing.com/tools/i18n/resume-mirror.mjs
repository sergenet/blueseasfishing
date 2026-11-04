// tools/i18n/resume-mirror.mjs — keeps re-running mirror-auth.mjs until every
// auth/commerce page + species-db pack is localized for all 7 languages.
//
// The free MyMemory endpoint (only working MT transport right now; gtx is
// IP-throttled) 429s in waves on bulk runs. mirror-auth.mjs exits code 2 when
// throttled, and it caches every translated string on disk, so each re-run
// resumes exactly where the last left off and only re-requests the strings it
// could not get. This driver just sleeps through the 429 waves with an
// adaptive cooldown (backs off while progress stalls, resets when it moves).
//
// Progress = number of target files whose <html lang="xx"> tag is correct AND
// that contain no "QUERY LENGTH" corruption, across the pages mirror-auth owns.
//
// Run: node tools/i18n/resume-mirror.mjs [--locale xx] [--limit n]
// Exit codes: 0 all done, 2 throttled-and-stalled (safe to run again later),
//             3 monthly spend cap (do not resume), other = hard failure.
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const extra = process.argv.slice(2);

const LOCALES = ['es', 'fr', 'de', 'pt', 'ru', 'el', 'ar'];
const PAGES = [
  'login.html', 'premium.html', 'subscribe.html', 'members-area.html',
  'premium-success.html', 'trip-planner.html', 'gear-recommendations.html',
];
const DATA_FILES = [
  'species-db.js', 'species-db.enriched.js', 'species-db.enriched.world.js',
  'species-db.expanded.js', 'species-db.expanded.worldwide.js', 'species-db.regions.js',
  'species-db.images.js',
];

const BASE_COOLDOWN_MS = 5 * 60 * 1000;
const MAX_COOLDOWN_MS = 30 * 60 * 1000;

function doneCount() {
  let n = 0;
  const targets = [];
  for (const l of LOCALES) {
    for (const p of PAGES) targets.push([l, p]);
    for (const d of DATA_FILES) targets.push([l, d]);
  }
  for (const [l, name] of targets) {
    const f = join(ROOT, l, name);
    if (!existsSync(f)) continue;
    let body;
    try { body = readFileSync(f, 'utf8'); } catch { continue; }
    if (body.includes('QUERY LENGTH')) continue; // corrupt — must be rebuilt
    if (name.endsWith('.html') && !body.includes(`lang="${l}"`)) continue;
    n++;
  }
  return n;
}

let attempt = 0, lastDone = -1, stallCount = 0, cooldown = BASE_COOLDOWN_MS;

for (;;) {
  attempt++;
  const t0 = Date.now();
  const code = await new Promise((resolve) => {
    const p = spawn(process.execPath, [join(HERE, 'mirror-auth.mjs'), ...extra], { stdio: 'inherit' });
    p.on('exit', (c) => resolve(c ?? 1));
  });
  const mins = ((Date.now() - t0) / 60000).toFixed(1);
  const done = doneCount();
  const total = LOCALES.length * (PAGES.length + DATA_FILES.length);

  if (code === 0) {
    console.log(`[resume] mirror complete: ${done}/${total} targets after ${attempt} attempt(s)`);
    process.exit(0);
  }
  if (code === 3) {
    console.error('[resume] monthly MT spend cap reached — not resuming (resets on the 1st).');
    process.exit(3);
  }
  if (code === 4) {
    // Legacy path (mirror-auth now exits 2 for quota+fallbacks): fixed wait —
    // the old formula omitted `* 3600e3`, yielding a NEGATIVE sleep and a
    // no-cooldown hot loop.
    const reset = new Date(Math.ceil((Date.now() + 4 * 3600e3) / 3600e3) * 3600e3);
    const waitMs = Math.max(reset - Date.now(), 30 * 60e3);
    console.error(`[resume] MyMemory daily quota — sleeping ${(waitMs / 60000).toFixed(0)}m until reset (done ${done}/${total}).`);
    await new Promise((r) => setTimeout(r, waitMs));
    continue;
  }
  if (code !== 2) {
    console.error(`[resume] mirror-auth failed with exit ${code} — stopping (done ${done}/${total})`);
    process.exit(code);
  }

  // exit 2 = throttled. Did we make progress since the last attempt?
  if (done > lastDone) {
    if (lastDone >= 0) console.log(`[resume] progress: ${done}/${total} targets complete (+${done - lastDone})`);
    lastDone = done;
    stallCount = 0;
    cooldown = BASE_COOLDOWN_MS;
  } else {
    stallCount++;
    cooldown = Math.min(cooldown * 2, MAX_COOLDOWN_MS);
    console.log(`[resume] no progress at ${done}/${total} (stall #${stallCount})`);
  }

  // NOTE: no `done >= total` shortcut here — doneCount() only proves each
  // target file EXISTS with the right <html lang>; it cannot see English
  // fallback strings inside. Exit 0 from mirror-auth (totalFallbacks === 0)
  // is the only trustworthy completion signal.
  console.log(`[resume] attempt ${attempt} ran ${mins}m — cooling down ${Math.round(cooldown / 60000)}m (done ${done}/${total})`);
  await new Promise((r) => setTimeout(r, cooldown));
}
