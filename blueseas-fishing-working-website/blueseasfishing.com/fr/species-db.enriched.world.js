/* BlueSeas — World enrichment pack (multiregion)

   Safe merge: fills missing fields; adds new species if not present.

   Fields: name, sci, env, habitat, baits, season, regions, depth?, alias?, img?

*/

(function(){

  const ENRICHED = [

    // ===== North America — Freshwater (adds or fills) =====

    {name:"Touladi", slug: "lake-trout", sci:"Salvelinus namaycush", env:"Freshwater",

     habitat:"Lacs profonds et froids ; bassins du lac principal, bosses, pointes.",

     baits:"Tubes à jigging, swimbaits, cuillères, appâts morts",

     season:"Saison des glaces profonde ; printemps peu profond; thermocline d'été",

     regions:["Grands Lacs (MI/ON)", "Gorge Flamboyante (UT/WY)", "Lacs du Bouclier ontarien", "Lac Tahoe (CA/NV)"]},



    {name:"Saumon kokani", slug: "kokanee-salmon", sci:"Oncorhynchus nerka (enclavé)", env:"Freshwater",

     habitat:"Pélagique, scolarisé sur des bassins profonds ; thermocline estivale.",

     baits:"Dodger + hoochie/maïs, petites cuillères",

     season:"Printemps-Été",

     regions:["Gorge Flamboyante (UT/WY)", "Wallowa (Oregon)", "Débandade (Californie)", "lacs intérieurs de la Colombie-Britannique"]},



    {name:"Saumon rouge", slug: "sockeye-salmon", sci:"Oncorhynchus nerka", env:"Freshwater",

     habitat:"Rivières + lacs lors des courses ; exutoires du lac.",

     baits:"Mouches (éparses de type bonefish), petites cuillères",

     season:"Summer runs",

     regions:["Baie de Bristol (AK)", "Système Fraser (C.-B.)"]},



    {name:"Saumon rose", slug: "pink-salmon", sci:"Oncorhynchus gorbuscha", env:"Freshwater",

     habitat:"Marée vers les rivières inférieures ; voies de circulation près du rivage.",

     baits:"Petites cuillères, essoreuses, gabarits",

     season:"Courses d'été des années impaires (nombreuses régions)",

     regions:["Puget Sound (État de Washington)", "Sud-Est de l'Alaska", "rivières côtières de la Colombie-Britannique"]},



    {name:"Saumon kéta", slug: "chum-salmon", sci:"Oncorhynchus keta", env:"Freshwater",

     habitat:"Rivières inférieures, marécages de marée.",

     baits:"Jigs, fileuses, mouches flashy",

     season:"Late fall",

     regions:["Sud-Est de l'Alaska", "Puget Sound (État de Washington)", "rivières de la Colombie-Britannique"]},



    {name:"Truite à tête plate", slug: "bull-trout", sci:"Salvelinus confluentus", env:"Freshwater",

     habitat:"Systèmes fluviaux froids et interconnectés ; migrateurs ; bassins profonds.",

     baits:"Grands streamers, swimbaits, cuillères",

     season:"Printemps-automne (là où c'est ouvert)",

     regions:["rivières de l'Alberta et de la Colombie-Britannique", "systèmes Idaho/Montana"]},



    {name:"Ombre arctique", slug: "arctic-grayling", sci:"Thymallus arcticus", env:"Freshwater",

     habitat:"Rivières/lacs clairs et froids ; rapides et bassins.",

     baits:"Mouches sèches, petites cuillères, micro cuillères",

     season:"Été-début d'automne",

     regions:["Alaska interior", "Territoires du Nord-Ouest/Yukon", "Montana high country"]},



    {name:"Marigane blanche", slug: "white-crappie", sci:"Pomoxis annularis", env:"Freshwater",

     habitat:"Bois de broussailles/sur pied ; réservoirs tachés.",

     baits:"Petits gabarits, vairons, lames",

     season:"Rassemblement avant la ponte à la fin de l'hiver ; frai printanier; écoles d'automne",

     regions:["Mississippi reservoirs", "Oklahoma lakes", "Lac Kentucky"]},



    {name:"Perchaude", slug: "yellow-perch", sci:"Perca flavescens", env:"Freshwater",

     habitat:"Bordures de mauvaises herbes, replats de moyenne profondeur, bancs de bassin.",

     baits:"Petits gabarits, cuillères, ménés",

     season:"Toute l'année ; glace de qualité et printemps/automne",

     regions:["Lacs du Haut-Midwest", "Lac Simcoe (ON)"]},



    {name:"Poisson-chat bleu", slug: "blue-catfish", sci:"Ictalurus furcatus", env:"Freshwater",

     habitat:"Grandes rivières ; rebords de canal ; barrages.",

     baits:"Alose coupée, bonite, appât vivant",

     season:"Morsure de nuit d'été ; trous profonds d'hiver",

     regions:["James River (Virginie)", "Fleuve Mississippi", "Santee Cooper (SC)"]},



    {name:"Poisson-chat à tête plate", slug: "flathead-catfish", sci:"Pylodictis olivaris", env:"Freshwater",

     habitat:"Embouteillages, trous profonds, virages extérieurs.",

     baits:"crapet arlequin/alose vivants ; gros appâts de rivière",

     season:"Mois chauds (nuit); jour d'automne en courant",

     regions:["Réservoirs/rivières du Kansas", "Rivière Ohio", "Canaux AZ (introduits)"]},



    {name:"Gar alligator", slug: "alligator-gar", sci:"Atractosteus spatula", env:"Freshwater",

     habitat:"Backwaters, bayous, rivières lentes.",

     baits:"Appâts vivants/coupés ; leurres à corde (enchevêtrement des dents)",

     season:"Warm months",

     regions:["Rivière Trinity (TX)", "bayous côtiers du Texas et de la Louisiane"]},



    {name:"Brochet maillé", slug: "chain-pickerel", sci:"Esox niger", env:"Freshwater",

     habitat:"Baies herbeuses, marigots.",

     baits:"Spinnerbaits, cuillères, jerkbaits",

     season:"Printemps-Automne ; l'hiver dans le Sud",

     regions:["étangs/lacs du sud-est des États-Unis", "Les criques de marée du centre de l'Atlantique"]},



    // ===== NA — Inshore/Coastal =====

    {name:"Tambour noir", slug: "black-drum", sci:"Pogonias cromis", env:"Saltwater",

     habitat:"Bars à huîtres, canaux, coupes de surf ; jetées.",

     baits:"Crabe, crevette, appât coupé ; gabarits",

     season:"Toute l'année ; le gros tambour du printemps tourne",

     regions:["Laguna Madre (TX)", "Louisiana marshes", "Lagune aux moustiques (FL)", "Banques extérieures (NC)"]},



    {name:"Tête de mouton", slug: "sheepshead", sci:"Archosargus probatocephalus", env:"Saltwater",

     habitat:"Pilotis, jetées, parcs à huîtres.",

     baits:"Crabes violonistes, crevettes, balanes",

     season:"Pointe de la fin de l'hiver et du printemps",

     regions:["Ponts/embouchures de Floride", "Louisiana marshes", "jetées du Texas"]},



    {name:"Bar Noir", slug: "black-sea-bass", sci:"Centropristis striata", env:"Saltwater",

     habitat:"Épaves/récifs côtiers, corniches.",

     baits:"Jigs, lanières de calamars, palourdes",

     season:"Printemps-automne (la profondeur change avec la température)",

     regions:["Récifs du New Jersey et du Massachusetts", "Épaves de Chesapeake/Virginie"]},



    {name:"Tautog (poisson noir)", slug: "tautog-blackfish", sci:"Tautoga onitis", env:"Saltwater",

     habitat:"Des roches, des épaves, des jetées.",

     baits:"Crabes verts, crabes asiatiques aux jigs",

     season:"Prime du printemps et de la fin de l'automne",

     regions:["Épaves/récifs de RI/CT/NY", "jetées du New Jersey"]},



    {name:"Poisson bleu", slug: "bluefish", sci:"Pomatomus saltatrix", env:"Saltwater",

     habitat:"Surfez sur des rips, des criques, des blitz sur des bancs d'appâts.",

     baits:"Métaux, eaux de surface, nageurs ; couper l'appât",

     season:"Migrations printemps-automne",

     regions:["Surf NY–MA", "NJ déchire", "Banques extérieures (NC)"]},



    {name:"Maquereau atlantique", slug: "atlantic-mackerel", sci:"Scomber scombrus", env:"Saltwater",

     habitat:"Écoles côtières/au large ; bordures de structures.",

     baits:"Sabikis, petits métaux, plumes",

     season:"Printemps-début d'été",

     regions:["Golfe du Maine", "Côtes du Royaume-Uni et d'Irlande (également incluses dans le pack UE)"]},



    {name:"Faux germon (petit thon)", slug: "false-albacore-little-tunny", sci:"Euthynnus alletteratus", env:"Saltwater",

     habitat:"Attaques éclair près des côtes sur des alevins de verre ; courants de retour.",

     baits:"Jigs époxy, métaux, petites mouches",

     season:"Fin d'été – automne",

     regions:["Cape Cod–NJ (course d'automne)", "Banques extérieures (NC)"]},



    {name:"Tête de mouton de Californie", slug: "california-sheephead", sci:"Semicossyphus pulcher", env:"Saltwater",

     habitat:"Bancs de varech, récifs, structures rocheuses.",

     baits:"Crabs/shrimp, squid; jigs",

     season:"Toute l'année (idéalement en été/automne)",

     regions:["Lignes de varech du sud de la Californie", "Îles Anglo-Normandes (CA)"]},



    {name:"Varech (Calico) Bass", slug: "kelp-calico-bass", sci:"Paralabrax clathratus", env:"Saltwater",

     habitat:"Bordures de varech, rochers de chaudière, ports.",

     baits:"Swimbaits, fers de surface, plastiques",

     season:"Fin du printemps–automne",

     regions:["Catalina/Palos Verdes (CA)", "Algues de La Jolla (CA)"]},



    {name:"Sébaste vermillon", slug: "vermilion-rockfish", sci:"Sebastes miniatus", env:"Saltwater",

     habitat:"Récifs/rebords profonds ; fond dur.",

     baits:"Jigs, bas de ligne appâts, slow-pitch",

     season:"Open seasons vary",

     regions:["Monterey/Carmel (Californie)", "Récifs de l'Oregon et de l'État de Washington"]},



    {name:"Cabezon", slug: "cabezon", sci:"Scorpaenichthys marmoratus", env:"Saltwater",

     habitat:"Récifs rocheux peu profonds, poches de varech.",

     baits:"Jigs avec appâts, swimbaits",

     season:"Rockfish seasons",

     regions:["Centre/Nord de la Californie, Oregon, Washington"]},



    // ===== Offshore — Pelagics (global use) =====

    {name:"Thon à nageoires jaunes", slug: "yellowfin-tuna", sci:"Thunnus albacares", env:"Saltwater",

     habitat:"Eau bleue, ruptures de température, bords de courant.",

     baits:"Plumes de pêche à la traîne, bouchons de cèdre, poppers, appâts vivants",

     season:"Mois d'eau chaude ; migrations saisonnières",

     regions:["Au large de la Californie du Sud/Baja", "Gulf Stream de Floride", "Île des Canaries", "bancs de l'océan Indien"]},



    {name:"Thon rouge", slug: "bluefin-tuna", sci:"Thunnus thynnus", env:"Saltwater",

     habitat:"Concentrations d'appâts en mer ; bords des étagères.",

     baits:"Stickbaits, poppers, jigs, appâts vivants ; propagation à la traîne",

     season:"Varie (printemps-automne en NA/UE)",

     regions:["Cap Cod/Golfe du Maine", "Banques extérieures (NC)", "Méditerranéenne"]},



    {name:"Wahou", slug: "wahoo", sci:"Acanthocybium solandri", env:"Saltwater",

     habitat:"Descentes abruptes, des passages de structures à grande vitesse.",

     baits:"Pêche à la traîne à grande vitesse, plongeurs profonds, jigs",

     season:"Saisons chaudes ; marées lunaires",

     regions:["Bahamas/Détroit de Floride", "Baja peninsula", "Hawaii ledges"]},



    {name:"Marlin bleu", slug: "blue-marlin", sci:"Makaira nigricans", env:"Saltwater",

     habitat:"Eau d'un bleu profond près des monts sous-marins ; concentrations d'appâts.",

     baits:"Leurres à la traîne, teasers + pitch baits",

     season:"Saisons chaudes tropicales/subtropicales",

     regions:["Açores", "Madère", "Gulf Stream, Bahamas", "Cabo San Lucas (MX)"]},



    {name:"Voilier", slug: "sailfish", sci:"Istiophorus platypterus", env:"Saltwater",

     habitat:"Bordures/lignes de mauvaises herbes ; écoles d'appâts; changements de couleur.",

     baits:"Ballyhoo à la traîne, teasers de drague, appâts de pitch",

     season:"Hiver FL/Caraïbes ; saisonnier ailleurs",

     regions:["Palm Beach–Islamorada (FL)", "Guatemala", "Costa Rica Pacifique"]},



    {name:"Espadon", slug: "swordfish", sci:"Xiphias gladius", env:"Saltwater",

     habitat:"Structure en chute profonde ; migrations verticales diurnes.",

     baits:"Calmars profonds, tactiques de bouée/dérive",

     season:"Nuit d'été ; journée en forte baisse toute l'année dans certaines régions",

     regions:["Les Keys de Floride", "canyons du sud de la Californie", "Med canyons"]},



    // ===== Europe (fresh + salt) =====

    {name:"Saumon de l'Atlantique", slug: "atlantic-salmon", sci:"Salmo salar", env:"Freshwater",

     habitat:"Rapides, bassins, courants ; des rivières à saumon classiques.",

     baits:"Mouche (ailes de cheveux, tubes), fileuses, cuillères",

     season:"Varie selon le fleuve ; printemps-automne",

     regions:["Norvège Gaula", "Écosse Spey/Dee", "Iceland rivers", "Kola russe"]},



    {name:"Sandre", slug: "zander", sci:"Sander lucioperca", env:"Freshwater",

     habitat:"Rivières lentes et lacs profonds ; structure/bords.",

     baits:"Shads jiggés, Crankbaits, Appâts vivants",

     season:"Printemps-automne ; nuit d'été",

     regions:["Bassins de la Baltique, de l'Elbe et du Danube", "Réservoirs du Royaume-Uni (remplis)"]},



    {name:"Perche européenne", slug: "european-perch", sci:"Perca fluviatilis", env:"Freshwater",

     habitat:"Bordures d'herbiers, jetées, canaux ; bancs de prédateurs.",

     baits:"Petits plastiques souples, spinners, dropshot",

     season:"Toute l'année ; idéal au printemps et en automne",

     regions:["Canaux/lacs du Royaume-Uni", "Scandinavia lakes", "fleuves d'Europe centrale"]},



    {name:"Tanche", slug: "tench", sci:"Tinca tinca", env:"Freshwater",

     habitat:"Eaux stagnantes envahies par la végétation ; berges ; activité durant les mois chauds.",

     baits:"Vers, maïs, pain, bouillettes (method feeder)",

     season:"Fin du printemps-été",

     regions:["Eaux calmes et canaux du Royaume-Uni et de l'Union européenne"]},



    {name:"Barbillon", slug: "barbel", sci:"Barbus barbus", env:"Freshwater",

     habitat:"Cours de gravier, rivières rapides ; au fond.",

     baits:"Pellets, bouillettes, viande, fromage ; plates-formes d'alimentation",

     season:"Été-automne",

     regions:["Rivière Wye/Trent/Severn (Royaume-Uni)", "Rhin/Seine/Danube"]},



    {name:"Méné européen", slug: "european-chub", sci:"Squalius cephalus", env:"Freshwater",

     habitat:"Rivières couvertes ; berges ; bassins sous pont.",

     baits:"Pain, vers, petits leurres, mouches",

     season:"Toute l'année ; pêche à vue en eau peu profonde et claire",

     regions:["Fleuves et canaux du Royaume-Uni et de l'Union européenne"]},



    {name:"Bar européen", slug: "european-seabass", sci:"Dicentrarchus labrax", env:"Saltwater",

     habitat:"Plages de surf, estuaires, marques rocheuses.",

     baits:"Plastiques souples, bouchons de surface, métaux, appâts",

     season:"Fin du printemps – automne",

     regions:["Côtes atlantiques du Royaume-Uni, d'Irlande et de France", "Mediterranean harbors"]},



    {name:"Dorade royale", slug: "gilthead-seabream", sci:"Sparus aurata", env:"Saltwater",

     habitat:"Baies rocheuses/sableuses méditerranéennes ; ports.",

     baits:"Crabe, crevettes, crustacés ; petits gabarits",

     season:"Warm months",

     regions:["Côtes d'Espagne, d'Italie et de Grèce"]},



    {name:"Morue franche", slug: "atlantic-cod", sci:"Gadus morhua", env:"Saltwater",

     habitat:"Bancs, épaves, récifs ; eau plus froide.",

     baits:"Jigs, appâts (palourdes/calmars), pirks",

     season:"Hiver-printemps dans de nombreuses régions",

     regions:["Norway fjords", "Islande", "Épaves de la mer du Nord britannique"]},



    {name:"Lieu jaune", slug: "pollack", sci:"Pollachius pollachius", env:"Saltwater",

     habitat:"Marques rocheuses couvertes d'algues, épaves ; chasseurs en pleine eau.",

     baits:"Shads sur têtes plombées, métaux",

     season:"printemps-automne",

     regions:["Côte atlantique du Royaume-Uni/Irlande", "Bretagne"]},



    {name:"Turbot", slug: "turbot", sci:"Scophthalmus maximus", env:"Saltwater",

     habitat:"Bancs de sable près des courants de marée ; plages de surf.",

     baits:"Lanières de poisson, lançons; traîner des cuillères",

     season:"Printemps-été",

     regions:["Bancs de la mer du Nord", "Biscay beaches"]},



    // ===== Australia / New Zealand / Pacific =====

    {name:"Barramundi", slug: "barramundi", sci:"Lates calcarifer", env:"Brackish",

     habitat:"chenaux de mangrove, embâcles, drains ; retenues d'eau.",

     baits:"Corps durs, vibrations douces, swimbaits ; mulet vivant",

     season:"Formation de bassins de retenue pendant la saison des pluies tropicales ; retenues d'eau permanentes",

     regions:["chenaux de marée NT/QLD (AU)", "Les billabongs de Kakadu (AU)", "Barrages du Top End"]},



    {name:"Morue de Murray", slug: "murray-cod", sci:"Maccullochella peelii", env:"Freshwater",

     habitat:"Gros obstacles en rivière, bancs de rochers ; attaques surprises.",

     baits:"Gros swimbaits, wakebaits, spinnerbaits",

     season:"Fermé au printemps (AU) ; période idéale en été et en automne",

     regions:["Bassin Murray-Darling (AU)"]},



    {name:"Basse australienne", slug: "australian-bass", sci:"Macquaria novemaculeata", env:"Freshwater",

     habitat:"Rivières de la côte est ; obstacles/rapides ; saumâtres en hiver.",

     baits:"Marcheurs de surface, spinnerbaits, plastiques",

     season:"surface estivale ; bancs d'eau saumâtre en hiver",

     regions:["Rivières NSW/QLD (AU)"]},



    {name:"Tête plate sombre", slug: "dusky-flathead", sci:"Platycephalus fuscus", env:"Saltwater",

     habitat:"Bancs de sable d'estuaire, chenaux, dénivellations ; tactique de l'affût.",

     baits:"Plastiques souples, vibes, leurres à crevettes",

     season:"printemps-automne",

     regions:["Estuaires de la Nouvelle-Galles du Sud et du Queensland (Australie)"]},



    {name:"Vivaneau (australasien)", slug: "snapper-australasian", sci:"Pagrus auratus", env:"Saltwater",

     habitat:"Récifs, bancs de moules, chenaux ; bancs d'appâts.",

     baits:"Softbaits, micro-jigs, ledger rigs",

     season:"Frai printanier ; activités automnales",

     regions:["Golfe d'Hauraki (Nouvelle-Zélande)", "Récifs SA/VIC (AU)"]},



    {name:"Kingfish à queue jaune", slug: "yellowtail-kingfish", sci:"Seriola lalandi", env:"Saltwater",

     habitat:"Épingles, bords de courant, corniches de varech.",

     baits:"Appâts vivants, stickbaits de surface, jigs",

     season:"Été-automne",

     regions:["Baie des Îles (Nouvelle-Zélande)", "Côte sud de la Nouvelle-Galles du Sud (Australie)"]},



    {name:"Carangue géante (GT)", slug: "giant-trevally-gt", sci:"Caranx ignobilis", env:"Saltwater",

     habitat:"Bords de récifs, patates de corail, spots de surf.",

     baits:"Gros poppers, stickbaits, jigs",

     season:"Tropical warm months",

     regions:["atolls de la mer de Corail", "Maldives", "Seychelles"]},



    {name:"Maquereau espagnol", slug: "spanish-mackerel", sci:"Scomberomorus commerson", env:"Saltwater",

     habitat:"Caps, pointes de récifs, bancs d'appâts.",

     baits:"Vairons à la traîne, tranches de métal, appâts vivants",

     season:"Warm months",

     regions:["Queensland/Australie du Nord", "PNG/Indonésie"]},



    // ===== Asia =====

    {name:"Mahsir (doré)", slug: "mahseer-golden", sci:"Tor putitora", env:"Freshwater",

     habitat:"Rivières de piémont ; courants rapides/bassins ; migratrices.",

     baits:"Cuillères, essoreuses, bouchons ; pâte/appâts dans certaines régions",

     season:"Baisse post-mousson ; ciel dégagé au creux hivernal",

     regions:["fleuves de l'Himalaya indien", "Nepal foothills"]},



    {name:"Tête de serpent (géant)", slug: "snakehead-giant", sci:"Channa micropeltes", env:"Freshwater",

     habitat:"Lacs/canaux envahis par les herbes aquatiques ; prédateur à l'affût.",

     baits:"Grenouilles, buzzbaits, swimbaits ; appât vivant",

     season:"Hautes eaux en saison humide ; pêche à vue en période d'étiage",

     regions:["Réservoirs de Malaisie/Thaïlande", "Borneo lakes"]},



    {name:"Rohu", slug: "rohu", sci:"Labeo rohita", env:"Freshwater",

     habitat:"Grands fleuves, étangs, réservoirs.",

     baits:"Pâte/attas, maïs, pain ; mangeoires de méthode",

     season:"Mois chauds ; dépend de la mousson",

     regions:["Bassin du Gange (IN/BD)", "Pakistan canals"]},



    {name:"Poisson-chat géant du Mékong", slug: "giant-mekong-catfish", sci:"Pangasianodon gigas", env:"Freshwater",

     habitat:"Grands chenaux fluviaux ; trous profonds ; réservoirs (empoissonnés).",

     baits:"Méthodes avec granulés/amorces ; vivre/couper dans certaines régions",

     season:"Variable ; souvent les mois chauds",

     regions:["Bassin du Mékong (TH/LA/VN/CN)"]},



    {name:"Carpe siamoise", slug: "siamese-carp", sci:"Catlocarpio siamensis", env:"Freshwater",

     habitat:"Plaines inondables, réservoirs (remplis).",

     baits:"Bouillettes/granulés/méthode ; matériel lourd",

     season:"Warm months",

     regions:["réservoirs/pêcheries thaïlandais"]},



    // ===== Africa =====

    {name:"Perche du Nil", slug: "nile-perch", sci:"Lates niloticus", env:"Freshwater",

     habitat:"Structure du lac/de la rivière, dénivellations ; embuscade.",

     baits:"Swimbaits profonds, appâts vivants, bouchons de pêche à la traîne",

     season:"Saisons sèches ; faible luminosité",

     regions:["Lac Victoria (EA)", "Lac Nasser (EG)"]},



    {name:"Poisson-tigre", slug: "tigerfish", sci:"Hydrocynus vittatus", env:"Freshwater",

     habitat:"Rivières rapides ; bancs de sable/tourbillons ; eaux claires.",

     baits:"Spinners, cuillères, ménés ; chefs de fil",

     season:"Saison sèche (débits plus faibles et plus clairs)",

     regions:["Zambèze, Okavango (BW/NA/ZM)"]},



    {name:"Poisson jaune (petite bouche)", slug: "yellowfish-smallmouth", sci:"Labeobarbus aeneus", env:"Freshwater",

     habitat:"Rifles/courants ; pêche à vue ; pêche à la mouche/au leurre.",

     baits:"Nymphes, petites manivelles, plastiques mous",

     season:"printemps-automne",

     regions:["Rivière Vaal (ZA)"]},



    {name:"Galjoen", slug: "galjoen", sci:"Dichistius capensis", env:"Saltwater",

     habitat:"Surfeurs sud-africains : rochers et eaux vives.",

     baits:"Appâts rouges/moules ; petits gabarits",

     season:"hiver-printemps (eau plus froide)",

     regions:["Plages rocheuses du Cap occidental (ZA)"]},



    {name:"Kob (sombre/taché)", slug: "kob-dusky-spotted", sci:"Argyrosomus japonicus", env:"Saltwater",

     habitat:"Trous de surf, embouchures de rivières, estuaires.",

     baits:"Mulet vivant, plastiques souples, bucktails",

     season:"Automne-hiver (régional)",

     regions:["Côte sud-africaine", "Australie-Occidentale (sous le nom de Mulloway)"]},



    // ===== South America / Caribbean =====

    {name:"Basse paon", slug: "peacock-bass", sci:"Cichla temensis", env:"Freshwater",

     habitat:"Bois inondé, lagunes ; eaux de surface explosives.",

     baits:"Gros appâts, stickbaits, jigs",

     season:"saison sèche (faible niveau d'eau)",

     regions:["Río Negro (BR)", "Orénoque (VE/CO)"]},



    {name:"Dorée dorée", slug: "golden-dorado", sci:"Salminus brasiliensis", env:"Freshwater",

     habitat:"Des coulées rapides, des veines rocheuses ; une structure dense.",

     baits:"Streamers, jerkbaits, cuillères (fil leader)",

     season:"Printemps-automne (régional)",

     regions:["Marais d'Ibera (AR)", "Bolivia jungle rivers", "Fleuve Uruguay"]},



    {name:"Pacu", slug: "pacu", sci:"Colossoma/Piaractus spp.", env:"Freshwater",

     habitat:"Rivières lentes, forêts inondées.",

     baits:"Fruit, nuts, corn, pellets; flies",

     season:"Chute des fruits en haute saison ; mois chauds",

     regions:["Bassin amazonien (BR/PE/BO)"]},



    {name:"Piraiba (Lau Lau)", slug: "pira-ba-lau-lau", sci:"Brachyplatystoma filamentosum", env:"Freshwater",

     habitat:"Canaux Amazon profonds ; confluences.",

     baits:"D'énormes appâts coupés ; matériel lourd",

     season:"Varie selon la rivière ; souvent en chute d'eau",

     regions:["tronc principal de l'Amazone (BR)"]},



    {name:"Payara (poisson vampire)", slug: "payara-vampire-fish", sci:"Hydrolycus scomberoides", env:"Freshwater",

     habitat:"Des rapides rocheux et des plongeons vertigineux ; eau oxygénée.",

     baits:"Grandes cuillères, jigs, stickbaits ; gros banderoles",

     season:"Lower water periods",

     regions:["Affluents de l'Orénoque et de l'Amazone (VE/CO/BR)"]},



    {name:"Poisson osseux", slug: "bonefish", sci:"Albula vulpes", env:"Saltwater",

     habitat:"Plaines peu profondes, herbes aquatiques, sable.",

     baits:"Petites mouches à crevettes, jigs",

     season:"Tropiques toute l'année ; marées et angle du soleil",

     regions:["Bahamas", "Les Keys de Floride", "Yucatán"]},



    {name:"Permis", slug: "permit", sci:"Trachinotus falcatus", env:"Saltwater",

     habitat:"Plaines peu profondes ; poissons en chasse ; méfiants.",

     baits:"Crabes mouches, petits gabarits ; crabes vivants",

     season:"Printemps-automne (fenêtres de marée)",

     regions:["Bélize", "Yucatán", "Clés"]},

  ];



  function mergeEnrichment(){

    const db = Array.isArray(window.SPECIES_DB) ? window.SPECIES_DB : (window.SPECIES_DB = []);

    const norm = x => String(x||"").toLowerCase().trim();

    const isEmpty = v => v==null || (typeof v==="chaîne" && !v.trim()) || (Array.isArray(v)&&!v.length);

    const keys = ["env","habitat","appâts","saison","profondeur","alias","img","régions"];



    const findMatch = (rec) =>

      db.find(s => norm(s.name||s.species)===norm(rec.name) ||

                   norm(s.sci||s.scientific_name)===norm(rec.sci));



    ENRICHED.forEach(rec=>{

      const m = findMatch(rec);

      if (m){

        keys.forEach(k=>{ if (!isEmpty(m[k]) ) return; if (!isEmpty(rec[k])) m[k]=rec[k]; });

        // also map to alternate property names some DB entries might use

        if (isEmpty(m.scientific_name) && rec.sci) m.scientific_name = rec.sci;

        if (isEmpty(m.species) && rec.name) m.species = rec.name;

      } else {

        db.push({...rec});

      }

    });

  }



  // Wait for base DB, then merge

  let tries=0;

  (function wait(){

    if (Array.isArray(window.SPECIES_DB)){ mergeEnrichment(); }

    else if (tries++ < 60){ setTimeout(wait, 100); }

  })();

})();
