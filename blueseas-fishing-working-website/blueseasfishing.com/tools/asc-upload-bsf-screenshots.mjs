// Upload Blue Seas screenshots to a screenshot set via ASC API.
// Usage: MSYS2_ARG_CONV_EXCL="*" node tools/asc-upload-bsf-screenshots.mjs <folder-of-pngs> [displayType]
//   displayType: APP_IPHONE_65 (default) | APP_IPAD_PRO_3GEN_129 (13" iPad)
// Flow per file: POST /v1/appScreenshots (reserve) -> PUT bytes to uploadOperations[0].url -> PATCH uploaded=true + md5 checksum.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { makeToken, API } from './asc-jwt.mjs';

const VERSION_ID = '0eaf00d6-1fcd-40f5-a4d3-67aea4d63125'; // Blue Seas 1.0
const LOCALE = 'en-US';
const DISPLAY = process.argv[3] ?? 'APP_IPHONE_65';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node tools/asc-upload-bsf-screenshots.mjs <folder-of-pngs> [displayType]');
  process.exit(1);
}
console.log(`Target display type: ${DISPLAY}`);

async function api(method, p, body, extraHeaders = {}) {
  const res = await fetch(`${API}${p}`, {
    method,
    headers: {
      Authorization: `Bearer ${makeToken()}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  if (res.status >= 300) {
    console.error(`HTTP ${res.status} ${method} ${p}\n${text}`);
    process.exit(1);
  }
  return json;
}

// 1. en-US localization of version 1.0 (GET_COLLECTION is not allowed on
// appStoreVersionLocalizations, but GET_INSTANCE is — ID was captured earlier).
const locId = '47dbe33c-57da-4906-9887-609074cd2309';
const loc = await api('GET', `/v1/appStoreVersionLocalizations/${locId}`);
if (loc.data?.attributes?.locale !== LOCALE) {
  console.error(`Localization ${locId} is ${loc.data?.attributes?.locale}, expected ${LOCALE}`);
  process.exit(1);
}

// 2. Find or create the APP_IPHONE_65 screenshot set
const sets = await api('GET', `/v1/appStoreVersionLocalizations/${locId}/appScreenshotSets`);
let set = sets.data.find(s => s.attributes.screenshotDisplayType === DISPLAY);
if (set) {
  console.log(`Screenshot set exists: ${set.id} (${DISPLAY})`);
} else {
  const created = await api('POST', '/v1/appScreenshotSets', {
    data: {
      type: 'appScreenshotSets',
      attributes: { screenshotDisplayType: DISPLAY },
      relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: locId } } },
    },
  });
  set = created.data;
  console.log(`Created screenshot set: ${set.id} (${DISPLAY})`);
}

const existing = await api('GET', `/v1/appScreenshotSets/${set.id}/appScreenshots`) ?? { data: [] };
const done = new Set((existing.data ?? []).map(s => s.attributes.fileName));
if (done.size > 0) console.log(`Already in set (will skip): ${[...done].join(', ')}`);

// 3. Upload each PNG in filename order
const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.png')).sort();
if (files.length === 0) { console.error('No PNG files found'); process.exit(1); }
console.log(`Uploading ${files.length} file(s): ${files.join(', ')}`);

for (const f of files) {
  if (done.has(f)) { console.log(`${f}: already uploaded, skipping`); continue; }
  const fp = path.join(dir, f);
  const bytes = fs.readFileSync(fp);
  const fileSize = bytes.length;
  const md5 = crypto.createHash('md5').update(bytes).digest('hex');

  const reserved = await api('POST', '/v1/appScreenshots', {
    data: {
      type: 'appScreenshots',
      attributes: { fileName: f, fileSize },
      relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: set.id } } },
    },
  });
  const shotId = reserved.data.id;
  const state0 = reserved.data.attributes.assetDeliveryState?.state;
  const op = reserved.data.attributes.uploadOperations?.[0];
  if (!op) { console.error(`No uploadOperations for ${f} (state=${state0})`); process.exit(1); }
  console.log(`${f}: reserved ${shotId} (${state0}) -> PUT ${op.method} ${op.length} bytes`);

  const put = await fetch(op.url, {
    method: op.method,
    headers: { 'Content-Type': op.requestHeaders?.['Content-Type'] ?? 'image/png' },
    body: bytes,
  });
  if (put.status >= 300) {
    console.error(`PUT failed HTTP ${put.status}: ${await put.text()}`);
    process.exit(1);
  }
  console.log(`${f}: PUT ${put.status}`);

  const committed = await api('PATCH', `/v1/appScreenshots/${shotId}`, {
    data: { type: 'appScreenshots', id: shotId, attributes: { uploaded: true, sourceFileChecksum: md5 } },
  });
  console.log(`${f}: committed, assetDeliveryState=${committed.data.attributes.assetDeliveryState?.state}`);
}

// 4. Verify
const verify = await api('GET', `/v1/appScreenshotSets/${set.id}/appScreenshots`);
console.log('\nScreenshot set now contains:');
for (const s of verify.data) {
  console.log(`  ${s.attributes.fileName}  ${s.attributes.assetDeliveryState?.state}  ${s.attributes.fileSize} bytes  priority=${s.attributes.priority ?? '-'}`);
}
