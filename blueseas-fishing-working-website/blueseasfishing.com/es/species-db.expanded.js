/* Expanded catalogue: common and scientific names plus conservative group-level ecology.
   Existing records win; duplicate common or scientific names are excluded at runtime. */
(function () {
  const groups = [
    {
      env: 'Freshwater', habitat: 'Lagos fríos y templados, ríos, arroyos y humedales conectados.',
      baits: 'Dependiente de la especie; insectos, gusanos, peces pequeños, crustáceos, moscas o señuelos artificiales donde sea legal',
      season: 'Varía según la cuenca hidrográfica y la normativa local.',
      fish: [
        ['anguila americana','Anguilla rostrata','american-eel'],['anguila europea','Anguilla anguilla','european-eel'],['anguila japonesa','Anguilla japonica','japanese-eel'],
        ['Pez espátula americano','Polyodon spathula','american-paddlefish'],['Esturión nariz de pala','Scaphirhynchus platorynchus','shovelnose-sturgeon'],['Esturión pálido','Scaphirhynchus albus','pallid-sturgeon'],
        ['Esturión del Atlántico','Acipenser oxyrinchus','atlantic-sturgeon'],['Esturión de nariz corta','Acipenser brevirostrum','shortnose-sturgeon'],['Esturión del Golfo','Acipenser oxyrinchus desotoi','gulf-sturgeon'],
        ['lota','Lota lota','burbot'],['Pescado Blanco Redondo','Prosopium cylindraceum','round-whitefish'],['cisco','Coregonus artedi','cisco'],['Tímalo ártico','Thymallus arcticus','arctic-grayling'],
        ['fundido americano','Osmerus mordax','american-smelt'],['ojo de luna','Hiodon tergisus','mooneye'],['Ojo dorado','Hiodon alosoides','goldeye'],['Arenque listado','Alosa chrysochloris','skipjack-herring'],
        ['Sábalo molleja','Dorosoma cepedianum','gizzard-shad'],['Sábalo de aleta roscada','Dorosoma petenense','threadfin-shad'],['Alemana','Alosa pseudoharengus','alewife'],
        ['Cacho de arroyo','Semotilus atromaculatus','creek-chub'],['pez caída','Semotilus corporalis','fallfish'],['brillo dorado','Notemigonus crysoleucas','golden-shiner'],
        ['Pececillo de cabeza gorda','Pimephales promelas','fathead-minnow'],['Brillo esmeralda','Notropis atherinoides','emerald-shiner'],['brillo común','Luxilus cornutus','common-shiner'],
        ['Cacho de río','Nocomis micropogon','river-chub'],['Cacho cabeza cachonda','Nocomis biguttatus','hornyhead-chub'],['Dace de nariz larga','Rhinichthys cataractae','longnose-dace'],
        ['Dace de nariz negra','Rhinichthys atratulus','blacknose-dace'],['Apisonador de piedras central','Campostoma anomalum','central-stoneroller'],['Dace de vientre rojo del norte','Chrosomus eos','northern-redbelly-dace'],
        ['Lechón blanco','Catostomus commersonii','white-sucker'],['Lechón de nariz larga','Catostomus catostomus','longnose-sucker'],['pluma','Carpiodes cyprinus','quillback'],
        ['río carpsucker','Carpiodes carpio','river-carpsucker'],['Lechón manchado','Minytrema melanops','spotted-sucker'],['Chupapuercos del norte','Hypentelium nigricans','northern-hogsucker'],
        ['Caballo rojo negro','Moxostoma duquesnei','black-redhorse'],['Caballo rojo dorado','Moxostoma erythrurum','golden-redhorse'],['Caballo rojo de cabeza corta','Moxostoma macrolepidotum','shorthead-redhorse'],
        ['Gran caballo rojo','Moxostoma valenciennesi','greater-redhorse'],['Caballo rojo plateado','Moxostoma anisurum','silver-redhorse'],['Lechón azul','Cycleptus elongatus','blue-sucker']
      ]
    },
    {
      env: 'Freshwater', habitat: 'Lagos cálidos, estanques, ríos de curso lento, llanuras aluviales y remansos vegetados.',
      baits: 'Dependiente de la especie; gusanos, insectos, peces pequeños, crustáceos, cebos preparados o señuelos pequeños',
      season: 'Suele ser más activo en los meses cálidos; consulte las normas locales.',
      fish: [
        ['Pez luna de orejas largas','Lepomis megalotis','longear-sunfish'],['Pez luna con manchas anaranjadas','Lepomis humilis','orangespotted-sunfish'],['Pez luna de pecho rojo','Lepomis auritus','redbreast-sunfish'],
        ['Pez luna dólar','Lepomis marginatus','dollar-sunfish'],['Pez luna gallo','Lepomis symmetricus','bantam-sunfish'],['Pez luna de barro','Acantharchus pomotis','mud-sunfish'],
        ['Folleto','Centrarchus macropterus','flier'],['Bajo sombra','Ambloplites ariommus','shadow-bass'],['Perca de Sacramento','Archoplites interruptus','sacramento-perch'],
        ['Cabeza de toro amarilla','Ameiurus natalis','yellow-bullhead'],['Cabeza de toro marrón','Ameiurus nebulosus','brown-bullhead'],['bagre blanco','Ameiurus catus','white-catfish'],
        ['gato de piedra','Noturus flavus','stonecat'],['Renacuajo Madtom','Noturus gyrinus','tadpole-madtom'],['Caracol cabeza de toro','Ameiurus brunneus','snail-bullhead'],
        ['Perca pirata','Aphredoderus sayanus','pirate-perch'],['Pez pantano','Chologaster cornuta','swampfish'],['Mudminnow central','Umbra limi','central-mudminnow'],
        ['Mudminnow olímpico','Novumbra hubbsi','olympic-mudminnow'],['Pickerel americano','Esox americanus','american-pickerel'],['Pez negro de Alaska','Dallia pectoralis','alaska-blackfish'],
        ['Arroyo pejerrey','Labidesthes sicculus','brook-silverside'],['Pejerrey interior','Menidia beryllina','inland-silverside'],['Pez mosquito','Gambusia affinis','mosquitofish'],
        ['Molly de vela','Poecilia latipinna','sailfin-molly'],['Pececillo cabeza de oveja','Cyprinodon variegatus','sheepshead-minnow'],['Killis de agua de lluvia','Lucania parva','rainwater-killifish'],
        ['momichog','Fundulus heteroclitus','mummichog'],['Killis anillados','Fundulus diaphanus','banded-killifish'],['Killis de aleta azul','Lucania goodei','bluefin-killifish'],
        ['Loperca','Percina caprodes','logperch'],['Johnny Darter','Etheostoma nigrum','johnny-darter'],['Dardo arcoiris','Etheostoma caeruleum','rainbow-darter'],
        ['Dardo de Iowa','Etheostoma exile','iowa-darter'],['Dardo de cola de milano','Etheostoma flabellare','fantail-darter'],['Dardo verde','Etheostoma blennioides','greenside-darter'],
        ['Dardo del lado negro','Percina maculata','blackside-darter'],['Dardo de canal','Percina copelandi','channel-darter'],['Limpiador de aleta amarilla','Notropis lutipinnis','yellowfin-shiner'],
        ['Pececillo de Ozark','Notropis nubilus','ozark-minnow'],['Brillo de cara rosada','Notropis rubellus','rosyface-shiner'],['Limpiador de aleta puntual','Cyprinella spiloptera','spotfin-shiner']
      ]
    },
    {
      env: 'Freshwater', habitat: 'Ríos, lagos, embalses y hábitats de llanuras aluviales tropicales y subtropicales.',
      baits: 'Dependiente de la especie; material vegetal, insectos, crustáceos, peces pequeños, cebos de masa o señuelos artificiales',
      season: 'Varía según el clima, el nivel del agua y la normativa local.',
      fish: [
        ['Tilapia del Nilo','Oreochromis niloticus','nile-tilapia'],['tilapia azul','Oreochromis aureus','blue-tilapia'],['Tilapia de Mozambique','Oreochromis mossambicus','mozambique-tilapia'],
        ['Tilapia de vientre rojo','Coptodon zillii','redbelly-tilapia'],['Óscar','Astronotus ocellatus','oscar'],['Pavo real','Cichla ocellaris','peacock-bass'],
        ['Pavo real mariposa','Cichla orinocensis','butterfly-peacock-bass'],['Cíclido jaguar','Parachromis managuensis','jaguar-cichlid'],['Cíclido Midas','Amphilophus citrinellus','midas-cichlid'],
        ['Cíclido maya','Mayaheros urophthalmus','mayan-cichlid'],['Acara Negra','Cichlasoma bimaculatum','black-acara'],['Acara azul','Andinoacara pulcher','blue-acara'],
        ['discutir','Symphysodon discus','discus'],['Pez ángel de agua dulce','Pterophyllum scalare','freshwater-angelfish'],['Cíclido Convicto','Amatitlania nigrofasciata','convict-cichlid'],
        ['arapaima','Arapaima gigas','arapaima'],['Arowana de plata','Osteoglossum bicirrhosum','silver-arowana'],['Pez cuchillo payaso','Chitala ornata','clown-knifefish'],
        ['Gurami gigante','Osphronemus goramy','giant-gourami'],['Besando a Gurami','Helostoma temminckii','kissing-gourami'],['Gurami de piel de serpiente','Trichopodus pectoralis','snakeskin-gourami'],
        ['Cabeza de serpiente gigante','Channa micropeltes','giant-snakehead'],['Cabeza de serpiente del norte','Channa argus','northern-snakehead'],['Cabeza de serpiente rayada','Channa striata','striped-snakehead'],
        ['Bagre Caminante','Clarias batrachus','walking-catfish'],['Bagre del norte de África','Clarias gariepinus','north-african-catfish'],['Bagre de cola roja','Phractocephalus hemioliopterus','redtail-catfish'],
        ['Bagre nariz de pala tigre','Pseudoplatystoma fasciatum','tiger-shovelnose-catfish'],['Bagre sierra rasgadora','Oxydoras niger','ripsaw-catfish'],['Bagre Pictus','Pimelodus pictus','pictus-catfish'],
        ['Bagre Tiburón Iridiscente','Pangasianodon hypophthalmus','iridescent-shark-catfish'],['Bagre gigante del Mekong','Pangasianodon gigas','mekong-giant-catfish'],['Bagre Wels','Silurus glanis','wels-catfish'],
        ['tambaquí','Colossoma macropomum','tambaqui'],['pacú','Piaractus mesopotamicus','pacu'],['Piraña de vientre rojo','Pygocentrus nattereri','red-bellied-piranha'],
        ['payara','Hydrolycus scomberoides','payara'],['dorado dorado','Salminus brasiliensis','golden-dorado'],['pez tigre','Hydrocynus vittatus','tigerfish'],
        ['Pez tigre goliat','Hydrocynus goliath','goliath-tigerfish'],['Púa gigante','Catlocarpio siamensis','giant-barb'],['Rohu','Labeo rohita','rohu']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Arrecifes de coral, arrecifes rocosos, lagunas y estructuras costeras cercanas.',
      baits: 'Dependiente de la especie; camarones, cangrejos, moluscos, peces pequeños, jigs, plugs o moscas',
      season: 'Varía según la región, el ciclo de desove y la normativa pesquera.',
      fish: [
        ['Mero de Nasáu','Epinephelus striatus','nassau-grouper'],['Mero Mordaza','Mycteroperca microlepis','gag-grouper'],['Mero Negro','Mycteroperca bonaci','black-grouper'],
        ['Mero Rojo','Epinephelus morio','red-grouper'],['Mero de Varsovia','Hyporthodus nigritus','warsaw-grouper'],['Mero Goliat','Epinephelus itajara','goliath-grouper'],
        ['Mero bribón','Mycteroperca phenax','scamp-grouper'],['Mero Nevado','Hyporthodus niveatus','snowy-grouper'],['Mero de borde amarillo','Hyporthodus flavolimbatus','yellowedge-grouper'],
        ['Pargo de cordero','Lutjanus analis','mutton-snapper'],['Pargo de manglar','Lutjanus griseus','mangrove-snapper'],['Pargo de carril','Lutjanus synagris','lane-snapper'],
        ['Pargo Cubera','Lutjanus cyanopterus','cubera-snapper'],['Pargo de perro','Lutjanus jocu','dog-snapper'],['Pargo de seda','Lutjanus vivanus','silk-snapper'],
        ['Pargo bermellón','Rhomboplites aurorubens','vermilion-snapper'],['Pargo maestro de escuela','Lutjanus apodus','schoolmaster-snapper'],['Pargo de caoba','Lutjanus mahogoni','mahogany-snapper'],
        ['Ballesta reina','Balistes vetula','queen-triggerfish'],['Ballesta gris','Balistes capriscus','gray-triggerfish'],['Ballesta del océano','Canthidermis sufflamen','ocean-triggerfish'],
        ['Ballesta de cola roja','Xanthichthys mento','redtail-triggerfish'],['Pez ballesta titán','Balistoides viridescens','titan-triggerfish'],['Ballesta Picasso','Rhinecanthus aculeatus','picasso-triggerfish'],
        ['Pez loro semáforo','Sparisoma viride','stoplight-parrotfish'],['Pez loro arcoiris','Scarus guacamaia','rainbow-parrotfish'],['Pez loro reina','Scarus vetula','queen-parrotfish'],
        ['Pez loro de medianoche','Scarus coelestinus','midnight-parrotfish'],['Pez loro cabeza de chorlito','Bolbometopon muricatum','bumphead-parrotfish'],['princesa pez loro','Scarus taeniopterus','princess-parrotfish'],
        ['pez cerdo','Lachnolaimus maximus','hogfish'],['Cabeza de oveja de California','Semicossyphus pulcher','california-sheephead'],['Napoleón Ballan','Labrus bergylta','ballan-wrasse'],
        ['Napoleón cuco','Labrus mixtus','cuckoo-wrasse'],['Napoleón limpiador Bluestreak','Labroides dimidiatus','bluestreak-cleaner-wrasse'],['Napoleón Napoleón','Cheilinus undulatus','napoleon-wrasse'],
        ['Pez ángel francés','Pomacanthus paru','french-angelfish'],['Pez ángel reina','Holacanthus ciliaris','queen-angelfish'],['Pez ángel gris','Pomacanthus arcuatus','gray-angelfish'],
        ['Pez ángel emperador','Pomacanthus imperator','emperor-angelfish'],['Belleza de roca','Holacanthus tricolor','rock-beauty'],['Pez mariposa banda de cobre','Chelmon rostratus','copperband-butterflyfish']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Bahías costeras, estuarios, playas, muelles, arrecifes y aguas de la plataforma continental.',
      baits: 'Dependiente de la especie; carnada, calamares, camarones, cangrejos, gusanos, jigs, cucharas, tapones o moscas',
      season: 'Varía según la migración, la temperatura, la región y la regulación.',
      fish: [
        ['Sábalo Atlántico','Megalops atlanticus','atlantic-tarpon'],['Sábalo del Indo-Pacífico','Megalops cyprinoides','indo-pacific-tarpon'],['Róbalo común','Centropomus undecimalis','common-snook'],
        ['róbalo gordo','Centropomus parallelus','fat-snook'],['Róbalo espina de espada','Centropomus ensiferus','swordspine-snook'],['Permiso Atlántico','Trachinotus falcatus','atlantic-permit'],
        ['Pámpano de Florida','Trachinotus carolinus','florida-pompano'],['palometa','Trachinotus goodei','palometa'],['Amberjack mayor','Seriola dumerili','greater-amberjack'],
        ['Amberjack menor','Seriola fasciata','lesser-amberjack'],['Almaco Jack','Seriola rivoliana','almaco-jack'],['Jack Crevalle','Caranx hippos','crevalle-jack'],
        ['Jack ojo de caballo','Caranx latus','horse-eye-jack'],['Corredor azul','Caranx crysos','blue-runner'],['Pámpano africano','Alectis ciliaris','african-pompano'],
        ['mirar hacia abajo','Selene vomer','lookdown'],['Pez Luna del Atlántico','Selene setapinnis','atlantic-moonfish'],['Mariquita','Elops saurus','ladyfish'],
        ['pez hueso','Albula vulpes','bonefish'],['Aleta roscada del Atlántico','Polydactylus octonemus','atlantic-threadfin'],['triple cola','Lobotes surinamensis','tripletail'],
        ['cobia','Rachycentron canadum','cobia'],['Pez espada del Atlántico','Chaetodipterus faber','atlantic-spadefish'],['Pez espada del Pacífico','Chaetodipterus zonatus','pacific-spadefish'],
        ['Pez aguja del Atlántico','Strongylura marina','atlantic-needlefish'],['Pez sabueso','Tylosurus crocodilus','houndfish'],['Alboroto','Hemiramphus brasiliensis','ballyhoo'],
        ['Pez volador del Atlántico','Cheilopogon melanurus','atlantic-flyingfish'],['Pez volador de California','Cheilopogon pinnatibarbatus californicus','california-flyingfish'],['Salmonete rayado','Mugil cephalus','striped-mullet'],
        ['salmonete blanco','Mugil curema','white-mullet'],['Lacha atlántica','Brevoortia tyrannus','atlantic-menhaden'],['Golfo Lacha','Brevoortia patronus','gulf-menhaden'],
        ['Sardina del Pacífico','Sardinops sagax','pacific-sardine'],['Sardina europea','Sardina pilchardus','european-pilchard'],['Anchoa del Norte','Engraulis mordax','northern-anchovy'],
        ['Arenque del Atlántico','Clupea harengus','atlantic-herring'],['Arenque del Pacífico','Clupea pallasii','pacific-herring'],['capelán','Mallotus villosus','capelin'],
        ['Caballa del Atlántico','Scomber scombrus','atlantic-mackerel'],['Caballa del Pacífico','Scomber japonicus','pacific-chub-mackerel'],['caballa','Trachurus symmetricus','jack-mackerel']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Océano abierto, bancos costeros, bordes de corrientes, montes submarinos y aguas pelágicas profundas',
      baits: 'Dependiente de la especie; señuelos curricán, peces carnada vivos o muertos, calamares, jigs, poppers o moscas',
      season: 'Altamente migratorio; su disponibilidad varía según la corriente, la temperatura y la regulación.',
      fish: [
        ['Atún Aleta Negra','Thunnus atlanticus','blackfin-tuna'],['Atún de cola larga','Thunnus tonggol','longtail-tuna'],['Atún Rojo del Sur','Thunnus maccoyii','southern-bluefin-tuna'],
        ['Marlín azul del Atlántico','Makaira nigricans','atlantic-blue-marlin'],['Marlín negro','Istiompax indica','black-marlin'],['Marlín blanco','Kajikia albida','white-marlin'],
        ['Pez lanza de pico corto','Tetrapturus angustirostris','shortbill-spearfish'],['Pez lanza pico largo','Tetrapturus pfluegeri','longbill-spearfish'],['Pez lanza del Mediterráneo','Tetrapturus belone','mediterranean-spearfish'],
        ['Pez vela del Indo-Pacífico','Istiophorus platypterus','indo-pacific-sailfish'],['gran barracuda','Sphyraena barracuda','great-barracuda'],['Barracuda del Pacífico','Sphyraena argentea','pacific-barracuda'],
        ['escolares','Lepidocybium flavobrunneum','escolar'],['pez aceite','Ruvettus pretiosus','oilfish'],['opah','Lampris guttatus','opah'],
        ['Pez luna del océano','Mola mola','ocean-sunfish'],['Mola de cola afilada','Masturus lanceolatus','sharptail-mola'],['Pez luna delgado','Ranzania laevis','slender-sunfish'],
        ['tiburón azul','Prionace glauca','blue-shark'],['Mako de aleta corta','Isurus oxyrinchus','shortfin-mako'],['Mako de aleta larga','Isurus paucus','longfin-mako'],
        ['marrajo sardinero','Lamna nasus','porbeagle'],['Tiburón Salmón','Lamna ditropis','salmon-shark'],['Tiburón oceánico punta blanca','Carcharhinus longimanus','oceanic-whitetip-shark'],
        ['Tiburón sedoso','Carcharhinus falciformis','silky-shark'],['trilladora patudo','Alopias superciliosus','bigeye-thresher'],['trilladora común','Alopias vulpinus','common-thresher'],
        ['Trilladora pelágica','Alopias pelagicus','pelagic-thresher'],['Tiburón ballena','Rhincodon typus','whale-shark'],['Tiburón peregrino','Cetorhinus maximus','basking-shark'],
        ['mantarraya','Mobula birostris','manta-ray'],['Raya diablo chilena','Mobula tarapacana','chilean-devil-ray'],['Raya pelágica','Pteroplatytrygon violacea','pelagic-stingray'],
        ['palometa atlántica','Brama brama','atlantic-pomfret'],['Palometa del Pacífico','Brama japonica','pacific-pomfret'],['Louvar','Luvarus imperialis','louvar']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Fondos rocosos, arrecifes, algas marinas, pecios y hábitats de plataforma o talud continental.',
      baits: 'Dependiente de la especie; calamares, tiras de pescado, crustáceos, aparejos de fondo, jigs o plásticos blandos',
      season: 'La profundidad y las temporadas de pesca varían; consulte las reglas regionales vigentes.',
      fish: [
        ['Pez roca cola amarilla','Sebastes flavidus','yellowtail-rockfish'],['Pez roca viuda','Sebastes entomelas','widow-rockfish'],['Pez roca de agallas negras','Sebastes melanostomus','blackgill-rockfish'],
        ['Pez roca manchado oscuro','Sebastes crameri','darkblotched-rockfish'],['Pez Roca Rosado','Sebastes rosaceus','rosy-rockfish'],['Pez Roca Tigre','Sebastes nigrocinctus','tiger-rockfish'],
        ['Marcar Pez Roca','Sebastes rubrivinctus','flag-rockfish'],['Pez árbol','Sebastes serriceps','treefish'],['Pez roca algas marinas','Sebastes atrovirens','kelp-rockfish'],
        ['Pez Roca De Hierba','Sebastes rastrelliger','grass-rockfish'],['Pez Roca de Banco','Sebastes rufus','bank-rockfish'],['Pez roca chilipimentero','Sebastes goodei','chilipepper-rockfish'],
        ['bacalao','Sebastes levis','cowcod'],['Perca del Océano Pacífico','Sebastes alutus','pacific-ocean-perch'],['Pez Roca Rastreador Corto','Sebastes borealis','shortraker-rockfish'],
        ['Pez roca de boca amarilla','Sebastes reedi','yellowmouth-rockfish'],['Pez roca gris plateado','Sebastes brevispinis','silvergray-rockfish'],['Pez roca cola rayada','Sebastes saxicola','stripetail-rockfish'],
        ['Suela Petrale','Eopsetta jordani','petrale-sole'],['Lenguado de Dover','Microstomus pacificus','dover-sole'],['lenguado inglés','Parophrys vetulus','english-sole'],
        ['Suela Rex','Glyptocephalus zachirus','rex-sole'],['Suela de roca','Lepidopsetta bilineata','rock-sole'],['Platija estrellada','Platichthys stellatus','starry-flounder'],
        ['Platija de dientes de flecha','Atheresthes stomias','arrowtooth-flounder'],['Fletán de Groenlandia','Reinhardtius hippoglossoides','greenland-halibut'],['solla americana','Hippoglossoides platessoides','american-plaice'],
        ['Platija de cola amarilla','Limanda ferruginea','yellowtail-flounder'],['platija de invierno','Pseudopleuronectes americanus','winter-flounder'],['platija bruja','Glyptocephalus cynoglossus','witch-flounder'],
        ['Merluza Roja','Urophycis chuss','red-hake'],['Merluza Blanca','Urophycis tenuis','white-hake'],['Merluza plateada','Merluccius bilinearis','silver-hake'],
        ['Merluza del Pacífico','Merluccius productus','pacific-hake'],['Ling azul','Molva dypterygia','blue-ling'],['cusco','Brosme brosme','cusk']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Plataforma costera, arrecife, arena, lodo, praderas marinas o hábitats estuarinos, según la especie.',
      baits: 'Dependiente de la especie; crustáceos, moluscos, gusanos, peces pequeños, cebos cortados o señuelos artificiales',
      season: 'Varía según la región y la normativa.',
      fish: [
        ['Pez lobo del Atlántico','Anarhichas lupus','atlantic-wolffish'],['Pez lobo manchado','Anarhichas minor','spotted-wolffish'],['faneca del océano','Zoarces americanus','ocean-pout'],
        ['Lumpfish del Atlántico','Cyclopterus lumpus','atlantic-lumpfish'],['Chupagrumos espinoso del Pacífico','Eumicrotremus orbis','pacific-spiny-lumpsucker'],['esculpir','Myoxocephalus scorpius','sculpin'],
        ['Escultura de cuerno de ciervo del Pacífico','Leptocottus armatus','pacific-staghorn-sculpin'],['Escultura de cuernos largos','Myoxocephalus octodecemspinosus','longhorn-sculpin'],['Cuervo de mar','Hemitripterus americanus','sea-raven'],
        ['Saurio Atlántico','Scomberesox saurus','atlantic-saury'],['Saurio del Pacífico','Cololabis saira','pacific-saury'],['Lanza de arena','Ammodytes americanus','sand-lance'],
        ['Lanza de arena del Pacífico','Ammodytes hexapterus','pacific-sand-lance'],['blanquillo','Lopholatilus chamaeleonticeps','tilefish'],['Pez azulejo línea azul','Caulolatilus microps','blueline-tilefish'],
        ['Pez blanquillo dorado','Lopholatilus chamaeleonticeps','golden-tilefish'],['Globo del Norte','Sphoeroides maculatus','northern-puffer'],['Globo sureño','Sphoeroides nephelus','southern-puffer'],
        ['Puffer a cuadros','Sphoeroides testudineus','checkered-puffer'],['pez puercoespín','Diodon hystrix','porcupinefish'],['pez globo','Diodon holocanthus','balloonfish'],
        ['Pez tronco liso','Lactophrys triqueter','smooth-trunkfish'],['Pez vaca garabateado','Acanthostracion quadricornis','scrawled-cowfish'],['Pez tronco manchado','Lactophrys bicaudalis','spotted-trunkfish'],
        ['Rémora','Remora remora','remora'],['chupatiburones','Echeneis naucrates','sharksucker'],['Sable del Atlántico','Trichiurus lepturus','atlantic-cutlassfish'],
        ['pez cinta','Trachipterus arcticus','ribbonfish'],['rey-del-salmon','Trachipterus altivelis','king-of-the-salmon'],['pez remo','Regalecus glesne','oarfish'],
        ['Observador de estrellas del Atlántico','Uranoscopus scaber','atlantic-stargazer'],['Observador de estrellas del norte','Astroscopus guttatus','northern-stargazer'],['Pez blanquillo de arena','Malacanthus plumieri','sand-tilefish'],
        ['Pez lagarto del Atlántico','Synodus saurus','atlantic-lizardfish'],['Pez lagarto costero','Synodus foetens','inshore-lizardfish'],['Corvina de arrecife','Ophioscion punctatissimus','reef-croaker']
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
  try { document.dispatchEvent(new Event('bsf-db-enriquecido')); } catch (_) {}
})();
