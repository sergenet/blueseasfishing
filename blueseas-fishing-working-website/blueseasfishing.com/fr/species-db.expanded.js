/* Expanded catalogue: common and scientific names plus conservative group-level ecology.
   Existing records win; duplicate common or scientific names are excluded at runtime. */
(function () {
  const groups = [
    {
      env: 'Freshwater', habitat: 'Lacs, rivières, ruisseaux et zones humides connectées de climat frais et tempéré',
      baits: 'Dépend de lespèce ; insectes, vers, petits poissons, crustacés, mouches ou leurres artificiels lorsque cela est légal',
      season: 'Cela varie selon le bassin versant et la réglementation locale.',
      fish: [
        ['Anguille dAmérique','Anguilla rostrata','american-eel'],['Anguille européenne','Anguilla anguilla','european-eel'],['Anguille japonaise','Anguilla japonica','japanese-eel'],
        ['Spatulaire américain','Polyodon spathula','american-paddlefish'],['Esturgeon à nez plat','Scaphirhynchus platorynchus','shovelnose-sturgeon'],['Esturgeon pâle','Scaphirhynchus albus','pallid-sturgeon'],
        ['Esturgeon noir','Acipenser oxyrinchus','atlantic-sturgeon'],['Esturgeon à museau court','Acipenser brevirostrum','shortnose-sturgeon'],['Esturgeon du Golfe','Acipenser oxyrinchus desotoi','gulf-sturgeon'],
        ['Lotte','Lota lota','burbot'],['Corégone rond','Prosopium cylindraceum','round-whitefish'],['Cisco','Coregonus artedi','cisco'],['Ombre arctique','Thymallus arcticus','arctic-grayling'],
        ['Éperlan américain','Osmerus mordax','american-smelt'],['Œil de lune','Hiodon tergisus','mooneye'],['Laquaiche aux yeux dor','Hiodon alosoides','goldeye'],['Hareng listao','Alosa chrysochloris','skipjack-herring'],
        ['Alose à gésier','Dorosoma cepedianum','gizzard-shad'],['Alose filante','Dorosoma petenense','threadfin-shad'],['Gaspareau','Alosa pseudoharengus','alewife'],
        ['Méné de ruisseau','Semotilus atromaculatus','creek-chub'],['Poisson-automne','Semotilus corporalis','fallfish'],['Méné doré','Notemigonus crysoleucas','golden-shiner'],
        ['Vairon à grosse tête','Pimephales promelas','fathead-minnow'],['Méné émeraude','Notropis atherinoides','emerald-shiner'],['Méné commun','Luxilus cornutus','common-shiner'],
        ['Méné de rivière','Nocomis micropogon','river-chub'],['Méné à tête cornée','Nocomis biguttatus','hornyhead-chub'],['Naseux à long museau','Rhinichthys cataractae','longnose-dace'],
        ['Naseux à nez noir','Rhinichthys atratulus','blacknose-dace'],['Rouleau de pierre central','Campostoma anomalum','central-stoneroller'],['Naseux ventre rouge du Nord','Chrosomus eos','northern-redbelly-dace'],
        ['Meunier blanc','Catostomus commersonii','white-sucker'],['Meunier à long nez','Catostomus catostomus','longnose-sucker'],['Quillback','Carpiodes cyprinus','quillback'],
        ['Carpsucker de rivière','Carpiodes carpio','river-carpsucker'],['Meunier tacheté','Minytrema melanops','spotted-sucker'],['Suceur de porc du Nord','Hypentelium nigricans','northern-hogsucker'],
        ['Chevalier noir','Moxostoma duquesnei','black-redhorse'],['Chevalier doré','Moxostoma erythrurum','golden-redhorse'],['Chevalier à tête courte','Moxostoma macrolepidotum','shorthead-redhorse'],
        ['Grand chevalier','Moxostoma valenciennesi','greater-redhorse'],['Chevalier argenté','Moxostoma anisurum','silver-redhorse'],['Meunier bleu','Cycleptus elongatus','blue-sucker']
      ]
    },
    {
      env: 'Freshwater', habitat: 'Lacs chauds, étangs, rivières lentes, plaines inondables et bras morts végétalisés',
      baits: 'Dépend de lespèce ; vers, insectes, petits poissons, crustacés, appâts préparés ou petits leurres',
      season: 'Plus actif généralement pendant les mois chauds ; vérifiez la réglementation locale.',
      fish: [
        ['Poisson-lune à longue oreille','Lepomis megalotis','longear-sunfish'],['Poisson-lune à points orange','Lepomis humilis','orangespotted-sunfish'],['Poisson-lune à poitrine rouge','Lepomis auritus','redbreast-sunfish'],
        ['Poisson-lune en dollars','Lepomis marginatus','dollar-sunfish'],['Poisson-lune bantam','Lepomis symmetricus','bantam-sunfish'],['Poisson-lune de boue','Acantharchus pomotis','mud-sunfish'],
        ['Dépliant','Centrarchus macropterus','flier'],['Basse dombre','Ambloplites ariommus','shadow-bass'],['Perche de Sacramento','Archoplites interruptus','sacramento-perch'],
        ['Barbotte jaune','Ameiurus natalis','yellow-bullhead'],['Barbotte brune','Ameiurus nebulosus','brown-bullhead'],['Poisson-chat blanc','Ameiurus catus','white-catfish'],
        ['Chat de pierre','Noturus flavus','stonecat'],['Chat-fou têtard','Noturus gyrinus','tadpole-madtom'],['Tête descargot','Ameiurus brunneus','snail-bullhead'],
        ['Perchoir de pirate','Aphredoderus sayanus','pirate-perch'],['Poisson des marais','Chologaster cornuta','swampfish'],['Central Mudminnow','Umbra limi','central-mudminnow'],
        ['Mudminnow olympique','Novumbra hubbsi','olympic-mudminnow'],['Brochet américain','Esox americanus','american-pickerel'],['Poisson noir dAlaska','Dallia pectoralis','alaska-blackfish'],
        ['Ruisseau Silverside','Labidesthes sicculus','brook-silverside'],['Silverside intérieur','Menidia beryllina','inland-silverside'],['Poisson-moustique','Gambusia affinis','mosquitofish'],
        ['Sailfin Molly','Poecilia latipinna','sailfin-molly'],['Vairon tête de mouton','Cyprinodon variegatus','sheepshead-minnow'],['Killifish deau de pluie','Lucania parva','rainwater-killifish'],
        ['Moumichoc','Fundulus heteroclitus','mummichog'],['Fondule bagué','Fundulus diaphanus','banded-killifish'],['Fondule rouge','Lucania goodei','bluefin-killifish'],
        ['Perchoir','Percina caprodes','logperch'],['Johnny Darter','Etheostoma nigrum','johnny-darter'],['Fléchette arc-en-ciel','Etheostoma caeruleum','rainbow-darter'],
        ['Dard de lIowa','Etheostoma exile','iowa-darter'],['Dard à queue large','Etheostoma flabellare','fantail-darter'],['Dard vert','Etheostoma blennioides','greenside-darter'],
        ['Dard noir','Percina maculata','blackside-darter'],['Fouille gris','Percina copelandi','channel-darter'],['Méné à nageoires jaunes','Notropis lutipinnis','yellowfin-shiner'],
        ['Vairon dOzark','Notropis nubilus','ozark-minnow'],['Méné rose','Notropis rubellus','rosyface-shiner'],['Méné tacheté','Cyprinella spiloptera','spotfin-shiner']
      ]
    },
    {
      env: 'Freshwater', habitat: 'Rivières, lacs, réservoirs et habitats de plaines inondables tropicaux et subtropicaux',
      baits: 'Dépend de lespèce ; matériel végétal, insectes, crustacés, petits poissons, appâts en pâte ou leurres artificiels',
      season: 'Cela varie selon le climat, le niveau de leau et la réglementation locale.',
      fish: [
        ['Tilapia du Nil','Oreochromis niloticus','nile-tilapia'],['Tilapia bleu','Oreochromis aureus','blue-tilapia'],['Tilapia du Mozambique','Oreochromis mossambicus','mozambique-tilapia'],
        ['Tilapia à ventre rouge','Coptodon zillii','redbelly-tilapia'],['oscar','Astronotus ocellatus','oscar'],['Basse paon','Cichla ocellaris','peacock-bass'],
        ['Papillon Paon Basse','Cichla orinocensis','butterfly-peacock-bass'],['Cichlidé Jaguar','Parachromis managuensis','jaguar-cichlid'],['Cichlidé Midas','Amphilophus citrinellus','midas-cichlid'],
        ['Cichlidé Maya','Mayaheros urophthalmus','mayan-cichlid'],['Acara noire','Cichlasoma bimaculatum','black-acara'],['Acara bleue','Andinoacara pulcher','blue-acara'],
        ['Disque','Symphysodon discus','discus'],['Poisson-ange deau douce','Pterophyllum scalare','freshwater-angelfish'],['Cichlidé condamné','Amatitlania nigrofasciata','convict-cichlid'],
        ['Arapaima','Arapaima gigas','arapaima'],['Arowana dargent','Osteoglossum bicirrhosum','silver-arowana'],['Poisson-couteau clown','Chitala ornata','clown-knifefish'],
        ['Gourami géant','Osphronemus goramy','giant-gourami'],['Embrasser Gourami','Helostoma temminckii','kissing-gourami'],['Gourami en peau de serpent','Trichopodus pectoralis','snakeskin-gourami'],
        ['Tête de serpent géante','Channa micropeltes','giant-snakehead'],['Tête de serpent du Nord','Channa argus','northern-snakehead'],['Tête de serpent rayée','Channa striata','striped-snakehead'],
        ['Poisson-chat ambulant','Clarias batrachus','walking-catfish'],['Poisson-chat dAfrique du Nord','Clarias gariepinus','north-african-catfish'],['Poisson-chat à queue rouge','Phractocephalus hemioliopterus','redtail-catfish'],
        ['Poisson-chat à nez pelle tigre','Pseudoplatystoma fasciatum','tiger-shovelnose-catfish'],['Poisson-chat Ripsaw','Oxydoras niger','ripsaw-catfish'],['Poisson-chat Pictus','Pimelodus pictus','pictus-catfish'],
        ['Poisson-chat requin irisé','Pangasianodon hypophthalmus','iridescent-shark-catfish'],['Poisson-chat géant du Mékong','Pangasianodon gigas','mekong-giant-catfish'],['Poisson-chat gallois','Silurus glanis','wels-catfish'],
        ['Tambaquí','Colossoma macropomum','tambaqui'],['Pacu','Piaractus mesopotamicus','pacu'],['Piranha à ventre rouge','Pygocentrus nattereri','red-bellied-piranha'],
        ['Payara','Hydrolycus scomberoides','payara'],['Dorée dorée','Salminus brasiliensis','golden-dorado'],['Poisson-tigre','Hydrocynus vittatus','tigerfish'],
        ['Poisson-tigre Goliath','Hydrocynus goliath','goliath-tigerfish'],['Barbe géante','Catlocarpio siamensis','giant-barb'],['Rohu','Labeo rohita','rohu']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Récifs coralliens, récifs rocheux, lagons et structures côtières avoisinantes',
      baits: 'Dépend de lespèce ; crevettes, crabes, mollusques, petits poissons, gabarits, bouchons ou mouches',
      season: 'Cela varie selon la région, le cycle de reproduction et la réglementation de la pêche.',
      fish: [
        ['Mérou de Nassau','Epinephelus striatus','nassau-grouper'],['Mérou bâillonné','Mycteroperca microlepis','gag-grouper'],['Mérou noir','Mycteroperca bonaci','black-grouper'],
        ['Mérou rouge','Epinephelus morio','red-grouper'],['Mérou de Varsovie','Hyporthodus nigritus','warsaw-grouper'],['Mérou Goliath','Epinephelus itajara','goliath-grouper'],
        ['Mérou Scamp','Mycteroperca phenax','scamp-grouper'],['Mérou neigeux','Hyporthodus niveatus','snowy-grouper'],['Mérou jaune','Hyporthodus flavolimbatus','yellowedge-grouper'],
        ['Vivaneau de mouton','Lutjanus analis','mutton-snapper'],['Vivaneau des mangroves','Lutjanus griseus','mangrove-snapper'],['Vivaneau de voie','Lutjanus synagris','lane-snapper'],
        ['Vivaneau Cubera','Lutjanus cyanopterus','cubera-snapper'],['Vivaneau de chien','Lutjanus jocu','dog-snapper'],['Vivaneau en soie','Lutjanus vivanus','silk-snapper'],
        ['Vivaneau vermillon','Rhomboplites aurorubens','vermilion-snapper'],['Vivaneau dinstituteur','Lutjanus apodus','schoolmaster-snapper'],['Vivaneau en acajou','Lutjanus mahogoni','mahogany-snapper'],
        ['Baliste reine','Balistes vetula','queen-triggerfish'],['Baliste gris','Balistes capriscus','gray-triggerfish'],['Baliste océanique','Canthidermis sufflamen','ocean-triggerfish'],
        ['Baliste à queue rouge','Xanthichthys mento','redtail-triggerfish'],['Baliste Titan','Balistoides viridescens','titan-triggerfish'],['Baliste Picasso','Rhinecanthus aculeatus','picasso-triggerfish'],
        ['Poisson-perroquet aux feux rouges','Sparisoma viride','stoplight-parrotfish'],['Poisson perroquet arc-en-ciel','Scarus guacamaia','rainbow-parrotfish'],['Poisson-perroquet royal','Scarus vetula','queen-parrotfish'],
        ['Poisson perroquet de minuit','Scarus coelestinus','midnight-parrotfish'],['Poisson perroquet à bosse','Bolbometopon muricatum','bumphead-parrotfish'],['Poisson perroquet princesse','Scarus taeniopterus','princess-parrotfish'],
        ['Porcs','Lachnolaimus maximus','hogfish'],['Tête de mouton de Californie','Semicossyphus pulcher','california-sheephead'],['Napoléon Ballan','Labrus bergylta','ballan-wrasse'],
        ['Labre coucou','Labrus mixtus','cuckoo-wrasse'],['Napoléon nettoyeur Bluestreak','Labroides dimidiatus','bluestreak-cleaner-wrasse'],['Napoléon','Cheilinus undulatus','napoleon-wrasse'],
        ['Poisson-ange français','Pomacanthus paru','french-angelfish'],['Reine du poisson-ange','Holacanthus ciliaris','queen-angelfish'],['Poisson-ange gris','Pomacanthus arcuatus','gray-angelfish'],
        ['Poisson-ange empereur','Pomacanthus imperator','emperor-angelfish'],['Beauté du rock','Holacanthus tricolor','rock-beauty'],['Poisson-papillon à bande de cuivre','Chelmon rostratus','copperband-butterflyfish']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Baies côtières, estuaires, plages, jetées, récifs et eaux du plateau continental',
      baits: 'Dépend de lespèce ; poissons-appâts, calmars, crevettes, crabes, vers, gabarits, cuillères, bouchons ou mouches',
      season: 'Cela varie selon la migration, la température, la région et la réglementation.',
      fish: [
        ['Tarpon atlantique','Megalops atlanticus','atlantic-tarpon'],['Tarpon indo-pacifique','Megalops cyprinoides','indo-pacific-tarpon'],['Snook commun','Centropomus undecimalis','common-snook'],
        ['Gros Snook','Centropomus parallelus','fat-snook'],['Snook Épée','Centropomus ensiferus','swordspine-snook'],['Permis Atlantique','Trachinotus falcatus','atlantic-permit'],
        ['Pompano de Floride','Trachinotus carolinus','florida-pompano'],['Palométa','Trachinotus goodei','palometa'],['Sériole grande','Seriola dumerili','greater-amberjack'],
        ['Sériole moindre','Seriola fasciata','lesser-amberjack'],['Almaco Jack','Seriola rivoliana','almaco-jack'],['Crevalle Jack','Caranx hippos','crevalle-jack'],
        ['Jack oeil de cheval','Caranx latus','horse-eye-jack'],['Coureur bleu','Caranx crysos','blue-runner'],['Pompano africain','Alectis ciliaris','african-pompano'],
        ['Recherche','Selene vomer','lookdown'],['Poisson-lune de lAtlantique','Selene setapinnis','atlantic-moonfish'],['Coccinelle','Elops saurus','ladyfish'],
        ['Poisson osseux','Albula vulpes','bonefish'],['Aileron de lAtlantique','Polydactylus octonemus','atlantic-threadfin'],['Triple queue','Lobotes surinamensis','tripletail'],
        ['Cobia','Rachycentron canadum','cobia'],['Spadefish de lAtlantique','Chaetodipterus faber','atlantic-spadefish'],['Spadefish du Pacifique','Chaetodipterus zonatus','pacific-spadefish'],
        ['Poisson-aiguille de lAtlantique','Strongylura marina','atlantic-needlefish'],['Poisson-chasse','Tylosurus crocodilus','houndfish'],['Battage','Hemiramphus brasiliensis','ballyhoo'],
        ['Poisson volant de lAtlantique','Cheilopogon melanurus','atlantic-flyingfish'],['Poisson volant de Californie','Cheilopogon pinnatibarbatus californicus','california-flyingfish'],['Mulet rayé','Mugil cephalus','striped-mullet'],
        ['Rouget blanc','Mugil curema','white-mullet'],['Menhaden Atlantique','Brevoortia tyrannus','atlantic-menhaden'],['Golfe Menhaden','Brevoortia patronus','gulf-menhaden'],
        ['Sardine du Pacifique','Sardinops sagax','pacific-sardine'],['Pilchard européen','Sardina pilchardus','european-pilchard'],['Anchois du Nord','Engraulis mordax','northern-anchovy'],
        ['Hareng de lAtlantique','Clupea harengus','atlantic-herring'],['Hareng du Pacifique','Clupea pallasii','pacific-herring'],['Capelan','Mallotus villosus','capelin'],
        ['Maquereau atlantique','Scomber scombrus','atlantic-mackerel'],['Maquereau du Pacifique','Scomber japonicus','pacific-chub-mackerel'],['Jack maquereau','Trachurus symmetricus','jack-mackerel']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Océan ouvert, bancs de sable au large, bordures de courants, monts sous-marins et eaux pélagiques profondes',
      baits: 'Dépend de lespèce ; leurres à la traîne, poissons-appâts vivants ou morts, calmars, jigs, poppers ou mouches',
      season: 'Très migrateur ; sa disponibilité varie selon le courant, la température et la réglementation.',
      fish: [
        ['Thon à nageoires noires','Thunnus atlanticus','blackfin-tuna'],['Thon mignon','Thunnus tonggol','longtail-tuna'],['Thon rouge du sud','Thunnus maccoyii','southern-bluefin-tuna'],
        ['Marlin bleu de lAtlantique','Makaira nigricans','atlantic-blue-marlin'],['Marlin noir','Istiompax indica','black-marlin'],['Marlin blanc','Kajikia albida','white-marlin'],
        ['Spearfish à bec court','Tetrapturus angustirostris','shortbill-spearfish'],['Lance-lance à bec long','Tetrapturus pfluegeri','longbill-spearfish'],['Spearfish méditerranéen','Tetrapturus belone','mediterranean-spearfish'],
        ['Voilier indo-pacifique','Istiophorus platypterus','indo-pacific-sailfish'],['Grand Barracuda','Sphyraena barracuda','great-barracuda'],['Barracuda du Pacifique','Sphyraena argentea','pacific-barracuda'],
        ['Étudiant','Lepidocybium flavobrunneum','escolar'],['Poisson pétrolier','Ruvettus pretiosus','oilfish'],['Opah','Lampris guttatus','opah'],
        ['Poisson-lune de locéan','Mola mola','ocean-sunfish'],['Mola à queue pointue','Masturus lanceolatus','sharptail-mola'],['Poisson-lune élancé','Ranzania laevis','slender-sunfish'],
        ['Requin bleu','Prionace glauca','blue-shark'],['Mako à nageoires courtes','Isurus oxyrinchus','shortfin-mako'],['Mako à nageoires longues','Isurus paucus','longfin-mako'],
        ['Requin taupe','Lamna nasus','porbeagle'],['Requin saumon','Lamna ditropis','salmon-shark'],['Requin océanique à pointe blanche','Carcharhinus longimanus','oceanic-whitetip-shark'],
        ['Requin soyeux','Carcharhinus falciformis','silky-shark'],['Batteuse à gros yeux','Alopias superciliosus','bigeye-thresher'],['Batteuse commune','Alopias vulpinus','common-thresher'],
        ['Batteur pélagique','Alopias pelagicus','pelagic-thresher'],['Requin baleine','Rhincodon typus','whale-shark'],['Requin pèlerin','Cetorhinus maximus','basking-shark'],
        ['Raie Manta','Mobula birostris','manta-ray'],['Raie diable chilienne','Mobula tarapacana','chilean-devil-ray'],['Raie pélagique','Pteroplatytrygon violacea','pelagic-stingray'],
        ['Pomfret de lAtlantique','Brama brama','atlantic-pomfret'],['Pomfret du Pacifique','Brama japonica','pacific-pomfret'],['Louvar','Luvarus imperialis','louvar']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Fonds rocheux, récifs, forêts de varech, épaves et habitats de plateau ou de talus continental',
      baits: 'Dépend de lespèce ; calamars, lanières de poisson, crustacés, bas de ligne, gabarits ou plastiques souples',
      season: 'La profondeur et les périodes douverture varient ; veuillez consulter la réglementation régionale en vigueur.',
      fish: [
        ['Sébaste à queue jaune','Sebastes flavidus','yellowtail-rockfish'],['Sébaste veuve','Sebastes entomelas','widow-rockfish'],['Sébaste à branchies noires','Sebastes melanostomus','blackgill-rockfish'],
        ['Sébaste tacheté','Sebastes crameri','darkblotched-rockfish'],['Sébaste rosé','Sebastes rosaceus','rosy-rockfish'],['Sébaste tigre','Sebastes nigrocinctus','tiger-rockfish'],
        ['Sébaste drapeau','Sebastes rubrivinctus','flag-rockfish'],['Poisson-arbre','Sebastes serriceps','treefish'],['Sébaste de varech','Sebastes atrovirens','kelp-rockfish'],
        ['Sébaste herbivore','Sebastes rastrelliger','grass-rockfish'],['Sébaste de banc','Sebastes rufus','bank-rockfish'],['Sébaste au piment','Sebastes goodei','chilipepper-rockfish'],
        ['Morue de vache','Sebastes levis','cowcod'],['Perche de locéan Pacifique','Sebastes alutus','pacific-ocean-perch'],['Sébaste shortraker','Sebastes borealis','shortraker-rockfish'],
        ['Sébaste à bouche jaune','Sebastes reedi','yellowmouth-rockfish'],['Sébaste gris argenté','Sebastes brevispinis','silvergray-rockfish'],['Sébaste à queue rayée','Sebastes saxicola','stripetail-rockfish'],
        ['Semelle Pétale','Eopsetta jordani','petrale-sole'],['Semelle Douvres','Microstomus pacificus','dover-sole'],['Semelle anglaise','Parophrys vetulus','english-sole'],
        ['Semelle Rex','Glyptocephalus zachirus','rex-sole'],['Semelle de roche','Lepidopsetta bilineata','rock-sole'],['Flet étoilé','Platichthys stellatus','starry-flounder'],
        ['Flet à dents de flèche','Atheresthes stomias','arrowtooth-flounder'],['Flétan du Groenland','Reinhardtius hippoglossoides','greenland-halibut'],['Plie américaine','Hippoglossoides platessoides','american-plaice'],
        ['Flet à queue jaune','Limanda ferruginea','yellowtail-flounder'],['Plie rouge','Pseudopleuronectes americanus','winter-flounder'],['Plie grise','Glyptocephalus cynoglossus','witch-flounder'],
        ['Merlu rouge','Urophycis chuss','red-hake'],['Merlu blanc','Urophycis tenuis','white-hake'],['Merlu argenté','Merluccius bilinearis','silver-hake'],
        ['Merlu du Pacifique','Merluccius productus','pacific-hake'],['Lingue bleue','Molva dypterygia','blue-ling'],['Brosme','Brosme brosme','cusk']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Plateau continental, récif, sable, vase, herbiers marins ou habitats estuariens selon les espèces',
      baits: 'Dépend de lespèce ; crustacés, mollusques, vers, petits poissons, appâts coupés ou leurres artificiels',
      season: 'Cela varie selon la région et la réglementation.',
      fish: [
        ['Loup atlantique','Anarhichas lupus','atlantic-wolffish'],['Loup tacheté','Anarhichas minor','spotted-wolffish'],['Moue océanique','Zoarces americanus','ocean-pout'],
        ['Lompe de lAtlantique','Cyclopterus lumpus','atlantic-lumpfish'],['Lumpsucker épineux du Pacifique','Eumicrotremus orbis','pacific-spiny-lumpsucker'],['Chabot','Myoxocephalus scorpius','sculpin'],
        ['Chabot vinaigrier du Pacifique','Leptocottus armatus','pacific-staghorn-sculpin'],['Chabot à longues cornes','Myoxocephalus octodecemspinosus','longhorn-sculpin'],['Corbeau de mer','Hemitripterus americanus','sea-raven'],
        ['Balaou de lAtlantique','Scomberesox saurus','atlantic-saury'],['Balaou du Pacifique','Cololabis saira','pacific-saury'],['Lance des sables','Ammodytes americanus','sand-lance'],
        ['Lance des sables du Pacifique','Ammodytes hexapterus','pacific-sand-lance'],['Poisson-tuile','Lopholatilus chamaeleonticeps','tilefish'],['Poisson tuile bleu','Caulolatilus microps','blueline-tilefish'],
        ['Poisson-tuile doré','Lopholatilus chamaeleonticeps','golden-tilefish'],['Puffer du Nord','Sphoeroides maculatus','northern-puffer'],['Puffer du Sud','Sphoeroides nephelus','southern-puffer'],
        ['Doudoune à carreaux','Sphoeroides testudineus','checkered-puffer'],['Poisson porc-épic','Diodon hystrix','porcupinefish'],['Poisson ballon','Diodon holocanthus','balloonfish'],
        ['Poisson-tronc lisse','Lactophrys triqueter','smooth-trunkfish'],['Poisson-vache griffonné','Acanthostracion quadricornis','scrawled-cowfish'],['Poisson-tronc tacheté','Lactophrys bicaudalis','spotted-trunkfish'],
        ['Rémora','Remora remora','remora'],['Suceur de requin','Echeneis naucrates','sharksucker'],['Coutelas de lAtlantique','Trichiurus lepturus','atlantic-cutlassfish'],
        ['Poisson-ruban','Trachipterus arcticus','ribbonfish'],['Roi du saumon','Trachipterus altivelis','king-of-the-salmon'],['Poisson-aviron','Regalecus glesne','oarfish'],
        ['Observateur des étoiles de lAtlantique','Uranoscopus scaber','atlantic-stargazer'],['Observateur des étoiles du Nord','Astroscopus guttatus','northern-stargazer'],['Poisson tuile de sable','Malacanthus plumieri','sand-tilefish'],
        ['Poisson-lézard de lAtlantique','Synodus saurus','atlantic-lizardfish'],['Poisson-lézard côtier','Synodus foetens','inshore-lizardfish'],['Courbine des récifs','Ophioscion punctatissimus','reef-croaker']
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
  try { document.dispatchEvent(new Event('enrichi en bsf-db')); } catch (_) {}
})();
