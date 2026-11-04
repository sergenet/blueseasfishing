// species-db.expanded.worldwide.js — Worldwide species expansion pack #2
// 60 angling-relevant species sourced/verified against FishBase & IGFA records.
// Self-deduplicating: merges into window.SPECIES_DB, skipping any species whose
// common name or scientific name already exists. Safe to load multiple times.
(function () {
  if (typeof window === 'неопределенный') return;
  window.SPECIES_DB = window.SPECIES_DB || [];

  var GROUPS = [
    {
      env: 'Saltwater',
      habitat: 'Прибрежные воды, рифы, эстуарии или открытый океан — в зависимости от вида.',
      baits: 'Нарезная наживка, живая наживка, джиги и троллинговые приманки, подходящие для целевых видов.',
      season: 'Различаются в зависимости от региона и нормативных актов.',
      fish: [
        // --- Sharks & rays (major angling and ID-misidentification targets) ---
        ['Бычья акула', 'Carcharhinus leucas','bull-shark'],
        ['Тигровая акула', 'Galeocerdo cuvier','tiger-shark'],
        ['Песчаная акула', 'Carcharhinus plumbeus','sandbar-shark'],
        ['Песчаная тигровая акула', 'Carcharias taurus','sand-tiger-shark'],
        ['Лимонная акула', 'Negaprion brevirostris','lemon-shark'],
        ['Медсестра Акула', 'Ginglymostoma cirratum','nurse-shark'],
        ['Акула-молот (отлично)', 'Sphyrna mokarran','hammerhead-shark-great'],
        ['Черноперая акула', 'Carcharhinus limbatus','blacktip-shark'],
        ['Черноперая рифовая акула', 'Carcharhinus melanopterus','blacktip-reef-shark'],
        ['Спиннер Акула', 'Carcharhinus brevipinna','spinner-shark'],
        ['Темная акула', 'Carcharhinus obscurus','dusky-shark'],
        ['Рифовая акула (Карибский бассейн)', 'Carcharhinus perezi','reef-shark-caribbean'],
        ['Серая рифовая акула', 'Carcharhinus amblyrhynchos','grey-reef-shark'],
        ['Ангел Акула', 'Squatina squatina','angel-shark'],
        ['Торнбэк Рэй', 'Raja clavata','thornback-ray'],
        ['Блондинка Рэй', 'Raja brachyura','blonde-ray'],
        ['Малоглазый скат', 'Raja microocellata','small-eyed-ray'],
        ['Волнистый луч', 'Raja undulata','undulate-ray'],
        ['Пятнистый скат', 'Raja montagui','spotted-ray'],
        ['Кукушка Рэй', 'Leucoraja naevus','cuckoo-ray'],
        ['Обычный скейт (Синий скейт)', 'Dipturus batis','common-skate-blue-skate'],
        ['Шагреневый Рэй', 'Leucoraja fullonica','shagreen-ray'],
        ['Орлиный скат (пятнистый)', 'Aetobatus narinari','eagle-ray-spotted'],
        ['Булл Рэй', 'Aetomylaeus bovinus','bull-ray'],
        ['Обыкновенный скат', 'Dasyatis pastinaca','common-stingray'],
        // --- Snappers & IWP reef/tropical saltwater ---
        ['Красный люциан (Северный)', 'Lutjanus campechanus','red-snapper-northern'],
        ['Желтохвостый окунь', 'Ocyurus chrysurus','yellowtail-snapper'],
        ['Кубера Снеппер (Тихий океан)', 'Lutjanus novemfasciatus','cubera-snapper-pacific'],
        ['Красный Император', 'Lutjanus sebae','red-emperor'],
        ['Мангровый Джек', 'Lutjanus argentimaculatus','mangrove-jack'],
        ['Коралловая форель', 'Plectropomus leopardus','coral-trout'],
        ['Запретная коралловая форель', 'Plectropomus maculatus','barred-coral-trout'],
        ['Цветочный роккод', 'Epinephelus fuscoguttatus','flowery-rockcod'],
        ['Малабарский окунь', 'Epinephelus malabaricus','malabar-grouper'],
        ['Голубой Тревалли', 'Caranx melampygus','bluefin-trevally'],
        ['Золотой Тревалли', 'Gnathanodon speciosus','golden-trevally'],
        ['Брасси Тревалли', 'Caranx papuensis','brassy-trevally'],
        ['Черноперый Тревалли', 'Caranx heberi','blacktip-trevally'],
        ['Молочная рыба', 'Chanos chanos','milkfish'],
        ['рыба-петух', 'Nematistius pectoralis','roosterfish'],
        ['Маллоуэй (еврейская рыба)', 'Argyrosomus japonicus','mulloway-jewfish'],
        ['Испанский флаг-луциан', 'Lutjanus carponotatus','spanish-flag-snapper'],
        ['Написанная рыба-кролик', 'Siganus spinus','scribbled-rabbitfish'],
        ['Голденлайн морской лещ', 'Gymnocranius grandoculis','goldenline-seabream'],
        // --- Mediterranean / NE Atlantic inshore ---
        ['Кольцевой морской лещ', 'Diplodus annularis','annular-seabream'],
        ['Двуполосный морской лещ', 'Diplodus vulgaris','two-banded-seabream'],
        ['Белый морской лещ', 'Diplodus sargus','white-seabream'],
        ['Черный морской лещ', 'Spondyliosoma cantharus','black-seabream'],
        ['Салема Порги', 'Sarpa salpa','salema-porgy'],
        ['Чернопятнистый морской лещ', 'Pagellus bogaraveo','blackspot-seabream'],
        ['Подмышечный морской лещ', 'Pagellus acarne','axillary-seabream'],
        ['Полосатая барабулька', 'Mullus surmuletus','striped-red-mullet'],
        ['Барабулька', 'Mullus barbatus','red-mullet'],
        ['Серая кефаль (Тонкогубая)', 'Chelon ramada','grey-mullet-thinlip'],
        ['Золотисто-серая кефаль', 'Chelon auratus','golden-grey-mullet'],
        ['Корб (Барабан Ши)', 'Umbrina cirrosa','corb-shi-drum'],
        ['Расписной гребешок', 'Serranus scriba','painted-comber'],
        ['Камбала (европейская)', 'Platichthys flesus','flounder-european'],
        ['надувшись', 'Trisopterus luscus','pouting'],
        ['Уайтинг', 'Merlangius merlangus','whiting'],
        ['Сарган', 'Belone belone','garfish'],
        ['Большой долгоносик', 'Trachinus draco','greater-weever'],
        ['Ванна Гурнард', 'Chelidonichthys lucerna','tub-gurnard'],
        ['Джон Дори', 'Zeus faber','john-dory'],
        ['Конгерский угорь', 'Conger conger','conger-eel']
      ]
    },
    {
      env: 'Freshwater',
      habitat: 'Реки, озера и заводи, подходящие для каждого вида.',
      baits: 'Подходящие для данного вида приманки, мушки и натуральные наживки.',
      season: 'Различаются в зависимости от региона и нормативных актов.',
      fish: [
        // --- European coarse fish ---
        ['Плотва', 'Rutilus rutilus','roach'],
        ['Радд', 'Scardinius erythrophthalmus','rudd'],
        ['Обыкновенный лещ', 'Abramis brama','common-bream'],
        ['Серебряный лещ', 'Blicca bjoerkna','silver-bream'],
        ['Белоглазый лещ', 'Ballerus sapa','white-eye-bream'],
        ['мрачный', 'Alburnus alburnus','bleak'],
        ['Язь (Орфе)', 'Leuciscus idus','ide-orfe'],
        ['Елец', 'Leuciscus leuciscus','dace'],
        ['Зопе', 'Ballerus ballerus','zope'],
        ['Зиге (сабляй карп)', 'Pelecus cultratus','ziege-sabre-carp'],
        ['Вимба', 'Vimba vimba','vimba'],
        ['Нос', 'Chondrostoma nasus','nase'],
        ['Хариус (европейский)', 'Thymallus thymallus','grayling-european'],
        // --- Predators & exotic freshwater targets ---
        ['Таймень', 'Hucho taimen','taimen'],
        ['Хучен (Дунайский лосось)', 'Hucho hucho','huchen-danube-salmon'],
        ['Сом Вунду', 'Heterobranchus longifilis','vundu-catfish'],
        ['Масляный сом', 'Ompok bimaculatus','butter-catfish'],
        ['Мраморный сом', 'Leiarius marmoratus','marble-catfish'],
        ['Джау-сом', 'Zungaro jahu','jau-catfish'],
        ['Запретный Сурубим', 'Pseudoplatystoma fasciatum','barred-surubim'],
        ['Пятнистый Сурубим', 'Pseudoplatystoma corruscans','spotted-surubim'],
        ['Павлиний окунь (Бабочка)', 'Cichla ocellaris','peacock-bass-butterfly'],
        ['Рыба-волк (Трайрао)', 'Hoplias aimara','wolf-fish-trairao'],
        ['Редтейл Брайкон', 'Brycon melanopterus','redtail-brycon'],
        ['Серебряный доллар (Метиннис)', 'Metynnis lippincottianus','silver-dollar-metynnis']
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
  try { document.dispatchEvent(new Event('обогащенный bsf-db')); } catch (_) {}
})();
