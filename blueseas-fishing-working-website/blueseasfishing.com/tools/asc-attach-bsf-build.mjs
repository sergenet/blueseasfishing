// Attach Blue Seas build 9 to appStoreVersion 1.0 and show price schedule raw body.
// Run from repo root: MSYS2_ARG_CONV_EXCL="*" node tools/asc-attach-bsf-build.mjs
import { makeToken, API } from './asc-jwt.mjs';

const VERSION_ID = '0eaf00d6-1fcd-40f5-a4d3-67aea4d63125';
const APP = '6817498888';
const BUILD_VERSION = process.argv[2] || '9';

async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${makeToken()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return { status: res.status, json: JSON.parse(text) }; } catch { return { status: res.status, text }; }
}

// 1) Find the build (list all app builds, pick by version client-side).
const builds = await call('GET', `/v1/builds?filter[app]=${APP}&filter[version]=${BUILD_VERSION}&limit=10`);
if (!builds.ok) {
  console.log('filtered GET failed', builds.status, JSON.stringify(builds.json ?? builds.text).slice(0, 400));
  console.log('falling back to unfiltered list...');
  const all = await call('GET', `/v1/builds?filter[app]=${APP}&limit=20`);
  console.log('all builds:', (all.json?.data ?? []).map((x) => `#${x.attributes.version} ${x.attributes.processingState}`).join(' | ') || all.status);
  const pick = (all.json?.data ?? []).find((x) => String(x.attributes.version) === BUILD_VERSION);
  if (!pick) process.exit(1);
  builds.json = { data: [pick] };
}
const build = builds.json.data[0];
if (!build) { console.log(`no build with version ${BUILD_VERSION} found`); process.exit(1); }
console.log(`build ${BUILD_VERSION}: id=${build.id} state=${build.attributes.processingState} expired=${build.attributes.expired} usesNonExemptEncryption=${build.attributes.usesNonExemptEncryption}`);
if (build.attributes.processingState !== 'VALID') { console.log('build not VALID — stopping'); process.exit(1); }

// 2) Attach to the version (PATCH build relationship on appStoreVersion).
const patch = await call('PATCH', `/v1/appStoreVersions/${VERSION_ID}`, {
  data: {
    type: 'appStoreVersions',
    id: VERSION_ID,
    relationships: { build: { data: { type: 'builds', id: build.id } } },
  },
});
console.log('PATCH attach build →', patch.status);
if (!patch.ok) { console.log(patch.text); process.exit(1); }

// 3) Confirm.
const ver = await call('GET', `/v1/appStoreVersions/${VERSION_ID}?include=build`);
const inc = ver.json?.included?.[0];
console.log('confirmed attached build:', inc ? `#${inc.attributes.version} (${inc.attributes.processingState})` : 'NONE');

// 4) Raw price schedule body (is a Free tier set?).
const price = await call('GET', `/v1/apps/${APP}/appPriceSchedule`);
console.log('\nappPriceSchedule raw:', JSON.stringify(price.json ?? price.text, null, 2).slice(0, 1500));
