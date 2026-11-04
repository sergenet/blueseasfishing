#!/usr/bin/env node
/**
 * upload-changed.mjs — push a specific set of paths to the live site.
 *
 * deploy-site.py walks all ~9,851 files every run and compares remote sizes, which
 * takes ~40 minutes. When only one directory changed (e.g. the affiliate-link repair
 * across destinations/ and its 7 locale mirrors) that is pure overhead.
 *
 * This uploads the same files with the same skip-if-same-size rule, but only for the
 * paths given. Credentials come from deploy.py via python, so they are never printed
 * or duplicated here.
 *
 * Run:  node tools/upload-changed.mjs destinations es/destinations fr/destinations \
 *         de/destinations pt/destinations ru/destinations el/destinations ar/destinations
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
// deploy.py sits two levels up: <project>/blueseasfishing/deploy.py
const DEPLOY_PY = join(ROOT, '..', '..', 'deploy.py');

const dirs = process.argv.slice(2);
if (!dirs.length) {
  console.error('usage: node tools/upload-changed.mjs <dir> [dir...]');
  process.exit(1);
}

// Pull credentials through python without echoing them.
const credsJson = execFileSync('python', [
  '-c',
  `import json,sys; sys.path.insert(0, r"${dirname(DEPLOY_PY)}"); import deploy; ` +
  `print(json.dumps({"host":deploy.FTP_HOST,"user":deploy.FTP_USER,"pass":deploy.FTP_PASS}))`,
], { encoding: 'utf8' }).trim();
const creds = JSON.parse(credsJson);

const files = [];
for (const d of dirs) {
  const abs = join(ROOT, d);
  let names;
  try { names = readdirSync(abs); } catch { console.error(`skip ${d}: not found`); continue; }
  for (const n of names) {
    if (!n.endsWith('.html')) continue;
    const p = join(abs, n);
    if (!statSync(p).isFile()) continue;
    files.push({ abs: p, rel: relative(ROOT, p).split('\\').join('/') });
  }
}
console.log(`${files.length} files to check across ${dirs.length} directories`);

// ~/.netrc-style trivial FTP client over python's ftplib, driven from node.
const py = `
import ftplib, sys, json, os
creds = json.loads(os.environ["FTPCREDS"])
items = json.loads(os.environ["FTPITEMS"])
ftp = ftplib.FTP(creds["host"], timeout=120)
ftp.login(creds["user"], creds["pass"])
ftp.set_pasv(True)
uploaded = skipped = failed = 0
for rel, local, size in items:
    remote = "/" + rel
    try:
        try:
            if ftp.size(remote) == size:
                skipped += 1
                continue
        except Exception:
            pass
        parent = "/".join(remote.split("/")[:-1])
        parts = [p for p in parent.split("/") if p]
        cur = ""
        for p in parts:
            cur += "/" + p
            try: ftp.mkd(cur)
            except Exception: pass
        with open(local, "rb") as f:
            ftp.storbinary("STOR " + remote, f, blocksize=32768)
        uploaded += 1
        sys.stderr.write("U " + rel + "\\n")
    except Exception as e:
        failed += 1
        sys.stderr.write("FAIL " + rel + " :: " + str(e) + "\\n")
ftp.quit()
print(json.dumps({"uploaded": uploaded, "skipped": skipped, "failed": failed}))
`;

const items = files.map((f) => [f.rel, f.abs, statSync(f.abs).size]);
const out = execFileSync('python', ['-c', py], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
  env: { ...process.env, FTPCREDS: credsJson, FTPITEMS: JSON.stringify(items) },
  stdio: ['ignore', 'pipe', 'inherit'],
});
console.log(out.trim());
