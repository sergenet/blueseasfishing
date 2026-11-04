// Fill Blue Seas (app 6817498888) v1.0 App Store version localization text fields.
// Accurate-metadata rule (Apple 2.3.1): describes the OFFLINE app exactly —
// 548 species / 20 comparisons / 124 destinations, no in-app AI claims, no premium claims.
// NOTE: whatsNew is NOT set — Apple rejects it with 409 STATE_ERROR on a first version.
// Run from repo root: MSYS2_ARG_CONV_EXCL="*" node tools/asc-set-bsf-listing.mjs
import { makeToken, API } from './asc-jwt.mjs';

const LOC_ID = '47dbe33c-57da-4906-9887-609074cd2309'; // en-US version localization (v1.0)
const APP_INFO_ID = '825024d4-b11b-4274-9479-ac7ce60376a7';

const DESCRIPTION = `Meet the pocket companion for anglers: 548 fish species, 20 side-by-side comparison guides, and 124 fishing destinations — bundled into the app and available offline, wherever the water takes you.

SPECIES PROFILES
• 548 freshwater and saltwater species covering the United States and beyond
• Habitat, depth range, season, diet, and the best baits and lures for every species
• Scientific names plus common aliases, so you can search "greenhead" or "sailfin"
• Photos load from blueseasfishing.com when you're online

COMPARE LOOKALIKES
• 20 side-by-side ID guides: largemouth vs spotted bass, blue vs channel catfish, brown vs lake trout and more
• Quick-feature tables that settle "which fish is this?" debates right at the ramp

FIND WHAT'S BITING
• 124 destination guides — bays, piers, lakes and coastlines
• Each destination lists the species in our database for that fishery

WHY OFFLINE MATTERS
No account, no ads, no waiting on a signal. Species data lives inside the app, so it works at the lake, offshore, or in airplane mode.

MORE ON THE WEB
• Identify a fish photo with the AI Fish ID tool at blueseasfishing.com (linked from the app's More tab)
• Browse the full species database, photo gallery and the free monthly bite brief

Always confirm size and possession limits with your local wildlife agency — regulations change, and this guide is for identification, not legal advice.

Terms of Use (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula.html
Privacy Policy: https://www.blueseasfishing.com/privacy.html`;

const KEYWORDS = 'fish,species,angler,bait,lures,saltwater,freshwater,chart,guide,bass,trout,catfish,offshore,identify';

const PROMO = '548 fish species, 20 comparison guides and 124 destinations — fully offline. No account, no ads. Your pocket fishing ID companion.';

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

// 1) PATCH the en-US version localization text fields.
const patch = await call('PATCH', `/v1/appStoreVersionLocalizations/${LOC_ID}`, {
  data: {
    type: 'appStoreVersionLocalizations',
    id: LOC_ID,
    attributes: {
      description: DESCRIPTION,
      keywords: KEYWORDS,
      promotionalText: PROMO,
    },
  },
});
console.log('PATCH localization →', patch.status);
if (!patch.ok) { console.log(patch.text); process.exit(1); }
const a = patch.json.data.attributes;
console.log('description length:', a.description.length);
console.log('keywords length:', a.keywords.length, '(limit 100)');
console.log('promotionalText length:', a.promotionalText.length, '(limit 170)');

// 2) Show the age rating declaration shape (do not change anything yet).
const ar = await call('GET', `/v1/appInfos/${APP_INFO_ID}/ageRatingDeclaration`);
console.log('\nageRatingDeclaration →', ar.status);
if (ar.ok) {
  console.log(JSON.stringify(ar.json.data.attributes, null, 2));
} else {
  console.log(ar.text);
}
