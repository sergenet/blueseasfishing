/* BlueSeas — species DB enrichment (regions/hotspots + basics)

   - Safe merge: fills missing fields for existing species; adds new ones if absent.

   - Fields used by your gallery: name, sci, env, habitat, baits, season, regions, depth?, alias?, img?

*/

(function(){

  const ENRICHED = [

    // ===== Freshwater — Trout/Salmonids =====

    { name:"Truite arc-en-ciel", slug: "rainbow-trout", sci:"Oncorhynchus mykiss", env:"Freshwater",

      habitat:"Rivières et lacs froids et clairs ; radiers, tailouts, criques.",

      baits:"Filateurs en ligne, cuillères, petites manivelles, vers, œufs de saumon, mouches (nymphes, banderoles)",

      season:"Printemps-Automne ; matins/soirs d'été ; eaux résiduaires d'hiver",

      regions:[

        "Lacs alpins de la Sierra Nevada (CA)", "Deschutes + Metolius (OR)", "Madison + Gallatine (MT)",

        "eaux de queue du fleuve Colorado (Lees Ferry, AZ)", "Affluents des Grands Lacs (MI/NY/PA/ON)"

      ]},

    { name:"Truite brune", slug: "brown-trout", sci:"Salmo trutta", env:"Freshwater",

      habitat:"Des rivières fraîches et couvertes ; sous-coter les banques ; bassins profonds; ruisseaux de source.",

      baits:"Minnow plugs, jerkbaits, spinners, nightcrawlers, streamers",

      season:"Printemps-Automne ; pêche de nuit en été ; eaux résiduaires d'hiver",

      regions:[

        "Ruisseaux de source sans dérive (WI/MN/IA)", "Rivière Blanche (eaux de queue de l'Arkansas)",

        "Pennsylvania limestone streams", "Pierres taillées de l'île du Sud de la Nouvelle-Zélande", "Patagonie (AR/CL)"

      ]},

    { name:"Truite mouchetée", slug: "brook-trout", sci:"Salvelinus fontinalis", env:"Freshwater",

      habitat:"Petits cours supérieurs froids ; étangs de castors; rapides ombragés.",

      baits:"Petites fileuses, mouches sèches, vers, micro-cuillères",

      season:"Fin du printemps – début de l'automne ; midi en haut pays",

      regions:[

        "Sources des Appalaches (NC/VA/WV)", "Étangs des Adirondacks (NY)",

        "ruisseaux de source des Grands Lacs supérieurs", "nature sauvage du Labrador (CA)"

      ]},

    { name:"Truite fardée", slug: "cutthroat-trout", sci:"Oncorhynchus clarkii", env:"Freshwater",

      habitat:"Pierres de taille occidentales, lacs élevés ; coutures lentes, banques coupées.",

      baits:"Mouches sèches (trémies), petites fileuses, cuillères",

      season:"Été-début de l'automne (pic terrestre)",

      regions:[

        "Système de Yellowstone (WY/MT)", "Rivière Snake (WY)", "Hauts lacs de la Sierra (CA)", "Bassin de Flathead (MT)"

      ]},

    { name:"Truite arc-en-ciel", slug: "steelhead", sci:"Oncorhynchus mykiss (anadrome)", env:"Freshwater",

      habitat:"Les courants inférieurs, les queues de courant, les fentes ; la marée en début de saison.",

      baits:"Perles, gabarits sous flotteurs, fileuses, cuillères, mouches balancées",

      season:"Courses d'hiver (de décembre à février) et courses d'été (de juillet à octobre)",

      regions:[

        "Voleur et Umpqua (OR)", "Trinity et Klamath (CA)", "Hoh & Bogachiel (WA)",

        "Affluents des Grands Lacs (MI/NY/PA/ON)"

      ]},

    { name:"Saumon chinook", slug: "chinook-salmon", sci:"Oncorhynchus tshawytscha", env:"Freshwater",

      habitat:"Des passages de marée jusqu'au milieu de la rivière ; fentes profondes pendant la journée.",

      baits:"Montages hareng/anchois, fileuses, bouchons, œufs",

      season:"Courses d'automne ; ressorts dans certains systèmes",

      regions:["Fleuve Columbia (WA/OR)", "Kenai (AK)", "Système de Sacramento (CA)", "Fraser (C.-B.)"]},

    { name:"Saumon coho", slug: "coho-salmon", sci:"Oncorhynchus kisutch", env:"Freshwater",

      habitat:"Piscines plus lentes et bords doux près de la structure.",

      baits:"Spinners, jigs à contraction, petits bouchons, œufs",

      season:"Automne (de septembre à novembre)",

      regions:["Affluents du Puget Sound (WA)", "ruisseaux du sud-est de l'Alaska", "Oregon coastal rivers", "affluents des Grands Lacs"]},



    // ===== Freshwater — Warm/Coolwater =====

    { name:"Achigan à grande bouche", slug: "largemouth-bass", sci:"Micropterus salmoides", env:"Freshwater",

      habitat:"Mauvaises herbes, bois, quais, canaux de ruisseaux ; peu profond au printemps.",

      baits:"Vers Senko, spinnerbaits, jigs + craws, grenouilles, chatterbaits",

      season:"Frai (printemps), surface (aube/crépuscule d'été), chasse à l'ombre en automne",

      regions:["Lac Okeechobee (FL)","Lac Fork (TX)","Guntersville (AL)","Lac Clear (CA)","Sam Rayburn (TX)"]},

    { name:"Achigan à petite bouche", slug: "smallmouth-bass", sci:"Micropterus dolomieu", env:"Freshwater",

      habitat:"Rivières/lacs rocheux ; coutures actuelles; pointes de gravier.",

      baits:"Montages Ned, tubes, jerkbaits, manivelles, marcheurs topwater",

      season:"Frayer à la fin du printemps; bosses profondes en été ; courses d'appâts d'automne",

      regions:["Fleuve Saint-Laurent (NY/ON)","hauts-fonds des Grands Lacs","Susquehanna (PA)","Comté de Door (WI)"]},

    { name:"bar rayé", slug: "striped-bass", sci:"Morone saxatilis", env:"Freshwater",

      habitat:"Points de retenue, canaux fluviaux ; lumières de pont de nuit.",

      baits:"Appâts de natation, bucktails, alose vivante, fantômes de surface",

      season:"Courses de printemps ; morsure de nuit d'été; blitz d'automne",

      regions:["Delta du Sac-San Joaquin (CA)","Lac Texoma (OK/TX)","Rivière Hudson (NY)","Chesapeake tributaries"]},

    { name:"Doré jaune", slug: "walleye", sci:"Sander vitreus", env:"Freshwater",

      habitat:"Points rocheux, lignes de fracture, bords de mauvaises herbes ; mangeoires à faible luminosité.",

      baits:"Jig + vairon, live bait rigs, Crankbaits, Blades",

      season:"Rivières de printemps après le frai ; bosses d'été; morsure de nuit d'automne",

      regions:["Lac Érié (OH/PA/ON)","Lac des Bois (MN/ON)","Fleuve Columbia (État de Washington)","Baie verte (WI)"]},

    { name:"Grand brochet", slug: "northern-pike", sci:"Esox lucius", env:"Freshwater",

      habitat:"Herbiers, baies arrière, embouchures de rivières ; des lieux d'embuscade.",

      baits:"Spinnerbaits, cuillères, jerkbaits, gros swimbaits",

      season:"Dégivrement peu profond ; mauvaises herbes d'été; tomber gros appât",

      regions:["Eaux limitrophes (MN/ON)","Saskatchewan lakes","Alaska sloughs","Irish loughs"]},

    { name:"Maskinongé", slug: "muskellunge", sci:"Esox masquinongy", env:"Freshwater",

      habitat:"Pointes, mauvaises herbes, transitions roche/bois ; suit & figure-8.",

      baits:"Double 10 bucktails, jerkbaits, appâts glissants, caoutchouc",

      season:"Fin du printemps-automne ; fenêtres pour lever/coucher de la lune",

      regions:["Lac Sainte-Claire (MI/ON)","Baie verte (WI)","Saint-Laurent (NY/ON)","Lac Eagle (ON)"]},

    { name:"Bluegill", slug: "bluegill", sci:"Lepomis macrochirus", env:"Freshwater",

      habitat:"Bordures de mauvaises herbes, criques peu profondes, quais ; literie appartements printemps.",

      baits:"Morceaux de vers, petits gabarits, microplastiques, mouches",

      season:"Frai de printemps ; ombre d'été; bassins profonds d'hiver",

      regions:["Étangs/lacs à l'échelle nationale (États-Unis)","Bordures herbeuses des lacs naturels","Étangs agricoles (SE/MW)"]},

    { name:"Marigane noire", slug: "black-crappie", sci:"Pomoxis nigromaculatus", env:"Freshwater",

      habitat:"Tas de broussailles, bois sur pied, quais ; écoles suspendues.",

      baits:"Petits jigs, minnows, micro-crankbaits",

      season:"Regroupement avant le frai (fin de l'hiver), frai (printemps), bancs d'automne",

      regions:["Réservoirs du Mississippi","Lac Kentucky","Minnesota natural lakes","Oklahoma timber reservoirs"]},

    { name:"Poisson-chat de rivière", slug: "channel-catfish", sci:"Ictalurus punctatus", env:"Freshwater",

      habitat:"Trous profonds, coudes extérieurs, enrochements, afflux chauds.",

      baits:"Appâts coupés, appâts puants, foie de poulet, appâts vivants",

      season:"Les nuits d'été ; après les pluies ; trous profonds d'hiver",

      regions:["Rivière Rouge (ND/MN)","Santee Cooper (SC)","Rivière Trinity (TX)","Le fleuve Missouri coule"]},

    { name:"Carpe commune", slug: "common-carp", sci:"Cyprinus carpio", env:"Freshwater",

      habitat:"Vasières peu profondes, baies chaudes, tourbillons de rivières.",

      baits:"Maïs, boules de pâte, pain, bouillettes ; mouches (punaises de la carpe)",

      season:"Fin du printemps–automne (observer les poissons sur les flats)",

      regions:["ports des Grands Lacs","Canaux/rivières du Royaume-Uni et de l'UE","bras morts du fleuve Missouri","Étangs urbains (États-Unis)"]},



    // ===== Saltwater — Inshore/Coastal =====

    { name:"Tambour rouge (sébaste)", slug: "red-drum-redfish", sci:"Sciaenops ocellatus", env:"Saltwater",

      habitat:"Marais, bars à huîtres, flats, surf cuts ; marée mobile.",

      baits:"Cuillères dorées, queues de pagaie + jigs, bouchon à éclater + crevettes, mulet coupé",

      season:"Toute l'année ; courses de taureaux d'automne ; Lacs de retour en hiver",

      regions:["Louisiana marshes","Laguna Madre (TX)","Moustique/Indian River (FL)","ruisseaux de Charleston (SC)"]},

    { name:"Truite de mer tachetée", slug: "spotted-seatrout", sci:"Cynoscion nebulosus", env:"Saltwater",

      habitat:"Plats gazonnés, nids-de-poule, auges, feux de quai.",

      baits:"Plastiques souples, promenade du chien en surface, crevettes sous liège",

      season:"Printemps-Automne ; canaux profonds d'hiver",

      regions:["Baie de Tampa (FL)","Laguna Madre (TX)","Louisiana interior bays","Lagune d'Indian River (FL)"]},

    { name:"Snooker", slug: "snook", sci:"Centropomus undecimalis", env:"Saltwater",

      habitat:"Pointes de mangrove, ponts, passages ; bords de courant.",

      baits:"Queues de pagaie, jerk shads, pinfish/crevettes vivantes, topwater",

      season:"Nuits d'été ; transitions printemps/automne",

      regions:["Plages et criques du sud de la Floride","Dix Mille Îles (FL)","Lagune aux moustiques (FL)","Estuaires du Pacifique du Costa Rica"]},

    { name:"Tarpon", slug: "tarpon", sci:"Megalops atlanticus", env:"Saltwater",

      habitat:"Plages, anses, ponts, chenaux ; bancs de poissons ondulants.",

      baits:"Mulets/crabes vivants, gros swimbaits, mouches",

      season:"Migrations de printemps-été ; juvéniles d'automne dans les ruisseaux",

      regions:["Boca Grande (FL)","Islamorada (clés de Floride)","Côte sud de Porto Rico","Yucatán (MX)"]},

    { name:"Flet du Sud", slug: "southern-flounder", sci:"Paralichthys lethostigma", env:"Saltwater",

      habitat:"Bords de canaux, drains, pointes ; embuscade en bas.",

      baits:"Queues de pagaie + jigs, vairons de boue, crevettes",

      season:"Course d'automne vers les cols ; drains de printemps des marais",

      regions:["Galveston + Sabine (TX)","Baie de Mobile (AL)","Détroit de Pamlico (Caroline du Nord)","région de Charleston (Caroline du Sud)"]},

    { name:"Flétan de Californie", slug: "california-halibut", sci:"Paralichthys californicus", env:"Saltwater",

      habitat:"Plats sablonneux près de la structure ; ports; bords de varech.",

      baits:"Dérive sardine/anchois, swimbaits, bucktails",

      season:"Fin du printemps et de l'été près du littoral ; ports d'hiver",

      regions:["Baie de Santa Monica (CA)","Baie de San Diego (CA)","Baie de Monterey (CA)","Îles Anglo-Normandes (CA)"]},

    { name:"Sériole à queue jaune", slug: "yellowtail-amberjack", sci:"Seriola lalandi dorsalis", env:"Saltwater",

      habitat:"Bordures d'algues, rizières au large, hauts-fonds rocheux.",

      baits:"Sardine vivante sur ligne de mouche, fer de surface, jigs yo-yo",

      season:"Fin du printemps – automne (poussées d'eau chaude)",

      regions:["Catalina/San Clemente (Californie)","Lignes de varech de Basse-Californie","Île de Cedros (MX)","Banques Cortez/43 Fathom (CA)"]},

    { name:"Bar de sable barré", slug: "barred-sand-bass", sci:"Paralabrax nebulifer", env:"Saltwater",

      habitat:"Plages, jetées, criques, lignes de varech ; bords de marée/courant.",

      baits:"Swimbaits en plastique sur têtes plombées, bandes d'anchois, petits fers",

      season:"Toute l'année ; morsure de sable/structure en été",

      regions:["Santa Monica + PV (CA)","Algues de Dana Point à Oceanside (CA)","Jetées de Mission et de la baie de San Diego (CA)"]},

    { name:"Bar blanc", slug: "white-seabass", sci:"Atractoscion nobilis", env:"Saltwater",

      habitat:"Lignes de varech, bancs de calmars, tombants côtiers ; faible luminosité.",

      baits:"Calmars vivants, swimbaits, jigs à pas lent",

      season:"Fin du printemps – début de l’été (frayage des calmars)",

      regions:["Zones de pêche au calmar de Catalina (CA)","Canal de Santa Barbara (CA)","Île de San Clemente (CA)"]},

    { name:"Morue-lingue", slug: "lingcod", sci:"Ophiodon elongatus", env:"Saltwater",

      habitat:"Rochers, corniches, récifs ; forte affinité structurelle.",

      baits:"Jigging métal, gros swimbaits, appâts entiers",

      season:"Les saisons d'ouverture varient ; ressort principal",

      regions:["Récifs côtiers de l'Oregon et de l'État de Washington","Pinacles de Monterey/Carmel (CA)","côte extérieure de la Colombie-Britannique"]},

    { name:"Vivaneau rouge", slug: "red-snapper", sci:"Lutjanus campechanus", env:"Saltwater",

      habitat:"Récifs, épaves et plateformes au large ; de la pleine eau au fond.",

      baits:"Appâts coupés, pinfish vivants, jigs verticaux",

      season:"Réglementé; saisons estivales du Golfe",

      regions:["Plateformes pétrolières du Golfe (TX/LA)","Récifs de Panhandle (FL)","Alabama artificial reefs"]},

    { name:"Mérou bâillonné", slug: "gag-grouper", sci:"Mycteroperca microlepis", env:"Saltwater",

      habitat:"Corniches rocheuses, fond calcaire, épaves ; prédateurs à l'affût.",

      baits:"Pinfish vivants, pêche à la traîne, jigs",

      season:"Automne-hiver près des côtes (fronts froids) ; au large toute l’année",

      regions:["Plateaux sous-marins au large de Tampa Bay (FL)","Big Bend, c'est génial (FL)","Épaves du Golfe (FL/AL)"]},

    { name:"Mahi-mahi (poisson dauphin)", slug: "mahi-mahi-dolphinfish", sci:"Coryphaena hippurus", env:"Saltwater",

      habitat:"Lignes de mauvaises herbes en mer, débris flottants, bordures de courants.",

      baits:"Plumes de pêche à la traîne, ballyhoo, poppers, jigs",

      season:"Fin du printemps–automne (courants chauds)",

      regions:["Bord du Gulf Stream en Floride","Banques extérieures (NC)","Les bords des tranchées de Puerto Rico","Baja offshore paddies"]}

  ];



  function mergeEnrichment(){

    const db = Array.isArray(window.SPECIES_DB) ? window.SPECIES_DB : (window.SPECIES_DB = []);

    const norm = x => String(x||"").toLowerCase().trim();

    const findMatch = (rec) => db.find(s =>

      norm(s.name||s.species) === norm(rec.name) ||

      norm(s.sci||s.scientific_name) === norm(rec.sci)

    );



    ENRICHED.forEach(rec => {

      const m = findMatch(rec);

      if (m){

        // fill only if missing/empty

        ["env","habitat","appâts","saison","profondeur","alias","img"].forEach(k=>{

          if (rec[k] && (!m[k] || (Array.isArray(m[k]) && !m[k].length))) m[k] = rec[k];

        });

        if (rec.regions && (!m.regions || (Array.isArray(m.regions) && !m.regions.length))) m.regions = rec.regions;

      } else {

        db.push({...rec});

      }

    });

  }



  // wait for base DB to exist, then merge

  let tries=0;

  (function wait(){

    if (Array.isArray(window.SPECIES_DB)){ mergeEnrichment(); }

    else if (tries++ < 50){ setTimeout(wait, 100); }

  })();

})();
