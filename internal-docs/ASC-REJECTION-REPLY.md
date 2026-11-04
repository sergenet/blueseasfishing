# Blue Seas 1.0 — Guideline 2.1 "Information Needed" response kit

**Rejection received:** Oct 2, 2026 · Submission `24ca2a29-5771-472c-8cd9-96741269fd51` · Message from Apple Yesterday 8:01 AM.
**Nature:** New-developer-account information request. NOT a bug/metadata violation. Build 9 stays attached; no binary change.

> ⚠️ **SUPERSEDED FOR 1.0 — 2026-10-20.** Build **11** is attached to version 1.0,
> which is now **Waiting for Review** together with both Premium subscriptions
> (`bsf_premium_monthly`, `bsf_premium_yearly`). Build 11 is a different app from
> the one this kit was written for: it has an **Identify** tab that uploads photos
> for AI ID, a 3-per-day free limit, and a **Premium** tab with real StoreKit
> subscriptions. So these statements below are **no longer true** and must not be
> sent: "no paid content or purchases", "no In-App Purchases", "no account/UGC/paid
> flows", "that AI feature is a website service only", and the claim that the app
> is a static offline reference. If Apple asks 2.1 again, rewrite those six answers
> from the current build — the structural advice (record on the submitted build,
> answer all six items, duplicate them in Notes) still applies.

**Apple asked for 6 items** (in the Resolution Center reply AND summarized in App Review Information → Notes):
1. Screen recording on a physical device (launch + typical flow; include account/UGC/paid flows if any — we have none)
2. Purpose + target audience (problem solved, value)
3. Setup/access instructions (credentials/sample files if any — none)
4. External services used for core functionality
5. Regional differences (or confirm none)
6. Regulated industry / protected third-party material documentation (if applicable)

Then press **Resubmit to App Review** on the submission details page.

---

## STEP 1 — Record the video on your iPhone (the only real work)

1. Install **TestFlight** on your iPhone (App Store), open the invite email Apple/ASC sent, accept — Blue Seas Fishing appears; install the build under review (currently **11**, the build attached to version 1.0).
2. Make sure iOS is up to date (Settings → General → Software Update).
3. Add **Screen Recording** to Control Center: Settings → Control Center → + Screen Recording.
4. Shooting script (~2 minutes, record from the HOME SCREEN so the launch is captured):
   - Start recording from the home screen → tap the Blue Seas icon (cold launch).
   - **Species** tab: scroll the list → search "bass" → open Largemouth Bass profile → show habitat/depth/bait info and the photo.
   - **Compare** tab: open "Largemouth vs Spotted Bass", scroll the comparison table.
   - **Destinations** tab: open one destination guide.
   - Control Center → turn **Airplane Mode ON** → return to app → browse species/compare (proves the offline claim).
   - **More** tab: show it briefly. Do NOT tap out to the website — keep the video inside the app.
   - Stop recording (saves to Photos).
5. Get the file onto this PC and save it as:
   `C:\blueseasfishing\Assets\ios-review\review-video.mov`
   (cable + Photos import, or iCloud.com → download, or Drive/Dropbox — anything works. Keep it under ~100 MB; 1–2 min of screen recording is far below that.)

## STEP 2 — Paste this into "Reply to App Review" (Resolution Center)

```text
Hello,

Thank you for the additional information request. Answers to each item:

1. SCREEN RECORDING (attached)
A screen recording captured on a physical iPhone is attached. It begins with a cold
launch of the app from the home screen and shows the typical user flow: browsing the
Species list, searching ("bass"), opening a species profile, using a side-by-side
Compare guide, opening a Destination guide, and the More tab. A portion is recorded
in airplane mode to demonstrate that all species, comparison and destination content
is bundled offline. The app has no account registration or login, no user-generated
content, and no paid content or purchases, so no such flows exist to demonstrate.

2. PURPOSE AND TARGET AUDIENCE
Blue Seas Fishing is an offline fish-identification reference for recreational
anglers, freshwater and saltwater, in the US and internationally. Problem it solves:
identifying a catch and choosing bait/technique without a cell signal — at the lake,
on a pier, or offshore. Value provided: 548 species profiles (habitat, depth range,
season, diet, best baits and lures), 20 side-by-side lookalike comparison guides,
and 124 destination guides listing the species found at each fishery. The app is
free, with no account, no ads, and no purchases.

3. SETUP AND ACCESS
No setup, registration, or credentials are required. Install and launch; every
feature is immediately available from the four tabs: Species (A–Z list with search),
Compare, Destinations, and More.

4. EXTERNAL SERVICES
None are required for the app's core functionality. All species, comparison and
destination data is bundled inside the binary. Species photographs are lazy-loaded
from the developer's own website (blueseasfishing.com) when the device is online;
the app remains fully usable without them. The More tab opens our website in Safari,
which offers a free web-based AI fish-photo identification tool — that AI feature is
a website service only and is not part of the iOS app. No third-party data providers,
authentication services, payment processors, or other external platforms are used
within the app.

5. REGIONAL DIFFERENCES
None. The app is a static offline reference and functions identically in all 175
countries/regions where it will be available. Species coverage is global
(freshwater and saltwater), with destination guides for fisheries in the United
States and abroad.

6. REGULATED INDUSTRY / PROTECTED THIRD-PARTY MATERIAL
Not applicable. The app is a fishing reference guide; it does not operate in a
regulated industry and provides no medical, legal, or financial guidance. All
species photographs and text are the developer's own or licensed for publication.
The app is for identification purposes only and directs users to their local
wildlife agency for current size and possession limits (also stated in the app
description).

Happy to provide anything else that would help complete the review.

Serge Shammas — sergenet@yahoo.com
```

⚠️ Before sending: item 6 states photos/text are owned or licensed — **only send if that's true** (confirmed below).

## STEP 3 — Replace the App Review Information → Notes field with this

(Same content Apple asked us to duplicate. Paste over the whole Notes box, then Save.)

```text
Offline fish identification guide: 548 species profiles, 20 comparison tables, 124 destination guides — all bundled in the app. No account, no ads, no purchases. The More tab links to our website (Safari), where the AI photo-ID tool lives; that is a web feature only, nothing is gated or sold inside the app.

PURPOSE/AUDIENCE: Offline fish-identification reference for recreational anglers (freshwater + saltwater, US and international); identify a catch and pick bait/technique without needing a signal. Free, ad-free, account-free.

ACCESS: No setup or credentials — all features available at launch from four tabs: Species (A–Z with search), Compare, Destinations, More.

EXTERNAL SERVICES: None required. All data is bundled in the binary; species photos lazy-load from the developer's own website (blueseasfishing.com) when online, and the app works fully without them. The More tab opens our website in Safari (free web-based AI fish-photo tool — website only, not part of the app). No third-party data providers, authentication, payments, or AI services inside the app.

REGIONS: Functions identically in all 175 countries/regions; content is global.

REGULATED/THIRD-PARTY: Not applicable — not a regulated industry; all species photos and text are the developer's own or licensed for publication.

RECORDING: A screen recording from a physical device (cold launch, typical flow, plus an airplane-mode segment demonstrating offline content) is attached to our reply in the Resolution Center.
```

## STEP 4 — Send + resubmit

1. Reply to App Review → paste Step 2 text → **Attach** the video → Send.
2. **Resubmit to App Review** (button on the submission details page; it enables once the message is answered).
3. Update Notes (Step 3) on the version page → Save. Order of 1–3 doesn't matter; all three must be done.
4. Typical turnaround after a complete 2.1 reply: 1–3 days.

## Division of labor

- **Serge:** record video on iPhone → save to `C:\blueseasfishing\Assets\ios-review\`; attach the file in the composer (native file dialog — easier from your side).
- **Buffy:** open the reply composer in the ASC tab, paste the reply text, verify, send; update the Notes field; click Resubmit; confirm state flips to WAITING_FOR_REVIEW.
