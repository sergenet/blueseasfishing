/* Expanded catalogue: common and scientific names plus conservative group-level ecology.
   Existing records win; duplicate common or scientific names are excluded at runtime. */
(function () {
  const groups = [
    {
      env: 'Freshwater', habitat: 'Kühle und gemäßigte Seen, Flüsse, Bäche und miteinander verbundene Feuchtgebiete',
      baits: 'Artenabhängig; Insekten, Würmer, kleine Fische, Krebstiere, Fliegen oder künstliche Köder, sofern dies zulässig ist',
      season: 'Variiert je nach Wassereinzugsgebiet und lokaler Verordnung',
      fish: [
        ['Amerikanischer Aal','Anguilla rostrata','american-eel'],['Europäischer Aal','Anguilla anguilla','european-eel'],['Japanischer Aal','Anguilla japonica','japanese-eel'],
        ['Amerikanischer Paddelfisch','Polyodon spathula','american-paddlefish'],['Schaufelnasenstör','Scaphirhynchus platorynchus','shovelnose-sturgeon'],['Blasser Stör','Scaphirhynchus albus','pallid-sturgeon'],
        ['Atlantischer Stör','Acipenser oxyrinchus','atlantic-sturgeon'],['Kurznasenstör','Acipenser brevirostrum','shortnose-sturgeon'],['Golfstör','Acipenser oxyrinchus desotoi','gulf-sturgeon'],
        ['Quappe','Lota lota','burbot'],['Runder Felchen','Prosopium cylindraceum','round-whitefish'],['Cisco','Coregonus artedi','cisco'],['Arktische Äsche','Thymallus arcticus','arctic-grayling'],
        ['Amerikanischer Stint','Osmerus mordax','american-smelt'],['Mondauge','Hiodon tergisus','mooneye'],['Goldauge','Hiodon alosoides','goldeye'],['Bonito-Hering','Alosa chrysochloris','skipjack-herring'],
        ['Gizzard Shad','Dorosoma cepedianum','gizzard-shad'],['Fadenflossen-Shad','Dorosoma petenense','threadfin-shad'],['Alewife','Alosa pseudoharengus','alewife'],
        ['Bach Döbel','Semotilus atromaculatus','creek-chub'],['Fallfisch','Semotilus corporalis','fallfish'],['Goldener Glanz','Notemigonus crysoleucas','golden-shiner'],
        ['Dickköpfiger Elritze','Pimephales promelas','fathead-minnow'],['Smaragdglanzer','Notropis atherinoides','emerald-shiner'],['Gemeiner Shiner','Luxilus cornutus','common-shiner'],
        ['Fluss Döbel','Nocomis micropogon','river-chub'],['Hornyhead Chub','Nocomis biguttatus','hornyhead-chub'],['Langnasen-Dace','Rhinichthys cataractae','longnose-dace'],
        ['Schwarznasen-Dace','Rhinichthys atratulus','blacknose-dace'],['Zentraler Stoneroller','Campostoma anomalum','central-stoneroller'],['Nördlicher Rotbauch-Dace','Chrosomus eos','northern-redbelly-dace'],
        ['Weißer Trottel','Catostomus commersonii','white-sucker'],['Langnasensauger','Catostomus catostomus','longnose-sucker'],['Federkiel','Carpiodes cyprinus','quillback'],
        ['Flusskarpslutscher','Carpiodes carpio','river-carpsucker'],['Gefleckter Sauger','Minytrema melanops','spotted-sucker'],['Nördlicher Schweinesauger','Hypentelium nigricans','northern-hogsucker'],
        ['Schwarzes Rotpferd','Moxostoma duquesnei','black-redhorse'],['Goldenes Rotpferd','Moxostoma erythrurum','golden-redhorse'],['Kurzhaariges Rotpferd','Moxostoma macrolepidotum','shorthead-redhorse'],
        ['Großes Rotpferd','Moxostoma valenciennesi','greater-redhorse'],['Silbernes Rotpferd','Moxostoma anisurum','silver-redhorse'],['Blauer Trottel','Cycleptus elongatus','blue-sucker']
      ]
    },
    {
      env: 'Freshwater', habitat: 'Warme Seen, Teiche, langsam fließende Flüsse, Auen und bewachsene Altwasserarme',
      baits: 'Artenabhängig; Würmer, Insekten, kleine Fische, Krebstiere, vorbereitete Köder oder kleine Köder',
      season: 'Meist aktiv in den warmen Monaten; örtliche Bestimmungen beachten.',
      fish: [
        ['Langärmer Mondfisch','Lepomis megalotis','longear-sunfish'],['Orangefleckiger Mondfisch','Lepomis humilis','orangespotted-sunfish'],['Rotkehlchen-Sonnenfisch','Lepomis auritus','redbreast-sunfish'],
        ['Dollar-Sonnenfisch','Lepomis marginatus','dollar-sunfish'],['Zwergmondfisch','Lepomis symmetricus','bantam-sunfish'],['Schlamm-Sonnenfisch','Acantharchus pomotis','mud-sunfish'],
        ['Flieger','Centrarchus macropterus','flier'],['Schattenbass','Ambloplites ariommus','shadow-bass'],['Sacramento-Barsch','Archoplites interruptus','sacramento-perch'],
        ['Gelbe Groppe','Ameiurus natalis','yellow-bullhead'],['Brauner Groppenkopf','Ameiurus nebulosus','brown-bullhead'],['Weißer Wels','Ameiurus catus','white-catfish'],
        ['Stonecat','Noturus flavus','stonecat'],['Kaulquappe Madtom','Noturus gyrinus','tadpole-madtom'],['Schneckengroppe','Ameiurus brunneus','snail-bullhead'],
        ['Piratenbarsch','Aphredoderus sayanus','pirate-perch'],['Sumpffisch','Chologaster cornuta','swampfish'],['Zentrales Mudminnow','Umbra limi','central-mudminnow'],
        ['Olympischer Mudminnow','Novumbra hubbsi','olympic-mudminnow'],['Amerikanischer Pickerel','Esox americanus','american-pickerel'],['Alaska-Schwarzfisch','Dallia pectoralis','alaska-blackfish'],
        ['Brook Silverside','Labidesthes sicculus','brook-silverside'],['Im Landesinneren Silverside','Menidia beryllina','inland-silverside'],['Moskitofisch','Gambusia affinis','mosquitofish'],
        ['Segelflosse Molly','Poecilia latipinna','sailfin-molly'],['Schafkopf-Minnow','Cyprinodon variegatus','sheepshead-minnow'],['Regenwasser-Killifisch','Lucania parva','rainwater-killifish'],
        ['Mummichog','Fundulus heteroclitus','mummichog'],['Gebänderter Killifisch','Fundulus diaphanus','banded-killifish'],['Blauflossen-Killifisch','Lucania goodei','bluefin-killifish'],
        ['Holzbarsch','Percina caprodes','logperch'],['Johnny Darter','Etheostoma nigrum','johnny-darter'],['Regenbogen-Darter','Etheostoma caeruleum','rainbow-darter'],
        ['Iowa Darter','Etheostoma exile','iowa-darter'],['Fantail Darter','Etheostoma flabellare','fantail-darter'],['Greenside Darter','Etheostoma blennioides','greenside-darter'],
        ['Blackside Darter','Percina maculata','blackside-darter'],['Channel Darter','Percina copelandi','channel-darter'],['Gelbflossen-Shiner','Notropis lutipinnis','yellowfin-shiner'],
        ['Ozark Minnow','Notropis nubilus','ozark-minnow'],['Rosyface Shiner','Notropis rubellus','rosyface-shiner'],['Spotfin Shiner','Cyprinella spiloptera','spotfin-shiner']
      ]
    },
    {
      env: 'Freshwater', habitat: 'Tropische und subtropische Flüsse, Seen, Stauseen und Auenlebensräume',
      baits: 'Artenabhängig; Pflanzenmaterial, Insekten, Krebstiere, kleine Fische, Teigköder oder künstliche Köder',
      season: 'Variiert je nach Klima, Wasserstand und lokalen Vorschriften',
      fish: [
        ['Nil-Tilapia','Oreochromis niloticus','nile-tilapia'],['Blauer Tilapia','Oreochromis aureus','blue-tilapia'],['Mosambik Tilapia','Oreochromis mossambicus','mozambique-tilapia'],
        ['Rotbauch-Tilapia','Coptodon zillii','redbelly-tilapia'],['Oskar','Astronotus ocellatus','oscar'],['Grüner Augenfleck Kammbarsch','Cichla ocellaris','peacock-bass'],
        ['Schmetterlings-Pfauenbarsch','Cichla orinocensis','butterfly-peacock-bass'],['Jaguar-Buntbarsch','Parachromis managuensis','jaguar-cichlid'],['Midas-Buntbarsch','Amphilophus citrinellus','midas-cichlid'],
        ['Maya-Buntbarsch','Mayaheros urophthalmus','mayan-cichlid'],['Schwarzes Acara','Cichlasoma bimaculatum','black-acara'],['Blauer Acara','Andinoacara pulcher','blue-acara'],
        ['Diskus','Symphysodon discus','discus'],['Süßwasser-Kaiserfisch','Pterophyllum scalare','freshwater-angelfish'],['Verurteilter Buntbarsch','Amatitlania nigrofasciata','convict-cichlid'],
        ['Arapaima','Arapaima gigas','arapaima'],['Silbernes Arowana','Osteoglossum bicirrhosum','silver-arowana'],['Clown-Messerfisch','Chitala ornata','clown-knifefish'],
        ['Riesengurami','Osphronemus goramy','giant-gourami'],['Gurami küssen','Helostoma temminckii','kissing-gourami'],['Schlangenhautgurami','Trichopodus pectoralis','snakeskin-gourami'],
        ['Riesiger Schlangenkopf','Channa micropeltes','giant-snakehead'],['Nördlicher Schlangenkopf','Channa argus','northern-snakehead'],['Gestreifter Schlangenkopf','Channa striata','striped-snakehead'],
        ['Gehender Wels','Clarias batrachus','walking-catfish'],['Nordafrikanischer Wels','Clarias gariepinus','north-african-catfish'],['Rotschwanzwels','Phractocephalus hemioliopterus','redtail-catfish'],
        ['Tiger-Schaufelnasenwels','Pseudoplatystoma fasciatum','tiger-shovelnose-catfish'],['Ripsaw-Wels','Oxydoras niger','ripsaw-catfish'],['Pictus-Wels','Pimelodus pictus','pictus-catfish'],
        ['Schillernder Haiwels','Pangasianodon hypophthalmus','iridescent-shark-catfish'],['Mekong-Riesenwels','Pangasianodon gigas','mekong-giant-catfish'],['Welser Wels','Silurus glanis','wels-catfish'],
        ['Tambaqui','Colossoma macropomum','tambaqui'],['Pacu','Piaractus mesopotamicus','pacu'],['Rotbauchpiranha','Pygocentrus nattereri','red-bellied-piranha'],
        ['Payara','Hydrolycus scomberoides','payara'],['Goldenes Dorado','Salminus brasiliensis','golden-dorado'],['Tigerfisch','Hydrocynus vittatus','tigerfish'],
        ['Goliath-Tigerfisch','Hydrocynus goliath','goliath-tigerfish'],['Riesenbarb','Catlocarpio siamensis','giant-barb'],['Rohu','Labeo rohita','rohu']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Korallenriffe, Felsriffe, Lagunen und nahegelegene Küstenstrukturen',
      baits: 'Artenabhängig; Garnelen, Krabben, Weichtiere, kleine Fische, Jigs, Wobbler oder Fliegen',
      season: 'Variiert je nach Region, Laichzyklus und Fischereiregulierung',
      fish: [
        ['Nassauischer Zackenbarsch','Epinephelus striatus','nassau-grouper'],['Gag-Zackenbarsch','Mycteroperca microlepis','gag-grouper'],['Schwarzer Zackenbarsch','Mycteroperca bonaci','black-grouper'],
        ['Roter Zackenbarsch','Epinephelus morio','red-grouper'],['Warschauer Zackenbarsch','Hyporthodus nigritus','warsaw-grouper'],['Goliath-Zackenbarsch','Epinephelus itajara','goliath-grouper'],
        ['Scamp-Zackenbarsch','Mycteroperca phenax','scamp-grouper'],['Verschneiter Zackenbarsch','Hyporthodus niveatus','snowy-grouper'],['Gelbrand-Zackenbarsch','Hyporthodus flavolimbatus','yellowedge-grouper'],
        ['Hammelschnapper','Lutjanus analis','mutton-snapper'],['Mangrovenschnapper','Lutjanus griseus','mangrove-snapper'],['Lane Snapper','Lutjanus synagris','lane-snapper'],
        ['Cubera-Schnapper','Lutjanus cyanopterus','cubera-snapper'],['Hundeschnapper','Lutjanus jocu','dog-snapper'],['Seidenschnapper','Lutjanus vivanus','silk-snapper'],
        ['Zinnoberroter Schnapper','Rhomboplites aurorubens','vermilion-snapper'],['Schulmeister Snapper','Lutjanus apodus','schoolmaster-snapper'],['Mahagoni-Schnapper','Lutjanus mahogoni','mahogany-snapper'],
        ['Königin-Drückerfisch','Balistes vetula','queen-triggerfish'],['Grauer Drückerfisch','Balistes capriscus','gray-triggerfish'],['Ozean-Drückerfisch','Canthidermis sufflamen','ocean-triggerfish'],
        ['Rotschwanz-Drückerfisch','Xanthichthys mento','redtail-triggerfish'],['Titan-Drückerfisch','Balistoides viridescens','titan-triggerfish'],['Picasso-Drückerfisch','Rhinecanthus aculeatus','picasso-triggerfish'],
        ['Ampel-Papageienfisch','Sparisoma viride','stoplight-parrotfish'],['Regenbogenpapageienfisch','Scarus guacamaia','rainbow-parrotfish'],['Königin Papageienfisch','Scarus vetula','queen-parrotfish'],
        ['Mitternachtspapageienfisch','Scarus coelestinus','midnight-parrotfish'],['Büffelkopf-Papageienfisch','Bolbometopon muricatum','bumphead-parrotfish'],['Prinzessin Papageienfisch','Scarus taeniopterus','princess-parrotfish'],
        ['Schweinsfisch','Lachnolaimus maximus','hogfish'],['Kalifornischer Schafskopf','Semicossyphus pulcher','california-sheephead'],['Ballan-Lippfisch','Labrus bergylta','ballan-wrasse'],
        ['Kuckucks-Lippfisch','Labrus mixtus','cuckoo-wrasse'],['Blaustreifen-Putzer-Lippfisch','Labroides dimidiatus','bluestreak-cleaner-wrasse'],['Napoleon-Lippfisch','Cheilinus undulatus','napoleon-wrasse'],
        ['Französischer Kaiserfisch','Pomacanthus paru','french-angelfish'],['Königin-Kaiserfisch','Holacanthus ciliaris','queen-angelfish'],['Grauer Kaiserfisch','Pomacanthus arcuatus','gray-angelfish'],
        ['Kaiser-Kaiserfisch','Pomacanthus imperator','emperor-angelfish'],['Rockschönheit','Holacanthus tricolor','rock-beauty'],['Kupferband-Falterfisch','Chelmon rostratus','copperband-butterflyfish']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Küstenbuchten, Flussmündungen, Strände, Molen, Riffe und Schelfgewässer',
      baits: 'Artenabhängig; Köderfische, Tintenfische, Garnelen, Krabben, Würmer, Jigs, Löffel, Wobbler oder Fliegen',
      season: 'Variiert je nach Migration, Temperatur, Region und Regulierung',
      fish: [
        ['Atlantischer Tarpon','Megalops atlanticus','atlantic-tarpon'],['Indopazifischer Tarpon','Megalops cyprinoides','indo-pacific-tarpon'],['Gewöhnlicher Snook','Centropomus undecimalis','common-snook'],
        ['Fetter Snook','Centropomus parallelus','fat-snook'],['Swordspine Snook','Centropomus ensiferus','swordspine-snook'],['Atlantik-Genehmigung','Trachinotus falcatus','atlantic-permit'],
        ['Florida Pompano','Trachinotus carolinus','florida-pompano'],['Palometa','Trachinotus goodei','palometa'],['Großer Bernsteinmakrele','Seriola dumerili','greater-amberjack'],
        ['Kleiner Bernsteinmakrele','Seriola fasciata','lesser-amberjack'],['Almaco Jack','Seriola rivoliana','almaco-jack'],['Crevalle Jack','Caranx hippos','crevalle-jack'],
        ['Pferdeaugen-Jack','Caranx latus','horse-eye-jack'],['Blauer Läufer','Caranx crysos','blue-runner'],['Afrikanischer Pompano','Alectis ciliaris','african-pompano'],
        ['Blick nach unten','Selene vomer','lookdown'],['Atlantischer Mondfisch','Selene setapinnis','atlantic-moonfish'],['Marienfisch','Elops saurus','ladyfish'],
        ['Knochenfisch','Albula vulpes','bonefish'],['Atlantische Fadenflosse','Polydactylus octonemus','atlantic-threadfin'],['Tripletail','Lobotes surinamensis','tripletail'],
        ['Cobia','Rachycentron canadum','cobia'],['Atlantischer Schaufelfisch','Chaetodipterus faber','atlantic-spadefish'],['Pazifischer Schaufelfisch','Chaetodipterus zonatus','pacific-spadefish'],
        ['Atlantischer Nadelfisch','Strongylura marina','atlantic-needlefish'],['Jagdhund','Tylosurus crocodilus','houndfish'],['Tamtam','Hemiramphus brasiliensis','ballyhoo'],
        ['Atlantischer Flugfisch','Cheilopogon melanurus','atlantic-flyingfish'],['Kalifornischer Flugfisch','Cheilopogon pinnatibarbatus californicus','california-flyingfish'],['Gestreifte Meeräsche','Mugil cephalus','striped-mullet'],
        ['Weiße Meeräsche','Mugil curema','white-mullet'],['Atlantischer Menhaden','Brevoortia tyrannus','atlantic-menhaden'],['Golf Menhaden','Brevoortia patronus','gulf-menhaden'],
        ['Pazifische Sardine','Sardinops sagax','pacific-sardine'],['Europäische Sardelle','Sardina pilchardus','european-pilchard'],['Nördliche Sardelle','Engraulis mordax','northern-anchovy'],
        ['Atlantischer Hering','Clupea harengus','atlantic-herring'],['Pazifischer Hering','Clupea pallasii','pacific-herring'],['Capelin','Mallotus villosus','capelin'],
        ['Makrele','Scomber scombrus','atlantic-mackerel'],['Pazifische Döbelmakrele','Scomber japonicus','pacific-chub-mackerel'],['Jack Mackerel','Trachurus symmetricus','jack-mackerel']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Offenes Meer, vorgelagerte Bänke, Strömungsränder, Seeberge und tiefes pelagisches Wasser',
      baits: 'Artenabhängig; Trollköder, lebende oder tote Köderfische, Tintenfische, Jigs, Poppers oder Fliegen',
      season: 'Stark wandernd; Verfügbarkeit variiert je nach Strömung, Temperatur und Regulierung',
      fish: [
        ['Schwarzflossen-Thunfisch','Thunnus atlanticus','blackfin-tuna'],['Longtail-Thunfisch','Thunnus tonggol','longtail-tuna'],['Südlicher Blauflossen-Thunfisch','Thunnus maccoyii','southern-bluefin-tuna'],
        ['Atlantischer Blauer Marlin','Makaira nigricans','atlantic-blue-marlin'],['Schwarzer Marlin','Istiompax indica','black-marlin'],['Weißer Marlin','Kajikia albida','white-marlin'],
        ['Kurzschnabel-Speerfisch','Tetrapturus angustirostris','shortbill-spearfish'],['Langschnabel-Speerfisch','Tetrapturus pfluegeri','longbill-spearfish'],['Mittelmeer-Speerfisch','Tetrapturus belone','mediterranean-spearfish'],
        ['Indopazifischer Segelfisch','Istiophorus platypterus','indo-pacific-sailfish'],['Großer Barrakuda','Sphyraena barracuda','great-barracuda'],['Pazifischer Barrakuda','Sphyraena argentea','pacific-barracuda'],
        ['Escolar','Lepidocybium flavobrunneum','escolar'],['Ölfisch','Ruvettus pretiosus','oilfish'],['Opah','Lampris guttatus','opah'],
        ['Ozean-Sonnenfisch','Mola mola','ocean-sunfish'],['Scharfschwanz-Mola','Masturus lanceolatus','sharptail-mola'],['Schlanker Mondfisch','Ranzania laevis','slender-sunfish'],
        ['Blauer Hai','Prionace glauca','blue-shark'],['Kurzflossen-Mako','Isurus oxyrinchus','shortfin-mako'],['Langflossen-Mako','Isurus paucus','longfin-mako'],
        ['Heringshai','Lamna nasus','porbeagle'],['Lachshai','Lamna ditropis','salmon-shark'],['Ozeanischer Weißspitzenhai','Carcharhinus longimanus','oceanic-whitetip-shark'],
        ['Seidenhai','Carcharhinus falciformis','silky-shark'],['Großaugenthrescher','Alopias superciliosus','bigeye-thresher'],['Gewöhnlicher Drescher','Alopias vulpinus','common-thresher'],
        ['Pelagische Dreschmaschine','Alopias pelagicus','pelagic-thresher'],['Walhai','Rhincodon typus','whale-shark'],['Riesenhai','Cetorhinus maximus','basking-shark'],
        ['Mantarochen','Mobula birostris','manta-ray'],['Chilenischer Teufelsrochen','Mobula tarapacana','chilean-devil-ray'],['Pelagischer Stachelrochen','Pteroplatytrygon violacea','pelagic-stingray'],
        ['Atlantischer Pomfret','Brama brama','atlantic-pomfret'],['Pazifischer Pomfret','Brama japonica','pacific-pomfret'],['Louvar','Luvarus imperialis','louvar']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Felsige Böden, Riffe, Kelpwälder, Wracks und Lebensräume auf dem Kontinentalschelf oder -hang',
      baits: 'Artenabhängig; Tintenfische, Fischstreifen, Krebstiere, Grundvorfächer, Vorrichtungen oder weiche Kunststoffe',
      season: 'Tiefe und Schonzeiten variieren; bitte informieren Sie sich über die aktuellen regionalen Bestimmungen.',
      fish: [
        ['Gelbschwanz-Drachenfisch','Sebastes flavidus','yellowtail-rockfish'],['Witwe-Drachenfisch','Sebastes entomelas','widow-rockfish'],['Schwarzkiemen-Drachenfisch','Sebastes melanostomus','blackgill-rockfish'],
        ['Dunkelfleckiger Felsenfisch','Sebastes crameri','darkblotched-rockfish'],['Rosiger Felsenfisch','Sebastes rosaceus','rosy-rockfish'],['Tiger-Drachenfisch','Sebastes nigrocinctus','tiger-rockfish'],
        ['Flaggen-Drachenfisch','Sebastes rubrivinctus','flag-rockfish'],['Baumfisch','Sebastes serriceps','treefish'],['Seetang-Drachenfisch','Sebastes atrovirens','kelp-rockfish'],
        ['Gras-Drachenfisch','Sebastes rastrelliger','grass-rockfish'],['Uferklippenfisch','Sebastes rufus','bank-rockfish'],['Chilischoten-Drachenfisch','Sebastes goodei','chilipepper-rockfish'],
        ['Cowcod','Sebastes levis','cowcod'],['Barsch im Pazifischen Ozean','Sebastes alutus','pacific-ocean-perch'],['Kurzraker-Drachenfisch','Sebastes borealis','shortraker-rockfish'],
        ['Gelbmaul-Drachenfisch','Sebastes reedi','yellowmouth-rockfish'],['Silbergrauer Felsenfisch','Sebastes brevispinis','silvergray-rockfish'],['Streifenschwanz-Drachenfisch','Sebastes saxicola','stripetail-rockfish'],
        ['Petrale-Sohle','Eopsetta jordani','petrale-sole'],['Dover Sole','Microstomus pacificus','dover-sole'],['Englische Sohle','Parophrys vetulus','english-sole'],
        ['Rex-Sohle','Glyptocephalus zachirus','rex-sole'],['Rock-Sohle','Lepidopsetta bilineata','rock-sole'],['Sternenflunder','Platichthys stellatus','starry-flounder'],
        ['Pfeilzahnflunder','Atheresthes stomias','arrowtooth-flounder'],['Schwarzer Heilbutt','Reinhardtius hippoglossoides','greenland-halibut'],['Amerikanische Scholle','Hippoglossoides platessoides','american-plaice'],
        ['Gelbschwanzflunder','Limanda ferruginea','yellowtail-flounder'],['Winterflunder','Pseudopleuronectes americanus','winter-flounder'],['Hexenflunder','Glyptocephalus cynoglossus','witch-flounder'],
        ['Roter Seehecht','Urophycis chuss','red-hake'],['Weißer Seehecht','Urophycis tenuis','white-hake'],['Silberner Seehecht','Merluccius bilinearis','silver-hake'],
        ['Pazifischer Seehecht','Merluccius productus','pacific-hake'],['Blauer Ling','Molva dypterygia','blue-ling'],['Cusk','Brosme brosme','cusk']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Küstenschelf, Riff, Sand, Schlamm, Seegraswiesen oder Ästuar-Lebensräume, je nach Art',
      baits: 'Artenabhängig; Krebstiere, Weichtiere, Würmer, kleine Fische, geschnittene Köder oder künstliche Köder',
      season: 'Variiert je nach Region und Verordnung',
      fish: [
        ['Atlantischer Seewolf','Anarhichas lupus','atlantic-wolffish'],['Gefleckter Seewolf','Anarhichas minor','spotted-wolffish'],['Ozean-Schmollen','Zoarces americanus','ocean-pout'],
        ['Atlantischer Seehase','Cyclopterus lumpus','atlantic-lumpfish'],['Pazifischer stacheliger Lumpsucker','Eumicrotremus orbis','pacific-spiny-lumpsucker'],['Sculpin','Myoxocephalus scorpius','sculpin'],
        ['Pazifischer Hirschhornskorpion','Leptocottus armatus','pacific-staghorn-sculpin'],['Longhorn Sculpin','Myoxocephalus octodecemspinosus','longhorn-sculpin'],['Seerabe','Hemitripterus americanus','sea-raven'],
        ['Atlantischer Saury','Scomberesox saurus','atlantic-saury'],['Pazifischer Saury','Cololabis saira','pacific-saury'],['Sandlanze','Ammodytes americanus','sand-lance'],
        ['Pazifische Sandlanze','Ammodytes hexapterus','pacific-sand-lance'],['Tilefisch','Lopholatilus chamaeleonticeps','tilefish'],['Blueline Tilefish','Caulolatilus microps','blueline-tilefish'],
        ['Goldener Tilefisch','Lopholatilus chamaeleonticeps','golden-tilefish'],['Nördlicher Kugelfisch','Sphoeroides maculatus','northern-puffer'],['Südlicher Kugelfisch','Sphoeroides nephelus','southern-puffer'],
        ['Karierter Puffer','Sphoeroides testudineus','checkered-puffer'],['Stachelschweinfisch','Diodon hystrix','porcupinefish'],['Ballonfisch','Diodon holocanthus','balloonfish'],
        ['Glatter Kofferfisch','Lactophrys triqueter','smooth-trunkfish'],['Gekritzelter Kuhfisch','Acanthostracion quadricornis','scrawled-cowfish'],['Gefleckter Kofferfisch','Lactophrys bicaudalis','spotted-trunkfish'],
        ['Remora','Remora remora','remora'],['Haifischlutscher','Echeneis naucrates','sharksucker'],['Atlantischer Tintenfisch','Trichiurus lepturus','atlantic-cutlassfish'],
        ['Bandfisch','Trachipterus arcticus','ribbonfish'],['König des Lachses','Trachipterus altivelis','king-of-the-salmon'],['Oarfish','Regalecus glesne','oarfish'],
        ['Atlantischer Sterngucker','Uranoscopus scaber','atlantic-stargazer'],['Nördlicher Sterngucker','Astroscopus guttatus','northern-stargazer'],['Sandkachelfisch','Malacanthus plumieri','sand-tilefish'],
        ['Atlantischer Eidechsenfisch','Synodus saurus','atlantic-lizardfish'],['Küstenechsenfisch','Synodus foetens','inshore-lizardfish'],['Riffcroaker','Ophioscion punctatissimus','reef-croaker']
      ]
    }
  ];

  const existing = Array.isArray(window.SPECIES_DB) ? window.SPECIES_DB : [];
  const names = new Set(existing.map(x => String(x.name || '').toLowerCase()));
  const scientific = new Set(existing.map(x => String(x.sci || '').toLowerCase()));
  const extra = [];
  groups.forEach(group => group.fish.forEach(([name, sci, slug]) => {
    if (names.has(name.toLowerCase()) || scientific.has(sci.toLowerCase())) return;
    names.add(name.toLowerCase()); scientific.add(sci.toLowerCase());
    extra.push({name, slug, sci, env: group.env, habitat: group.habitat, baits: group.baits, season: group.season});
  }));
  window.SPECIES_DB_CATALOG_ROWS = extra;
  window.SPECIES_DB = existing.concat(extra);
  try { document.dispatchEvent(new Event('bsf-db-enriched')); } catch (_) {}
})();
