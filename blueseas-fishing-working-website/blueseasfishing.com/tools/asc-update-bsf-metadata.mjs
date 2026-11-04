import { makeToken, API } from './asc-jwt.mjs';

const LOC_ID = '47dbe33c-57da-4906-9887-609074cd2309';
const REVIEW_DETAIL_ID = 'f8db1cb1-4388-4486-b8ea-1aaba5b89ed8';

const call = async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${makeToken()}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path}: ${JSON.stringify(body.errors || body)}`);
  return body;
};

const newDescription = `Meet the pocket companion for anglers: 548 fish species, 20 side-by-side comparison guides, 124 fishing destinations, and AI-powered fish photo identification.

SPECIES PROFILES
• 548 freshwater and saltwater species covering the United States and beyond
• Habitat, depth range, season, diet, and the best baits and lures for every species
• Scientific names plus common aliases, so you can search "greenhead" or "sailfin"
• Photos load from blueseasfishing.com when you're online

AI FISH IDENTIFICATION & PREMIUM
• Snap or upload a fish photo for instant species identification and distinguishing features
• Free users get 3 identifications daily plus full offline access to all 548 species profiles
• Blue Seas Premium unlocks unlimited AI identifications and multi-fish destination trip plans

COMPARE LOOKALIKES
• 20 side-by-side ID guides: largemouth vs spotted bass, blue vs channel catfish, brown vs lake trout and more
• Quick-feature tables that settle "which fish is this?" debates right at the ramp

FIND WHAT'S BITING
• 124 destination guides — bays, piers, lakes and coastlines
• Each destination lists the species in our database for that fishery

Always confirm size and possession limits with your local wildlife agency — regulations change, and this guide is for identification, not legal advice.

Terms of Use (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
Privacy Policy: https://www.blueseasfishing.com/privacy.html`;

const newNotes = `Blue Seas Fishing 1.0 includes offline species guides, side-by-side comparisons, and AI-assisted fish identification.
Free tier: 3 AI fish photo identifications per day.
In-App Purchases (Blue Seas Premium):
- Blue Seas Premium Monthly ($7.99/mo)
- Blue Seas Premium Yearly ($59.99/yr)
Both unlock unlimited AI fish identifications and multi-fish destination trip plans.
To test the subscription flow:
1. Open the app and tap the 'Identify' or 'Premium' tab in the bottom bar.
2. Tap either 'Blue Seas Premium · Monthly' ($7.99/mo) or 'Blue Seas Premium · Yearly' ($59.99/yr) to present the native App Store purchase sheet.
3. A 'Restore App Store Purchase' button, 'Manage subscriptions in App Store' link, and clickable EULA / Privacy Policy links are present on the paywall screen.
No account registration or login is required.`;

console.log('Updating appStoreVersionLocalization...');
await call(`/v1/appStoreVersionLocalizations/${LOC_ID}`, {
  method: 'PATCH',
  body: JSON.stringify({
    data: {
      type: 'appStoreVersionLocalizations',
      id: LOC_ID,
      attributes: {
        description: newDescription,
        promotionalText: '548 fish species, 20 comparison guides, 124 destinations, and AI fish photo identification.',
      },
    },
  }),
});
console.log('Localization updated successfully.');

console.log('Updating appStoreReviewDetail notes...');
await call(`/v1/appStoreReviewDetails/${REVIEW_DETAIL_ID}`, {
  method: 'PATCH',
  body: JSON.stringify({
    data: {
      type: 'appStoreReviewDetails',
      id: REVIEW_DETAIL_ID,
      attributes: {
        notes: newNotes,
        demoAccountRequired: false,
      },
    },
  }),
});
console.log('Review notes updated successfully.');
