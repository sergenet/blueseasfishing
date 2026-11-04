/* BlueSeas — World enrichment pack (multiregion)

   Safe merge: fills missing fields; adds new species if not present.

   Fields: name, sci, env, habitat, baits, season, regions, depth?, alias?, img?

*/

(function(){

  const ENRICHED = [

    // ===== North America — Freshwater (adds or fills) =====

    {name:"озерная форель", slug: "lake-trout", sci:"Salvelinus namaycush", env:"Freshwater",

     habitat:"Глубокие холодные озера; бассейны главных озер, горбы, точки.",

     baits:"Трубки для отсадки, плавки, ложки, мертвая приманка",

     season:"Ледниковый период глубокий; весенний мелкий; летний термоклин",

     regions:["Великие озера (MI/ON)", "Огненное ущелье (UT/WY)", "Озера Онтарио Шилд", "Озеро Тахоэ, Калифорния/ НевадаComment"]},



    {name:"Кокани Лосось", slug: "kokanee-salmon", sci:"Oncorhynchus nerka (не имеет выхода к морю)", env:"Freshwater",

     habitat:"Пелагический, образование над глубокими бассейнами; летний термоклин.",

     baits:"Плут + хучи/кукуруза, маленькие ложки",

     season:"Весна Лето",

     regions:["Огненное ущелье (UT/WY)", "Валлова (штат Орегон)", "Стампид (Калифорния)", "Внутренние озера Британской Колумбии"]},



    {name:"Нерка", slug: "sockeye-salmon", sci:"Oncorhynchus nerka", env:"Freshwater",

     habitat:"Реки + озера во время пробежек; выходы из озер.",

     baits:"Мухи (редкие), маленькие ложки",

     season:"Summer runs",

     regions:["Бристольский залив (Аляска)", "Система Fraser (BC)"]},



    {name:"Розовый Salmon", slug: "pink-salmon", sci:"Oncorhynchus gorbuscha", env:"Freshwater",

     habitat:"От прилива до нижних рек; полосы движения у берега.",

     baits:"Маленькие ложки, прядильщики, джиги",

     season:"Летние пробежки с нечетным годом (многие районы)",

     regions:["Пьюджет-Саунд (Вашингтон)", "Юго-Восточная Аляска", "BC прибрежные реки"]},



    {name:"Кета", slug: "chum-salmon", sci:"Oncorhynchus keta", env:"Freshwater",

     habitat:"Нижние реки, приливные шероховатости.",

     baits:"Джиги, спиннеры, кричащие мухи",

     season:"Late fall",

     regions:["Юго-Восточная Аляска", "Пьюджет-Саунд (Вашингтон)", "Реки Британской Колумбии"]},



    {name:"Бычья форель", slug: "bull-trout", sci:"Salvelinus confluentus", env:"Freshwater",

     habitat:"Холодные, связанные речные системы; мигрирующие; глубокие бассейны.",

     baits:"Крупные стримеры, купальники, ложки",

     season:"Весна-осень (где открыто)",

     regions:["Реки Альберта/Британская Колумбия", "Системы Айдахо/Монтана"]},



    {name:"Арктический хариус", slug: "arctic-grayling", sci:"Thymallus arcticus", env:"Freshwater",

     habitat:"Холодные чистые реки/озера; винтовки и бассейны.",

     baits:"Сухие мухи, маленькие прядильщики, микро ложки",

     season:"Лето - ранняя осень",

     regions:["Alaska interior", "СЗТ/Юкон", "Montana high country"]},



    {name:"белый краппи", slug: "white-crappie", sci:"Pomoxis annularis", env:"Freshwater",

     habitat:"Щетка/стоячая древесина; окрашенные резервуары.",

     baits:"Маленькие кондукторы, песчинки, лезвия",

     season:"Постановка Prespawn в конце зимы; весенний нерест; осенние школы",

     regions:["Mississippi reservoirs", "Oklahoma lakes", "Кентукки-Лейк"]},



    {name:"желтый окунь", slug: "yellow-perch", sci:"Perca flavescens", env:"Freshwater",

     habitat:"Края сорняков, среднеглубокие квартиры, бассейновые косяки.",

     baits:"Маленькие джиги, ложки, пески",

     season:"Круглый год; основной лед и весна/осень",

     regions:["Озера Верхнего Среднего Запада", "Озеро Симко (ON)"]},



    {name:"Синий сом", slug: "blue-catfish", sci:"Ictalurus furcatus", env:"Freshwater",

     habitat:"Большие реки; русловые уступы; дамбы.",

     baits:"Cut shad, skipjack, живая приманка",

     season:"Летний ночной укус; зимние глубокие ямы",

     regions:["Джеймс-Ривер (Вирджиния)", "река Миссисипи", "Санти Купер (Южная Каролина)"]},



    {name:"плоскоголовый сом", slug: "flathead-catfish", sci:"Pylodictis olivaris", env:"Freshwater",

     habitat:"Завалы, глубокие отверстия, наружные изгибы.",

     baits:"Живые синежаберные/теневые; большие речные приманки",

     season:"Теплые месяцы (ночь); осеннее дневное время в текущем",

     regions:["Водохранилища/реки Канзаса", "Огайо", "Каналы AZ (введены)"]},



    {name:"Аллигатор Гар", slug: "alligator-gar", sci:"Atractosteus spatula", env:"Freshwater",

     habitat:"Заводи, заливные, медленные реки.",

     baits:"Живая/разрезанная приманка; веревочные приманки (клубок зубов)",

     season:"Warm months",

     regions:["Тринити-Ривер (Техас)", "Coastal TX/LA Bayous"]},



    {name:"Цепной кирилл", slug: "chain-pickerel", sci:"Esox niger", env:"Freshwater",

     habitat:"Сорные бухты, заводи.",

     baits:"Спиннербейты, ложки, джеркбейты",

     season:"Весна-осень; зима на юге",

     regions:["Юго-восточные пруды/озера США", "Среднеатлантические приливные ручьи"]},



    // ===== NA — Inshore/Coastal =====

    {name:"Черный барабан", slug: "black-drum", sci:"Pogonias cromis", env:"Saltwater",

     habitat:"Устричные батончики, каналы, срезы для серфинга; причалы.",

     baits:"Краб, креветка, наживка; джиги",

     season:"Круглый год; пружинные большие барабаны",

     regions:["Лагуна-Мадре (Техас)", "Louisiana marshes", "Москитная лагуна (Флорида)", "Внешние банки (NC)"]},



    {name:"Шипсхед", slug: "sheepshead", sci:"Archosargus probatocephalus", env:"Saltwater",

     habitat:"Пилинги, причалы, устричные клумбы.",

     baits:"Скрипач крабы, креветки, ракушки",

     season:"Поздний зимне-весенний пик",

     regions:["FL мосты/впускные отверстия", "Louisiana marshes", "Причалы TX"]},



    {name:"Черное море", slug: "black-sea-bass", sci:"Centropristis striata", env:"Saltwater",

     habitat:"Береговые затонувшие корабли/рифы, уступы.",

     baits:"Джиги, полоски кальмара, моллюски",

     season:"Весна-осень (сдвиги глубины с температурой)",

     regions:["Рифы NJ-MA", "Затонувшие корабли в Чесапике/Вирджинии"]},



    {name:"Таутог (черная рыба)", slug: "tautog-blackfish", sci:"Tautoga onitis", env:"Saltwater",

     habitat:"Каменные сваи, затонувшие корабли, причалы.",

     baits:"Зеленые крабы, азиатские крабы на джигах",

     season:"Весна и поздняя осень прайм",

     regions:["RI/CT/NY затонувшие корабли/рифы", "Причалы Нью-Джерси"]},



    {name:"луфарь", slug: "bluefish", sci:"Pomatomus saltatrix", env:"Saltwater",

     habitat:"Серфинг-рипы, заливы, блицы на приманках.",

     baits:"Металлы, верхняя вода, пловцы; разрезанная приманка",

     season:"Весенне-осенние миграции",

     regions:["NY–MA Surf", "NJ RIPS", "Внешние банки (NC)"]},



    {name:"Скумбрия атлантическая", slug: "atlantic-mackerel", sci:"Scomber scombrus", env:"Saltwater",

     habitat:"Школы на берегу/в море; края конструкции.",

     baits:"Сабики, мелкие металлы, перья",

     season:"Весна-начало лета",

     regions:["Залив Мэн", "UK/IE Coasts (также в пакете ЕС)"]},



    {name:"Ложный альбакор (маленький танни)", slug: "false-albacore-little-tunny", sci:"Euthynnus alletteratus", env:"Saltwater",

     habitat:"Прибрежные блицы на стеклянных песках; разрывы.",

     baits:"Эпоксидные приспособления, металлы, мелкие мухи",

     season:"Конец лета-осень",

     regions:["Кейп-Код, штат Нью-Джерси (осенний пробег)", "Внешние банки (NC)"]},



    {name:"Калифорнийская овчарка", slug: "california-sheephead", sci:"Semicossyphus pulcher", env:"Saltwater",

     habitat:"Ложа водорослей, рифы, скалистое строение.",

     baits:"Crabs/shrimp, squid; jigs",

     season:"Круглый год (лучшее лето/осень)",

     regions:["Линии водорослей SoCal", "Нормандские острова (CA)"]},



    {name:"Ламинария (калико) окунь", slug: "kelp-calico-bass", sci:"Paralabrax clathratus", env:"Saltwater",

     habitat:"Края водорослей, котельные породы, гавани.",

     baits:"Swimbaits, поверхностные утюги, пластмассы",

     season:"Поздняя весна-осень",

     regions:["Каталина/Палос-Вердес (Калифорния)", "Ла-Хойя (Калифорния)"]},



    {name:"Вермилион", slug: "vermilion-rockfish", sci:"Sebastes miniatus", env:"Saltwater",

     habitat:"Глубокие рифы/выступы; твердое дно.",

     baits:"Кондукторы, приманки, медленный шаг",

     season:"Open seasons vary",

     regions:["Монтерей/Кармель (Калифорния)", "Рифы штата Орегон/Вашингтон"]},



    {name:"Кабезон", slug: "cabezon", sci:"Scorpaenichthys marmoratus", env:"Saltwater",

     habitat:"Мелкие скалистые рифы, карманы ламинарии.",

     baits:"Джиги с приманкой, плавки",

     season:"Rockfish seasons",

     regions:["Центральный/Северный CA, OR, WA"]},



    // ===== Offshore — Pelagics (global use) =====

    {name:"Желтоперый тунец", slug: "yellowfin-tuna", sci:"Thunnus albacares", env:"Saltwater",

     habitat:"Синяя вода, температурные перерывы, текущие края.",

     baits:"Троллинговые перья, кедровые пробки, попперсы, живая приманка",

     season:"Тепловодные месяцы; сезонные миграции",

     regions:["SoCal/Baja оффшор", "Гольфстрим во Флориде", "Канарские острова.", "Банки Индийского океана"]},



    {name:"Голубой тунец", slug: "bluefin-tuna", sci:"Thunnus thynnus", env:"Saltwater",

     habitat:"Концентрации морской приманки; края шельфа.",

     baits:"Приманки, попперы, джиги, живая приманка; троллинговый спред",

     season:"Различается (весна-осень в NA/EU)",

     regions:["Кейп-Код/залив Мэн", "Внешние банки (NC)", "Средиземноморская"]},



    {name:"Ваху", slug: "wahoo", sci:"Acanthocybium solandri", env:"Saltwater",

     habitat:"Крутые высадки, скоростные проходы конструкции.",

     baits:"Высокоскоростной троллинг, дайверы, джиги",

     season:"Теплые сезоны; лунные приливы",

     regions:["Багамские острова/Флоридский пролив", "Baja peninsula", "Hawaii ledges"]},



    {name:"Голубой марлин", slug: "blue-marlin", sci:"Makaira nigricans", env:"Saltwater",

     habitat:"Глубокая голубая вода вблизи подводных гор; концентрации приманки.",

     baits:"Троллинговые приманки, тизеры + смоляные приманки",

     season:"Тропические/субтропические теплые сезоны",

     regions:["Азорские о-ва", "Мадейра", "Гольфстрим Багамские острова", "Кабо-Сан-Лукас (Мексика)"]},



    {name:"Парусник", slug: "sailfish", sci:"Istiophorus platypterus", env:"Saltwater",

     habitat:"Края/линии сорняков; косяки приманки; изменение цвета.",

     baits:"Троллинговый баллиху, дноуглубительные тизеры, питч-приманки",

     season:"Зимний Флорида/Карибы; сезонный в других местах",

     regions:["Палм-Бич-Исламорада (Флорида)", "Гватемала", "Коста-Рика Тихоокеанский регион"]},



    {name:"Меченос", slug: "swordfish", sci:"Xiphias gladius", env:"Saltwater",

     habitat:"Структура глубокого падения; суточные вертикальные миграции.",

     baits:"Глубоководный кальмар, тактика буя/дрейфа",

     season:"Ночное лето; дневное глубокое падение круглый год в некоторых районах",

     regions:["Флорида-Кис", "Каньоны SoCal", "Med canyons"]},



    // ===== Europe (fresh + salt) =====

    {name:"Атлантика Salmon", slug: "atlantic-salmon", sci:"Salmo salar", env:"Freshwater",

     habitat:"Риффлы, бассейны, трассы; классические лососевые реки.",

     baits:"Муха (волосяные крылья, трубки), прядильщики, ложки",

     season:"Различается по реке; весна-осень",

     regions:["Норвежская гаула", "Шотландия Спей/Ди", "Iceland rivers", "Россия Кольская"]},



    {name:"Обыкновенный судак", slug: "zander", sci:"Sander lucioperca", env:"Freshwater",

     habitat:"Медленные реки и глубокие озера; структура/края.",

     baits:"Джиггированные шейды, приманки, живая приманка",

     season:"Весна-осень; ночь летом",

     regions:["Балтийский/Эльбский/Дунайский бассейны", "Британские резервуары (укомплектованные)"]},



    {name:"Европейский окунь", slug: "european-perch", sci:"Perca fluviatilis", env:"Freshwater",

     habitat:"Сорняки, пирсы, каналы; косяки хищников.",

     baits:"Небольшие мягкие пластмассы, прядильщики, дропшот",

     season:"Круглый год; лучшая весна/осень",

     regions:["Каналы/озера Великобритании", "Scandinavia lakes", "Центральные реки ЕС"]},



    {name:"линь", slug: "tench", sci:"Tinca tinca", env:"Freshwater",

     habitat:"Сорные тихие воды; края; активные теплые месяцы.",

     baits:"Черви, кукуруза, хлеб, котлы (способ подачи)",

     season:"Весна Лето",

     regions:["Тихие воды и каналы Великобритании/ЕС"]},



    {name:"усач обыкновенный", slug: "barbel", sci:"Barbus barbus", env:"Freshwater",

     habitat:"Гравийные течения, быстрые реки; на дне.",

     baits:"Пеллеты, котлы, мясо, сыр; фидерные установки",

     season:"Лето-осень",

     regions:["Ривер-Уай/Трент/Северн (Великобритания)", "Рейн/Сена/Дунай"]},



    {name:"Европейский голавль", slug: "european-chub", sci:"Squalius cephalus", env:"Freshwater",

     habitat:"Реки с покрытием; борта; мостовые бассейны.",

     baits:"Хлеб, черви, мелкие приманки, мухи",

     season:"Круглогодично; малопрозрачная рыбалка с прицелом",

     regions:["Реки и каналы Великобритании/ЕС"]},



    {name:"Лаврак", slug: "european-seabass", sci:"Dicentrarchus labrax", env:"Saltwater",

     habitat:"Пляжи для серфинга, эстуарии, скалы.",

     baits:"Мягкие пластмассы, поверхностные пробки, металлы, приманки",

     season:"Поздняя весна-осень",

     regions:["Атлантическое побережье Великобритании/IE/FR", "Mediterranean harbors"]},



    {name:"LESHCH MORSKOI", slug: "gilthead-seabream", sci:"Sparus aurata", env:"Saltwater",

     habitat:"Средиземноморские скалистые/песчаные бухты; гавани.",

     baits:"Краб, креветки, моллюски; маленькие джиги",

     season:"Warm months",

     regions:["Испания/Италия/побережье Греции"]},



    {name:"атлантическая треска", slug: "atlantic-cod", sci:"Gadus morhua", env:"Saltwater",

     habitat:"Берега, затонувшие корабли, рифы; более холодная вода.",

     baits:"Джиги, приманки (моллюски/кальмары), пирки",

     season:"Зима-весна во многих районах",

     regions:["Norway fjords", "Исландия", "Затонувшие корабли в Северном море Великобритании"]},



    {name:"поллак", slug: "pollack", sci:"Pollachius pollachius", env:"Saltwater",

     habitat:"Следы от водорослей, затонувшие корабли; охотники за водорослями.",

     baits:"Затенения на джиг-головках, металлы",

     season:"ВЕСНА, ОСЕНЬ",

     regions:["Великобритания/IE Атлантическое побережье", "Бриттани"]},



    {name:"Тюрбо", slug: "turbot", sci:"Scophthalmus maximus", env:"Saltwater",

     habitat:"Песчаные берега рядом с приливными трассами; пляжи для серфинга.",

     baits:"Рыбные полоски, сандели; ложки для волочения",

     season:"Весна Лето",

     regions:["Берега Северного моря", "Biscay beaches"]},



    // ===== Australia / New Zealand / Pacific =====

    {name:"Латес", slug: "barramundi", sci:"Lates calcarifer", env:"Brackish",

     habitat:"Мангровые ручьи, коряги, водостоки; водохранилища.",

     baits:"Твердые тела, мягкие вибрации, плавки; живая кефаль",

     season:"Строительство тропического сезона дождей; водохранилища круглый год",

     regions:["Приливные ручьи NT/QLD (AU)", "Заводи Какаду (Австралия)", "Плотины верхнего конца"]},



    {name:"муррейская треска", slug: "murray-cod", sci:"Maccullochella peelii", env:"Freshwater",

     habitat:"Большие речные коряги, скальные бары; засады.",

     baits:"Большие плавки, вейкбейты, спиннербейты",

     season:"Закрыто весной (AU); лучшее лето/осень",

     regions:["МЕЖДУРЕЧЬЕ МУРРЕЯ И ДАРЛИНГА"]},



    {name:"Австралийский бас", slug: "australian-bass", sci:"Macquaria novemaculeata", env:"Freshwater",

     habitat:"Реки восточного побережья; коряги/пороги; солоноватые зимой.",

     baits:"Поверхностные ходунки, спиннербейты, пластмассы",

     season:"Летняя поверхность; зимняя солоноватая",

     regions:["Реки NSW/QLD (AU)"]},



    {name:"темный плоскоголов", slug: "dusky-flathead", sci:"Platycephalus fuscus", env:"Saltwater",

     habitat:"Лиманные песчаные равнины, дренажи, высадки; сидеть-и-амбуш.",

     baits:"Мягкие пластики, вибрации, креветочные приманки",

     season:"ВЕСНА, ОСЕНЬ",

     regions:["Лиманы Нового Южного Уэльса/QLD (Австралия)"]},



    {name:"Снэппер (австралазийский)", slug: "snapper-australasian", sci:"Pagrus auratus", env:"Saltwater",

     habitat:"Рифы, мидийные грядки, каналы; косяки приманки.",

     baits:"Мягкие приманки, микроджиги, леджерные оснастки",

     season:"Весеннее нерест; осенние отработки",

     regions:["Залив Хаураки (Новая Зеландия)", "Рифы SA/VIC (Австралия)"]},



    {name:"Желтохвостый кингфил", slug: "yellowtail-kingfish", sci:"Seriola lalandi", env:"Saltwater",

     habitat:"Штифты, токовые кромки, уступы водорослей.",

     baits:"Живые приманки, приманки для верхней воды, джиги",

     season:"Лето, Осень.",

     regions:["Залив Островов (Новая Зеландия)", "Южное побережье Нового Южного Уэльса (Австралия)"]},



    {name:"Гигант Тревалли (GT)", slug: "giant-trevally-gt", sci:"Caranx ignobilis", env:"Saltwater",

     habitat:"Края рифов, бомжи, перерывы для серфинга.",

     baits:"Большие попперсы, приманки, джиги",

     season:"Tropical warm months",

     regions:["Атоллы Кораллового моря", "Мальдивы", "Сейшельские острова"]},



    {name:"Испанская скумбрия", slug: "spanish-mackerel", sci:"Scomberomorus commerson", env:"Saltwater",

     habitat:"Мысы, рифовые точки, школы приманок.",

     baits:"Троллинговые пески, металлические ломтики, живые приманки",

     season:"Warm months",

     regions:["Квинсленд/Северная Австралия", "PNG/Индонезия"]},



    // ===== Asia =====

    {name:"Mahseer (Золотой)", slug: "mahseer-golden", sci:"Tor putitora", env:"Freshwater",

     habitat:"Предгорные реки; быстрые трассы/бассейны; мигрирующие.",

     baits:"Ложки, прядильщики, пробки; тесто/приманки в некоторых регионах",

     season:"Постмуссонное падение; зима низкая прозрачность",

     regions:["Реки Индийских Гималаев", "Nepal foothills"]},



    {name:"Змееголовый (Гигант)", slug: "snakehead-giant", sci:"Channa micropeltes", env:"Freshwater",

     habitat:"Удушенные сорняками озера/каналы; хищник из засады.",

     baits:"Лягушки, камышовки, купальницы; живая приманка",

     season:"Влажный сезон, высокая вода; маловодная рыбалка с прицелом",

     regions:["Водохранилища Малайзия/Таиланд", "Borneo lakes"]},



    {name:"Роху", slug: "rohu", sci:"Labeo rohita", env:"Freshwater",

     habitat:"Крупные реки, пруды, водохранилища.",

     baits:"Тесто/атта, кукуруза, хлеб; кормушки",

     season:"Теплые месяцы; зависит от муссонов",

     regions:["Бассейн Ганга (IN/BD)", "Pakistan canals"]},



    {name:"Гигантский меконгский сом", slug: "giant-mekong-catfish", sci:"Pangasianodon gigas", env:"Freshwater",

     habitat:"Крупные русла рек; глубокие скважины; водохранилища (зарыбленные).",

     baits:"Методы гранулирования/земляной приманки; живые/разрезанные на некоторых участках",

     season:"Различается; часто теплые месяцы",

     regions:["Бассейн Меконга (TH/LA/VN/CN)"]},



    {name:"Сиамский карп", slug: "siamese-carp", sci:"Catlocarpio siamensis", env:"Freshwater",

     habitat:"Поймы, водохранилища (зарыбленные).",

     baits:"Котлы/гранулы/метод; тяжелые снасти",

     season:"Warm months",

     regions:["Тайские водохранилища/рыбные промыслы"]},



    // ===== Africa =====

    {name:"нильский окунь", slug: "nile-perch", sci:"Lates niloticus", env:"Freshwater",

     habitat:"Структура озера/реки, высадки; засада.",

     baits:"Глубокие плавки, живая приманка, троллинговые пробки",

     season:"Сухие сезоны; слабая освещенность",

     regions:["Озеро Виктория (EA)", "Озеро Насер (EG)"]},



    {name:"Тигровая рыба", slug: "tigerfish", sci:"Hydrocynus vittatus", env:"Freshwater",

     habitat:"Быстрые реки; песчаные отмели/водовороты; чистые трассы.",

     baits:"Прядильщики, ложки, ломтики; проволочные выноски",

     season:"Сухой сезон (более низкие, более чистые потоки)",

     regions:["Замбези, Окаванго (BW/NA/ZM)"]},



    {name:"Желтая рыбка (Smallmouth)", slug: "yellowfish-smallmouth", sci:"Labeobarbus aeneus", env:"Freshwater",

     habitat:"Риффлз/бег; прицельная рыбалка; муха/приманка.",

     baits:"Нимфы, маленькие шатуны, мягкие пластмассы",

     season:"ВЕСНА, ОСЕНЬ",

     regions:["Река Ваал (Замбия)"]},



    {name:"Гальджоэн", slug: "galjoen", sci:"Dichistius capensis", env:"Saltwater",

     habitat:"Южноафриканские серф-рок уступы; белая вода.",

     baits:"Красная приманка/мидии; маленькие приспособления",

     season:"Зима-весна (более прохладная вода)",

     regions:["Западно-Капские скалистые пляжи (ZA)"]},



    {name:"Коб (темный/пятнистый)", slug: "kob-dusky-spotted", sci:"Argyrosomus japonicus", env:"Saltwater",

     habitat:"Серфинговые лунки, устья рек, лиманы.",

     baits:"Живая кефаль, мягкий пластик, пряжки",

     season:"Осень-зима (региональная)",

     regions:["Южноафриканское побережье", "Западная Австралия (как Маллоуэй)"]},



    // ===== South America / Caribbean =====

    {name:"Павлиньи окуни", slug: "peacock-bass", sci:"Cichla temensis", env:"Freshwater",

     habitat:"Затопленная древесина, лагуны; взрывоопасная верхняя вода.",

     baits:"Большие реквизитные приманки, приманки, джиги",

     season:"Сухой сезон (малая вода)",

     regions:["Рио-Негро (Бразилия)", "Ориноко (VE/CO)"]},



    {name:"Золотой дорадо", slug: "golden-dorado", sci:"Salminus brasiliensis", env:"Freshwater",

     habitat:"Быстрые спуски, скальные пласты; тяжелая конструкция.",

     baits:"Стримеры, джеркбейты, ложки (проволочный лидер)",

     season:"Весна-осень (региональная)",

     regions:["Болото Ибера (Арканзас)", "Bolivia jungle rivers", "река уругвай"]},



    {name:"паку", slug: "pacu", sci:"Виды Colossoma/Piaractus.", env:"Freshwater",

     habitat:"Медленные реки, затопленные леса.",

     baits:"Fruit, nuts, corn, pellets; flies",

     season:"Высокая капля плодов в воде; теплые месяцы",

     regions:["Бассейн Амазонки (BR/PE/BO)"]},



    {name:"Пираиба (Лау-Лау)", slug: "pira-ba-lau-lau", sci:"Brachyplatystoma filamentosum", env:"Freshwater",

     habitat:"Глубокие каналы Амазонки; слияния.",

     baits:"Огромные разрезанные приманки; тяжелые снасти",

     season:"Зависит от реки; часто падает вода",

     regions:["Amazon Mainstem (BR)"]},



    {name:"Пайара (Рыба-вампир)", slug: "payara-vampire-fish", sci:"Hydrolycus scomberoides", env:"Freshwater",

     habitat:"Быстрые каменистые трассы и погружения; насыщенная кислородом вода.",

     baits:"Большие ложки, джиги, приманки; большие стримеры",

     season:"Lower water periods",

     regions:["Племена Ориноко/Амазонки (VE/CO/BR)"]},



    {name:"Костяная рыба", slug: "bonefish", sci:"Albula vulpes", env:"Saltwater",

     habitat:"Мелкие ровные участки, черепашья трава, песок.",

     baits:"Мелкие мухи-креветки, джиги",

     season:"Круглогодичные тропики; приливы + солнце под углом",

     regions:["Багамские острова", "Флорида-Кис", "Юкатан"]},



    {name:"Разрешить", slug: "permit", sci:"Trachinotus falcatus", env:"Saltwater",

     habitat:"Неглубокие квартиры; хвостатая рыба; осторожно.",

     baits:"Крабовые мухи, маленькие джиги; живые крабы",

     season:"Весна-осень (приливные окна)",

     regions:["Белиз", "Юкатан", "Клавиши"]},

  ];



  function mergeEnrichment(){

    const db = Array.isArray(window.SPECIES_DB) ? window.SPECIES_DB : (window.SPECIES_DB = []);

    const norm = x => String(x||"").toLowerCase().trim();

    const isEmpty = v => v==null || (typeof v==="нить" && !v.trim()) || (Array.isArray(v)&&!v.length);

    const keys = ["окружение","среда обитания","طعمه","сезон","глубина","псевдоним","изображение","области"];



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
