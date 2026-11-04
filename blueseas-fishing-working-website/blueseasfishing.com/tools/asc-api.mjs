// App Store Connect API probe.
// Usage: node tools/asc-api.mjs /v1/apps/6812443628
// Signs an ES256 JWT with the ASC API key saved at C:/Users/Serge/bsf-keys/AuthKey_6UFTJ53674.p8.
// Key facts: Key ID 6UFTJ53674, Issuer d0eb378e-7d52-4a0c-8446-c6b8f017bf35, role App Manager.
import fs from 'node:fs';
import crypto from 'node:crypto';

const KEY_PATH = 'C:/Users/Serge/bsf-keys/AuthKey_6UFTJ53674.p8';
const KEY_ID = '6UFTJ53674';
const ISSUER_ID = 'd0eb378e-7d52-4a0c-8446-c6b8f017bf35';
const API = 'https://api.appstoreconnect.apple.com';

const b64url = (buf) => Buffer.from(buf).toString('base64url');

// JWT ES256 needs raw r||s (64 bytes); Node emits DER (SEQUENCE of two INTEGERs) — convert.
function derToRaw(der) {
  let p = 2;
  if (der[1] & 0x80) p += der[1] & 0x7f; // long-form length header
  if (der[p] !== 0x02) throw new Error('bad DER: expected INTEGER');
  const rLen = der[p + 1];
  const r = der.slice(p + 2, p + 2 + rLen);
  const q = p + 2 + rLen;
  if (der[q] !== 0x02) throw new Error('bad DER: expected INTEGER');
  const sLen = der[q + 1];
  const s = der.slice(q + 2, q + 2 + sLen);
  const rr = r.length === 33 ? r.slice(1) : r; // strip leading zero
  const ss = s.length === 33 ? s.slice(1) : s;
  return Buffer.concat([Buffer.alloc(32 - rr.length, 0), rr, Buffer.alloc(32 - ss.length, 0), ss]);
}

function makeToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: KEY_ID, typ: 'JWT' };
  const payload = { iss: ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' };
  const input = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const key = crypto.createPrivateKey(fs.readFileSync(KEY_PATH, 'utf8'));
  const der = crypto.sign('SHA256', Buffer.from(input), key);
  return `${input}.${b64url(derToRaw(der))}`;
}

const path = process.argv[2];
if (!path) {
  console.error('Usage: node tools/asc-api.mjs <api-path e.g. /v1/apps>');
  process.exit(1);
}

const res = await fetch(`${API}${path}`, {
  headers: { Authorization: `Bearer ${makeToken()}` },
});
const text = await res.text();
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(`HTTP ${res.status}\n${text}`);
}
if (!res.ok) process.exitCode = 1;
