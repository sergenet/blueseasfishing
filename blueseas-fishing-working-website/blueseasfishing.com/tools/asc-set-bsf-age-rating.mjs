// Set Blue Seas (app 6817498888) age rating: every question No → 4+.
// App facts: offline database app; no UGC, no chat, no ads, no gambling, no embedded
// browser — Linking.openURL opens Safari links to blueseasfishing.com only, which does
// NOT count as Unrestricted Web Access. No health/medical content (fishing ID guide).
// Run from repo root: MSYS2_ARG_CONV_EXCL="*" node tools/asc-set-bsf-age-rating.mjs
import { makeToken, API } from './asc-jwt.mjs';

const APP_INFO_ID = '825024d4-b11b-4274-9479-ac7ce60376a7';

// API note: content-intensity questions take STRING enums ('NONE' | 'INFREQUENT_OR_MILD' |
// 'FREQUENT_OR_INTENSE' | 'INFREQUENT' | 'FREQUENT'); the rest take booleans.
const N = 'NONE';
const ALL_NO = {
  // boolean questions
  advertising: false,
  gambling: false,
  healthOrWellnessTopics: false,
  lootBox: false,
  messagingAndChat: false,
  socialMedia: false,
  unrestrictedWebAccess: false, // Safari links via Linking.openURL ≠ embedded browser
  userGeneratedContent: false,
  parentalControls: false, // no PIN-locked/parental-gated features
  ageAssurance: false, // boolean per API; app has no age-restricted content
  // enum questions → NONE
  alcoholTobaccoOrDrugUseOrReferences: N,
  contests: N,
  gamblingSimulated: N,
  gunsOrOtherWeapons: N,
  horrorOrFearThemes: N,
  matureOrSuggestiveThemes: N,
  medicalOrTreatmentInformation: N,
  profanityOrCrudeHumor: N,
  sexualContentGraphicAndNudity: N,
  sexualContentOrNudity: N,
  violenceCartoonOrFantasy: N,
  violenceRealistic: N,
  violenceRealisticProlongedGraphicOrSadistic: N,
};

async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${makeToken()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, ok: res.ok, json, text };
}

// 1) Fetch declaration to get its id.
const get = await call('GET', `/v1/appInfos/${APP_INFO_ID}/ageRatingDeclaration`);
if (!get.ok) { console.log('GET failed', get.status, get.text); process.exit(1); }
const decId = get.json.data.id;
console.log('declaration id:', decId, 'type:', get.json.data.type);

// 2) PATCH all-No (correct resource path: /v1/ageRatingDeclarations).
const patch = await call('PATCH', `/v1/ageRatingDeclarations/${decId}`, {
  data: { type: 'ageRatingDeclarations', id: decId, attributes: ALL_NO },
});
console.log('PATCH age rating →', patch.status);
if (!patch.ok) { console.log(patch.text); process.exit(1); }
const attrs = patch.json.data.attributes;
const wrong = Object.entries(ALL_NO).filter(([k, v]) => attrs[k] !== v);
console.log(wrong.length ? `NOT SAVED: ${JSON.stringify(wrong)}` : 'all 21 questions saved as No/NONE ✓');

// 3) Inspect appInfo for DSA/trader status + state.
const info = await call('GET', `/v1/appInfos/${APP_INFO_ID}`);
if (info.ok) {
  console.log('\nappInfo state:', info.json.data.attributes.appStoreState);
  const interesting = Object.fromEntries(
    Object.entries(info.json.data.attributes).filter(([k]) => /dsa|trader|merchant|regulat/i.test(k))
  );
  console.log('DSA/trader-related attributes:', JSON.stringify(interesting, null, 2));
} else {
  console.log('appInfo GET failed', info.status, info.text);
}
