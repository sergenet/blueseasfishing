#!/usr/bin/env node
/**
 * generate-comparisons.mjs
 *
 * Generates the "X vs Y identification" comparison pages that target
 * high-intent searches from anglers trying to tell two similar species apart.
 * Content is hand-authored per pair (real distinguishing features), layout
 * mirrors the existing hand-made comparison pages, and each page adds an
 * FAQPage JSON-LD block for rich results.
 *
 * Outputs:
 *   <a>-vs-<b>-identification.html   one page per confused pair (root level)
 *   fish-identification-guides.html  hub page linking every guide
 *
 * Cross-linking:
 *   - every page links to both species pages (/species/<slug>.html)
 *   - generate-species-pages.mjs GUIDE_LINKS sends related species traffic back
 *
 * Run:  node tools/generate-comparisons.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fitTitle } from './lib/title-fit.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.blueseasfishing.com';

/* --------------------------------------------------------------- helpers */
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function toSlug(str) {
  return String(str || '').toLowerCase()
    .replace(/[()[\]]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const shortName = (n) => String(n || '').replace(/\s*\([^)]*\)\s*/g, '').trim();

function imgFor(name) {
  for (const ext of ['webp', 'jpg', 'png']) {
    const p = join(ROOT, 'images', 'species', `${toSlug(name)}.${ext}`);
    if (existsSync(p)) return `/images/species/${toSlug(name)}.${ext}`;
  }
  return '';
}

/* ------------------------------------------------------------ pair data */
/* Every row: [feature, valueForA, valueForB]. Content is authored, not scraped. */
const PAIRS = [
  {
    a: 'Largemouth Bass', b: 'Smallmouth Bass', env: 'Freshwater',
    lede: 'The classic bass confusion. Jaw length, dorsal-fin gap and color pattern separate them in seconds once you know where to look.',
    rows: [
      ['Mouth / jaw', 'Upper jaw extends well past the rear of the eye', 'Upper jaw stops at or before the rear of the eye'],
      ['Dorsal fin', 'Deep notch between spined and soft sections', 'Shallow notch; the two sections nearly merge'],
      ['Color pattern', 'Green sides with a dark lateral blotch chain', 'Brown-bronze sides with dark vertical bars'],
      ['Preferred water', 'Warm, weedy lakes, ponds and slow river banks', 'Cooler, clearer water with rock, gravel and current'],
    ],
    photo: ['Straight side view with the mouth closed to show jaw length', 'Dorsal fin spread so the notch depth is visible', 'Full flank to capture bars versus lateral blotch', 'Habitat shot — weeds or rock support the call'],
    note: 'Hybrids of the two occur in some waters and share traits of both. Where the jaw and dorsal clues conflict, treat the call as uncertain and rely on the location and habitat.',
    faqs: [
      ['Which grows larger?', 'Largemouth bass typically grow larger; trophy smallmouth are heavy for their length but usually run smaller overall.'],
      ['Do they live in the same lakes?', 'Often in the same reservoir, but largemouth hold in vegetation and wood while smallmouth favor rocky points and current.'],
      ['Which fights harder?', 'Smallmouth are famous for acrobatic, sustained runs relative to size; largemouth fight deeper with head shakes.'],
    ],
    refs: ['Micropterus salmoides', 'Micropterus dolomieu'],
  },
  {
    a: 'Largemouth Bass', b: 'Spotted Bass', env: 'Freshwater',
    lede: 'Spotted bass increasingly share largemouth water. One mouth-length check and one tongue check settle most IDs.',
    rows: [
      ['Mouth / jaw', 'Upper jaw extends past the rear of the eye', 'Upper jaw stops at or just short of the eye'],
      ['Dorsal fin', 'Clear notch between the two sections', 'Sections connected by a low arch, nearly continuous'],
      ['Flank pattern', 'Dark lateral blotch chain along the side', 'Rows of small spots below the lateral line'],
      ['Tongue', 'Smooth tongue', 'Rough tooth patch at the base of the tongue'],
    ],
    photo: ['Closed-mouth side view for jaw length', 'Open mouth angled to reveal the tongue base', 'Dorsal fin profile showing notch versus arch', 'Flank shot of the spot rows versus blotch'],
    note: 'The tongue patch is the most reliable single clue but requires a careful look. Hybrids blur features; photograph the jaw, dorsal and flank and compare at home.',
    faqs: [
      ['Which grows larger?', 'Largemouth grow notably larger in most waters; spotted bass rarely reach trophy largemouth proportions.'],
      ['Are spotted bass bad for a lake?', 'They compete with largemouth in some systems, but management views vary by state — check local agency guidance.'],
      ['How common is the tongue patch check?', 'Common among bass anglers; run a fingertip gently along the tongue base — spotted bass show a rough patch.'],
    ],
    refs: ['Micropterus salmoides', 'Micropterus punctulatus'],
  },
  {
    a: 'Blue Catfish', b: 'Channel Catfish', env: 'Freshwater',
    lede: 'Both are big-river catfish with forked tails. Anal-fin shape and spotting pattern do most of the work.',
    rows: [
      ['Anal fin', 'Long, straight lower edge; 30–36 rays', 'Rounded lower edge; 25–29 rays'],
      ['Spotting', 'Adults usually plain gray-blue, few or no spots', 'Small dark spots scattered on the sides (most sizes)'],
      ['Head shape', 'Broad, flat head; heavy shoulders', 'Narrower head with a more pointed snout'],
      ['Size potential', 'Enormous; well past 100 lb in big rivers', 'Commonly 2–10 lb; trophies past 20 lb'],
    ],
    photo: ['Anal fin stretched flat to show edge and ray count', 'Flank lighting that shows or rules out spots', 'Head profile from the side', 'Something for scale — the size gap is real'],
    note: 'Juvenile blue catfish can show faint spots, so lean on anal-fin shape when sizes are small. Hybrids are rare; the fin edge is the tiebreaker.',
    faqs: [
      ['Which is better to eat?', 'Both are table fare; many anglers prefer smaller channel cats for clean fillets, while blues from clean water fry well.'],
      ['Do they live together?', 'Yes in big-river systems — channels range wider, blues favor deeper channels and holes.'],
      ['Which is the record holder?', 'Blue catfish hold most of the giant-catfish records in US rivers and reservoirs.'],
    ],
    refs: ['Ictalurus furcatus', 'Ictalurus punctatus'],
  },
  {
    a: 'Channel Catfish', b: 'Flathead Catfish', env: 'Freshwater',
    lede: 'A forked tail versus a rounded one, and two totally different feeding styles — the ID mirrors the biology.',
    rows: [
      ['Tail', 'Deeply forked', 'Slightly forked to rounded'],
      ['Head / jaw', 'Pointed snout, upper jaw even with lower', 'Broad flat head; lower jaw sticks out past the upper'],
      ['Color', 'Slate to olive with scattered dark spots', 'Yellow-olive to chocolate brown, plain or mottled'],
      ['Feeding', 'Opportunistic scavenger — cut bait, stink bait', 'Live-fish predator — sunfish, shad, live bait rigs'],
    ],
    photo: ['Tail spread to show fork depth', 'Head profile from the side showing jaw overlap', 'Full body color in even light', 'Mouth view — flatheads look distinctly "bull-dog"'],
    note: 'Flathead color shifts with water clarity; the protruding lower jaw and tail shape hold up in any water. Young flatheads can look plain like channels — check the jaw.',
    faqs: [
      ['Which is more active at night?', 'Both feed at night, but channel catfish roam in schools; flatheads hunt from cover, often live-bait only.'],
      ['Which grows bigger?', 'Flatheads reach larger typical sizes; both produce century-class river giants in southern reservoirs.'],
      ['Do channels eat live fish too?', 'Yes, especially at dusk, but their scavenger streak makes them far easier to bait.'],
    ],
    refs: ['Ictalurus punctatus', 'Pylodictis olivaris'],
  },
  {
    a: 'Black Crappie', b: 'White Crappie', env: 'Freshwater',
    lede: 'Same slabs, different patterns. Count dorsal spines when the pattern is washed out.',
    rows: [
      ['Dorsal spines', 'Usually 7–8 spines', 'Usually 5–6 spines'],
      ['Flank pattern', 'Irregular dark blotches, scattered', 'Faint vertical bars, evenly spaced'],
      ['Body shape', 'Slightly deeper body and larger mouth', 'Slimmer profile, smaller mouth'],
      ['Typical water', 'Clearer lakes with vegetation', 'Murkier lakes, oxbows and backwaters'],
    ],
    photo: ['Dorsal fin close-up for spine count', 'Flank pattern in flat, even light', 'Mouth closed profile for head shape', 'Photo both species if caught together — schools often mix'],
    note: 'The two interbreed in some reservoirs and the pattern washes out in spawning males. When color is ambiguous, the dorsal-spine count is the standard tiebreaker.',
    faqs: [
      ['Which tastes better?', 'Both are prized panfish; cold-water crappie of either kind fillet clean and sweet.'],
      ['Do they school together?', 'Frequently overlap on brush piles; whites often suspend wider, blacks hold tighter to cover.'],
      ['Which gets bigger?', 'Black crappie hold most slot and trophy records, but big whites are common in southern oxbows.'],
    ],
    refs: ['Pomoxis nigromaculatus', 'Pomoxis annularis'],
  },
  {
    a: 'Bluegill', b: 'Redear Sunfish', env: 'Freshwater',
    lede: 'The ear flap ends the argument: solid black versus black with a red-orange edge.',
    rows: [
      ['Ear flap (gill cover)', 'Solid dark flap, no colored border', 'Dark flap edged in red to orange'],
      ['Mouth', 'Small mouth; jaw short of the eye', 'Small mouth, slightly longer on adults'],
      ['Body color', 'Deep blue-green with orange breast', 'Olive-gold, plainer sides, longer body'],
      ['Feeding habit', 'Insects and larvae throughout the weeds', 'Snails and mussels — the "shellcracker"'],
    ],
    photo: ['Ear flap macro — the giveaway', 'Breast color in natural light', 'Full side profile for body depth', 'If possible, the bait/habitat (snail shells nearby)'],
    note: 'Hybrid bluegill × redear are stocked in some ponds and show mixed flap color. When in doubt, the flap edge plus body length (redear run longer) settles it.',
    faqs: [
      ['Why "shellcracker"?', 'Redear crush snails and mussels with specialized throat teeth — their droppings even glitter with shell.'],
      ['Which grows bigger?', 'Redear typically outgrow bluegill in the same water.'],
      ['Same baits?', 'Both take worms and crickets; redear fish best slowly on the bottom near shell beds.'],
    ],
    refs: ['Lepomis macrochirus', 'Lepomis microlophus'],
  },
  {
    a: 'Red Drum (Redfish)', b: 'Black Drum', env: 'Saltwater',
    lede: 'Two drum, two silhouettes. Barbels, eyespots and tail shape separate them instantly.',
    rows: [
      ['Chin barbels', 'None', 'Several short barbels under the chin'],
      ['Tail spots', 'One or more dark eyespots near the tail base', 'No eyespots; juveniles show dark vertical bars instead'],
      ['Tail shape', 'Truncated, slightly curved edge', 'Broad and rounded'],
      ['Mouth', 'Down-turned, feed-forward snout', 'Pavement teeth; crushes shell on structure'],
    ],
    photo: ['Underside of the chin for barbels', 'Tail-base close-up for eyespots', 'Tail spread to show the edge shape', 'Juveniles: capture any vertical bars'],
    note: 'Juvenile black drum bars fade with age and bull-reds lose spots entirely some years — the chin barbels remain the constant. Big "bull" reds and black drum overlap in size and water.',
    faqs: [
      ['Which one "drums" louder?', 'Black drum are the louder croakers; you can hear them through a boat hull on calm days.'],
      ['Which is the table favorite?', 'Red drum (as "redfish") dominate Gulf menus; small black drum ("puppy drum" size blacks) also rate well — large blacks get coarse.'],
      ['Do they hybridize?', 'No confirmed hybrids; the two are distinguished easily by barbels and eyespots.'],
    ],
    refs: ['Sciaenops ocellatus', 'Pogonias cromis'],
  },
  {
    a: 'Spotted Seatrout', b: 'Weakfish', env: 'Saltwater',
    lede: 'Two Cynoscion cousins on opposite coasts. Spot pattern and range usually settle the call.',
    rows: [
      ['Spot pattern', 'Distinct round black spots across back, dorsal and tail', 'Few, small, irregular spots — more vermiculation than dots'],
      ['Anal-fin spines', 'One thin spine', 'Two thin spines'],
      ['Back color', 'Blue-gray to green with silver flanks', 'Bronze-green to olive with purple sheen'],
      ['Range', 'Gulf of Mexico and US Southeast coasts', 'Mid-Atlantic to Northeast coasts'],
    ],
    photo: ['Flank and dorsal in even light for spot pattern', 'Anal fin region to count spines', 'Tail spread — trout spots cross the fin', 'Location noted: the coasts barely overlap'],
    note: 'Where ranges meet (VirginiaCarolinas), a spotless or oddly spotted fish can challenge both names. The anal-spine count is the published tiebreaker.',
    faqs: [
      ['Why "weak"fish?', 'Named for the weak mouth membrane that tears on hooks — handle gently.'],
      ['Are they related to freshwater trout?', 'No — both are drum family (Sciaenidae); the "trout" name is purely colloquial.'],
      ['Which is better to eat?', 'Both are delicate; smaller fish of either species eat best.'],
    ],
    refs: ['Cynoscion nebulosus', 'Cynoscion regalis'],
  },
  {
    a: 'Southern Flounder', b: 'Summer Flounder (Fluke)', env: 'Saltwater',
    lede: 'Both flatfish face right. Spot patterns and range do the talking.',
    rows: [
      ['Ocellated spots', 'About 3 large eyespots; few small spots', '5–6 eyespots plus many small spots on the flank'],
      ['Blind side', 'Unspotted white; occasional dark blotch', 'Unspotted white'],
      ['Tail edge', 'Rounded to double-rounded', 'Truncated (square-ish)'],
      ['Range', 'Gulf and US Southeast Atlantic coasts', 'Mid-Atlantic to New England ("fluke")'],
    ],
    photo: ['Eyed side flat on the deck for spot count', 'Tail edge profile', 'Mouth open — fluke show larger teeth', 'Location noted: the two coasts differ'],
    note: 'Gulf anglers also meet gulf flounder; the 3-spot rule holds there too. Fin-ray counts are the lab-grade tiebreaker but the spot pattern is usually enough.',
    faqs: [
      ['Which is bigger?', 'Summer flounder reach larger typical sizes in the Northeast; southern flounder grow big in Gulf passes.'],
      ['Both "fluke"?', 'Northeast anglers call summer flounder "fluke"; southern flounder is the Gulf/Carolina flatfish.'],
      ['Same baits?', 'Both take live finger mullet, mud minnows and soft plastics bounced along the bottom.'],
    ],
    refs: ['Paralichthys lethostigma', 'Paralichthys dentatus'],
  },
  {
    a: 'California Halibut', b: 'Pacific Halibut', env: 'Saltwater',
    lede: 'A nearshore 10-pounder versus a deep-water giant — plus one scale check.',
    rows: [
      ['Size potential', 'Rarely past 50 lb; typical 5–15 lb', 'Commonly 20–100 lb; records past 400 lb'],
      ['Scales', 'Larger, rougher scales — gritty to the touch', 'Very small, smooth scales'],
      ['Color', 'Sandy brown, sometimes pale "buttermilk" patches', 'Uniform dark-brown to olive eyed side'],
      ['Depth', 'Surf zone to about 300 ft, often near beaches', 'Deep offshore flats, 100–1,000+ ft'],
    ],
    photo: ['Full eyed-side profile', 'Skin texture close-up on the flank', 'Tail and girth with something for scale', 'Depth/location note — it narrows the pair fast'],
    note: 'Both are left-facing (eyed side left) — the California fish is one of the few left-eyed Paralichthys cousins, while Pacific halibut is right-eyed, a quick orientation check.',
    faqs: [
      ['Which side do they face?', 'California halibut can face either way; Pacific halibut eyes sit on the right side. Orientation is a legitimate clue here.'],
      ['Can they be caught the same way?', 'Different games: California halibut stalk surf and bay flats; Pacific halibut is a deep-drop bait-and-jig fishery.'],
      ['Which tastes better?', 'Both are premium white fish; Pacific halibut fillets from bigger fish are the classic fish-and-chips flake.'],
    ],
    refs: ['Paralichthys californicus', 'Hippoglossus stenolepis'],
  },
  {
    a: 'Chinook Salmon', b: 'Coho Salmon', env: 'Saltwater',
    lede: 'The two big Pacific salmon. Tail spots and gum line are the timeless checks.',
    rows: [
      ['Tail spots', 'Spots on both tail lobes and the back', 'Spots only on the upper tail lobe'],
      ['Gum line', 'Black at the base of the teeth', 'White to pale gray gums'],
      ['Size', 'Largest Pacific salmon — 15–40 lb common in runs', 'Smaller — 6–12 lb typical'],
      ['Tail shape', 'Broad, more square', 'More forked'],
    ],
    photo: ['Tail spread for spot coverage', 'Lower jaw gum line in good light', 'Full fish with something for scale', 'Fin tips — coho can show white gum-adjacent edges'],
    note: 'In rivers, both darken and the colors lie; tail spots and gum line remain readable on spawned fish. Landlocked kings (where stocked) still show the double-lobe spots.',
    faqs: [
      ['Which fights harder?', 'Chinook dive deep and bulldog; coho are famous acrobats.'],
      ['Which is "king" salmon?', 'Chinook — the same fish by another name.'],
      ['Do they run together?', 'Their runs often overlap by weeks; chinook typically peak earlier in a system.'],
    ],
    refs: ['Oncorhynchus tshawytscha', 'Oncorhynchus kisutch'],
  },
  {
    a: 'Rainbow Trout', b: 'Cutthroat Trout', env: 'Freshwater',
    lede: 'One look under the jaw: the cutthroat\'s red-orange slash is the namesake and the giveaway.',
    rows: [
      ['Jaw slash', 'No slash under the lower jaw', 'Distinct red-orange slash under the jaw'],
      ['Lateral stripe', 'Pink to rose lateral stripe, common', 'Usually absent or faint'],
      ['Spotting', 'Dense small black spots, tail heavily spotted', 'Coarser spots, concentrated toward the tail'],
      ['Maxilla', 'Ends near the eye', 'Often extends past the eye'],
    ],
    photo: ['Lift the jaw to show or rule out the slash', 'Full flank for the stripe and spots', 'Head profile for maxilla length', 'Even light — colors shift fast in spawning fish'],
    note: 'Steelhead are the sea-run form of rainbow trout and lose the stripe; the slash check still separates them from sea-run cutthroat. Hybrid "cutbows" blur both — note the location.',
    faqs: [
      ['What is a cutbow?', 'A rainbow × cutthroat hybrid, common where stocks overlap; it may show a faint slash and a pink stripe together.'],
      ['Which is native where?', 'Cutthroats are the native western mountain fish; rainbows now range worldwide through stocking.'],
      ['Same flies?', 'Yes — both take standard trout fare; cutthroats in remote water are famously aggressive.'],
    ],
    refs: ['Oncorhynchus mykiss', 'Oncorhynchus clarkii'],
  },
  {
    a: 'Brook Trout', b: 'Brown Trout', env: 'Freshwater',
    lede: 'A char versus a true trout: vermiculation and white-edged fins versus red halos and a square tail.',
    rows: [
      ['Back pattern', 'Worm-like pale vermiculation lines', 'Plain or with dark spots; no worm lines'],
      ['Flank spots', 'Pale yellow spots; red spots with blue halos', 'Red-black spots, many ringed with pale halos'],
      ['Fins', 'White leading edges with black striping', 'Plain fins, no white-black edge'],
      ['Tail', 'Nearly square', 'Slightly forked'],
    ],
    photo: ['Back from above for vermiculation', 'Pectoral or pelvic fin edge close-up', 'Flank in even light for halo pattern', 'Tail spread for the square-versus-forked check'],
    note: 'Brook trout are char (Salvelinus), browns are true salmonids — evolution explains the look. Tiger trout (brook × brown) show dramatic maze vermiculation where stocked.',
    faqs: [
      ['Is a brook trout really a trout?', 'Technically a char — same family, different genus. Anglers still call it a trout.'],
      ['Which is more cold-water demanding?', 'Brook trout need the coldest, cleanest water of the two.'],
      ['What is a tiger trout?', 'The striking sterile hybrid of the two, stocked in some states for trophy fishing.'],
    ],
    refs: ['Salvelinus fontinalis', 'Salmo trutta'],
  },
  {
    a: 'Lake Trout', b: 'Bull Trout', env: 'Freshwater',
    lede: 'Two deep-water chars. Tail shape and fin edges separate them; range confirms.',
    rows: [
      ['Tail', 'Deeply forked', 'Flat to slightly curved rear edge'],
      ['Fin edges', 'No white leading-edge marks', 'White leading edges, front fins'],
      ['Spotting', 'Light wormy spots over dark green-gray', 'Orange to red spots over olive-back'],
      ['Where found', 'Deep cold lakes across the North', 'Cold rivers/lakes of the Pacific Northwest'],
    ],
    photo: ['Tail spread flat for the fork check', 'Leading edge of a pectoral fin', 'Flank spots in even light', 'Location — outside the Northwest, bull trout are unlikely'],
    note: 'Bull trout are protected in much of their range — know the local rules before harvesting. Lake trout live deeper; bull trout often patrol current seams.',
    faqs: [
      ['Are bull trout actually trout?', 'They are char, like lake trout and brook trout.'],
      ['Which gets bigger?', 'Lake trout — century-class fish exist in Great Lakes and northern lakes.'],
      ['Why the protection rules?', 'Bull trout declined across much of their range; many waters require immediate release.'],
    ],
    refs: ['Salvelinus namaycush', 'Salvelinus confluentus'],
  },
  {
    a: 'Northern Pike', b: 'Muskellunge', env: 'Freshwater',
    lede: 'The esox cousins: cheek scales, spot-versus-bar patterns and tail shape tell them apart.',
    rows: [
      ['Cheek scales', 'Fully scaled cheek and gill cover', 'Lower half of the cheek bare (scaleless patch)'],
      ['Pattern', 'Light bean-shaped spots on dark body', 'Vertical dark bars on a lighter body'],
      ['Tail', 'More forked', 'Rounded'],
      ['Size', 'Commonly 24–40 in', 'Commonly 36–50 in where established'],
    ],
    photo: ['Cheek close-up — scales or bare skin', 'Full flank for spot-versus-bar pattern', 'Tail spread for edge shape', 'Head profile — muskie jaws look longer and duck-billed'],
    note: 'Tiger muskellunge (pike × muskie) show bars plus spots and the muskie cheek patch; they are stocked in several states. Juvenile muskie can be spot-heavy — check the cheek.',
    faqs: [
      ['Which is harder to catch?', 'Muskellunge — the "fish of ten thousand casts." Pike are far more willing.'],
      ['Do they share water?', 'Yes across the northern tier; pike school shallower, muskie hold deeper structure.'],
      ['Which bites more in summer?', 'Pike keep biting through summer heat; muskie often shift to dawn, dusk and night.'],
    ],
    refs: ['Esox lucius', 'Esox masquinongy'],
  },
  {
    a: 'Yellow Perch', b: 'White Perch', env: 'Freshwater',
    lede: 'Not actually cousins — a true perch versus a temperate bass that borrowed the name.',
    rows: [
      ['Family', 'True perch (Percidae)', 'Temperate bass (Moronidae) — related to white bass'],
      ['Pattern', 'Bold dark vertical bars on gold-green', 'Plain silver-gray sides, faint bars at most'],
      ['Fins', 'Orange-red pelvic and anal fins', 'Plain gray fins'],
      ['Size', 'Hand-sized; 8–12 in typical', '6–10 in typical; bigger in brackish rivers'],
    ],
    photo: ['Full flank for bars versus plain silver', 'Pelvic and anal fin color', 'First dorsal fin — spiny in both, but shape differs', 'Note the water — white perch tolerate brackish water'],
    note: 'In coastal rivers the two can share the net. White perch lack the deep spiny-dorsal silhouette and orange fins of yellow perch at any size.',
    faqs: [
      ['Is white perch really a perch?', 'It is closer to striped bass and white bass than to yellow perch.'],
      ['Which schools tighter?', 'Yellow perch school tightly; white perch scatter in loose groups.'],
      ['Best bait for each?', 'Both take worms and small minnows; yellow perch love small jigs tipped with spikes.'],
    ],
    refs: ['Perca flavescens', 'Morone americana'],
  },
  {
    a: 'King Mackerel', b: 'Spanish Mackerel', env: 'Saltwater',
    lede: 'The speed family. Size and the lateral-line "drop" separate kings from spaniards.',
    rows: [
      ['Size', 'Commonly 10–40 lb; giants past 60 lb', '1–5 lb; rarely past 10 lb'],
      ['Lateral line', 'Dips sharply below the second dorsal fin', 'Gently slopes the full length'],
      ['Spots', 'Usually spotless; juveniles can show spots', 'Bronze oval spots on the flank'],
      ['Dorsal fin', 'Gray front edge', 'Distinctly black front edge on the first dorsal'],
    ],
    photo: ['Lateral line trace from gill plate to tail', 'First dorsal fin edge color', 'Flank for spots', 'Girth photo — size gap is the quickest tell'],
    note: 'Small "school" kings muddy the waters: they can carry spots like spanish. The lateral-line dip is the published separator — trace it in the photo.',
    faqs: [
      ['Which is better eating?', 'Small spanish are clean and mild; kings are favored for smoking and steaks.'],
      ['Which is the tournament fish?', 'King mackerel — the SKA circuit is built around them.'],
      ['Both bite the same tackle?', 'Similar trolled spoons and live bait; kings demand wire leaders.'],
    ],
    refs: ['Scomberomorus cavalla', 'Scomberomorus maculatus'],
  },
  {
    a: 'Yellowfin Tuna', b: 'Bluefin Tuna', env: 'Saltwater',
    lede: 'The ocean\'s two great tunas. Fin length and pectoral color settle it at the rail.',
    rows: [
      ['Second dorsal + anal fins', 'Long, sickle-shaped in adults — often past the tail base', 'Short and rounded at all sizes'],
      ['Pectoral fin', 'Long, reaching well past the fin base; yellow tint', 'Short, stiff, dark'],
      ['Body build', 'Slender torpedo', 'Thick, football-shaped trunk'],
      ['Size', 'Commonly 30–150 lb', '50 lb school fish to giants past 500 lb'],
    ],
    photo: ['Dorsal and anal fins spread for length', 'Pectoral fin folded against the body', 'Girth from above', 'Tail keels — yellowfin show twin small keels'],
    note: 'Bigeye tuna sit between the two: longer fins than bluefin but rounder than yellowfin, with a distinct anal fin. When in doubt among all three, photograph the fins and girth.',
    faqs: [
      ['Which is the sushi star?', 'Bluefin fetch the record market prices; yellowfin (ahi) is the everyday sushi favorite.'],
      ['Do they school together?', 'Often mix offshore with porpoise schools; size classes usually separate by depth.'],
      ['Which fights harder?', 'Bluefin — the deepest runs and longest battles in sportfishing.'],
    ],
    refs: ['Thunnus albacares', 'Thunnus thynnus'],
  },
  {
    a: 'Blue Marlin', b: 'Striped Marlin', env: 'Saltwater',
    lede: 'Pacific big-game royalty. Dorsal height, stripes and build separate the two.',
    rows: [
      ['First dorsal fin', 'Tall but lower than body depth; rounded profile', 'Taller than body depth; pointed, pocketed membranes'],
      ['Stripes', 'Light blue bars that fade quickly after landing', 'Vivid lavender-blue vertical bars, persist when lit up'],
      ['Build', 'Deep-chested, heavy forward shoulder', 'Sleeker, more compressed body'],
      ['Bill', 'Long, round, robust', 'Longer relative to body, more slender'],
    ],
    photo: ['Dorsal fin raised against body depth', 'Flank lit up for stripe color', 'Bill-to-body proportion from the side', 'Boat-side girth for the build difference'],
    note: 'Black marlin join the party in the Indo-Pacific and lack the vivid bars; their pectoral fins do not fold flat. Compare dorsal and pectoral position in every billfish photo.',
    faqs: [
      ['Which is bigger?', 'Blue marlin — granders past 1,000 lb exist; striped marlin rarely pass 300 lb.'],
      ['Which jumps more?', 'Striped marlin are famous for repeated tail-walking; blues run deeper.'],
      ['Where do they overlap?', 'Pacific offshore canyons and banks — Kona, Cabo, and the great seamounts.'],
    ],
    refs: ['Makaira nigricans', 'Kajikia audax'],
  },
  {
    a: 'Sailfish', b: 'Blue Marlin', env: 'Saltwater',
    lede: 'A sail versus a rounded fin: the name literally describes the difference.',
    rows: [
      ['Dorsal fin', 'Sail-shaped, taller than body depth, folds into a groove', 'Rounded fin, lower than body depth'],
      ['Size', '7–8 ft, 40–80 lb typical', 'Larger and far heavier; grander class exists'],
      ['Build', 'Slender, compressed sides', 'Deep, muscular chest'],
      ['Speed claim', 'Often cited as the fastest billfish', 'Power over pace'],
    ],
    photo: ['Dorsal fin fully raised — the sail is unmistakable', 'Full profile for build comparison', 'Bill length relative to head', 'Flank pattern — sailfish show scattered light dots'],
    note: 'Atlantic and Indo-Pacific sailfish were long treated as one species and are now often split; the sail ID holds for both. Juvenile blue marlin can show tall dorsals — check the body depth.',
    faqs: [
      ['Is the sail fin always raised?', 'No — it folds flat into a groove and raises when excited or feeding.'],
      ['Which is the angler favorite?', 'Sailfish: high jumps, big numbers in season, and reliable catch-and-release action.'],
      ['Can you keep them?', 'Most fisheries are strictly catch-and-release for billfish; check local rules.'],
    ],
    refs: ['Istiophorus albicans', 'Makaira nigricans'],
  },
];

/* Existing hand-made guides for the hub + species-page cross links. */
const EXISTING_GUIDES = [
  ['bluegill-vs-green-sunfish-identification.html', 'Bluegill vs. Green Sunfish', ['bluegill', 'green sunfish']],
  ['walleye-vs-sauger-identification.html', 'Walleye vs. Sauger', ['walleye', 'sauger']],
  ['striped-bass-vs-white-bass-identification.html', 'Striped Bass vs. White Bass', ['striped bass', 'white bass']],
  ['salmon-vs-trout-identification.html', 'Salmon vs. Trout', ['salmon', 'trout']],
  ['rainbow-trout-identification.html', 'Rainbow Trout Identification', ['rainbow trout', 'steelhead']],
  ['chinook-salmon-identification.html', 'Chinook Salmon Identification', ['chinook', 'king salmon']],
  ['california-halibut-identification.html', 'California Halibut Identification', ['california halibut']],
];

/* ----------------------------------------------------------- page parts */
const NAV = `<nav class="guide-nav"><div class="guide-nav-inner"><a class="guide-brand" href="/">Blue Seas Fishing</a><a href="/fish-id.html">Identify a Fish</a><a href="/fish-identification-guides.html">All ID Guides</a><a href="/gallery.html">Species Database</a><a href="/forum.html">Forum</a><a href="/subscribe.html">Subscribe</a></div></nav>`;

function imgBlock(name) {
  const src = imgFor(name);
  if (!src) return '';
  return `<img src="${src}" alt="${esc(shortName(name))} — identification photo" width="640" height="427" loading="lazy">`;
}

function speciesLinks(name) {
  const slug = toSlug(name);
  const img = imgFor(name);
  return `<a class="species-card" href="/species/${slug}.html"><h4>${esc(shortName(name))} species guide</h4><p>Full profile: habitat, baits, seasons and range.</p>${img ? `<img src="${img}" alt="" width="320" height="213" loading="lazy">` : ''}</a>`;
}

function buildPage(pair) {
  const an = shortName(pair.a), bn = shortName(pair.b);
  const title = fitTitle([
    `${an} vs ${bn} Identification Guide`,
    `${an} vs ${bn} ID Guide`,
    `${an} vs ${bn}`,
  ]);
  const desc = `Tell ${an.toLowerCase()} and ${bn.toLowerCase()} apart using ${pair.rows.slice(0, 3).map((r) => r[0].toLowerCase()).join(', ')} and more.`;
  const url = `${SITE}/${toSlug(`${an}-vs-${bn}`)}-identification.html`;
  const file = `${toSlug(`${an}-vs-${bn}`)}-identification.html`;

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'ID Guides', item: `${SITE}/fish-identification-guides.html` },
      { '@type': 'ListItem', position: 3, name: title },
    ],
  };
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: desc,
    mainEntityOfPage: url,
    publisher: { '@type': 'Organization', name: 'Blue Seas Fishing', url: `${SITE}/` },
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pair.faqs.map(([q, a]) => ({
      '@type': 'Question', name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const compareRows = pair.rows.map(([f, av, bv]) => `<tr><td>${esc(f)}</td><td>${esc(av)}</td><td>${esc(bv)}</td></tr>`).join('');
  const photoList = pair.photo.map((p) => `<li>${esc(p)}</li>`).join('');
  const faqHtml = pair.faqs.map(([q, a]) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join('');
  const refLinks = pair.refs.map((sci) => `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(sci.replace(/\s+/g, '_'))}" rel="noopener">${esc(sci)} — Wikipedia</a>`).join('<br>');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Blue Seas Fishing">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  ${(() => { const ia = imgFor(pair.a) || imgFor(pair.b); return ia ? `<meta property="og:image" content="${SITE}${ia}">` : ''; })()}
  <script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
  <script type="application/ld+json">${JSON.stringify(article)}</script>
  <script type="application/ld+json">${JSON.stringify(faq)}</script>
<link rel="stylesheet" href="/assets/css/species-guides.css"><script src="/analytics-consent.js?v=2" defer></script></head>
<body>${NAV}<main class="guide-wrap">
<div class="breadcrumbs"><a href="/">Home</a> / <a href="/fish-identification-guides.html">ID guides</a> / ${esc(an)} vs. ${esc(bn.toLowerCase())}</div>
<h1>${esc(an)} vs. ${esc(bn.toLowerCase())}: how to tell them apart</h1>
<p class="lede">${esc(pair.lede)}</p>
<h2>Fast comparison</h2>
<table class="compare"><thead><tr><th>Feature</th><th>${esc(an)}</th><th>${esc(bn)}</th></tr></thead><tbody>${compareRows}</tbody></table>
<h2>Photograph these features</h2><ol class="feature-list">${photoList}</ol>
<h2>When it is not clear-cut</h2><p>${esc(pair.note)}</p>
<div class="warning"><strong>Identification tools can be wrong.</strong> Confirm uncertain fish with the local fisheries authority before relying on the result for harvest or possession rules.</div>
<div class="action"><h2>Compare your catch</h2><p>Use an AI-assisted suggestion as a starting point, then check the features above yourself.</p><a class="button" href="/fish-id.html">Upload a fish photo</a><a class="button secondary" href="/gallery.html">Browse species</a></div>
<div class="guide-links">${speciesLinks(pair.a)}${speciesLinks(pair.b)}</div>
<h2>Frequently asked questions</h2><dl class="faq">${faqHtml}</dl>
<div class="sources"><h2>Authoritative references</h2><p>${refLinks}</p></div>
<footer class="guide-footer">Blue Seas Fishing provides identification guidance, not a regulatory determination. Check current local fishing rules.</footer></main><script src="/assets/js/nav-back.js?v=3" defer></script></body></html>
`;
}

function buildHub() {
  const file = 'fish-identification-guides.html';
  const url = `${SITE}/${file}`;
  const title = 'Fish Identification Guides — Comparison & Species ID Help';
  const desc = 'Every Blue Seas fishing identification guide: side-by-side comparisons of commonly confused species plus single-species ID deep dives.';

  const groups = [
    ['Commonly confused species', PAIRS.map((p) => [`${toSlug(`${shortName(p.a)}-vs-${shortName(p.b)}`)}-identification.html`, `${shortName(p.a)} vs. ${shortName(p.b)}`])],
    ['Deep-dive guides', EXISTING_GUIDES.filter(([, t]) => !t.includes(' vs.')).map(([href, t]) => [href, t])],
    ['More comparisons', EXISTING_GUIDES.filter(([, t]) => t.includes(' vs.')).map(([href, t]) => [href, t])],
  ];
  const groupHtml = groups.map(([label, items]) => `<h2>${esc(label)}</h2><ul class="guide-list">${items.map(([href, t]) => `<li><a href="/${href}">${esc(t)}</a></li>`).join('')}</ul>`).join('\n');

  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: title },
    ],
  };

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Blue Seas Fishing">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary">
  <script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
<link rel="stylesheet" href="/assets/css/species-guides.css"><script src="/analytics-consent.js?v=2" defer></script></head>
<body>${NAV}<main class="guide-wrap">
<div class="breadcrumbs"><a href="/">Home</a> / ID guides</div>
<h1>Fish identification guides</h1>
<p class="lede">Side-by-side comparisons for the species anglers mix up most, plus deep dives on hard-to-ID fish. Every guide links to the full species profiles in the database.</p>
${groupHtml}
<div class="action"><h2>Not sure what you caught?</h2><p>Upload a photo and get an AI-assisted identification in seconds — free, three per day.</p><a class="button" href="/fish-id.html">Identify my fish</a></div>
<footer class="guide-footer">Blue Seas Fishing provides identification guidance, not a regulatory determination. Check current local fishing rules.</footer></main><script src="/assets/js/nav-back.js?v=3" defer></script></body></html>
`;
}

/* ----------------------------------------------------------------- main */
let written = 0;
for (const pair of PAIRS) {
  const an = shortName(pair.a), bn = shortName(pair.b);
  const file = `${toSlug(`${an}-vs-${bn}`)}-identification.html`;
  writeFileSync(join(ROOT, file), buildPage(pair));
  console.log(`  ${file}`);
  written++;
}
writeFileSync(join(ROOT, 'fish-identification-guides.html'), buildHub());
console.log(`  fish-identification-guides.html`);
console.log(`Done: ${written} comparison pages + 1 hub page`);
