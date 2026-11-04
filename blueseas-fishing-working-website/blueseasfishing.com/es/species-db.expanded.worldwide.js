// species-db.expanded.worldwide.js — Worldwide species expansion pack #2
// 60 angling-relevant species sourced/verified against FishBase & IGFA records.
// Self-deduplicating: merges into window.SPECIES_DB, skipping any species whose
// common name or scientific name already exists. Safe to load multiple times.
(function () {
  if (typeof window === 'indefinido') return;
  window.SPECIES_DB = window.SPECIES_DB || [];

  var GROUPS = [
    {
      env: 'Saltwater',
      habitat: 'Aguas costeras, arrecifes, estuarios u océano abierto, dependiendo de la especie.',
      baits: 'Cebo cortado, cebo vivo, jigs y señuelos para curricán adaptados a las especies objetivo',
      season: 'Varía según la región y la normativa.',
      fish: [
        // --- Sharks & rays (major angling and ID-misidentification targets) ---
        ['tiburón toro', 'Carcharhinus leucas','bull-shark'],
        ['Tiburón tigre', 'Galeocerdo cuvier','tiger-shark'],
        ['Tiburón banco de arena', 'Carcharhinus plumbeus','sandbar-shark'],
        ['Tiburón tigre de arena', 'Carcharias taurus','sand-tiger-shark'],
        ['Tiburón Limón', 'Negaprion brevirostris','lemon-shark'],
        ['Tiburón nodriza', 'Ginglymostoma cirratum','nurse-shark'],
        ['Tiburón martillo (genial)', 'Sphyrna mokarran','hammerhead-shark-great'],
        ['Tiburón punta negra', 'Carcharhinus limbatus','blacktip-shark'],
        ['Tiburón punta negra', 'Carcharhinus melanopterus','blacktip-reef-shark'],
        ['Tiburón giratorio', 'Carcharhinus brevipinna','spinner-shark'],
        ['Tiburón oscuro', 'Carcharhinus obscurus','dusky-shark'],
        ['Tiburón de arrecife (Caribe)', 'Carcharhinus perezi','reef-shark-caribbean'],
        ['Tiburón gris de arrecife', 'Carcharhinus amblyrhynchos','grey-reef-shark'],
        ['Tiburón ángel', 'Squatina squatina','angel-shark'],
        ['Rayo espinado', 'Raja clavata','thornback-ray'],
        ['Rayo Rubio', 'Raja brachyura','blonde-ray'],
        ['Rayo de ojos pequeños', 'Raja microocellata','small-eyed-ray'],
        ['Rayo ondulado', 'Raja undulata','undulate-ray'],
        ['Rayo manchado', 'Raja montagui','spotted-ray'],
        ['Rayo cuco', 'Leucoraja naevus','cuckoo-ray'],
        ['Raya común (raya azul)', 'Dipturus batis','common-skate-blue-skate'],
        ['Rayo Shagreen', 'Leucoraja fullonica','shagreen-ray'],
        ['Raya águila (manchada)', 'Aetobatus narinari','eagle-ray-spotted'],
        ['Rayo toro', 'Aetomylaeus bovinus','bull-ray'],
        ['Raya común', 'Dasyatis pastinaca','common-stingray'],
        // --- Snappers & IWP reef/tropical saltwater ---
        ['Pargo Rojo (Norte)', 'Lutjanus campechanus','red-snapper-northern'],
        ['Pargo de cola amarilla', 'Ocyurus chrysurus','yellowtail-snapper'],
        ['Pargo Cubera (Pacífico)', 'Lutjanus novemfasciatus','cubera-snapper-pacific'],
        ['Emperador Rojo', 'Lutjanus sebae','red-emperor'],
        ['Gato de manglar', 'Lutjanus argentimaculatus','mangrove-jack'],
        ['Trucha Coralina', 'Plectropomus leopardus','coral-trout'],
        ['Trucha de coral barrada', 'Plectropomus maculatus','barred-coral-trout'],
        ['Bacalao de roca florido', 'Epinephelus fuscoguttatus','flowery-rockcod'],
        ['Mero Malabar', 'Epinephelus malabaricus','malabar-grouper'],
        ['Jurel de aleta azul', 'Caranx melampygus','bluefin-trevally'],
        ['Jurel dorado', 'Gnathanodon speciosus','golden-trevally'],
        ['Jurel latón', 'Caranx papuensis','brassy-trevally'],
        ['Jurel punta negra', 'Caranx heberi','blacktip-trevally'],
        ['chano', 'Chanos chanos','milkfish'],
        ['pez gallo', 'Nematistius pectoralis','roosterfish'],
        ['Mulloway (pez judío)', 'Argyrosomus japonicus','mulloway-jewfish'],
        ['Pargo Bandera Española', 'Lutjanus carponotatus','spanish-flag-snapper'],
        ['Pez conejo garabateado', 'Siganus spinus','scribbled-rabbitfish'],
        ['Dorada Línea Dorada', 'Gymnocranius grandoculis','goldenline-seabream'],
        // --- Mediterranean / NE Atlantic inshore ---
        ['Dorada anular', 'Diplodus annularis','annular-seabream'],
        ['Dorada de dos bandas', 'Diplodus vulgaris','two-banded-seabream'],
        ['Dorada blanca', 'Diplodus sargus','white-seabream'],
        ['Dorada Negra', 'Spondyliosoma cantharus','black-seabream'],
        ['Salema Porgy', 'Sarpa salpa','salema-porgy'],
        ['Dorada mancha negra', 'Pagellus bogaraveo','blackspot-seabream'],
        ['Dorada axilar', 'Pagellus acarne','axillary-seabream'],
        ['Salmonete Rayado', 'Mullus surmuletus','striped-red-mullet'],
        ['Salmonete', 'Mullus barbatus','red-mullet'],
        ['Salmonete Gris (Thinlip)', 'Chelon ramada','grey-mullet-thinlip'],
        ['Salmonete Gris Dorado', 'Chelon auratus','golden-grey-mullet'],
        ['Corb (tambor shi)', 'Umbrina cirrosa','corb-shi-drum'],
        ['Peinador pintado', 'Serranus scriba','painted-comber'],
        ['Platija (europea)', 'Platichthys flesus','flounder-european'],
        ['haciendo pucheros', 'Trisopterus luscus','pouting'],
        ['merlán', 'Merlangius merlangus','whiting'],
        ['pez aguja', 'Belone belone','garfish'],
        ['mayor weever', 'Trachinus draco','greater-weever'],
        ['Rubio de bañera', 'Chelidonichthys lucerna','tub-gurnard'],
        ['Juan Dory', 'Zeus faber','john-dory'],
        ['Congrio', 'Conger conger','conger-eel']
      ]
    },
    {
      env: 'Freshwater',
      habitat: 'Ríos, lagos y remansos adecuados para cada especie.',
      baits: 'Señuelos, moscas y cebos naturales apropiados para cada especie',
      season: 'Varía según la región y la normativa.',
      fish: [
        // --- European coarse fish ---
        ['cucaracha', 'Rutilus rutilus','roach'],
        ['Rudd', 'Scardinius erythrophthalmus','rudd'],
        ['Dorada Común', 'Abramis brama','common-bream'],
        ['Dorada plateada', 'Blicca bjoerkna','silver-bream'],
        ['Dorada de ojo blanco', 'Ballerus sapa','white-eye-bream'],
        ['sombrío', 'Alburnus alburnus','bleak'],
        ['Ide (Orfe)', 'Leuciscus idus','ide-orfe'],
        ['dace', 'Leuciscus leuciscus','dace'],
        ['zope', 'Ballerus ballerus','zope'],
        ['Ziege (carpa sable)', 'Pelecus cultratus','ziege-sabre-carp'],
        ['vimba', 'Vimba vimba','vimba'],
        ['Nase', 'Chondrostoma nasus','nase'],
        ['Grayling (europeo)', 'Thymallus thymallus','grayling-european'],
        // --- Predators & exotic freshwater targets ---
        ['Taimen', 'Hucho taimen','taimen'],
        ['Huchen (salmón del Danubio)', 'Hucho hucho','huchen-danube-salmon'],
        ['Bagre Vundu', 'Heterobranchus longifilis','vundu-catfish'],
        ['Bagre Mantequilla', 'Ompok bimaculatus','butter-catfish'],
        ['Bagre de mármol', 'Leiarius marmoratus','marble-catfish'],
        ['Bagre Jau', 'Zungaro jahu','jau-catfish'],
        ['Surubines prohibidos', 'Pseudoplatystoma fasciatum','barred-surubim'],
        ['Surubines manchados', 'Pseudoplatystoma corruscans','spotted-surubim'],
        ['Pavón Real (Mariposa)', 'Cichla ocellaris','peacock-bass-butterfly'],
        ['Pez Lobo (Trairao)', 'Hoplias aimara','wolf-fish-trairao'],
        ['Brycon de cola roja', 'Brycon melanopterus','redtail-brycon'],
        ['Dólar de plata (Metynnis)', 'Metynnis lippincottianus','silver-dollar-metynnis']
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
  try { document.dispatchEvent(new Event('bsf-db-enriquecido')); } catch (_) {}
})();
