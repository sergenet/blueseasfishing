// species-db.expanded.worldwide.js — Worldwide species expansion pack #2
// 60 angling-relevant species sourced/verified against FishBase & IGFA records.
// Self-deduplicating: merges into window.SPECIES_DB, skipping any species whose
// common name or scientific name already exists. Safe to load multiple times.
(function () {
  if (typeof window === 'απροσδιόριστος') return;
  window.SPECIES_DB = window.SPECIES_DB || [];

  var GROUPS = [
    {
      env: 'Saltwater',
      habitat: 'Παράκτια ύδατα, ύφαλοι, εκβολές ποταμών ή ανοιχτός ωκεανός ανάλογα με το είδος',
      baits: 'Κόψτε το δόλωμα, το ζωντανό δόλωμα, τις ρόδες και τα δολώματα που ταιριάζουν στο είδος-στόχο',
      season: 'Διαφέρει ανάλογα με την περιοχή και τους κανονισμούς',
      fish: [
        // --- Sharks & rays (major angling and ID-misidentification targets) ---
        ['Καρχαρίας ταύρος', 'Carcharhinus leucas','bull-shark'],
        ['Καρχαρίας Τίγρης', 'Galeocerdo cuvier','tiger-shark'],
        ['Sandbar Shark', 'Carcharhinus plumbeus','sandbar-shark'],
        ['Sand Tiger Shark', 'Carcharias taurus','sand-tiger-shark'],
        ['Καρχαρίας λεμονιού', 'Negaprion brevirostris','lemon-shark'],
        ['Καρχαρίας νοσοκόμα', 'Ginglymostoma cirratum','nurse-shark'],
        ['Σφυροκέφαλος Καρχαρίας (Υπέροχος)', 'Sphyrna mokarran','hammerhead-shark-great'],
        ['Blacktip Shark', 'Carcharhinus limbatus','blacktip-shark'],
        ['Blacktip Reef Shark', 'Carcharhinus melanopterus','blacktip-reef-shark'],
        ['Spinner Shark', 'Carcharhinus brevipinna','spinner-shark'],
        ['Dusky Shark', 'Carcharhinus obscurus','dusky-shark'],
        ['Reef Shark (Καραϊβική)', 'Carcharhinus perezi','reef-shark-caribbean'],
        ['Καρχαρίας γκρίζος ύφαλος', 'Carcharhinus amblyrhynchos','grey-reef-shark'],
        ['Άγγελος Καρχαρίας', 'Squatina squatina','angel-shark'],
        ['Θόρνμπακ Ρέι', 'Raja clavata','thornback-ray'],
        ['Ξανθή Ακτίνα', 'Raja brachyura','blonde-ray'],
        ['Small-eyed Ray', 'Raja microocellata','small-eyed-ray'],
        ['Κυματιστή Ακτίνα', 'Raja undulata','undulate-ray'],
        ['Spotted Ray', 'Raja montagui','spotted-ray'],
        ['Κούκος Ρέι', 'Leucoraja naevus','cuckoo-ray'],
        ['Common Skate (Μπλε πατίνι)', 'Dipturus batis','common-skate-blue-skate'],
        ['Shagreen Ray', 'Leucoraja fullonica','shagreen-ray'],
        ['Eagle Ray (Spotted)', 'Aetobatus narinari','eagle-ray-spotted'],
        ['Μπουλ Ρέι', 'Aetomylaeus bovinus','bull-ray'],
        ['Κοινό Stingray', 'Dasyatis pastinaca','common-stingray'],
        // --- Snappers & IWP reef/tropical saltwater ---
        ['Red Snapper (Βόρεια)', 'Lutjanus campechanus','red-snapper-northern'],
        ['Yellowtail Snapper', 'Ocyurus chrysurus','yellowtail-snapper'],
        ['Cubera Snapper (Ειρηνικός)', 'Lutjanus novemfasciatus','cubera-snapper-pacific'],
        ['Κόκκινος Αυτοκράτορας', 'Lutjanus sebae','red-emperor'],
        ['Μαγκρόβ Τζακ', 'Lutjanus argentimaculatus','mangrove-jack'],
        ['Πέστροφα κοραλλιών', 'Plectropomus leopardus','coral-trout'],
        ['φραγμένη κοραλλιογενής πέστροφα', 'Plectropomus maculatus','barred-coral-trout'],
        ['Flowery Rockcod', 'Epinephelus fuscoguttatus','flowery-rockcod'],
        ['Σφυρίδα Malabar', 'Epinephelus malabaricus','malabar-grouper'],
        ['Bluefin Trevally', 'Caranx melampygus','bluefin-trevally'],
        ['Golden Trevally', 'Gnathanodon speciosus','golden-trevally'],
        ['Brassy Trevally', 'Caranx papuensis','brassy-trevally'],
        ['Blacktip Trevally', 'Caranx heberi','blacktip-trevally'],
        ['Γαλακτόψαρο', 'Chanos chanos','milkfish'],
        ['Πετεινόψαρο', 'Nematistius pectoralis','roosterfish'],
        ['Mulloway (Εβραίος)', 'Argyrosomus japonicus','mulloway-jewfish'],
        ['Ισπανική σημαία Snapper', 'Lutjanus carponotatus','spanish-flag-snapper'],
        ['Κουνελόψαρο μουντζουρωμένο', 'Siganus spinus','scribbled-rabbitfish'],
        ['Goldenline Seabream', 'Gymnocranius grandoculis','goldenline-seabream'],
        // --- Mediterranean / NE Atlantic inshore ---
        ['Δακτυλιοειδής τσιπούρα', 'Diplodus annularis','annular-seabream'],
        ['Τσιπούρα με δύο ταινίες', 'Diplodus vulgaris','two-banded-seabream'],
        ['Λευκή τσιπούρα', 'Diplodus sargus','white-seabream'],
        ['Μαύρη τσιπούρα', 'Spondyliosoma cantharus','black-seabream'],
        ['Salema Porgy', 'Sarpa salpa','salema-porgy'],
        ['Blackspot Seabream', 'Pagellus bogaraveo','blackspot-seabream'],
        ['Μασχαλιαία τσιπούρα', 'Pagellus acarne','axillary-seabream'],
        ['Ριγέ μπαρμπούνι', 'Mullus surmuletus','striped-red-mullet'],
        ['Μπαρμπούνι', 'Mullus barbatus','red-mullet'],
        ['Γκρίζο κέφαλο (Thinlip)', 'Chelon ramada','grey-mullet-thinlip'],
        ['Χρυσό Γκρίζο Κέφαλο', 'Chelon auratus','golden-grey-mullet'],
        ['Corb (Τύμπανο Shi)', 'Umbrina cirrosa','corb-shi-drum'],
        ['Βαμμένη χτένα', 'Serranus scriba','painted-comber'],
        ['Flounder (Ευρωπαϊκό)', 'Platichthys flesus','flounder-european'],
        ['Μυρωμένος', 'Trisopterus luscus','pouting'],
        ['Νταούκι', 'Merlangius merlangus','whiting'],
        ['Garfish', 'Belone belone','garfish'],
        ['Greater Weever', 'Trachinus draco','greater-weever'],
        ['Tub Gunard', 'Chelidonichthys lucerna','tub-gurnard'],
        ['Τζον Ντόρι', 'Zeus faber','john-dory'],
        ['Conger Eel', 'Conger conger','conger-eel']
      ]
    },
    {
      env: 'Freshwater',
      habitat: 'Ποτάμια, λίμνες και τέλματα κατάλληλα για κάθε είδος',
      baits: 'Κατάλληλα για είδη θέλγητρα, μύγες και φυσικά δολώματα',
      season: 'Διαφέρει ανάλογα με την περιοχή και τους κανονισμούς',
      fish: [
        // --- European coarse fish ---
        ['Κατσαρίδα', 'Rutilus rutilus','roach'],
        ['Ραντ', 'Scardinius erythrophthalmus','rudd'],
        ['Κοινή Τσιπούρα', 'Abramis brama','common-bream'],
        ['Ασημένια Τσιπούρα', 'Blicca bjoerkna','silver-bream'],
        ['Τσιπούρα λευκού ματιού', 'Ballerus sapa','white-eye-bream'],
        ['Ζοφερό', 'Alburnus alburnus','bleak'],
        ['Ιδέ (Ορφέ)', 'Leuciscus idus','ide-orfe'],
        ['Λευκίσκος', 'Leuciscus leuciscus','dace'],
        ['Zope', 'Ballerus ballerus','zope'],
        ['Ziege (Sabre Carp)', 'Pelecus cultratus','ziege-sabre-carp'],
        ['Vimba', 'Vimba vimba','vimba'],
        ['Nase', 'Chondrostoma nasus','nase'],
        ['Grayling (Ευρωπαϊκό)', 'Thymallus thymallus','grayling-european'],
        // --- Predators & exotic freshwater targets ---
        ['Taimen', 'Hucho taimen','taimen'],
        ['Huchen (Σολομός Δούναβη)', 'Hucho hucho','huchen-danube-salmon'],
        ['Γατόψαρο Vundu', 'Heterobranchus longifilis','vundu-catfish'],
        ['Γατόψαρο βουτύρου', 'Ompok bimaculatus','butter-catfish'],
        ['Μαρμάρινο Γατόψαρο', 'Leiarius marmoratus','marble-catfish'],
        ['Jau Γατόψαρο', 'Zungaro jahu','jau-catfish'],
        ['Αφραγμένος Σουρουμπίμ', 'Pseudoplatystoma fasciatum','barred-surubim'],
        ['Σουρουμπίμ με στίγματα', 'Pseudoplatystoma corruscans','spotted-surubim'],
        ['Peacock Bass (Πεταλούδα)', 'Cichla ocellaris','peacock-bass-butterfly'],
        ['Wolf Fish (Trairao)', 'Hoplias aimara','wolf-fish-trairao'],
        ['Redtail Brycon', 'Brycon melanopterus','redtail-brycon'],
        ['Ασημένιο δολάριο (Μετύννης)', 'Metynnis lippincottianus','silver-dollar-metynnis']
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
  try { document.dispatchEvent(new Event('bsf-db-εμπλουτισμένο')); } catch (_) {}
})();
