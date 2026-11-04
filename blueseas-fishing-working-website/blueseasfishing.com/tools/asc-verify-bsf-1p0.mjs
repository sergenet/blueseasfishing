// Verify Blue Seas 1.0 submission readiness (read-only).
// Run from repo root: MSYS2_ARG_CONV_EXCL="*" node tools/asc-verify-bsf-1p0.mjs
import { makeToken, API } from './asc-jwt.mjs';

const VERSION_ID = '0eaf00d6-1fcd-40f5-a4d3-67aea4d63125';
const APP = '6817498888';

async function call(path) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${makeToken()}` } });
  const text = await res.text();
  try { return { status: res.status, json: JSON.parse(text) }; } catch { return { status: res.status, text }; }
}

// 1) Version + attached build.
const ver = await call(`/v1/appStoreVersions/${VERSION_ID}?include=build`);
console.log('version state:', ver.json?.data?.attributes?.appStoreState ?? ver.status);
const b = ver.json?.included?.[0];
console.log('attached build:', b ? `#${b.attributes.version} (${b.attributes.processingState})` : 'NONE');

// 2) Localization text saved?
const loc = await call(`/v1/appStoreVersionLocalizations/47dbe33c-57da-4906-9887-609074cd2309`);
const a = loc.json?.data?.attributes ?? {};
console.log('\nlocalization:');
console.log('  description:', a.description ? `${a.description.length} chars ✓` : 'MISSING');
console.log('  keywords:', a.keywords ? `${a.keywords.length} chars ✓` : 'MISSING');
console.log('  promotionalText:', a.promotionalText ? `${a.promotionalText.length} chars ✓` : 'MISSING');
console.log('  supportUrl:', a.supportUrl ?? 'MISSING');

// 3) Screenshot sets on the localization.
const sets = await call(`/v1/appStoreVersionLocalizations/47dbe33c-57da-4906-9887-609074cd2309/appScreenshotSets`);
console.log('\nscreenshot sets:', sets.json?.data?.length ?? sets.status,
  sets.json?.data?.map((s) => s.attributes.screenshotDisplayType).join(', ') || '');

// 4) Pricing (app price schedule at app level).
const price = await call(`/v1/apps/${APP}/appPriceSchedule`);
console.log('\nappPriceSchedule:', price.status, price.json?.data ? JSON.stringify(price.json.data.attributes) : price.text?.slice(0, 200));
const avail = await call(`/v1/apps/${APP}/appAvailabilityV2`);
console.log('appAvailabilityV2:', avail.status, avail.json?.data ? JSON.stringify(avail.json.data.attributes).slice(0, 300) : avail.text?.slice(0, 200));
