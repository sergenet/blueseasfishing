/* Expanded catalogue: common and scientific names plus conservative group-level ecology.
   Existing records win; duplicate common or scientific names are excluded at runtime. */
(function () {
  const groups = [
    {
      env: 'Freshwater', habitat: 'Озера, реки, ручьи и связанные с ними водно-болотные угодья с прохладным и умеренным климатом.',
      baits: 'Видозависимый; насекомые, черви, мелкая рыба, ракообразные, мухи или искусственные приманки, если это разрешено законом.',
      season: 'Различаются в зависимости от водосборного бассейна и местных правил.',
      fish: [
        ['Американский угорь','Anguilla rostrata','american-eel'],['Европейский угорь','Anguilla anguilla','european-eel'],['Японский угорь','Anguilla japonica','japanese-eel'],
        ['Американский веслонос','Polyodon spathula','american-paddlefish'],['Лопатоносый осетр','Scaphirhynchus platorynchus','shovelnose-sturgeon'],['Бледный осетр','Scaphirhynchus albus','pallid-sturgeon'],
        ['Атлантический осетр','Acipenser oxyrinchus','atlantic-sturgeon'],['Коротконосый осетр','Acipenser brevirostrum','shortnose-sturgeon'],['Персидский осетр','Acipenser oxyrinchus desotoi','gulf-sturgeon'],
        ['Налим','Lota lota','burbot'],['Круглый сиг','Prosopium cylindraceum','round-whitefish'],['Циско','Coregonus artedi','cisco'],['Арктический хариус','Thymallus arcticus','arctic-grayling'],
        ['Американская корюшка','Osmerus mordax','american-smelt'],['Лунный Глаз','Hiodon tergisus','mooneye'],['Голдай','Hiodon alosoides','goldeye'],['Скипджек Сельдь','Alosa chrysochloris','skipjack-herring'],
        ['Желудок Шад','Dorosoma cepedianum','gizzard-shad'],['Нитьплавниковый Шад','Dorosoma petenense','threadfin-shad'],['Алевайф','Alosa pseudoharengus','alewife'],
        ['Крик Чуб','Semotilus atromaculatus','creek-chub'],['Водопадная рыба','Semotilus corporalis','fallfish'],['Золотой Финал','Notemigonus crysoleucas','golden-shiner'],
        ['Толстоголовый гольян','Pimephales promelas','fathead-minnow'],['Изумрудный Фингал','Notropis atherinoides','emerald-shiner'],['Обыкновенный Фингал','Luxilus cornutus','common-shiner'],
        ['Река Чуб','Nocomis micropogon','river-chub'],['Рогатый голавль','Nocomis biguttatus','hornyhead-chub'],['Длинноносый елец','Rhinichthys cataractae','longnose-dace'],
        ['Черноносый елец','Rhinichthys atratulus','blacknose-dace'],['Центральный Каменокат','Campostoma anomalum','central-stoneroller'],['Северный краснобрюхий елец','Chrosomus eos','northern-redbelly-dace'],
        ['Белый присоска','Catostomus commersonii','white-sucker'],['Длинноносая присоска','Catostomus catostomus','longnose-sucker'],['Квилбэк','Carpiodes cyprinus','quillback'],
        ['Река Карпсакер','Carpiodes carpio','river-carpsucker'],['Пятнистая присоска','Minytrema melanops','spotted-sucker'],['Северный Хогсакер','Hypentelium nigricans','northern-hogsucker'],
        ['Черный Красный конь','Moxostoma duquesnei','black-redhorse'],['Золотой Редхорс','Moxostoma erythrurum','golden-redhorse'],['Короткоголовый рыжий конь','Moxostoma macrolepidotum','shorthead-redhorse'],
        ['Большой Редхорс','Moxostoma valenciennesi','greater-redhorse'],['Серебряная красная лошадь','Moxostoma anisurum','silver-redhorse'],['Синяя присоска','Cycleptus elongatus','blue-sucker']
      ]
    },
    {
      env: 'Freshwater', habitat: 'Теплые озера, пруды, медленно текущие реки, поймы и заросшие растительностью заводи',
      baits: 'Видозависимый; черви, насекомые, мелкая рыба, ракообразные, готовые наживки или небольшие приманки.',
      season: 'Чаще всего проявляет активность в теплые месяцы; ознакомьтесь с местными правилами.',
      fish: [
        ['Длинноухая рыба-солнечник','Lepomis megalotis','longear-sunfish'],['Оранжевопятнистая рыба-луна','Lepomis humilis','orangespotted-sunfish'],['Красногрудая рыба-луна','Lepomis auritus','redbreast-sunfish'],
        ['Долларовая рыба-луна','Lepomis marginatus','dollar-sunfish'],['Бантамская рыба-луна','Lepomis symmetricus','bantam-sunfish'],['Грязевая рыба-луна','Acantharchus pomotis','mud-sunfish'],
        ['флаер','Centrarchus macropterus','flier'],['Теневой бас','Ambloplites ariommus','shadow-bass'],['Сакраменто Перч','Archoplites interruptus','sacramento-perch'],
        ['Желтый бык','Ameiurus natalis','yellow-bullhead'],['Коричневый бычок','Ameiurus nebulosus','brown-bullhead'],['Белый сом','Ameiurus catus','white-catfish'],
        ['Каменный кот','Noturus flavus','stonecat'],['Головастик Мэдтом','Noturus gyrinus','tadpole-madtom'],['Улитка Бычок','Ameiurus brunneus','snail-bullhead'],
        ['Пиратский окунь','Aphredoderus sayanus','pirate-perch'],['Болотная рыба','Chologaster cornuta','swampfish'],['Центральный Мадминноу','Umbra limi','central-mudminnow'],
        ['Олимпийский Мадминноу','Novumbra hubbsi','olympic-mudminnow'],['Американский Пикерель','Esox americanus','american-pickerel'],['Аляска Черная рыба','Dallia pectoralis','alaska-blackfish'],
        ['Брук Сильверсайд','Labidesthes sicculus','brook-silverside'],['Внутренний Сильверсайд','Menidia beryllina','inland-silverside'],['Рыба-москит','Gambusia affinis','mosquitofish'],
        ['Парусник Молли','Poecilia latipinna','sailfin-molly'],['Шипсхед Минноу','Cyprinodon variegatus','sheepshead-minnow'],['Киллифиш из дождевой воды','Lucania parva','rainwater-killifish'],
        ['Муммичог','Fundulus heteroclitus','mummichog'],['Полосатый киллифиш','Fundulus diaphanus','banded-killifish'],['Голубая киллифиш','Lucania goodei','bluefin-killifish'],
        ['Логперч','Percina caprodes','logperch'],['Джонни Дартер','Etheostoma nigrum','johnny-darter'],['Радужный дартер','Etheostoma caeruleum','rainbow-darter'],
        ['Айова Дартер','Etheostoma exile','iowa-darter'],['Веерообразное стрелок','Etheostoma flabellare','fantail-darter'],['Гринсайд Дартер','Etheostoma blennioides','greenside-darter'],
        ['Блэксайд Дартер','Percina maculata','blackside-darter'],['Канал Дартер','Percina copelandi','channel-darter'],['Желтоперый Фингал','Notropis lutipinnis','yellowfin-shiner'],
        ['Озарк Минноу','Notropis nubilus','ozark-minnow'],['Розоволицый Фингал','Notropis rubellus','rosyface-shiner'],['Спотфин Фингал','Cyprinella spiloptera','spotfin-shiner']
      ]
    },
    {
      env: 'Freshwater', habitat: 'Тропические и субтропические реки, озера, водохранилища и пойменные местообитания',
      baits: 'Видозависимый; растительный материал, насекомые, ракообразные, мелкая рыба, наживки из теста или искусственные приманки.',
      season: 'Зависит от климата, уровня воды и местных правил.',
      fish: [
        ['Нильская Тилапия','Oreochromis niloticus','nile-tilapia'],['Голубая Тилапия','Oreochromis aureus','blue-tilapia'],['Мозамбикская Тилапия','Oreochromis mossambicus','mozambique-tilapia'],
        ['Краснобрюхая Тилапия','Coptodon zillii','redbelly-tilapia'],['Оскар','Astronotus ocellatus','oscar'],['Павлиньи окуни','Cichla ocellaris','peacock-bass'],
        ['Бабочка Павлин Бас','Cichla orinocensis','butterfly-peacock-bass'],['Ягуар Цихлида','Parachromis managuensis','jaguar-cichlid'],['Мидас цихлида','Amphilophus citrinellus','midas-cichlid'],
        ['Майя цихлида','Mayaheros urophthalmus','mayan-cichlid'],['Черная Акара','Cichlasoma bimaculatum','black-acara'],['Голубая Акара','Andinoacara pulcher','blue-acara'],
        ['Дискус','Symphysodon discus','discus'],['Пресноводная рыба-ангел','Pterophyllum scalare','freshwater-angelfish'],['Осужденная цихлида','Amatitlania nigrofasciata','convict-cichlid'],
        ['Арапайма','Arapaima gigas','arapaima'],['Серебряная Арована','Osteoglossum bicirrhosum','silver-arowana'],['Рыба-клоун-нож','Chitala ornata','clown-knifefish'],
        ['Гигантский гурами','Osphronemus goramy','giant-gourami'],['Целующийся гурами','Helostoma temminckii','kissing-gourami'],['Змеиный гурами','Trichopodus pectoralis','snakeskin-gourami'],
        ['Гигантский змееголов','Channa micropeltes','giant-snakehead'],['Северный змееголов','Channa argus','northern-snakehead'],['Полосатый змееголов','Channa striata','striped-snakehead'],
        ['Ходячий сом','Clarias batrachus','walking-catfish'],['Североафриканский сом','Clarias gariepinus','north-african-catfish'],['Краснохвостый сом','Phractocephalus hemioliopterus','redtail-catfish'],
        ['Тигровый лопатоносый сом','Pseudoplatystoma fasciatum','tiger-shovelnose-catfish'],['Зубатка-рипса','Oxydoras niger','ripsaw-catfish'],['Пиктус Сом','Pimelodus pictus','pictus-catfish'],
        ['Радужный акулий сом','Pangasianodon hypophthalmus','iridescent-shark-catfish'],['Меконгский гигантский сом','Pangasianodon gigas','mekong-giant-catfish'],['Вельсский сом','Silurus glanis','wels-catfish'],
        ['Тамбаки','Colossoma macropomum','tambaqui'],['паку','Piaractus mesopotamicus','pacu'],['Краснобрюхая пиранья','Pygocentrus nattereri','red-bellied-piranha'],
        ['Пайара','Hydrolycus scomberoides','payara'],['Золотой дорадо','Salminus brasiliensis','golden-dorado'],['Тигровая рыба','Hydrocynus vittatus','tigerfish'],
        ['Голиаф-тигр','Hydrocynus goliath','goliath-tigerfish'],['Гигантский Барб','Catlocarpio siamensis','giant-barb'],['Роху','Labeo rohita','rohu']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Коралловые рифы, скалистые рифы, лагуны и расположенные поблизости прибрежные сооружения',
      baits: 'Видозависимый; креветки, крабы, моллюски, мелкая рыба, приманки, воблеры или мухи',
      season: 'Различаются в зависимости от региона, цикла нереста и правил рыболовства.',
      fish: [
        ['Нассауский групер','Epinephelus striatus','nassau-grouper'],['Кляп-группер','Mycteroperca microlepis','gag-grouper'],['Черный окунь','Mycteroperca bonaci','black-grouper'],
        ['Красный окунь','Epinephelus morio','red-grouper'],['Варшавский групер','Hyporthodus nigritus','warsaw-grouper'],['Голиаф-Группер','Epinephelus itajara','goliath-grouper'],
        ['Окунь-скамп','Mycteroperca phenax','scamp-grouper'],['Снежный окунь','Hyporthodus niveatus','snowy-grouper'],['Желтокрайний окунь','Hyporthodus flavolimbatus','yellowedge-grouper'],
        ['Бараний луциан','Lutjanus analis','mutton-snapper'],['Мангровый луциан','Lutjanus griseus','mangrove-snapper'],['Лейн Снаппер','Lutjanus synagris','lane-snapper'],
        ['Кубера Снаппер','Lutjanus cyanopterus','cubera-snapper'],['Собака Снаппер','Lutjanus jocu','dog-snapper'],['Шелковый луциан','Lutjanus vivanus','silk-snapper'],
        ['Вермилион Снаппер','Rhomboplites aurorubens','vermilion-snapper'],['Школьный учитель Снаппер','Lutjanus apodus','schoolmaster-snapper'],['Окунь красного дерева','Lutjanus mahogoni','mahogany-snapper'],
        ['Королева триггера','Balistes vetula','queen-triggerfish'],['Серый спинорог','Balistes capriscus','gray-triggerfish'],['Океанский спинорог','Canthidermis sufflamen','ocean-triggerfish'],
        ['Краснохвостый спинорог','Xanthichthys mento','redtail-triggerfish'],['Титан-триггер','Balistoides viridescens','titan-triggerfish'],['Пикассо Триггер','Rhinecanthus aculeatus','picasso-triggerfish'],
        ['Стоп-сигнал-попугай','Sparisoma viride','stoplight-parrotfish'],['Радужная рыба-попугай','Scarus guacamaia','rainbow-parrotfish'],['Королева-попугай','Scarus vetula','queen-parrotfish'],
        ['Полночная рыба-попугай','Scarus coelestinus','midnight-parrotfish'],['Рыба-попугай','Bolbometopon muricatum','bumphead-parrotfish'],['Принцесса-попугай','Scarus taeniopterus','princess-parrotfish'],
        ['Свинья','Lachnolaimus maximus','hogfish'],['Калифорнийская овчарка','Semicossyphus pulcher','california-sheephead'],['Баллан Врассе','Labrus bergylta','ballan-wrasse'],
        ['Кукушка губан','Labrus mixtus','cuckoo-wrasse'],['Губан-чистильщик Bluestreak','Labroides dimidiatus','bluestreak-cleaner-wrasse'],['Наполеон Врасс','Cheilinus undulatus','napoleon-wrasse'],
        ['Французский ангел','Pomacanthus paru','french-angelfish'],['Королева-ангел','Holacanthus ciliaris','queen-angelfish'],['Серая рыба-ангел','Pomacanthus arcuatus','gray-angelfish'],
        ['Императорская рыба-ангел','Pomacanthus imperator','emperor-angelfish'],['Рок-красота','Holacanthus tricolor','rock-beauty'],['Меднополосая рыба-бабочка','Chelmon rostratus','copperband-butterflyfish']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Прибрежные заливы, эстуарии, пляжи, пирсы, рифы и воды континентального шельфа.',
      baits: 'Видозависимый; наживка, кальмары, креветки, крабы, черви, приманки, ложки, воблеры или мушки',
      season: 'Зависит от миграции, температуры, региона и регулирования.',
      fish: [
        ['Атлантический тарпон','Megalops atlanticus','atlantic-tarpon'],['Индо-Тихоокеанский тарпон','Megalops cyprinoides','indo-pacific-tarpon'],['Обыкновенный снук','Centropomus undecimalis','common-snook'],
        ['Жирный Снук','Centropomus parallelus','fat-snook'],['Мечеспайн Снук','Centropomus ensiferus','swordspine-snook'],['Атлантическое разрешение','Trachinotus falcatus','atlantic-permit'],
        ['Флорида Помпано','Trachinotus carolinus','florida-pompano'],['Паломета','Trachinotus goodei','palometa'],['Большой Янтарный Джек','Seriola dumerili','greater-amberjack'],
        ['Малый Янтарный Джек','Seriola fasciata','lesser-amberjack'],['Альмако Джек','Seriola rivoliana','almaco-jack'],['Креваль Джек','Caranx hippos','crevalle-jack'],
        ['Конский глаз Джек','Caranx latus','horse-eye-jack'],['Синий бегун','Caranx crysos','blue-runner'],['Африканский помпано','Alectis ciliaris','african-pompano'],
        ['Обзор','Selene vomer','lookdown'],['Атлантическая рыба-луна','Selene setapinnis','atlantic-moonfish'],['божья коровка','Elops saurus','ladyfish'],
        ['Костяная рыба','Albula vulpes','bonefish'],['Атлантический Нитьплавник','Polydactylus octonemus','atlantic-threadfin'],['тройной хвост','Lobotes surinamensis','tripletail'],
        ['Кобия','Rachycentron canadum','cobia'],['Атлантическая лопатка','Chaetodipterus faber','atlantic-spadefish'],['Тихоокеанская лопата','Chaetodipterus zonatus','pacific-spadefish'],
        ['Атлантическая рыба-игла','Strongylura marina','atlantic-needlefish'],['Гончая рыба','Tylosurus crocodilus','houndfish'],['Баллиху','Hemiramphus brasiliensis','ballyhoo'],
        ['Атлантическая летучая рыба','Cheilopogon melanurus','atlantic-flyingfish'],['Калифорнийская летучая рыба','Cheilopogon pinnatibarbatus californicus','california-flyingfish'],['Полосатая кефаль','Mugil cephalus','striped-mullet'],
        ['Белая кефаль','Mugil curema','white-mullet'],['Атлантический Менхаден','Brevoortia tyrannus','atlantic-menhaden'],['Галф Менхаден','Brevoortia patronus','gulf-menhaden'],
        ['Тихоокеанская сардина','Sardinops sagax','pacific-sardine'],['Европейская сардина','Sardina pilchardus','european-pilchard'],['Северный анчоус','Engraulis mordax','northern-anchovy'],
        ['Атлантическая сельдь','Clupea harengus','atlantic-herring'],['Тихоокеанская сельдь','Clupea pallasii','pacific-herring'],['Мойва','Mallotus villosus','capelin'],
        ['Скумбрия атлантическая','Scomber scombrus','atlantic-mackerel'],['Тихоокеанская скумбрия','Scomber japonicus','pacific-chub-mackerel'],['Джек Макрель','Trachurus symmetricus','jack-mackerel']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Открытый океан, прибрежные отмели, границы течений, подводные горы и глубоководные пелагические зоны.',
      baits: 'Видозависимый; троллинговые приманки, живая или мертвая наживка, кальмары, приманки, попперы или мушки',
      season: 'Высоко мигрирующие; их доступность варьируется в зависимости от течения, температуры и погодных условий.',
      fish: [
        ['Черноперый тунец','Thunnus atlanticus','blackfin-tuna'],['Длиннохвостый тунец','Thunnus tonggol','longtail-tuna'],['Южный голубой тунец','Thunnus maccoyii','southern-bluefin-tuna'],
        ['Атлантический голубой марлин','Makaira nigricans','atlantic-blue-marlin'],['Черный Марлин','Istiompax indica','black-marlin'],['Белый Марлин','Kajikia albida','white-marlin'],
        ['Короткоклювая рыба-копьеносец','Tetrapturus angustirostris','shortbill-spearfish'],['Длинноклювая копьеносная рыба','Tetrapturus pfluegeri','longbill-spearfish'],['Средиземноморская копья','Tetrapturus belone','mediterranean-spearfish'],
        ['Индо-Тихоокеанский парусник','Istiophorus platypterus','indo-pacific-sailfish'],['Большая Барракуда','Sphyraena barracuda','great-barracuda'],['Тихоокеанская барракуда','Sphyraena argentea','pacific-barracuda'],
        ['Эсколар','Lepidocybium flavobrunneum','escolar'],['Масляная рыба','Ruvettus pretiosus','oilfish'],['Опа','Lampris guttatus','opah'],
        ['Океанская рыба-луна','Mola mola','ocean-sunfish'],['Острый хвост Мола','Masturus lanceolatus','sharptail-mola'],['Стройная рыба-луна','Ranzania laevis','slender-sunfish'],
        ['Синяя акула','Prionace glauca','blue-shark'],['Короткоплавник Мако','Isurus oxyrinchus','shortfin-mako'],['Длинноперый Мако','Isurus paucus','longfin-mako'],
        ['порбигль','Lamna nasus','porbeagle'],['Лососевая акула','Lamna ditropis','salmon-shark'],['Океаническая белоперая акула','Carcharhinus longimanus','oceanic-whitetip-shark'],
        ['Шелковистая акула','Carcharhinus falciformis','silky-shark'],['Большеглазый молотилка','Alopias superciliosus','bigeye-thresher'],['Обычная молотилка','Alopias vulpinus','common-thresher'],
        ['Пелагическая молотилка','Alopias pelagicus','pelagic-thresher'],['Китовая акула','Rhincodon typus','whale-shark'],['Гигантская акула','Cetorhinus maximus','basking-shark'],
        ['Манта Рэй','Mobula birostris','manta-ray'],['Чилийский дьявольский луч','Mobula tarapacana','chilean-devil-ray'],['Пелагический скат','Pteroplatytrygon violacea','pelagic-stingray'],
        ['Атлантический Помфрет','Brama brama','atlantic-pomfret'],['Пасифик Помфрет','Brama japonica','pacific-pomfret'],['Лувар','Luvarus imperialis','louvar']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Скалистое дно, рифы, заросли водорослей, затонувшие корабли и местообитания на континентальном шельфе или склоне.',
      baits: 'Видозависимый; кальмары, рыбные полоски, ракообразные, донные оснастки, приспособления или мягкий пластик',
      season: 'Глубина и сроки действия разрешенных разрешений различаются; ознакомьтесь с действующими региональными правилами.',
      fish: [
        ['Желтохвостый морской окунь','Sebastes flavidus','yellowtail-rockfish'],['Вдова Морской окунь','Sebastes entomelas','widow-rockfish'],['Черножаберный морской окунь','Sebastes melanostomus','blackgill-rockfish'],
        ['Темнопятнистый морской окунь','Sebastes crameri','darkblotched-rockfish'],['Розовый окунь','Sebastes rosaceus','rosy-rockfish'],['Тигровый морской окунь','Sebastes nigrocinctus','tiger-rockfish'],
        ['Пометить Морской окунь','Sebastes rubrivinctus','flag-rockfish'],['Древесина','Sebastes serriceps','treefish'],['Келп Окунь','Sebastes atrovirens','kelp-rockfish'],
        ['Травяной морской окунь','Sebastes rastrelliger','grass-rockfish'],['Банк Рокфиш','Sebastes rufus','bank-rockfish'],['Чилипперский морской окунь','Sebastes goodei','chilipepper-rockfish'],
        ['Ковкод','Sebastes levis','cowcod'],['Тихоокеанский окунь','Sebastes alutus','pacific-ocean-perch'],['Шортрейкер Рокфиш','Sebastes borealis','shortraker-rockfish'],
        ['Желторотый морской окунь','Sebastes reedi','yellowmouth-rockfish'],['Серебристо-серый морской окунь','Sebastes brevispinis','silvergray-rockfish'],['Полосатый морской окунь','Sebastes saxicola','stripetail-rockfish'],
        ['Петрале Соле','Eopsetta jordani','petrale-sole'],['Дувр Соле','Microstomus pacificus','dover-sole'],['Английская подошва','Parophrys vetulus','english-sole'],
        ['Рекс Соле','Glyptocephalus zachirus','rex-sole'],['Рок Подошва','Lepidopsetta bilineata','rock-sole'],['Звездная камбала','Platichthys stellatus','starry-flounder'],
        ['Стрелозубая камбала','Atheresthes stomias','arrowtooth-flounder'],['Гренландский палтус','Reinhardtius hippoglossoides','greenland-halibut'],['Американская камбала','Hippoglossoides platessoides','american-plaice'],
        ['Желтохвостая камбала','Limanda ferruginea','yellowtail-flounder'],['Зимняя камбала','Pseudopleuronectes americanus','winter-flounder'],['Ведьма Камбала','Glyptocephalus cynoglossus','witch-flounder'],
        ['Красный Хек','Urophycis chuss','red-hake'],['Белый Хек','Urophycis tenuis','white-hake'],['Серебряный Хек','Merluccius bilinearis','silver-hake'],
        ['Тихоокеанский хек','Merluccius productus','pacific-hake'],['Синий Линг','Molva dypterygia','blue-ling'],['Куск','Brosme brosme','cusk']
      ]
    },
    {
      env: 'Saltwater', habitat: 'В зависимости от вида, это прибрежный шельф, риф, песок, ил, заросли морской травы или эстуарные местообитания.',
      baits: 'Видозависимый; ракообразные, моллюски, черви, мелкая рыба, наживка или искусственные приманки',
      season: 'Различаются в зависимости от региона и нормативных актов.',
      fish: [
        ['Атлантическая рыба-волк','Anarhichas lupus','atlantic-wolffish'],['Пятнистая рыба-волк','Anarhichas minor','spotted-wolffish'],['Океан Надутый','Zoarces americanus','ocean-pout'],
        ['Атлантический пинагор','Cyclopterus lumpus','atlantic-lumpfish'],['Тихоокеанский колючий пижон','Eumicrotremus orbis','pacific-spiny-lumpsucker'],['Кульпин','Myoxocephalus scorpius','sculpin'],
        ['Тихоокеанский оленерогий бык','Leptocottus armatus','pacific-staghorn-sculpin'],['Длиннорогий бычок','Myoxocephalus octodecemspinosus','longhorn-sculpin'],['Морской ворон','Hemitripterus americanus','sea-raven'],
        ['Атлантическая Сайра','Scomberesox saurus','atlantic-saury'],['Тихоокеанская сайра','Cololabis saira','pacific-saury'],['Песочное копье','Ammodytes americanus','sand-lance'],
        ['Тихоокеанское песчаное копье','Ammodytes hexapterus','pacific-sand-lance'],['Кафельфиш','Lopholatilus chamaeleonticeps','tilefish'],['Голубая кафельная рыба','Caulolatilus microps','blueline-tilefish'],
        ['Золотая плитка','Lopholatilus chamaeleonticeps','golden-tilefish'],['Северный фугу','Sphoeroides maculatus','northern-puffer'],['Южный фугу','Sphoeroides nephelus','southern-puffer'],
        ['Клетчатый пуховик','Sphoeroides testudineus','checkered-puffer'],['Рыба-дикобраз','Diodon hystrix','porcupinefish'],['Воздушный шар','Diodon holocanthus','balloonfish'],
        ['Гладкая рыба-хобот','Lactophrys triqueter','smooth-trunkfish'],['Нацарапанная коровья рыба','Acanthostracion quadricornis','scrawled-cowfish'],['Пятнистая рыба-хобот','Lactophrys bicaudalis','spotted-trunkfish'],
        ['Ремора','Remora remora','remora'],['Шарксакер','Echeneis naucrates','sharksucker'],['Атлантическая абордажная рыба','Trichiurus lepturus','atlantic-cutlassfish'],
        ['Ленточная рыба','Trachipterus arcticus','ribbonfish'],['Король лосося','Trachipterus altivelis','king-of-the-salmon'],['Весла','Regalecus glesne','oarfish'],
        ['Атлантический звездочёт','Uranoscopus scaber','atlantic-stargazer'],['Северный звездочет','Astroscopus guttatus','northern-stargazer'],['Песчаная плитка','Malacanthus plumieri','sand-tilefish'],
        ['Атлантическая ящерица','Synodus saurus','atlantic-lizardfish'],['Прибрежная ящерица','Synodus foetens','inshore-lizardfish'],['Рифовый горбыль','Ophioscion punctatissimus','reef-croaker']
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
  try { document.dispatchEvent(new Event('обогащенный bsf-db')); } catch (_) {}
})();
