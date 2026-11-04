/* Expanded catalogue: common and scientific names plus conservative group-level ecology.
   Existing records win; duplicate common or scientific names are excluded at runtime. */
(function () {
  const groups = [
    {
      env: 'Freshwater', habitat: 'Lagos, rios, ribeiros e zonas húmidas interligadas de clima frio e temperado',
      baits: 'Dependente da espécie; insetos, vermes, pequenos peixes, crustáceos, moscas ou iscas artificiais onde for legal',
      season: 'Varia conforme a bacia hidrográfica e a regulamentação local.',
      fish: [
        ['Enguia Americana','Anguilla rostrata','american-eel'],['Enguia Europeia','Anguilla anguilla','european-eel'],['Enguia Japonesa','Anguilla japonica','japanese-eel'],
        ['Peixe-remo americano','Polyodon spathula','american-paddlefish'],['Esturjão Nariz-pá','Scaphirhynchus platorynchus','shovelnose-sturgeon'],['Esturjão Pálido','Scaphirhynchus albus','pallid-sturgeon'],
        ['Esturjão Atlântico','Acipenser oxyrinchus','atlantic-sturgeon'],['Esturjão de nariz curto','Acipenser brevirostrum','shortnose-sturgeon'],['Esturjão do Golfo','Acipenser oxyrinchus desotoi','gulf-sturgeon'],
        ['Biênio','Lota lota','burbot'],['Peixe Branco Redondo','Prosopium cylindraceum','round-whitefish'],['Cisco','Coregonus artedi','cisco'],['Grayling Ártico','Thymallus arcticus','arctic-grayling'],
        ['Cheiro Americano','Osmerus mordax','american-smelt'],['Olho da Lua','Hiodon tergisus','mooneye'],['Olho Dourado','Hiodon alosoides','goldeye'],['Arenque Skipjack','Alosa chrysochloris','skipjack-herring'],
        ['Sável de moela','Dorosoma cepedianum','gizzard-shad'],['Sombra Threadfin','Dorosoma petenense','threadfin-shad'],['Esposa Alemã','Alosa pseudoharengus','alewife'],
        ['Riacho Chub','Semotilus atromaculatus','creek-chub'],['Peixe-queda','Semotilus corporalis','fallfish'],['Brilhante Dourado','Notemigonus crysoleucas','golden-shiner'],
        ['Peixinho cabeça-gorda','Pimephales promelas','fathead-minnow'],['Brilhante Esmeralda','Notropis atherinoides','emerald-shiner'],['Shiner Comum','Luxilus cornutus','common-shiner'],
        ['Rio Chub','Nocomis micropogon','river-chub'],['Chub Tesão','Nocomis biguttatus','hornyhead-chub'],['Dace Nariz Comprido','Rhinichthys cataractae','longnose-dace'],
        ['Dace Nariz Negro','Rhinichthys atratulus','blacknose-dace'],['Rolo de Pedra Central','Campostoma anomalum','central-stoneroller'],['Dace Redbelly do Norte','Chrosomus eos','northern-redbelly-dace'],
        ['Otário Branco','Catostomus commersonii','white-sucker'],['Otário Narigudo','Catostomus catostomus','longnose-sucker'],['Quillback','Carpiodes cyprinus','quillback'],
        ['Rio Carpsucker','Carpiodes carpio','river-carpsucker'],['Otário manchado','Minytrema melanops','spotted-sucker'],['Churrasqueiro do Norte','Hypentelium nigricans','northern-hogsucker'],
        ['Cavalo Vermelho Preto','Moxostoma duquesnei','black-redhorse'],['Cavalo Vermelho Dourado','Moxostoma erythrurum','golden-redhorse'],['Cavalo Vermelho de Cabeça Curta','Moxostoma macrolepidotum','shorthead-redhorse'],
        ['Grande Cavalo Vermelho','Moxostoma valenciennesi','greater-redhorse'],['Cavalo Vermelho Prateado','Moxostoma anisurum','silver-redhorse'],['Ventosa Azul','Cycleptus elongatus','blue-sucker']
      ]
    },
    {
      env: 'Freshwater', habitat: 'Lagos quentes, lagoas, rios de correnteza lenta, planícies aluviais e remansos com vegetação.',
      baits: 'Dependente da espécie; vermes, insetos, pequenos peixes, crustáceos, iscas preparadas ou pequenas iscas',
      season: 'Geralmente mais ativo nos meses quentes; consulte as regras locais.',
      fish: [
        ['Peixe-lua Longar','Lepomis megalotis','longear-sunfish'],['Peixe-lua com manchas laranjas','Lepomis humilis','orangespotted-sunfish'],['Peixe-lua-vermelho','Lepomis auritus','redbreast-sunfish'],
        ['Peixe-lua dólar','Lepomis marginatus','dollar-sunfish'],['Peixe-lua Bantam','Lepomis symmetricus','bantam-sunfish'],['Peixe-lua de lama','Acantharchus pomotis','mud-sunfish'],
        ['Folheto','Centrarchus macropterus','flier'],['Baixo Sombrio','Ambloplites ariommus','shadow-bass'],['Poleiro de Sacramento','Archoplites interruptus','sacramento-perch'],
        ['Cabeça de Touro Amarelo','Ameiurus natalis','yellow-bullhead'],['Cabeça de touro marrom','Ameiurus nebulosus','brown-bullhead'],['Bagre Branco','Ameiurus catus','white-catfish'],
        ['Gato de Pedra','Noturus flavus','stonecat'],['Girino Madtom','Noturus gyrinus','tadpole-madtom'],['Caracol Bullhead','Ameiurus brunneus','snail-bullhead'],
        ['Poleiro Pirata','Aphredoderus sayanus','pirate-perch'],['Peixe-pântano','Chologaster cornuta','swampfish'],['Mudminnow Central','Umbra limi','central-mudminnow'],
        ['Mudminnow Olímpico','Novumbra hubbsi','olympic-mudminnow'],['Pickerel Americano','Esox americanus','american-pickerel'],['Peixe Negro do Alasca','Dallia pectoralis','alaska-blackfish'],
        ['Brook Silverside','Labidesthes sicculus','brook-silverside'],['Silverside interior','Menidia beryllina','inland-silverside'],['Peixe-mosquito','Gambusia affinis','mosquitofish'],
        ['Sailfin Molly','Poecilia latipinna','sailfin-molly'],['Peixinho cabeça de ovelha','Cyprinodon variegatus','sheepshead-minnow'],['Killifish de água da chuva','Lucania parva','rainwater-killifish'],
        ['Mummichog','Fundulus heteroclitus','mummichog'],['Killifish em faixas','Fundulus diaphanus','banded-killifish'],['Killifish de atum rabilho','Lucania goodei','bluefin-killifish'],
        ['Perca','Percina caprodes','logperch'],['Johnny Darter','Etheostoma nigrum','johnny-darter'],['Darter arco-íris','Etheostoma caeruleum','rainbow-darter'],
        ['Darter de Iowa','Etheostoma exile','iowa-darter'],['Darter Fantail','Etheostoma flabellare','fantail-darter'],['Darter Greenside','Etheostoma blennioides','greenside-darter'],
        ['Darter do lado negro','Percina maculata','blackside-darter'],['Canal Darter','Percina copelandi','channel-darter'],['Shiner de albacora','Notropis lutipinnis','yellowfin-shiner'],
        ['Ozark peixinho','Notropis nubilus','ozark-minnow'],['Rosyface Shiner','Notropis rubellus','rosyface-shiner'],['Spotfin Shiner','Cyprinella spiloptera','spotfin-shiner']
      ]
    },
    {
      env: 'Freshwater', habitat: 'Rios, lagos, reservatórios e habitats de planícies aluviais tropicais e subtropicais',
      baits: 'Dependente da espécie; material vegetal, insetos, crustáceos, peixes pequenos, iscas de massa ou iscas artificiais',
      season: 'Varia conforme o clima, o nível da água e as regulamentações locais.',
      fish: [
        ['Tilápia do Nilo','Oreochromis niloticus','nile-tilapia'],['Tilápia Azul','Oreochromis aureus','blue-tilapia'],['Tilápia de Moçambique','Oreochromis mossambicus','mozambique-tilapia'],
        ['Tilápia de barriga vermelha','Coptodon zillii','redbelly-tilapia'],['Óscar','Astronotus ocellatus','oscar'],['Robalo','Cichla ocellaris','peacock-bass'],
        ['Robalo Borboleta','Cichla orinocensis','butterfly-peacock-bass'],['Ciclídeo Jaguar','Parachromis managuensis','jaguar-cichlid'],['Ciclídeo Midas','Amphilophus citrinellus','midas-cichlid'],
        ['Ciclídeo Maia','Mayaheros urophthalmus','mayan-cichlid'],['Acara Negra','Cichlasoma bimaculatum','black-acara'],['Acara Azul','Andinoacara pulcher','blue-acara'],
        ['Disco','Symphysodon discus','discus'],['Peixe-anjo de água doce','Pterophyllum scalare','freshwater-angelfish'],['Ciclídeo condenado','Amatitlania nigrofasciata','convict-cichlid'],
        ['Arapaima','Arapaima gigas','arapaima'],['Aruanã Prateado','Osteoglossum bicirrhosum','silver-arowana'],['Faca-palhaço','Chitala ornata','clown-knifefish'],
        ['Gourami Gigante','Osphronemus goramy','giant-gourami'],['Beijando Gourami','Helostoma temminckii','kissing-gourami'],['Gourami de pele de cobra','Trichopodus pectoralis','snakeskin-gourami'],
        ['Cabeça de Cobra Gigante','Channa micropeltes','giant-snakehead'],['Cabeça de Cobra do Norte','Channa argus','northern-snakehead'],['Cabeça de cobra listrada','Channa striata','striped-snakehead'],
        ['Bagre Andando','Clarias batrachus','walking-catfish'],['Peixe-gato do Norte da África','Clarias gariepinus','north-african-catfish'],['Peixe-gato Redtail','Phractocephalus hemioliopterus','redtail-catfish'],
        ['Peixe-gato tigre-nariz-pá','Pseudoplatystoma fasciatum','tiger-shovelnose-catfish'],['Peixe-gato Ripsaw','Oxydoras niger','ripsaw-catfish'],['Peixe-gato Pictus','Pimelodus pictus','pictus-catfish'],
        ['Peixe-gato tubarão iridescente','Pangasianodon hypophthalmus','iridescent-shark-catfish'],['Peixe-gato gigante do Mekong','Pangasianodon gigas','mekong-giant-catfish'],['Peixe-gato Wels','Silurus glanis','wels-catfish'],
        ['Tambaqui','Colossoma macropomum','tambaqui'],['Pacú','Piaractus mesopotamicus','pacu'],['Piranha de barriga vermelha','Pygocentrus nattereri','red-bellied-piranha'],
        ['Payara','Hydrolycus scomberoides','payara'],['Salminus','Salminus brasiliensis','golden-dorado'],['Peixe-tigre','Hydrocynus vittatus','tigerfish'],
        ['Peixe Tigre Golias','Hydrocynus goliath','goliath-tigerfish'],['Farpa Gigante','Catlocarpio siamensis','giant-barb'],['Rohu','Labeo rohita','rohu']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Recifes de coral, recifes rochosos, lagoas e estruturas costeiras próximas.',
      baits: 'Dependente da espécie; camarões, caranguejos, moluscos, peixes pequenos, gabaritos, plugs ou moscas',
      season: 'Varia conforme a região, o ciclo de desova e a regulamentação da pesca.',
      fish: [
        ['Garoupa de Nassau','Epinephelus striatus','nassau-grouper'],['Garoupa','Mycteroperca microlepis','gag-grouper'],['Garoupa Negra','Mycteroperca bonaci','black-grouper'],
        ['Garoupa Vermelha','Epinephelus morio','red-grouper'],['Garoupa de Varsóvia','Hyporthodus nigritus','warsaw-grouper'],['Garoupa Golias','Epinephelus itajara','goliath-grouper'],
        ['Garoupa Scamp','Mycteroperca phenax','scamp-grouper'],['Garoupa nevada','Hyporthodus niveatus','snowy-grouper'],['Garoupa Amarela','Hyporthodus flavolimbatus','yellowedge-grouper'],
        ['Pargo de carneiro','Lutjanus analis','mutton-snapper'],['Pargo do Mangue','Lutjanus griseus','mangrove-snapper'],['Snapper da pista','Lutjanus synagris','lane-snapper'],
        ['Pargo Cubera','Lutjanus cyanopterus','cubera-snapper'],['Cachorro Pargo','Lutjanus jocu','dog-snapper'],['Pargo de Seda','Lutjanus vivanus','silk-snapper'],
        ['Pargo Escarlate','Rhomboplites aurorubens','vermilion-snapper'],['Mestre-escola Snapper','Lutjanus apodus','schoolmaster-snapper'],['Pargo de mogno','Lutjanus mahogoni','mahogany-snapper'],
        ['Peixe-gatilho Rainha','Balistes vetula','queen-triggerfish'],['Peixe-porco cinza','Balistes capriscus','gray-triggerfish'],['Peixe-porco do oceano','Canthidermis sufflamen','ocean-triggerfish'],
        ['Peixe-gatilho Redtail','Xanthichthys mento','redtail-triggerfish'],['Peixe-gatilho Titã','Balistoides viridescens','titan-triggerfish'],['Peixe-porco Picasso','Rhinecanthus aculeatus','picasso-triggerfish'],
        ['Peixe-papagaio semáforo','Sparisoma viride','stoplight-parrotfish'],['Peixe-papagaio arco-íris','Scarus guacamaia','rainbow-parrotfish'],['Peixe-papagaio rainha','Scarus vetula','queen-parrotfish'],
        ['Peixe-papagaio da meia-noite','Scarus coelestinus','midnight-parrotfish'],['Peixe-papagaio cabeçudo','Bolbometopon muricatum','bumphead-parrotfish'],['Princesa peixe-papagaio','Scarus taeniopterus','princess-parrotfish'],
        ['Peixe-porco','Lachnolaimus maximus','hogfish'],['Semicossyphus pulcher','Semicossyphus pulcher','california-sheephead'],['Bodião Ballan','Labrus bergylta','ballan-wrasse'],
        ['Bodião Cuco','Labrus mixtus','cuckoo-wrasse'],['Bodião Limpador Bluestreak','Labroides dimidiatus','bluestreak-cleaner-wrasse'],['Napoleão Wrasse','Cheilinus undulatus','napoleon-wrasse'],
        ['Peixe anjo francês','Pomacanthus paru','french-angelfish'],['Peixe Anjo Rainha','Holacanthus ciliaris','queen-angelfish'],['Peixe anjo cinza','Pomacanthus arcuatus','gray-angelfish'],
        ['Peixe anjo imperador','Pomacanthus imperator','emperor-angelfish'],['Beleza da rocha','Holacanthus tricolor','rock-beauty'],['Peixe-borboleta de banda de cobre','Chelmon rostratus','copperband-butterflyfish']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Baías costeiras, estuários, praias, molhes, recifes e águas da plataforma continental.',
      baits: 'Dependente da espécie; iscas, lulas, camarões, caranguejos, minhocas, gabaritos, colheres, plugues ou moscas',
      season: 'Varia de acordo com a migração, a temperatura, a região e a regulamentação.',
      fish: [
        ['Tarpão Atlântico','Megalops atlanticus','atlantic-tarpon'],['Tarpon Indo-Pacífico','Megalops cyprinoides','indo-pacific-tarpon'],['Robalo Comum','Centropomus undecimalis','common-snook'],
        ['Robalo Gordo','Centropomus parallelus','fat-snook'],['Robalo Espinhaço','Centropomus ensiferus','swordspine-snook'],['Licença Atlântica','Trachinotus falcatus','atlantic-permit'],
        ['Pompano da Flórida','Trachinotus carolinus','florida-pompano'],['Palometa','Trachinotus goodei','palometa'],['Grande Amberjack','Seriola dumerili','greater-amberjack'],
        ['Amberjack Menor','Seriola fasciata','lesser-amberjack'],['Almaco Jack','Seriola rivoliana','almaco-jack'],['Crevalle Jack','Caranx hippos','crevalle-jack'],
        ['Jack Olho de Cavalo','Caranx latus','horse-eye-jack'],['Corredor Azul','Caranx crysos','blue-runner'],['Pompano Africano','Alectis ciliaris','african-pompano'],
        ['Olhar para baixo','Selene vomer','lookdown'],['Peixe-lua do Atlântico','Selene setapinnis','atlantic-moonfish'],['Joaninha','Elops saurus','ladyfish'],
        ['Butterfishes, silver pomfrets','Albula vulpes','bonefish'],['Barbatana do Atlântico','Polydactylus octonemus','atlantic-threadfin'],['Cauda tripla','Lobotes surinamensis','tripletail'],
        ['Cobia','Rachycentron canadum','cobia'],['Espada do Atlântico','Chaetodipterus faber','atlantic-spadefish'],['Peixe-espada do Pacífico','Chaetodipterus zonatus','pacific-spadefish'],
        ['Agulha do Atlântico','Strongylura marina','atlantic-needlefish'],['Galgo','Tylosurus crocodilus','houndfish'],['Ballyhoo','Hemiramphus brasiliensis','ballyhoo'],
        ['Peixe-voador do Atlântico','Cheilopogon melanurus','atlantic-flyingfish'],['Peixe voador da Califórnia','Cheilopogon pinnatibarbatus californicus','california-flyingfish'],['Tainha Listrada','Mugil cephalus','striped-mullet'],
        ['Tainha Branca','Mugil curema','white-mullet'],['Atlântico Menhaden','Brevoortia tyrannus','atlantic-menhaden'],['Golfo Menhaden','Brevoortia patronus','gulf-menhaden'],
        ['Sardinha do Pacífico','Sardinops sagax','pacific-sardine'],['Sardinha Europeia','Sardina pilchardus','european-pilchard'],['Anchova do Norte','Engraulis mordax','northern-anchovy'],
        ['Arenque do Atlântico','Clupea harengus','atlantic-herring'],['Arenque do Pacífico','Clupea pallasii','pacific-herring'],['Capelim','Mallotus villosus','capelin'],
        ['Sarda','Scomber scombrus','atlantic-mackerel'],['Cavala do Pacífico','Scomber japonicus','pacific-chub-mackerel'],['Cavala','Trachurus symmetricus','jack-mackerel']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Oceano aberto, bancos costeiros, bordas de correntes, montes submarinos e águas pelágicas profundas.',
      baits: 'Dependente da espécie; iscas trolladas, iscas vivas ou mortas, lulas, gabaritos, poppers ou moscas',
      season: 'Altamente migratório; a disponibilidade varia conforme a corrente, a temperatura e a regulamentação.',
      fish: [
        ['Atum Blackfin','Thunnus atlanticus','blackfin-tuna'],['Atum Longtail','Thunnus tonggol','longtail-tuna'],['Atum Bluefin do Sul','Thunnus maccoyii','southern-bluefin-tuna'],
        ['Marlim Azul Atlântico','Makaira nigricans','atlantic-blue-marlin'],['Marlim Negro','Istiompax indica','black-marlin'],['Marlim Branco','Kajikia albida','white-marlin'],
        ['Spearfish de bico curto','Tetrapturus angustirostris','shortbill-spearfish'],['Peixe-lança-bico-longo','Tetrapturus pfluegeri','longbill-spearfish'],['Spearfish Mediterrâneo','Tetrapturus belone','mediterranean-spearfish'],
        ['Veleiro Indo-Pacífico','Istiophorus platypterus','indo-pacific-sailfish'],['Grande Barracuda','Sphyraena barracuda','great-barracuda'],['Barracuda do Pacífico','Sphyraena argentea','pacific-barracuda'],
        ['escolar','Lepidocybium flavobrunneum','escolar'],['Peixe-óleo','Ruvettus pretiosus','oilfish'],['Opah','Lampris guttatus','opah'],
        ['Peixe-lua do oceano','Mola mola','ocean-sunfish'],['Mola de cauda afiada','Masturus lanceolatus','sharptail-mola'],['Peixe-lua delgado','Ranzania laevis','slender-sunfish'],
        ['Tubarão Azul','Prionace glauca','blue-shark'],['Mako de barbatana curta','Isurus oxyrinchus','shortfin-mako'],['Mako de barbatana longa','Isurus paucus','longfin-mako'],
        ['Beagle','Lamna nasus','porbeagle'],['Tubarão Salmão','Lamna ditropis','salmon-shark'],['Tubarão de pontas brancas oceânico','Carcharhinus longimanus','oceanic-whitetip-shark'],
        ['Tubarão Sedoso','Carcharhinus falciformis','silky-shark'],['Debulhador de patudo','Alopias superciliosus','bigeye-thresher'],['Debulhador Comum','Alopias vulpinus','common-thresher'],
        ['Debulhador Pelágico','Alopias pelagicus','pelagic-thresher'],['Tubarão-baleia','Rhincodon typus','whale-shark'],['Tubarão-frade','Cetorhinus maximus','basking-shark'],
        ['MantaRaia','Mobula birostris','manta-ray'],['Raio do Diabo Chileno','Mobula tarapacana','chilean-devil-ray'],['Arraia Pelágica','Pteroplatytrygon violacea','pelagic-stingray'],
        ['Pomfret Atlântico','Brama brama','atlantic-pomfret'],['Pomfret do Pacífico','Brama japonica','pacific-pomfret'],['Louvar','Luvarus imperialis','louvar']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Fundos rochosos, recifes, algas marinhas, naufrágios e habitats de plataforma ou talude continental.',
      baits: 'Dependente da espécie; lulas, tiras de peixe, crustáceos, plataformas de fundo, gabaritos ou plásticos macios',
      season: 'A profundidade da pesca e as épocas de caça variam; consulte as regras regionais vigentes.',
      fish: [
        ['Peixe-boi-de-rabo-amarelo','Sebastes flavidus','yellowtail-rockfish'],['Viúva Rockfish','Sebastes entomelas','widow-rockfish'],['Peixe-pedra Blackgill','Sebastes melanostomus','blackgill-rockfish'],
        ['Rockfish manchado de escuro','Sebastes crameri','darkblotched-rockfish'],['Rockfish Rosado','Sebastes rosaceus','rosy-rockfish'],['Peixe-tigre','Sebastes nigrocinctus','tiger-rockfish'],
        ['Peixe-bandeira','Sebastes rubrivinctus','flag-rockfish'],['Peixe árvore','Sebastes serriceps','treefish'],['Rockfish de algas','Sebastes atrovirens','kelp-rockfish'],
        ['Rockfish de grama','Sebastes rastrelliger','grass-rockfish'],['Banco Rockfish','Sebastes rufus','bank-rockfish'],['Peixe bodião pimenta','Sebastes goodei','chilipepper-rockfish'],
        ['Bacalhau','Sebastes levis','cowcod'],['Poleiro do Oceano Pacífico','Sebastes alutus','pacific-ocean-perch'],['Bodião Shortraker','Sebastes borealis','shortraker-rockfish'],
        ['Peixe-boca-amarela','Sebastes reedi','yellowmouth-rockfish'],['Bodião Cinzento Prateado','Sebastes brevispinis','silvergray-rockfish'],['Rockfish Stripetail','Sebastes saxicola','stripetail-rockfish'],
        ['Linguado Petrale','Eopsetta jordani','petrale-sole'],['Sola de Dover','Microstomus pacificus','dover-sole'],['Linguado Inglês','Parophrys vetulus','english-sole'],
        ['Sola Rex','Glyptocephalus zachirus','rex-sole'],['Sola de pedra','Lepidopsetta bilineata','rock-sole'],['Linguado estrelado','Platichthys stellatus','starry-flounder'],
        ['Solha dente de flecha','Atheresthes stomias','arrowtooth-flounder'],['Alabote da Groenlândia','Reinhardtius hippoglossoides','greenland-halibut'],['Solha Americana','Hippoglossoides platessoides','american-plaice'],
        ['Linguado de cauda amarela','Limanda ferruginea','yellowtail-flounder'],['Linguado de inverno','Pseudopleuronectes americanus','winter-flounder'],['Linguado de Bruxa','Glyptocephalus cynoglossus','witch-flounder'],
        ['Pescada Vermelha','Urophycis chuss','red-hake'],['Pescada Branca','Urophycis tenuis','white-hake'],['Pescada Prateada','Merluccius bilinearis','silver-hake'],
        ['Pescada do Pacífico','Merluccius productus','pacific-hake'],['Azul Ling','Molva dypterygia','blue-ling'],['Cusco','Brosme brosme','cusk']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Plataforma costeira, recife, areia, lama, ervas marinhas ou habitats estuarinos, dependendo da espécie.',
      baits: 'Dependente da espécie; crustáceos, moluscos, minhocas, peixes pequenos, iscas cortadas ou iscas artificiais',
      season: 'Varia conforme a região e a regulamentação.',
      fish: [
        ['Lobo-do-Atlântico','Anarhichas lupus','atlantic-wolffish'],['Lobo-malhado','Anarhichas minor','spotted-wolffish'],['Faneca do oceano','Zoarces americanus','ocean-pout'],
        ['Lumpfish do Atlântico','Cyclopterus lumpus','atlantic-lumpfish'],['Lumpsucker espinhoso do Pacífico','Eumicrotremus orbis','pacific-spiny-lumpsucker'],['Esculpir','Myoxocephalus scorpius','sculpin'],
        ['Escultor de Staghorn do Pacífico','Leptocottus armatus','pacific-staghorn-sculpin'],['Escultor Longhorn','Myoxocephalus octodecemspinosus','longhorn-sculpin'],['Corvo do Mar','Hemitripterus americanus','sea-raven'],
        ['Sauro Atlântico','Scomberesox saurus','atlantic-saury'],['Sauro do Pacífico','Cololabis saira','pacific-saury'],['Lança de Areia','Ammodytes americanus','sand-lance'],
        ['Lança de Areia do Pacífico','Ammodytes hexapterus','pacific-sand-lance'],['Peixe-azulejo','Lopholatilus chamaeleonticeps','tilefish'],['Peixe Azulejo','Caulolatilus microps','blueline-tilefish'],
        ['Peixe Azulejo Dourado','Lopholatilus chamaeleonticeps','golden-tilefish'],['Baiacu do Norte','Sphoeroides maculatus','northern-puffer'],['Baiacu do Sul','Sphoeroides nephelus','southern-puffer'],
        ['Baiacu xadrez','Sphoeroides testudineus','checkered-puffer'],['Peixe porco-espinho','Diodon hystrix','porcupinefish'],['Peixe-balão','Diodon holocanthus','balloonfish'],
        ['Peixe-tronco liso','Lactophrys triqueter','smooth-trunkfish'],['Vaca rabiscada','Acanthostracion quadricornis','scrawled-cowfish'],['Tronco manchado','Lactophrys bicaudalis','spotted-trunkfish'],
        ['Rêmora','Remora remora','remora'],['Sugador de tubarão','Echeneis naucrates','sharksucker'],['Cutelo do Atlântico','Trichiurus lepturus','atlantic-cutlassfish'],
        ['Peixe-fita','Trachipterus arcticus','ribbonfish'],['Rei do Salmão','Trachipterus altivelis','king-of-the-salmon'],['Peixe-remo','Regalecus glesne','oarfish'],
        ['Observador das Estrelas do Atlântico','Uranoscopus scaber','atlantic-stargazer'],['Observador das Estrelas do Norte','Astroscopus guttatus','northern-stargazer'],['Peixe Azulejo de Areia','Malacanthus plumieri','sand-tilefish'],
        ['Peixe Lagarto do Atlântico','Synodus saurus','atlantic-lizardfish'],['Peixe-lagarto costeiro','Synodus foetens','inshore-lizardfish'],['Corvina de recife','Ophioscion punctatissimus','reef-croaker']
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
  try { document.dispatchEvent(new Event('enriquecido com bsf-db')); } catch (_) {}
})();
