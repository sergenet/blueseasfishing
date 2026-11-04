// species-db.expanded.worldwide.js — Worldwide species expansion pack #2
// 60 angling-relevant species sourced/verified against FishBase & IGFA records.
// Self-deduplicating: merges into window.SPECIES_DB, skipping any species whose
// common name or scientific name already exists. Safe to load multiple times.
(function () {
  if (typeof window === 'undefined') return;
  window.SPECIES_DB = window.SPECIES_DB || [];

  var GROUPS = [
    {
      env: 'Saltwater',
      habitat: 'Coastal waters, reefs, estuaries, or open ocean depending on species',
      baits: 'Cut bait, live bait, jigs, and trolling lures suited to the target species',
      season: 'Varies by region and regulation',
      fish: [
        // --- Sharks & rays (major angling and ID-misidentification targets) ---
        ['Bull Shark', 'Carcharhinus leucas'],
        ['Tiger Shark', 'Galeocerdo cuvier'],
        ['Sandbar Shark', 'Carcharhinus plumbeus'],
        ['Sand Tiger Shark', 'Carcharias taurus'],
        ['Lemon Shark', 'Negaprion brevirostris'],
        ['Nurse Shark', 'Ginglymostoma cirratum'],
        ['Hammerhead Shark (Great)', 'Sphyrna mokarran'],
        ['Blacktip Shark', 'Carcharhinus limbatus'],
        ['Blacktip Reef Shark', 'Carcharhinus melanopterus'],
        ['Spinner Shark', 'Carcharhinus brevipinna'],
        ['Dusky Shark', 'Carcharhinus obscurus'],
        ['Reef Shark (Caribbean)', 'Carcharhinus perezi'],
        ['Grey Reef Shark', 'Carcharhinus amblyrhynchos'],
        ['Angel Shark', 'Squatina squatina'],
        ['Thornback Ray', 'Raja clavata'],
        ['Blonde Ray', 'Raja brachyura'],
        ['Small-Eyed Ray', 'Raja microocellata'],
        ['Undulate Ray', 'Raja undulata'],
        ['Spotted Ray', 'Raja montagui'],
        ['Cuckoo Ray', 'Leucoraja naevus'],
        ['Common Skate (Blue Skate)', 'Dipturus batis'],
        ['Shagreen Ray', 'Leucoraja fullonica'],
        ['Eagle Ray (Spotted)', 'Aetobatus narinari'],
        ['Bull Ray', 'Aetomylaeus bovinus'],
        ['Common Stingray', 'Dasyatis pastinaca'],
        // --- Snappers & IWP reef/tropical saltwater ---
        ['Red Snapper (Northern)', 'Lutjanus campechanus'],
        ['Yellowtail Snapper', 'Ocyurus chrysurus'],
        ['Cubera Snapper (Pacific)', 'Lutjanus novemfasciatus'],
        ['Red Emperor', 'Lutjanus sebae'],
        ['Mangrove Jack', 'Lutjanus argentimaculatus'],
        ['Coral Trout', 'Plectropomus leopardus'],
        ['Barred Coral Trout', 'Plectropomus maculatus'],
        ['Flowery Rockcod', 'Epinephelus fuscoguttatus'],
        ['Malabar Grouper', 'Epinephelus malabaricus'],
        ['Bluefin Trevally', 'Caranx melampygus'],
        ['Golden Trevally', 'Gnathanodon speciosus'],
        ['Brassy Trevally', 'Caranx papuensis'],
        ['Blacktip Trevally', 'Caranx heberi'],
        ['Milkfish', 'Chanos chanos'],
        ['Roosterfish', 'Nematistius pectoralis'],
        ['Mulloway (Jewfish)', 'Argyrosomus japonicus'],
        ['Spanish Flag Snapper', 'Lutjanus carponotatus'],
        ['Scribbled Rabbitfish', 'Siganus spinus'],
        ['Goldenline Seabream', 'Gymnocranius grandoculis'],
        // --- Mediterranean / NE Atlantic inshore ---
        ['Annular Seabream', 'Diplodus annularis'],
        ['Two-Banded Seabream', 'Diplodus vulgaris'],
        ['White Seabream', 'Diplodus sargus'],
        ['Black Seabream', 'Spondyliosoma cantharus'],
        ['Salema Porgy', 'Sarpa salpa'],
        ['Blackspot Seabream', 'Pagellus bogaraveo'],
        ['Axillary Seabream', 'Pagellus acarne'],
        ['Striped Red Mullet', 'Mullus surmuletus'],
        ['Red Mullet', 'Mullus barbatus'],
        ['Grey Mullet (Thinlip)', 'Chelon ramada'],
        ['Golden Grey Mullet', 'Chelon auratus'],
        ['Corb (Shi Drum)', 'Umbrina cirrosa'],
        ['Painted Comber', 'Serranus scriba'],
        ['Flounder (European)', 'Platichthys flesus'],
        ['Pouting', 'Trisopterus luscus'],
        ['Whiting', 'Merlangius merlangus'],
        ['Garfish', 'Belone belone'],
        ['Greater Weever', 'Trachinus draco'],
        ['Tub Gurnard', 'Chelidonichthys lucerna'],
        ['John Dory', 'Zeus faber'],
        ['Conger Eel', 'Conger conger']
      ]
    },
    {
      env: 'Freshwater',
      habitat: 'Rivers, lakes, and backwaters appropriate to each species',
      baits: 'Species-appropriate lures, flies, and natural baits',
      season: 'Varies by region and regulation',
      fish: [
        // --- European coarse fish ---
        ['Roach', 'Rutilus rutilus'],
        ['Rudd', 'Scardinius erythrophthalmus'],
        ['Common Bream', 'Abramis brama'],
        ['Silver Bream', 'Blicca bjoerkna'],
        ['White-Eye Bream', 'Ballerus sapa'],
        ['Bleak', 'Alburnus alburnus'],
        ['Ide (Orfe)', 'Leuciscus idus'],
        ['Dace', 'Leuciscus leuciscus'],
        ['Zope', 'Ballerus ballerus'],
        ['Ziege (Sabre Carp)', 'Pelecus cultratus'],
        ['Vimba', 'Vimba vimba'],
        ['Nase', 'Chondrostoma nasus'],
        ['Grayling (European)', 'Thymallus thymallus'],
        // --- Predators & exotic freshwater targets ---
        ['Taimen', 'Hucho taimen'],
        ['Huchen (Danube Salmon)', 'Hucho hucho'],
        ['Vundu Catfish', 'Heterobranchus longifilis'],
        ['Butter Catfish', 'Ompok bimaculatus'],
        ['Marble Catfish', 'Leiarius marmoratus'],
        ['Jau Catfish', 'Zungaro jahu'],
        ['Barred Surubim', 'Pseudoplatystoma fasciatum'],
        ['Spotted Surubim', 'Pseudoplatystoma corruscans'],
        ['Peacock Bass (Butterfly)', 'Cichla ocellaris'],
        ['Wolf Fish (Trairao)', 'Hoplias aimara'],
        ['Redtail Brycon', 'Brycon melanopterus'],
        ['Silver Dollar (Metynnis)', 'Metynnis lippincottianus']
      ]
    }
  ];

  var existing = window.SPECIES_DB;
  var names = new Set(existing.map(function (x) { return String(x.name || '').toLowerCase(); }));
  var scientific = new Set(existing.map(function (x) { return String(x.sci || '').toLowerCase(); }));
  var extra = [];
  GROUPS.forEach(function (group) {
    group.fish.forEach(function (pair) {
      var name = pair[0], sci = pair[1];
      if (names.has(name.toLowerCase()) || scientific.has(sci.toLowerCase())) return;
      names.add(name.toLowerCase());
      scientific.add(sci.toLowerCase());
      extra.push({ name: name, sci: sci, env: group.env, habitat: group.habitat, baits: group.baits, season: group.season });
    });
  });
  window.SPECIES_DB_WORLDWIDE_ROWS = extra;
  window.SPECIES_DB = existing.concat(extra);
  try { document.dispatchEvent(new Event('bsf-db-enriched')); } catch (_) {}
})();
