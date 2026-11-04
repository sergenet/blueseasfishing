// tools/i18n/resume-build.mjs — keeps re-running build.mjs until it finishes.
// Google's free gtx endpoint 429s in waves; build.mjs exits code 2 when the
// quota is exhausted (cache+manifest persist progress), so we sleep and resume.
// Cooldown adapts: it backs off further while progress stalls, and resets as
// soon as the manifest grows again, so the job can run unattended for days.
// Run: node tools/i18n/resume-build.mjs [--locale xx] [--limit n]
// Exit codes: 0 done, 2 quota (resume), 3 monthly spend cap (do not resume).
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(HERE, 'manifest.json');
const extra = process.argv.slice(2);
const BASE_COOLDOWN_MS = 5 * 60 * 1000;
const MAX_COOLDOWN_MS = 30 * 60 * 1000;
const PROGRESS_FILE = join(HERE, 'cache', '.resume-state.json');

function donePages() {
  try {
    const m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
    return Object.keys(m).filter((k) => k !== '__version').length;
  } catch { return 0; }
}

let attempt = 0;
let lastDone = -1;
let stallCount = 0;
let cooldown = BASE_COOLDOWN_MS;

for (;;) {
  attempt++;
  const t0 = Date.now();
  const code = await new Promise((resolve) => {
    const p = spawn(process.execPath, [join(HERE, 'build.mjs'), ...extra], { stdio: 'inherit' });
    p.on('exit', (c) => resolve(c ?? 1));
  });
  const mins = ((Date.now() - t0) / 60000).toFixed(1);

  if (code === 0) {
    console.log(`[resume] build complete after ${attempt} attempt(s)`);
    process.exit(0);
  }
  if (code === 3) {
    console.error('[resume] monthly MT spend cap reached — not resuming (the $100 cap resets on the 1st).');
    process.exit(3);
  }
  if (code !== 2) {
    console.error(`[resume] build failed with exit ${code} — stopping`);
    process.exit(code);
  }

  // exit 2 = MT quota exhausted. Did the manifest advance since last time?
  const done = donePages();
  if (done > lastDone) {
    if (lastDone >= 0) console.log(`[resume] progress: ${done} pages complete (+${done - lastDone})`);
    lastDone = done;
    stallCount = 0;
    cooldown = BASE_COOLDOWN_MS;
  } else {
    stallCount++;
    cooldown = Math.min(cooldown * 2, MAX_COOLDOWN_MS);
    console.log(`[resume] no progress at ${done} pages (stall #${stallCount})`);
  }

  try {
    writeFileSync(PROGRESS_FILE, JSON.stringify(
      { attempt, done, stallCount, cooldown, at: new Date().toISOString() }, null, 2));
  } catch { /* best-effort */ }

  console.log(`[resume] attempt ${attempt} ran ${mins}m — cooling down ${Math.round(cooldown / 60000)}m`);
  await new Promise((r) => setTimeout(r, cooldown));
}
