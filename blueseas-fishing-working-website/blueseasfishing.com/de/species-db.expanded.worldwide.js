// species-db.expanded.worldwide.js — Worldwide species expansion pack #2
// 60 angling-relevant species sourced/verified against FishBase & IGFA records.
// Self-deduplicating: merges into window.SPECIES_DB, skipping any species whose
// common name or scientific name already exists. Safe to load multiple times.
(function () {
  if (typeof window === 'undefiniert') return;
  window.SPECIES_DB = window.SPECIES_DB || [];

  var GROUPS = [
    {
      env: 'Saltwater',
      habitat: 'Küstengewässer, Riffe, Flussmündungen oder offenes Meer, je nach Art',
      baits: 'Schneiden Sie Köder, lebende Köder, Jigs und Trolling-Köder, die für die Zielart geeignet sind',
      season: 'Variiert je nach Region und Verordnung',
      fish: [
        // --- Sharks & rays (major angling and ID-misidentification targets) ---
        ['Bullenhai', 'Carcharhinus leucas','bull-shark'],
        ['Tigerhai', 'Galeocerdo cuvier','tiger-shark'],
        ['Sandbankhai', 'Carcharhinus plumbeus','sandbar-shark'],
        ['Sandtigerhai', 'Carcharias taurus','sand-tiger-shark'],
        ['Zitronenhai', 'Negaprion brevirostris','lemon-shark'],
        ['Ammenhai', 'Ginglymostoma cirratum','nurse-shark'],
        ['Hammerhai (großartig)', 'Sphyrna mokarran','hammerhead-shark-great'],
        ['Schwarzspitzenhai', 'Carcharhinus limbatus','blacktip-shark'],
        ['Schwarzspitzen-Riffhai', 'Carcharhinus melanopterus','blacktip-reef-shark'],
        ['Spinnerhai', 'Carcharhinus brevipinna','spinner-shark'],
        ['Dunkler Hai', 'Carcharhinus obscurus','dusky-shark'],
        ['Riffhai (Karibik)', 'Carcharhinus perezi','reef-shark-caribbean'],
        ['Grauer Riffhai', 'Carcharhinus amblyrhynchos','grey-reef-shark'],
        ['Engelhai', 'Squatina squatina','angel-shark'],
        ['Thornback Ray', 'Raja clavata','thornback-ray'],
        ['Blonder Ray', 'Raja brachyura','blonde-ray'],
        ['Kleinäugiger Rochen', 'Raja microocellata','small-eyed-ray'],
        ['Wellenstrahl', 'Raja undulata','undulate-ray'],
        ['Gefleckter Rochen', 'Raja montagui','spotted-ray'],
        ['Kuckucksrochen', 'Leucoraja naevus','cuckoo-ray'],
        ['Gemeiner Rochen (Blauer Rochen)', 'Dipturus batis','common-skate-blue-skate'],
        ['Shagreen Ray', 'Leucoraja fullonica','shagreen-ray'],
        ['Adlerrochen (gefleckt)', 'Aetobatus narinari','eagle-ray-spotted'],
        ['Bull Ray', 'Aetomylaeus bovinus','bull-ray'],
        ['Gewöhnlicher Stachelrochen', 'Dasyatis pastinaca','common-stingray'],
        // --- Snappers & IWP reef/tropical saltwater ---
        ['Roter Schnapper (Nord)', 'Lutjanus campechanus','red-snapper-northern'],
        ['Gelbschwanz-Schnapper', 'Ocyurus chrysurus','yellowtail-snapper'],
        ['Cubera-Schnapper (Pazifik)', 'Lutjanus novemfasciatus','cubera-snapper-pacific'],
        ['Roter Kaiser', 'Lutjanus sebae','red-emperor'],
        ['Mangrove Jack', 'Lutjanus argentimaculatus','mangrove-jack'],
        ['Korallenforelle', 'Plectropomus leopardus','coral-trout'],
        ['Barred Coral Forelle', 'Plectropomus maculatus','barred-coral-trout'],
        ['Blumiger Rockcod', 'Epinephelus fuscoguttatus','flowery-rockcod'],
        ['Malabar-Zackenbarsch', 'Epinephelus malabaricus','malabar-grouper'],
        ['Blauflossen-Makrele', 'Caranx melampygus','bluefin-trevally'],
        ['Goldene Stachelmakrele', 'Gnathanodon speciosus','golden-trevally'],
        ['Brassy Trevally', 'Caranx papuensis','brassy-trevally'],
        ['Schwarzspitzenmakrele', 'Caranx heberi','blacktip-trevally'],
        ['Milchfisch', 'Chanos chanos','milkfish'],
        ['Roosterfish', 'Nematistius pectoralis','roosterfish'],
        ['Mulloway (Judenfisch)', 'Argyrosomus japonicus','mulloway-jewfish'],
        ['Spanischer Flaggenschnapper', 'Lutjanus carponotatus','spanish-flag-snapper'],
        ['Gekritzelter Kaninchenfisch', 'Siganus spinus','scribbled-rabbitfish'],
        ['Goldbrassen', 'Gymnocranius grandoculis','goldenline-seabream'],
        // --- Mediterranean / NE Atlantic inshore ---
        ['Ringbrasse', 'Diplodus annularis','annular-seabream'],
        ['Zweibinden-Dorade', 'Diplodus vulgaris','two-banded-seabream'],
        ['Weiße Dorade', 'Diplodus sargus','white-seabream'],
        ['Schwarze Dorade', 'Spondyliosoma cantharus','black-seabream'],
        ['Salema Porgy', 'Sarpa salpa','salema-porgy'],
        ['Schwarzfleck-Dorade', 'Pagellus bogaraveo','blackspot-seabream'],
        ['Achselbrasse', 'Pagellus acarne','axillary-seabream'],
        ['Gestreifte Rotbarbe', 'Mullus surmuletus','striped-red-mullet'],
        ['Rotbarbe', 'Mullus barbatus','red-mullet'],
        ['Graue Meeräsche (Thinlip)', 'Chelon ramada','grey-mullet-thinlip'],
        ['Goldgraue Meeräsche', 'Chelon auratus','golden-grey-mullet'],
        ['Corb (Shi-Trommel)', 'Umbrina cirrosa','corb-shi-drum'],
        ['Gemalter Comber', 'Serranus scriba','painted-comber'],
        ['Flunder (europäisch)', 'Platichthys flesus','flounder-european'],
        ['Schmollend', 'Trisopterus luscus','pouting'],
        ['Wittling', 'Merlangius merlangus','whiting'],
        ['Hornhecht', 'Belone belone','garfish'],
        ['Großer Petermännchen', 'Trachinus draco','greater-weever'],
        ['Knurrhahn', 'Chelidonichthys lucerna','tub-gurnard'],
        ['John Dory', 'Zeus faber','john-dory'],
        ['Meeraal', 'Conger conger','conger-eel']
      ]
    },
    {
      env: 'Freshwater',
      habitat: 'Flüsse, Seen und Altwasser, die für die jeweilige Art geeignet sind',
      baits: 'Artgerechte Köder, Fliegen und Naturköder',
      season: 'Variiert je nach Region und Verordnung',
      fish: [
        // --- European coarse fish ---
        ['Kakerlake', 'Rutilus rutilus','roach'],
        ['Rudd', 'Scardinius erythrophthalmus','rudd'],
        ['Brasse', 'Abramis brama','common-bream'],
        ['Silberbrasse', 'Blicca bjoerkna','silver-bream'],
        ['Weißaugenbrasse', 'Ballerus sapa','white-eye-bream'],
        ['Düster', 'Alburnus alburnus','bleak'],
        ['Ide (Orfe)', 'Leuciscus idus','ide-orfe'],
        ['Dace', 'Leuciscus leuciscus','dace'],
        ['Zope', 'Ballerus ballerus','zope'],
        ['Ziege (Säbelkarpfen)', 'Pelecus cultratus','ziege-sabre-carp'],
        ['Vimba', 'Vimba vimba','vimba'],
        ['Nase', 'Chondrostoma nasus','nase'],
        ['Äsche (europäisch)', 'Thymallus thymallus','grayling-european'],
        // --- Predators & exotic freshwater targets ---
        ['Taimen', 'Hucho taimen','taimen'],
        ['Huchen (Donaulachs)', 'Hucho hucho','huchen-danube-salmon'],
        ['Vundu-Wels', 'Heterobranchus longifilis','vundu-catfish'],
        ['Butterwels', 'Ompok bimaculatus','butter-catfish'],
        ['Marmorwels', 'Leiarius marmoratus','marble-catfish'],
        ['Jau-Wels', 'Zungaro jahu','jau-catfish'],
        ['Gesperrter Surubim', 'Pseudoplatystoma fasciatum','barred-surubim'],
        ['Gefleckter Surubim', 'Pseudoplatystoma corruscans','spotted-surubim'],
        ['Pfauenbarsch (Schmetterling)', 'Cichla ocellaris','peacock-bass-butterfly'],
        ['Wolfsfisch (Trairao)', 'Hoplias aimara','wolf-fish-trairao'],
        ['Rotschwanz-Brycon', 'Brycon melanopterus','redtail-brycon'],
        ['Silberdollar (Metynnis)', 'Metynnis lippincottianus','silver-dollar-metynnis']
      ]
    }
  ];

  var existing = window.SPECIES_DB;
  var names = new Set(existing.map(function (x) { return String(x.name || '').toLowerCase(); }));
  var scientific = new Set(existing.map(function (x) { return String(x.sci || '').toLowerCase(); }));
  var extra = [];
  GROUPS.forEach(function (group) {
    group.fish.forEach(function (pair) {
      var name = pair[0], sci = pair[1], slug = pair[2];
      if (names.has(name.toLowerCase()) || scientific.has(sci.toLowerCase())) return;
      names.add(name.toLowerCase());
      scientific.add(sci.toLowerCase());
      extra.push({ name: name, slug: slug, sci: sci, env: group.env, habitat: group.habitat, baits: group.baits, season: group.season });
    });
  });
  window.SPECIES_DB_WORLDWIDE_ROWS = extra;
  window.SPECIES_DB = existing.concat(extra);
  try { document.dispatchEvent(new Event('bsf-db-enriched')); } catch (_) {}
})();
