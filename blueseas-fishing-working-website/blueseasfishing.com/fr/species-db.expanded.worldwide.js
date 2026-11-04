// species-db.expanded.worldwide.js — Worldwide species expansion pack #2
// 60 angling-relevant species sourced/verified against FishBase & IGFA records.
// Self-deduplicating: merges into window.SPECIES_DB, skipping any species whose
// common name or scientific name already exists. Safe to load multiple times.
(function () {
  if (typeof window === 'indéfini') return;
  window.SPECIES_DB = window.SPECIES_DB || [];

  var GROUPS = [
    {
      env: 'Saltwater',
      habitat: 'Eaux côtières, récifs, estuaires ou haute mer selon les espèces',
      baits: 'Appâts coupés, appâts vivants, jigs et leurres de pêche à la traîne adaptés à lespèce cible',
      season: 'Cela varie selon la région et la réglementation.',
      fish: [
        // --- Sharks & rays (major angling and ID-misidentification targets) ---
        ['Requin bouledogue', 'Carcharhinus leucas','bull-shark'],
        ['Requin tigre', 'Galeocerdo cuvier','tiger-shark'],
        ['Requin des bancs de sable', 'Carcharhinus plumbeus','sandbar-shark'],
        ['Requin tigre des sables', 'Carcharias taurus','sand-tiger-shark'],
        ['Requin citron', 'Negaprion brevirostris','lemon-shark'],
        ['Requin nourrice', 'Ginglymostoma cirratum','nurse-shark'],
        ['Requin marteau (grand)', 'Sphyrna mokarran','hammerhead-shark-great'],
        ['Requin à pointe noire', 'Carcharhinus limbatus','blacktip-shark'],
        ['Requin à pointe noire', 'Carcharhinus melanopterus','blacktip-reef-shark'],
        ['Requin fileur', 'Carcharhinus brevipinna','spinner-shark'],
        ['Requin sombre', 'Carcharhinus obscurus','dusky-shark'],
        ['Requin de récif (Caraïbes)', 'Carcharhinus perezi','reef-shark-caribbean'],
        ['Requin gris de récif', 'Carcharhinus amblyrhynchos','grey-reef-shark'],
        ['Ange Requin', 'Squatina squatina','angel-shark'],
        ['Raie épineuse', 'Raja clavata','thornback-ray'],
        ['Rayon blond', 'Raja brachyura','blonde-ray'],
        ['Raie aux petits yeux', 'Raja microocellata','small-eyed-ray'],
        ['Rayon ondulé', 'Raja undulata','undulate-ray'],
        ['Raie tachetée', 'Raja montagui','spotted-ray'],
        ['Raie coucou', 'Leucoraja naevus','cuckoo-ray'],
        ['Raie commune (raie bleue)', 'Dipturus batis','common-skate-blue-skate'],
        ['Rayon Galuchat', 'Leucoraja fullonica','shagreen-ray'],
        ['Raie aigle (tachée)', 'Aetobatus narinari','eagle-ray-spotted'],
        ['Rayon taureau', 'Aetomylaeus bovinus','bull-ray'],
        ['Raie pastenague commune', 'Dasyatis pastinaca','common-stingray'],
        // --- Snappers & IWP reef/tropical saltwater ---
        ['Vivaneau rouge (du Nord)', 'Lutjanus campechanus','red-snapper-northern'],
        ['Vivaneau à queue jaune', 'Ocyurus chrysurus','yellowtail-snapper'],
        ['Vivaneau Cubera (Pacifique)', 'Lutjanus novemfasciatus','cubera-snapper-pacific'],
        ['Empereur Rouge', 'Lutjanus sebae','red-emperor'],
        ['Jack de mangrove', 'Lutjanus argentimaculatus','mangrove-jack'],
        ['Truite Corail', 'Plectropomus leopardus','coral-trout'],
        ['Truite corail barrée', 'Plectropomus maculatus','barred-coral-trout'],
        ['Bocasse fleurie', 'Epinephelus fuscoguttatus','flowery-rockcod'],
        ['Mérou Malabar', 'Epinephelus malabaricus','malabar-grouper'],
        ['Carangue bleue', 'Caranx melampygus','bluefin-trevally'],
        ['Carangue dorée', 'Gnathanodon speciosus','golden-trevally'],
        ['Carangue cuivrée', 'Caranx papuensis','brassy-trevally'],
        ['Carangue à pointe noire', 'Caranx heberi','blacktip-trevally'],
        ['Chanos', 'Chanos chanos','milkfish'],
        ['Poisson-coq', 'Nematistius pectoralis','roosterfish'],
        ['Mulloway (poisson juif)', 'Argyrosomus japonicus','mulloway-jewfish'],
        ['Vivaneau drapeau espagnol', 'Lutjanus carponotatus','spanish-flag-snapper'],
        ['Poisson-lapin griffonné', 'Siganus spinus','scribbled-rabbitfish'],
        ['Daurade Goldenline', 'Gymnocranius grandoculis','goldenline-seabream'],
        // --- Mediterranean / NE Atlantic inshore ---
        ['Daurade annulaire', 'Diplodus annularis','annular-seabream'],
        ['Dorade à deux bandes', 'Diplodus vulgaris','two-banded-seabream'],
        ['Dorade Blanche', 'Diplodus sargus','white-seabream'],
        ['Dorade noire', 'Spondyliosoma cantharus','black-seabream'],
        ['Salema Porgy', 'Sarpa salpa','salema-porgy'],
        ['Dorade à points noirs', 'Pagellus bogaraveo','blackspot-seabream'],
        ['Dorade axillaire', 'Pagellus acarne','axillary-seabream'],
        ['Rouget rayé', 'Mullus surmuletus','striped-red-mullet'],
        ['Rouget', 'Mullus barbatus','red-mullet'],
        ['Mulet gris (Thinlip)', 'Chelon ramada','grey-mullet-thinlip'],
        ['Mulet gris doré', 'Chelon auratus','golden-grey-mullet'],
        ['Corb (Tambour Shi)', 'Umbrina cirrosa','corb-shi-drum'],
        ['Peigneur peint', 'Serranus scriba','painted-comber'],
        ['Flet (européen)', 'Platichthys flesus','flounder-european'],
        ['Bouder', 'Trisopterus luscus','pouting'],
        ['Merlan', 'Merlangius merlangus','whiting'],
        ['Orphie', 'Belone belone','garfish'],
        ['Grand Weever', 'Trachinus draco','greater-weever'],
        ['Grondin en baignoire', 'Chelidonichthys lucerna','tub-gurnard'],
        ['Jean Dory', 'Zeus faber','john-dory'],
        ['Congre', 'Conger conger','conger-eel']
      ]
    },
    {
      env: 'Freshwater',
      habitat: 'Rivières, lacs et bras morts adaptés à chaque espèce',
      baits: 'Leurres, mouches et appâts naturels adaptés aux espèces',
      season: 'Cela varie selon la région et la réglementation.',
      fish: [
        // --- European coarse fish ---
        ['Cafard', 'Rutilus rutilus','roach'],
        ['Rudd', 'Scardinius erythrophthalmus','rudd'],
        ['Brème commune', 'Abramis brama','common-bream'],
        ['Daurade argentée', 'Blicca bjoerkna','silver-bream'],
        ['Daurade aux yeux blancs', 'Ballerus sapa','white-eye-bream'],
        ['Sombre', 'Alburnus alburnus','bleak'],
        ['Ide (Orfé)', 'Leuciscus idus','ide-orfe'],
        ['Naseux', 'Leuciscus leuciscus','dace'],
        ['Zopé', 'Ballerus ballerus','zope'],
        ['Ziège (Carpe Sabre)', 'Pelecus cultratus','ziege-sabre-carp'],
        ['Vimba', 'Vimba vimba','vimba'],
        ['Nase', 'Chondrostoma nasus','nase'],
        ['Ombre (européen)', 'Thymallus thymallus','grayling-european'],
        // --- Predators & exotic freshwater targets ---
        ['Taïmen', 'Hucho taimen','taimen'],
        ['Huchen (saumon du Danube)', 'Hucho hucho','huchen-danube-salmon'],
        ['Poisson-chat Vundu', 'Heterobranchus longifilis','vundu-catfish'],
        ['Poisson-chat au beurre', 'Ompok bimaculatus','butter-catfish'],
        ['Poisson-chat en marbre', 'Leiarius marmoratus','marble-catfish'],
        ['Poisson-chat Jau', 'Zungaro jahu','jau-catfish'],
        ['Surubim barré', 'Pseudoplatystoma fasciatum','barred-surubim'],
        ['Surubim tacheté', 'Pseudoplatystoma corruscans','spotted-surubim'],
        ['Peacock Bass (Papillon)', 'Cichla ocellaris','peacock-bass-butterfly'],
        ['Poisson-loup (Trairao)', 'Hoplias aimara','wolf-fish-trairao'],
        ['Brycon à queue rouge', 'Brycon melanopterus','redtail-brycon'],
        ['Dollar en argent (Métynnis)', 'Metynnis lippincottianus','silver-dollar-metynnis']
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
  try { document.dispatchEvent(new Event('enrichi en bsf-db')); } catch (_) {}
})();
