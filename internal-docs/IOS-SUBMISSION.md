# Blue Seas Fishing — iOS status & remaining steps

**Pipeline: Expo EAS** (the same one used for TimerHavenApp and the AI Plant
Doctor apps — no Mac, no GitHub, no Codemagic needed).

Project folder: `C:\Users\Serge\Desktop\BlueSeasApp` (Expo SDK 54, offline
species database: 548 species / 20 comparisons / 124 destinations).
EAS project: `@sergenet/BlueSeasApp` · App Store Connect Apple ID: **6817498888**
ASC API key: "BlueSeas EAS" (ID 6UFTJ53674) stored at
`C:\Users\Serge\bsf-keys\AuthKey_6UFTJ53674.p8` — keep this file, it signs
every future submission. Issuer ID: d0eb378e-7d52-4a0c-8446-c6b8f017bf35.

## DONE (2026-09-29)

- Native Expo app built: 4 tabs (Species A–Z + search, Compare, Destinations,
  More), all data bundled offline, photos lazy-load from blueseasfishing.com.
- EAS cloud build **a15c83e9** — FINISHED (version 1.0.0, build 9).
- Submitted to App Store Connect (submission ef76f533) → **FINISHED**; build 9
  shows in ASC as **VALID** (processing done, App Store eligible).
- App record created in App Store Connect: "Blue Seas Fishing — Fish ID",
  SKU blueseas-001, bundle com.blueseasfishing.app, primary category **Sports**,
  subtitle "Identify fish, find hotspots" — all SAVED.
- Privacy Policy URL + Support URL set via ASC API
  (tools/asc-set-bsf-urls.mjs): blueseasfishing.com/privacy.html and
  blueseasfishing.com/contact.html.

## LESSONS FROM THE "GARDEN WITH SERGE" REJECTION — CHECK BEFORE SUBMITTING

Garden with Serge 1.1.7 was rejected (Sep 2026) for two things that are easy to
avoid. Verify every item below on the Blue Seas 1.0 page **before** pressing
Submit for Review:

1. **App Description must contain a functional Terms of Use (EULA) link.**
   Apple auto-checks this for ANY app (theirs uses Apple's standard EULA, so a
   plain link to https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
   in the description satisfied them). Blue Seas has no subscriptions, but the
   AI fish-ID page should still include this line in the App Description —
   cheap insurance and it matches the website's Terms.
2. **Privacy Policy URL field must be filled and functional** (App Privacy
   page). DONE for Blue Seas via API; confirm it shows on the version page.
3. **Support URL must be filled** (version page). DONE for Blue Seas via API
   (blueseasfishing.com/contact.html).
4. **EVERY In-App Purchase must be submitted together with the app.** Apple
   rejects the whole version if the app shows a product that isn't also
   submitted for review, and requires a NEW BINARY + review screenshot per IAP
   to fix it. Blue Seas has no IAPs, so this cannot happen — but never add a
   paid tier later without submitting the IAP in the same submission.
5. **App Review Notes should tell the reviewer exactly how to reach any
   purchase/upgrade flow** and mention that legal links are present.
6. **App Information page warnings**: complete the Digital Services Act trader
   status and any "Regulated Medical Devices" widgets if Apple shows them
   (GWS still has both pending; these become hard blockers later).
7. **Age rating**: answer the questionnaire before submit (Blue Seas: all No
   except Unrestricted Web Access = Yes).

Two reusable tools now exist (see tools/): `asc-api.mjs` (read any ASC API
endpoint with the saved key) and `asc-copy-iap-screenshot.mjs` (copy an IAP
review screenshot between subscriptions). MSYS quirk: run with
`MSYS2_ARG_CONV_EXCL="*"` or leading-slash API paths get mangled.

## REMAINING (in App Store Connect, appstoreconnect.apple.com)

**UPDATE 2026-09-30 — done via API (see PLAY-CONSOLE-PROGRESS.md):** description
(accurate offline-app text with EULA + Privacy links), keywords 100/100, promo text,
age rating (all No/NONE → 4+; Unrestricted Web Access = **No** — `Linking.openURL`
opens Safari, it does NOT count as web access), and build 9 ATTACHED to version 1.0
(it was missing!).

**UPDATE 2026-09-30 (later) — done in ASC UI + verified:**
- Version-page fields saved: Sign-in required UNCHECKED, Copyright "2026 Serge
  Shammas", App Review contact (Serge Shammas / +30 690 755 7864 /
  sergenet@yahoo.com), review Notes explaining offline app + web-only AI tool.
- **Pricing DONE in UI**: Free $0.00, base US, all 175 countries $0.00 (API can't
  read/write price points with this key — UI only). Tax category already correct.
- **Availability DONE in UI**: all 175 countries/regions, "Available on App Release".
- **App Information / DSA check DONE**: DSA widget already shows "This developer
  has identified itself as a non-trader for this app" (NOT pending, unlike GWS).
  No Regulated Medical Devices requirement (category Sports, age answers all NONE).
  Age rating 4+ (172 countries), category Sports, License Agreement = Apple's
  standard EULA — all verified on /apps/6817498888/distribution/info.
- Release option: "Automatically release this version" (left as-is).

Still open:

- **REJECTED 2026-10-02 — Guideline 2.1 "Information Needed"** (new-developer-
  account info request; NOT a bug/metadata violation; build 9 stays attached).
  A newer build (11) is now in TestFlight — see the 2026-10-20 section.
  Reviewer wants 6 items posted as a Resolution Center reply AND summarized in the
  App Review Notes field, then Resubmit: (1) physical-device screen recording,
  (2) purpose/audience, (3) setup/access, (4) external services, (5) regional
  differences, (6) regulated industry / third-party material. Full reply draft +
  video shooting script + checklist: **ASC-REJECTION-REPLY.md** (same folder).
- **ASC API key 6UFTJ53674 STOPPED WORKING (2026-10-02)** — every call returns
  401 NOT_AUTHORIZED, including /v1/apps/9999999999 (token-level rejection →
  key no longer recognized; likely revoked Apple-side). Same .p8 bytes worked
  Sep 30; clock verified in sync. Doesn't affect the app or submission — but to
  resume API automation: ASC → Users and Access → Integrations → Team Keys →
  Generate (role App Manager), save .p8 to C:\Users\Serge\bsf-keys\ and update
  KEY_ID in tools/asc-jwt.mjs (issuer ID unchanged).
- SUBMITTED 2026-09-30 ~3:32 PM — version 1.0 went to WAITING_FOR_REVIEW. All
  last blockers cleared in one pass:
  * TestFlight set up: group "Blue Seas Internal" (a14c2ccc-30a9-4628-9f5e-f61062431c1f,
    auto-distribution ON), Serge invited as internal tester (email invite).
  * Screenshots: iPhone 15 shots (1179×2556) resized with ImageMagick to 1284×2778;
    iPad shots (2048×1536) upscaled to 2732×2048; both sets uploaded via API with
    tools/asc-upload-bsf-screenshots.mjs (set b97e690d... = APP_IPHONE_65,
    aa1d2a1c... = APP_IPAD_PRO_3GEN_129). NOTE: Apple now requires 13" iPad
    screenshots for iPad-capable apps. Resume logic included (skips files already
    in the set) — Apple API intermittently 401s/500s mid-run, just re-run it.
  * Content Rights (UI only — attribute not exposed to this API key): "No, this
    app does not contain, show, or access third-party content".
  * App Privacy labels (UI only): "No, we do not collect data from this app" →
    "Data Not Collected", PUBLISHED.
  * Final flow: Add for Review → Draft Submission dialog → Submit for Review.
  * Next: watch for the review email (up to 48h); if rejected, fix + resubmit.

## UPDATE 2026-10-20 — BUILD 11 IS IN REVIEW (CONFIRMED IN APP STORE CONNECT)

TestFlight emailed the internal group: **Blue Seas Fishing — Fish ID 1.0.0 (11)
is ready to test** (iOS 15.1 or later). Checked live in App Store Connect the
same day, so these are facts rather than inferences:

- Version **1.0 → Waiting for Review**, build **11** attached (Build section
  shows App Icon 11 / version 1.0.0). Build 11 is the binary Apple is reviewing;
  build 9 is history.
- **Both subscriptions are in review with it.** Group "Blue Seas Premium"
  (22491155): `bsf_premium_monthly` (1 month) and `bsf_premium_yearly`
  (1 year) — both **Waiting for Review**. The "every IAP must be submitted with
  the version" rule is satisfied.
- Metadata now matches the shipped app: description + Review Notes describe AI
  photo ID, 3 free IDs/day, Premium $7.99/mo and $59.99/yr, restore button and
  EULA/privacy links. Source confirms it — `expo-iap`, `bsf_premium_monthly` /
  `bsf_premium_yearly`, Identify tab POSTing to
  `blueseasfishing.com/api/identify-fish.php`, tabs Identify / Species / Compare /
  Destinations / Premium.
- App Privacy is published as **"Data Not Collected"** (see risk 2 below).

Still open / worth checking:

1. **Wrong tab name in the subscription review note.** It says "open the
   'Identify' or **'More'** tab and tap 'Upgrade to Blue Seas Premium'". The
   fifth tab is labelled **Premium** (internal key `about`) and the upgrade card
   is inline there. Fix that note while the version waits — metadata can be
   edited during review, a different build cannot. The version-level Notes
   already say "Identify or Premium", which is correct.
2. **Privacy label vs. what the app does.** The app uploads the chosen photo to
   `identify-fish.php` (plus optional location/notes text) and the AI provider
   sees it. privacy.html says photos are discarded after the reply, which fits
   Apple's real-time-request exception — but be ready to explain it; declaring
   *Photos or Videos → Not Linked to You* is the safer answer if Apple pushes.
3. **The 2.1 reply kit is stale.** ASC-REJECTION-REPLY.md still says "no
   purchases, no paid content, no IAP" — that is FALSE for build 11. Do not
   send its text verbatim.

## ACCOUNT / LOGIN — BUILT 2026-10-20, NOT SHIPPED (review freeze respected)

Problem: build 11 has no login, so an App Store subscriber had no identity the
website or the AI API could recognise, and a website (Stripe) member could not
use their Premium in the app. Fix chosen: **an account in the app, linked to the
website** — written now, shipped in the next build.

New files (local only — nothing uploaded, no build, no ASC change):

- `api/app-token.php` — stateless bearer tokens: `base64url({uid,exp}).HMAC`,
  30 days. Signing key is `app_auth_secret` if set, else derived from the DB
  password, so deployment needs no new config; rotating either signs out every
device.
- `api/app-apple.php` — App Store Server API helpers (ES256 JWT with the DER→
  r||s conversion Apple requires, plus the subscription lookup).
- `api/app-auth.php` — actions `register`, `login`, `me`, `logout`,
  `premium-token`, `link-purchase`. Same `users` rows as the website; Premium is
  `users.status='premium'`. `link-purchase` asks Apple (never trusts the app),
  writes a `subscriptions` row with `external_provider='apple'` and flips the
  user — so App Store and Stripe members converge on one account.
- `BlueSeasApp/account.tsx` — sign-in / create-account card rendered on the
  **Premium** tab, token in SecureStore, `getPremiumToken()` for the AI API and
  `linkPurchase()` after a StoreKit purchase or restore.
- `App.tsx` — account wired in: Premium is `StoreKit active OR account premium`;
  identifications send `X-BSF-Premium` when the account is Premium; the paywall
  hides for account-Premium users; a completed purchase is linked automatically
  when signed in.

The server half is the piece that matters for the quota: without it a paying
member still hit the free 3/day IP limit on their 4th identification.

**To deploy:** `python upload-api-files.py app-auth.php app-token.php app-apple.php`
(no schema change). **Still required for the link to work:** an Apple In-App
Purchase key (key id, issuer id, `.p8`) in `.blueseasfishing-secrets.php` as
`apple_iap_key_id` / `apple_iap_issuer` / `apple_iap_key_path` — until then
`link-purchase` answers 503 `not_configured` by design. Then a new binary after
this review finishes, and a device test of buy → link → web login → AI quota.

Verified locally without touching production: 23 HTTP checks against
`api/app-auth.php` on the local MariaDB (`bsf_local`, test user deleted after),
14 checks on the Apple JWT (signature verifies against the public key, tampered
payload rejected), 12 token checks, and `npx tsc --noEmit` clean.

## UPDATING THE APP LATER

1. Edit the app in `Desktop\BlueSeasApp` (or refresh data:
   `node tools/generate-ios-data.mjs` in blueseasfishing.com, then copy
   `ios-project/Data/*.json` into `Desktop\BlueSeasApp\data\`).
2. `npx eas-cli@latest build --platform ios --profile production --no-wait`
   (credentials are saved now — no prompts).
3. When FINISHED: `npx eas-cli@latest submit --platform ios --latest --profile production --non-interactive`
4. In App Store Connect: new version → pick the build → submit.
