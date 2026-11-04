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
      habitat: 'Águas costeiras, recifes, estuários ou oceano aberto, dependendo da espécie.',
      baits: 'Iscas cortadas, iscas vivas, jigs e iscas de corrico adequadas às espécies-alvo',
      season: 'Varia conforme a região e a regulamentação.',
      fish: [
        // --- Sharks & rays (major angling and ID-misidentification targets) ---
        ['Tubarão Touro', 'Carcharhinus leucas','bull-shark'],
        ['Tubarão Tigre', 'Galeocerdo cuvier','tiger-shark'],
        ['Tubarão do banco de areia', 'Carcharhinus plumbeus','sandbar-shark'],
        ['Tubarão Tigre de Areia', 'Carcharias taurus','sand-tiger-shark'],
        ['Tubarão Limão', 'Negaprion brevirostris','lemon-shark'],
        ['Enfermeira Tubarão', 'Ginglymostoma cirratum','nurse-shark'],
        ['Tubarão-martelo (ótimo)', 'Sphyrna mokarran','hammerhead-shark-great'],
        ['Tubarão de pontas pretas', 'Carcharhinus limbatus','blacktip-shark'],
        ['Tubarão de pontas negras', 'Carcharhinus melanopterus','blacktip-reef-shark'],
        ['Tubarão Giratório', 'Carcharhinus brevipinna','spinner-shark'],
        ['Tubarão Escuro', 'Carcharhinus obscurus','dusky-shark'],
        ['Tubarão de Recife (Caribe)', 'Carcharhinus perezi','reef-shark-caribbean'],
        ['Tubarão Cinzento de Recife', 'Carcharhinus amblyrhynchos','grey-reef-shark'],
        ['Anjo Tubarão', 'Squatina squatina','angel-shark'],
        ['Raio Thornback', 'Raja clavata','thornback-ray'],
        ['Raio Loiro', 'Raja brachyura','blonde-ray'],
        ['Raio de olhos pequenos', 'Raja microocellata','small-eyed-ray'],
        ['Raio Ondulado', 'Raja undulata','undulate-ray'],
        ['Raia Manchada', 'Raja montagui','spotted-ray'],
        ['Raio Cuco', 'Leucoraja naevus','cuckoo-ray'],
        ['Patim Comum (Patin Azul)', 'Dipturus batis','common-skate-blue-skate'],
        ['Raio Shagreen', 'Leucoraja fullonica','shagreen-ray'],
        ['Raia Águia (manchada)', 'Aetobatus narinari','eagle-ray-spotted'],
        ['Arraia', 'Aetomylaeus bovinus','bull-ray'],
        ['Arraia Comum', 'Dasyatis pastinaca','common-stingray'],
        // --- Snappers & IWP reef/tropical saltwater ---
        ['Pargo Vermelho (Norte)', 'Lutjanus campechanus','red-snapper-northern'],
        ['Pargo de cauda amarela', 'Ocyurus chrysurus','yellowtail-snapper'],
        ['Cubera Snapper (Pacífico)', 'Lutjanus novemfasciatus','cubera-snapper-pacific'],
        ['Imperador Vermelho', 'Lutjanus sebae','red-emperor'],
        ['Mangue Jack', 'Lutjanus argentimaculatus','mangrove-jack'],
        ['Truta Coral', 'Plectropomus leopardus','coral-trout'],
        ['Truta Coral Barrada', 'Plectropomus maculatus','barred-coral-trout'],
        ['Rockcod florido', 'Epinephelus fuscoguttatus','flowery-rockcod'],
        ['Garoupa de Malabar', 'Epinephelus malabaricus','malabar-grouper'],
        ['Trevally de atum rabilho', 'Caranx melampygus','bluefin-trevally'],
        ['Trevally Dourado', 'Gnathanodon speciosus','golden-trevally'],
        ['Brassy Trevally', 'Caranx papuensis','brassy-trevally'],
        ['Blacktip Trevally', 'Caranx heberi','blacktip-trevally'],
        ['Peixe Leiteiro', 'Chanos chanos','milkfish'],
        ['Peixe Galo', 'Nematistius pectoralis','roosterfish'],
        ['Mulloway (peixe judeu)', 'Argyrosomus japonicus','mulloway-jewfish'],
        ['Snapper da bandeira espanhola', 'Lutjanus carponotatus','spanish-flag-snapper'],
        ['Peixe-coelho rabiscado', 'Siganus spinus','scribbled-rabbitfish'],
        ['Dourada Dourada', 'Gymnocranius grandoculis','goldenline-seabream'],
        // --- Mediterranean / NE Atlantic inshore ---
        ['Dourado Anular', 'Diplodus annularis','annular-seabream'],
        ['Dourado de Duas Bandas', 'Diplodus vulgaris','two-banded-seabream'],
        ['Dourada Branca', 'Diplodus sargus','white-seabream'],
        ['Dourada Negra', 'Spondyliosoma cantharus','black-seabream'],
        ['Salema Porgy', 'Sarpa salpa','salema-porgy'],
        ['Dourado', 'Pagellus bogaraveo','blackspot-seabream'],
        ['Dourada Axilar', 'Pagellus acarne','axillary-seabream'],
        ['Salmonete listrado', 'Mullus surmuletus','striped-red-mullet'],
        ['Salmonete', 'Mullus barbatus','red-mullet'],
        ['Tainha Cinzenta (Thinlip)', 'Chelon ramada','grey-mullet-thinlip'],
        ['Tainha Cinza Dourada', 'Chelon auratus','golden-grey-mullet'],
        ['Corb (Shi Tambor)', 'Umbrina cirrosa','corb-shi-drum'],
        ['Penteadeira Pintada', 'Serranus scriba','painted-comber'],
        ['Linguado (Europeu)', 'Platichthys flesus','flounder-european'],
        ['Fazendo beicinho', 'Trisopterus luscus','pouting'],
        ['Badejo', 'Merlangius merlangus','whiting'],
        ['Garfish', 'Belone belone','garfish'],
        ['Grande Weever', 'Trachinus draco','greater-weever'],
        ['Bacamarte de banheira', 'Chelidonichthys lucerna','tub-gurnard'],
        ['John Dory', 'Zeus faber','john-dory'],
        ['Enguia Congro', 'Conger conger','conger-eel']
      ]
    },
    {
      env: 'Freshwater',
      habitat: 'Rios, lagos e remansos adequados para cada espécie.',
      baits: 'Iscas, moscas e iscas naturais apropriadas para a espécie',
      season: 'Varia conforme a região e a regulamentação.',
      fish: [
        // --- European coarse fish ---
        ['Barata', 'Rutilus rutilus','roach'],
        ['Rudd', 'Scardinius erythrophthalmus','rudd'],
        ['Brema Comum', 'Abramis brama','common-bream'],
        ['Dourada Prateada', 'Blicca bjoerkna','silver-bream'],
        ['Brema de Olho Branco', 'Ballerus sapa','white-eye-bream'],
        ['Desolador', 'Alburnus alburnus','bleak'],
        ['Ide (Orfe)', 'Leuciscus idus','ide-orfe'],
        ['Dace', 'Leuciscus leuciscus','dace'],
        ['Zope', 'Ballerus ballerus','zope'],
        ['Ziege (carpa sabre)', 'Pelecus cultratus','ziege-sabre-carp'],
        ['Vimba', 'Vimba vimba','vimba'],
        ['nariz', 'Chondrostoma nasus','nase'],
        ['Grayling (Europeu)', 'Thymallus thymallus','grayling-european'],
        // --- Predators & exotic freshwater targets ---
        ['Taimen', 'Hucho taimen','taimen'],
        ['Huchen (salmão do Danúbio)', 'Hucho hucho','huchen-danube-salmon'],
        ['Peixe-gato Vundu', 'Heterobranchus longifilis','vundu-catfish'],
        ['Peixe-gato com manteiga', 'Ompok bimaculatus','butter-catfish'],
        ['Peixe-gato de mármore', 'Leiarius marmoratus','marble-catfish'],
        ['Bagre Jaú', 'Zungaro jahu','jau-catfish'],
        ['Surubim Barrado', 'Pseudoplatystoma fasciatum','barred-surubim'],
        ['Surubim malhado', 'Pseudoplatystoma corruscans','spotted-surubim'],
        ['Tucunaré (Borboleta)', 'Cichla ocellaris','peacock-bass-butterfly'],
        ['Peixe Lobo (Trairão)', 'Hoplias aimara','wolf-fish-trairao'],
        ['Brycon de cauda vermelha', 'Brycon melanopterus','redtail-brycon'],
        ['Dólar de Prata (Metynnis)', 'Metynnis lippincottianus','silver-dollar-metynnis']
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
  try { document.dispatchEvent(new Event('enriquecido com bsf-db')); } catch (_) {}
})();
