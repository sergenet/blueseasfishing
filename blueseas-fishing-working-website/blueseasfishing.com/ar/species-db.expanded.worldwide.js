// species-db.expanded.worldwide.js — Worldwide species expansion pack #2
// 60 angling-relevant species sourced/verified against FishBase & IGFA records.
// Self-deduplicating: merges into window.SPECIES_DB, skipping any species whose
// common name or scientific name already exists. Safe to load multiple times.
(function () {
  if (typeof window === 'غير محدد') return;
  window.SPECIES_DB = window.SPECIES_DB || [];

  var GROUPS = [
    {
      env: 'Saltwater',
      habitat: 'المياه الساحلية، والشعاب المرجانية، ومصبات الأنهار، أو المحيط المفتوح حسب النوع',
      baits: 'قطع الطُعم، والطُعم الحي، والرقص، وطُعم التصيد المناسب للأنواع المستهدفة',
      season: 'يختلف ذلك باختلاف المنطقة واللوائح',
      fish: [
        // --- Sharks & rays (major angling and ID-misidentification targets) ---
        ['الثور القرش', 'Carcharhinus leucas','bull-shark'],
        ['النمر القرش', 'Galeocerdo cuvier','tiger-shark'],
        ['القرش الرملي', 'Carcharhinus plumbeus','sandbar-shark'],
        ['قرش النمر الرملي', 'Carcharias taurus','sand-tiger-shark'],
        ['قرش الليمون', 'Negaprion brevirostris','lemon-shark'],
        ['ممرضة القرش', 'Ginglymostoma cirratum','nurse-shark'],
        ['قرش رأس المطرقة (كبير)', 'Sphyrna mokarran','hammerhead-shark-great'],
        ['القرش الأسود', 'Carcharhinus limbatus','blacktip-shark'],
        ['بلاكتيب ريف القرش', 'Carcharhinus melanopterus','blacktip-reef-shark'],
        ['سبينر القرش', 'Carcharhinus brevipinna','spinner-shark'],
        ['القرش الداكن', 'Carcharhinus obscurus','dusky-shark'],
        ['قرش الشعاب المرجانية (البحر الكاريبي)', 'Carcharhinus perezi','reef-shark-caribbean'],
        ['قرش الشعاب المرجانية الرمادية', 'Carcharhinus amblyrhynchos','grey-reef-shark'],
        ['ملاك القرش', 'Squatina squatina','angel-shark'],
        ['ثورنباك راي', 'Raja clavata','thornback-ray'],
        ['راي شقراء', 'Raja brachyura','blonde-ray'],
        ['راي صغير العينين', 'Raja microocellata','small-eyed-ray'],
        ['متموج راي', 'Raja undulata','undulate-ray'],
        ['رصدت راي', 'Raja montagui','spotted-ray'],
        ['راي الوقواق', 'Leucoraja naevus','cuckoo-ray'],
        ['التزلج المشترك (التزلج الأزرق)', 'Dipturus batis','common-skate-blue-skate'],
        ['شاجرين راي', 'Leucoraja fullonica','shagreen-ray'],
        ['راي النسر (مرقط)', 'Aetobatus narinari','eagle-ray-spotted'],
        ['بول راي', 'Aetomylaeus bovinus','bull-ray'],
        ['اللادغة المشتركة', 'Dasyatis pastinaca','common-stingray'],
        // --- Snappers & IWP reef/tropical saltwater ---
        ['النهاش الأحمر (الشمالي)', 'Lutjanus campechanus','red-snapper-northern'],
        ['سمك النهاش ذو الذيل الأصفر', 'Ocyurus chrysurus','yellowtail-snapper'],
        ['كوبرا سنابر (المحيط الهادئ)', 'Lutjanus novemfasciatus','cubera-snapper-pacific'],
        ['الإمبراطور الأحمر', 'Lutjanus sebae','red-emperor'],
        ['مانغروف جاك', 'Lutjanus argentimaculatus','mangrove-jack'],
        ['تراوت المرجان', 'Plectropomus leopardus','coral-trout'],
        ['سمك السلمون المرجاني المحظور', 'Plectropomus maculatus','barred-coral-trout'],
        ['روك كود منمق', 'Epinephelus fuscoguttatus','flowery-rockcod'],
        ['مالابار الهامور', 'Epinephelus malabaricus','malabar-grouper'],
        ['بلوفين تريفالي', 'Caranx melampygus','bluefin-trevally'],
        ['جولدن تريفالي', 'Gnathanodon speciosus','golden-trevally'],
        ['براسي تريفالي', 'Caranx papuensis','brassy-trevally'],
        ['بلاكتيب تريفالي', 'Caranx heberi','blacktip-trevally'],
        ['سمك اللبن', 'Chanos chanos','milkfish'],
        ['سمكة الديك', 'Nematistius pectoralis','roosterfish'],
        ['مولواي (يهودية)', 'Argyrosomus japonicus','mulloway-jewfish'],
        ['نهاش العلم الاسباني', 'Lutjanus carponotatus','spanish-flag-snapper'],
        ['خربشات أرنبفيش', 'Siganus spinus','scribbled-rabbitfish'],
        ['الدنيس الذهبي', 'Gymnocranius grandoculis','goldenline-seabream'],
        // --- Mediterranean / NE Atlantic inshore ---
        ['الدنيس الحلقي', 'Diplodus annularis','annular-seabream'],
        ['الدنيس ذو النطاقين', 'Diplodus vulgaris','two-banded-seabream'],
        ['الدنيس الأبيض', 'Diplodus sargus','white-seabream'],
        ['الدنيس الأسود', 'Spondyliosoma cantharus','black-seabream'],
        ['سليمة بورجي', 'Sarpa salpa','salema-porgy'],
        ['بقعة سوداء الدنيس', 'Pagellus bogaraveo','blackspot-seabream'],
        ['الدنيس الإبطي', 'Pagellus acarne','axillary-seabream'],
        ['البوري الأحمر المخطط', 'Mullus surmuletus','striped-red-mullet'],
        ['البوري الأحمر', 'Mullus barbatus','red-mullet'],
        ['البوري الرمادي (Thinlip)', 'Chelon ramada','grey-mullet-thinlip'],
        ['البوري الرمادي الذهبي', 'Chelon auratus','golden-grey-mullet'],
        ['كورب (شي طبل)', 'Umbrina cirrosa','corb-shi-drum'],
        ['مشط مطلي', 'Serranus scriba','painted-comber'],
        ['السمك المفلطح (الأوروبي)', 'Platichthys flesus','flounder-european'],
        ['العبوس', 'Trisopterus luscus','pouting'],
        ['البياض', 'Merlangius merlangus','whiting'],
        ['جارفيش', 'Belone belone','garfish'],
        ['ويفر الكبرى', 'Trachinus draco','greater-weever'],
        ['حوض جورنارد', 'Chelidonichthys lucerna','tub-gurnard'],
        ['جون دوري', 'Zeus faber','john-dory'],
        ['ثعبان البحر كونجر', 'Conger conger','conger-eel']
      ]
    },
    {
      env: 'Freshwater',
      habitat: 'الأنهار والبحيرات والمياه الراكدة المناسبة لكل نوع',
      baits: 'الطعوم والذباب والطعوم الطبيعية المناسبة للأنواع',
      season: 'يختلف ذلك باختلاف المنطقة واللوائح',
      fish: [
        // --- European coarse fish ---
        ['روتش', 'Rutilus rutilus','roach'],
        ['رود', 'Scardinius erythrophthalmus','rudd'],
        ['الدنيس المشترك', 'Abramis brama','common-bream'],
        ['الدنيس الفضي', 'Blicca bjoerkna','silver-bream'],
        ['الدنيس ذو العين البيضاء', 'Ballerus sapa','white-eye-bream'],
        ['كئيب', 'Alburnus alburnus','bleak'],
        ['إيدي (أورفي)', 'Leuciscus idus','ide-orfe'],
        ['الداس', 'Leuciscus leuciscus','dace'],
        ['زوبي', 'Ballerus ballerus','zope'],
        ['زيج (صابر الكارب)', 'Pelecus cultratus','ziege-sabre-carp'],
        ['فيمبا', 'Vimba vimba','vimba'],
        ['ناس', 'Chondrostoma nasus','nase'],
        ['جرايلينج (الأوروبية)', 'Thymallus thymallus','grayling-european'],
        // --- Predators & exotic freshwater targets ---
        ['تيمين', 'Hucho taimen','taimen'],
        ['هوشن (سلمون الدانوب)', 'Hucho hucho','huchen-danube-salmon'],
        ['سمك السلور فوندو', 'Heterobranchus longifilis','vundu-catfish'],
        ['سمك السلور بالزبدة', 'Ompok bimaculatus','butter-catfish'],
        ['سمك السلور الرخامي', 'Leiarius marmoratus','marble-catfish'],
        ['جو السلور', 'Zungaro jahu','jau-catfish'],
        ['منعت سوروبيم', 'Pseudoplatystoma fasciatum','barred-surubim'],
        ['رصدت السوروبيم', 'Pseudoplatystoma corruscans','spotted-surubim'],
        ['الطاووس باس (الفراشة)', 'Cichla ocellaris','peacock-bass-butterfly'],
        ['وولف فيش (ترايراو)', 'Hoplias aimara','wolf-fish-trairao'],
        ['ريدتيل بريكون', 'Brycon melanopterus','redtail-brycon'],
        ['الدولار الفضي (ميتينيس)', 'Metynnis lippincottianus','silver-dollar-metynnis']
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
  try { document.dispatchEvent(new Event('bsf-ديسيبل المخصب')); } catch (_) {}
})();
