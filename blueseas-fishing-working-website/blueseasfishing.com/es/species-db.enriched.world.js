/* BlueSeas — World enrichment pack (multiregion)

   Safe merge: fills missing fields; adds new species if not present.

   Fields: name, sci, env, habitat, baits, season, regions, depth?, alias?, img?

*/

(function(){

  const ENRICHED = [

    // ===== North America — Freshwater (adds or fills) =====

    {name:"Trucha de lago", slug: "lake-trout", sci:"Salvelinus namaycush", env:"Freshwater",

     habitat:"Lagos profundos y fríos; cuencas, jorobas, puntas del lago principal.",

     baits:"Tubos de jigging, swimbaits, cucharas, cebos muertos",

     season:"Temporada de hielo profunda; manantial poco profundo; termoclina de verano",

     regions:["Grandes Lagos (MI/ON)", "Garganta Llameante (UT/WY)", "lagos del Escudo de Ontario", "Lago Tahoe (California/Nevada)"]},



    {name:"Salmón Kokanee", slug: "kokanee-salmon", sci:"Oncorhynchus nerka (sin acceso al mar)", env:"Freshwater",

     habitat:"Pelágicos, formando cardúmenes en cuencas profundas; termoclina de verano.",

     baits:"Dodger + hoochie/maíz, cucharadas pequeñas",

     season:"Primavera-Verano",

     regions:["Garganta Llameante (UT/WY)", "Wallowa (Oregón)", "Estampida (California)", "lagos interiores de la Columbia Británica"]},



    {name:"salmón rojo", slug: "sockeye-salmon", sci:"Oncorhynchus nerka", env:"Freshwater",

     habitat:"Ríos + lagos durante las carreras; salidas del lago.",

     baits:"Moscas (escasas al estilo macabí), cucharas pequeñas",

     season:"Summer runs",

     regions:["Bahía de Bristol (Alaska)", "Sistema Fraser (Columbia Británica)"]},



    {name:"Salmón Rosado", slug: "pink-salmon", sci:"Oncorhynchus gorbuscha", env:"Freshwater",

     habitat:"Marea para bajar los ríos; carriles de circulación cerca de la costa.",

     baits:"Cucharas pequeñas, hilanderos, plantillas.",

     season:"Carreras de verano en años impares (muchas áreas)",

     regions:["Estrecho de Puget (WA)", "sureste de Alaska", "ríos costeros de la Columbia Británica"]},



    {name:"salmón chum", slug: "chum-salmon", sci:"Oncorhynchus keta", env:"Freshwater",

     habitat:"Ríos más bajos, pantanos de marea.",

     baits:"Jigs, hilanderos, moscas llamativas",

     season:"Late fall",

     regions:["sureste de Alaska", "Estrecho de Puget (WA)", "ríos de la Columbia Británica"]},



    {name:"trucha toro", slug: "bull-trout", sci:"Salvelinus confluentus", env:"Freshwater",

     habitat:"Sistemas fluviales fríos e interconectados; migratorios; pozas profundas.",

     baits:"Serpentinas grandes, cebos de baño, cucharas.",

     season:"Primavera-otoño (donde esté abierto)",

     regions:["Ríos de Alberta/Columbia Británica", "Sistemas de Idaho/Montana"]},



    {name:"Tímalo ártico", slug: "arctic-grayling", sci:"Thymallus arcticus", env:"Freshwater",

     habitat:"Ríos/lagos fríos y claros; rifles y piscinas.",

     baits:"Moscas secas, pequeños spinners, microcucharas.",

     season:"Verano – Principios de otoño",

     regions:["Alaska interior", "Territorios del Noroeste/Yukón", "Montana high country"]},



    {name:"tipo de pez blanco", slug: "white-crappie", sci:"Pomoxis annularis", env:"Freshwater",

     habitat:"Maleza/madera en pie; reservorios manchados.",

     baits:"Plantillas pequeñas, pececillos, cuchillas.",

     season:"Preparación previa al desove a finales del invierno; desove de primavera; escuelas de otoño",

     regions:["Mississippi reservoirs", "Oklahoma lakes", "Lago Kentucky"]},



    {name:"Perca amarilla", slug: "yellow-perch", sci:"Perca flavescens", env:"Freshwater",

     habitat:"Bordes de maleza, llanos de media profundidad, escuelas de cuencas.",

     baits:"Plantillas pequeñas, cucharas, pececillos",

     season:"Todo el año; hielo privilegiado y primavera/otoño",

     regions:["lagos del Alto Medio Oeste", "Lago Simcoe (Ontario)"]},



    {name:"Bagre azul", slug: "blue-catfish", sci:"Ictalurus furcatus", env:"Freshwater",

     habitat:"Grandes ríos; repisas de canal; represas.",

     baits:"Sábalo cortado, listado, cebo vivo",

     season:"Picadura de noche de verano; agujeros profundos de invierno",

     regions:["Río James (Virginia)", "Río Misisipi", "Santee Cooper (SC)"]},



    {name:"Bagre de cabeza plana", slug: "flathead-catfish", sci:"Pylodictis olivaris", env:"Freshwater",

     habitat:"Atascos, agujeros profundos, curvas exteriores.",

     baits:"agallas azules/sábalos vivos; cebos de río grande",

     season:"Meses cálidos (noche); caer durante el día en la corriente",

     regions:["Embalses/ríos de Kansas", "Río Ohio", "Canales de Arizona (introducidos)"]},



    {name:"Cocodrilo Gar", slug: "alligator-gar", sci:"Atractosteus spatula", env:"Freshwater",

     habitat:"Remansos, pantanos, ríos lentos.",

     baits:"Cebo vivo/cortado; señuelos de cuerda (enredo de dientes)",

     season:"Warm months",

     regions:["Río Trinidad (TX)", "Pantanos costeros de Texas/Luisiana"]},



    {name:"Pickerel de cadena", slug: "chain-pickerel", sci:"Esox niger", env:"Freshwater",

     habitat:"Bahías llenas de maleza, remansos.",

     baits:"Spinnerbaits, cucharas, Jerkbaits",

     season:"Primavera-otoño; invierno en el sur",

     regions:["Estanques/lagos del sureste de Estados Unidos", "arroyos de marea del Atlántico medio"]},



    // ===== NA — Inshore/Coastal =====

    {name:"tambor negro", slug: "black-drum", sci:"Pogonias cromis", env:"Saltwater",

     habitat:"Barras de ostras, canales, cortes de surf; embarcaderos.",

     baits:"Cangrejo, camarones, cebo cortado; plantillas",

     season:"Todo el año; grandes tambores de primavera",

     regions:["Laguna Madre (TX)", "Louisiana marshes", "Laguna de Mosquitos (Florida)", "Bancos externos (Carolina del Norte)"]},



    {name:"cabeza de oveja", slug: "sheepshead", sci:"Archosargus probatocephalus", env:"Saltwater",

     habitat:"Pilotes, embarcaderos, criaderos de ostras.",

     baits:"Cangrejos violinistas, camarones, percebes",

     season:"Pico de finales de invierno-primavera",

     regions:["puentes/entradas de Florida", "Louisiana marshes", "Muelles de Texas"]},



    {name:"Lubina Negra", slug: "black-sea-bass", sci:"Centropristis striata", env:"Saltwater",

     habitat:"Naufragios/arrecifes costeros, repisas.",

     baits:"Jiggings, tiras de calamar, almejas",

     season:"Primavera-otoño (la profundidad cambia con la temperatura)",

     regions:["Arrecifes de Nueva Jersey y Massachusetts", "Naufragios en Chesapeake/Virginia"]},



    {name:"Tautog (pez negro)", slug: "tautog-blackfish", sci:"Tautoga onitis", env:"Saltwater",

     habitat:"Montones de rocas, pecios, embarcaderos.",

     baits:"Cangrejos verdes, cangrejos asiáticos en jigs",

     season:"Primavera y finales de otoño",

     regions:["Naufragios/arrecifes en Rhode Island, Connecticut y Nueva York", "Muelles de Nueva Jersey"]},



    {name:"Pescado azul", slug: "bluefish", sci:"Pomatomus saltatrix", env:"Saltwater",

     habitat:"Olas, ensenadas, bombardeos en escuelas de cebo.",

     baits:"Metales, aguas superficiales, nadadores; cortar el cebo",

     season:"Migraciones de primavera a otoño",

     regions:["Surf entre Nueva York y Massachusetts", "Nueva Jersey destroza", "Bancos externos (Carolina del Norte)"]},



    {name:"Caballa del Atlántico", slug: "atlantic-mackerel", sci:"Scomber scombrus", env:"Saltwater",

     habitat:"Escuelas cercanas a la costa/en alta mar; bordes de estructuras.",

     baits:"Sabikis, pequeños metales, plumas.",

     season:"Primavera-principios de verano",

     regions:["golfo de maine", "Costas del Reino Unido/Irlanda (también en el paquete de la UE)"]},



    {name:"Falso atún blanco (bacoreta)", slug: "false-albacore-little-tunny", sci:"Euthynnus alletteratus", env:"Saltwater",

     habitat:"Ataques cerca de la costa contra peces pequeños de cristal; corrientes de resaca.",

     baits:"Plantillas de epoxi, metales, moscas pequeñas.",

     season:"Finales de verano - Otoño",

     regions:["Cape Cod–NJ (carrera de otoño)", "Bancos externos (Carolina del Norte)"]},



    {name:"Cabeza de oveja de California", slug: "california-sheephead", sci:"Semicossyphus pulcher", env:"Saltwater",

     habitat:"Lechos de algas, arrecifes, estructuras rocosas.",

     baits:"Crabs/shrimp, squid; jigs",

     season:"Todo el año (mejor verano/otoño)",

     regions:["Líneas de algas marinas del sur de California", "Islas del Canal (CA)"]},



    {name:"Bajo de algas marinas (calicó)", slug: "kelp-calico-bass", sci:"Paralabrax clathratus", env:"Saltwater",

     habitat:"Bordes de algas, rocas caldera, puertos.",

     baits:"Swimbaits, planchas de superficie, plásticos.",

     season:"Finales de primavera-otoño",

     regions:["Catalina/Palos Verdes (California)", "Algas marinas de La Jolla (California)"]},



    {name:"Pez roca bermellón", slug: "vermilion-rockfish", sci:"Sebastes miniatus", env:"Saltwater",

     habitat:"Arrecifes/rebordes profundos; fondo duro.",

     baits:"Jigs, aparejos de cebo, lanzamiento lento",

     season:"Open seasons vary",

     regions:["Monterey/Carmel (California)", "Arrecifes de Oregón/Washington"]},



    {name:"Cabezón", slug: "cabezon", sci:"Scorpaenichthys marmoratus", env:"Saltwater",

     habitat:"Arrecifes rocosos poco profundos, bolsas de algas marinas.",

     baits:"Jigs con cebo, swimbaits",

     season:"Rockfish seasons",

     regions:["Centro/Norte de California, Oregón, Washington"]},



    // ===== Offshore — Pelagics (global use) =====

    {name:"Atún Aleta Amarilla", slug: "yellowfin-tuna", sci:"Thunnus albacares", env:"Saltwater",

     habitat:"Agua azul, cambios de temperatura, bordes actuales.",

     baits:"Plumas de curricán, plugs de cedro, poppers, cebo vivo.",

     season:"Meses de aguas cálidas; migraciones estacionales",

     regions:["Costa del sur de California/Baja", "Corriente del Golfo de Florida", "El canario es.", "bancos del Océano Índico"]},



    {name:"Atún Rojo", slug: "bluefin-tuna", sci:"Thunnus thynnus", env:"Saltwater",

     habitat:"Concentraciones de cebo en alta mar; bordes de los estantes.",

     baits:"Stickbaits, poppers, jigs, cebos vivos; propagación troleada",

     season:"Varía (primavera-otoño en NA/UE)",

     regions:["Cabo Cod/Golfo de Maine", "Bancos externos (Carolina del Norte)", "Mediterráneo"]},



    {name:"peto", slug: "wahoo", sci:"Acanthocybium solandri", env:"Saltwater",

     habitat:"Desniveles pronunciados, pasos de estructuras de alta velocidad.",

     baits:"Trolling de alta velocidad, buceadores profundos, jigs.",

     season:"Estaciones cálidas; mareas lunares",

     regions:["Bahamas/Estrecho de Florida", "Baja peninsula", "Hawaii ledges"]},



    {name:"Marlín azul", slug: "blue-marlin", sci:"Makaira nigricans", env:"Saltwater",

     habitat:"Agua azul profunda cerca de los montes submarinos; concentraciones de cebo.",

     baits:"Señuelos trollados, teasers + cebos de lanzamiento",

     season:"Estaciones cálidas tropicales/subtropicales",

     regions:["Azores", "Madeira", "Corriente del Golfo de las Bahamas", "Cabo San Lucas (México)"]},



    {name:"pez vela", slug: "sailfish", sci:"Istiophorus platypterus", env:"Saltwater",

     habitat:"Bordes/líneas de malezas; escuelas de cebo; cambios de color.",

     baits:"Ballyhoose trolleado, teasers de dragado, cebos de lanzamiento",

     season:"invierno FL/Caribe; estacional en otro lugar",

     regions:["Palm Beach–Islamorada (Florida)", "Guatemala", "Costa Rica Pacífico"]},



    {name:"Pez espada", slug: "swordfish", sci:"Xiphias gladius", env:"Saltwater",

     habitat:"Estructura de caída profunda; Migraciones verticales diurnas.",

     baits:"Calamar de caída profunda, tácticas de boya/deriva",

     season:"Noche de verano; caída profunda durante todo el año en algunas áreas",

     regions:["Cayos de Florida", "Cañones del sur de California", "Med canyons"]},



    // ===== Europe (fresh + salt) =====

    {name:"Salmón del Atlántico", slug: "atlantic-salmon", sci:"Salmo salar", env:"Freshwater",

     habitat:"Rápidos, pozas, corrientes; ríos salmoneros clásicos.",

     baits:"Mosca (alas de pelo, tubos), hilanderos, cucharas.",

     season:"Varía según el río; primavera-otoño",

     regions:["Gaula de Noruega", "Escocia Spey/Dee", "Iceland rivers", "Rusia Kola"]},



    {name:"lucioperca", slug: "zander", sci:"Sander lucioperca", env:"Freshwater",

     habitat:"Ríos lentos y lagos profundos; estructura/bordes.",

     baits:"Jigged shads, crankbaits, cebo vivo",

     season:"Primavera-otoño; noche en verano",

     regions:["Cuencas del Báltico/Elba/Danubio", "Embalses del Reino Unido (con reservas de agua)"]},



    {name:"perca europea", slug: "european-perch", sci:"Perca fluviatilis", env:"Freshwater",

     habitat:"Riberas con maleza, muelles, canales; bancos de depredadores.",

     baits:"Pequeños plásticos blandos, hilanderos, dropshot.",

     season:"Todo el año; mejor primavera/otoño",

     regions:["Canales/lagos del Reino Unido", "Scandinavia lakes", "ríos de la UE central"]},



    {name:"tenca", slug: "tench", sci:"Tinca tinca", env:"Freshwater",

     habitat:"Aguas tranquilas con maleza; márgenes; activas durante los meses cálidos.",

     baits:"Gusanos, maíz, pan, Boilies (método alimentador)",

     season:"Finales de primavera-verano",

     regions:["Aguas tranquilas y canales del Reino Unido y la UE"]},



    {name:"barbo", slug: "barbel", sci:"Barbus barbus", env:"Freshwater",

     habitat:"Tramos de grava, ríos rápidos; en el fondo.",

     baits:"Pellets, Boilies, Carne, Queso; plataformas de alimentación",

     season:"Verano-otoño",

     regions:["Río Wye/Trent/Severn (Reino Unido)", "Rin/Sena/Danubio"]},



    {name:"cacho europeo", slug: "european-chub", sci:"Squalius cephalus", env:"Freshwater",

     habitat:"Ríos con vegetación; bordes; pozas de puentes.",

     baits:"Pan, gusanos, pequeños señuelos, moscas.",

     season:"Pesca a la vista en aguas claras y poco profundas durante todo el año.",

     regions:["Ríos y canales del Reino Unido y la UE"]},



    {name:"Lubina europea", slug: "european-seabass", sci:"Dicentrarchus labrax", env:"Saltwater",

     habitat:"Playas para surfear, estuarios, formaciones rocosas.",

     baits:"Plásticos blandos, tapones de superficie, metales, cebos.",

     season:"Finales de primavera-otoño",

     regions:["Costas atlánticas del Reino Unido, Irlanda y Francia", "Mediterranean harbors"]},



    {name:"Dorada", slug: "gilthead-seabream", sci:"Sparus aurata", env:"Saltwater",

     habitat:"Bahías rocosas/arenosas del Mediterráneo; puertos.",

     baits:"Cangrejo, camarones, mariscos; plantillas pequeñas",

     season:"Warm months",

     regions:["Costas de España, Italia y Grecia"]},



    {name:"Bacalao del Atlántico", slug: "atlantic-cod", sci:"Gadus morhua", env:"Saltwater",

     habitat:"Bancos, pecios, arrecifes; agua más fría.",

     baits:"Jigs, aparejos de cebo (almejas/calamares), pirañas",

     season:"Invierno-primavera en muchas zonas",

     regions:["Norway fjords", "Islandia", "Naufragios británicos en el Mar del Norte"]},



    {name:"abadejo", slug: "pollack", sci:"Pollachius pollachius", env:"Saltwater",

     habitat:"Marcas rocosas cubiertas de algas, restos de naufragios; perseguidores a media profundidad.",

     baits:"Shads en jigheads, metales",

     season:"Primavera-otoño",

     regions:["Costa atlántica del Reino Unido/Irlanda", "Bretaña"]},



    {name:"rodaballo", slug: "turbot", sci:"Scophthalmus maximus", env:"Saltwater",

     habitat:"Bancos arenosos cerca de las zonas de mareas; playas para practicar surf.",

     baits:"Tiras de pescado, lanzón; arrastrando cucharas",

     season:"Primavera-verano",

     regions:["bancos del Mar del Norte", "Biscay beaches"]},



    // ===== Australia / New Zealand / Pacific =====

    {name:"barramundi", slug: "barramundi", sci:"Lates calcarifer", env:"Brackish",

     habitat:"Arroyos de manglares, troncos sumergidos, desagües; embalses.",

     baits:"Cuerpos duros, vibraciones suaves, cebos para nadar; salmonete vivo",

     season:"Acumulación de agua durante la temporada de lluvias tropicales; embalses durante todo el año.",

     regions:["Arroyos mareales del Territorio del Norte/Queensland (Australia)", "Lagunas de Kakadu (AU)", "Presas del extremo norte"]},



    {name:"Bacalao Murray", slug: "murray-cod", sci:"Maccullochella peelii", env:"Freshwater",

     habitat:"Grandes obstáculos en el río, bancos de rocas; ataques por emboscada.",

     baits:"Grandes swimbaits, wakebaits, spinnerbaits",

     season:"Cerrado en primavera (AU); temporada alta verano/otoño",

     regions:["Cuenca Murray-Darling (AU)"]},



    {name:"Bajo australiano", slug: "australian-bass", sci:"Macquaria novemaculeata", env:"Freshwater",

     habitat:"Ríos de la costa este; zonas con obstáculos y rápidos; agua salobre en invierno.",

     baits:"Caminantes de superficie, spinnerbaits, plásticos",

     season:"Superficie de verano; escuela salobre de invierno",

     regions:["Ríos de Nueva Gales del Sur y Queensland (Australia)"]},



    {name:"Cabeza plana oscura", slug: "dusky-flathead", sci:"Platycephalus fuscus", env:"Saltwater",

     habitat:"Llanuras arenosas, desagües y desniveles en los estuarios; lugar para apostarse y emboscar.",

     baits:"Plásticos blandos, vibraciones, señuelos para gambas.",

     season:"Primavera-otoño",

     regions:["Estuarios de Nueva Gales del Sur y Queensland (Australia)"]},



    {name:"Pargo (Australasia)", slug: "snapper-australasian", sci:"Pagrus auratus", env:"Saltwater",

     habitat:"Arrecifes, bancos de mejillones, canales; cardúmenes de carnada.",

     baits:"Softbaits, micro-jigs, aparejos de contabilidad",

     season:"Desove de primavera; preparación otoñal",

     regions:["Golfo de Hauraki (Nueva Zelanda)", "Arrecifes de SA/VIC (AU)"]},



    {name:"Pez rey cola amarilla", slug: "yellowtail-kingfish", sci:"Seriola lalandi", env:"Saltwater",

     habitat:"Puntos de anclaje, bordes de corrientes, repisas de algas.",

     baits:"Cebos vivos, stickbaits de superficie, jigs",

     season:"Verano-otoño",

     regions:["Bahía de las Islas (Nueva Zelanda)", "costa sur de Nueva Gales del Sur (Australia)"]},



    {name:"Jurel gigante (GT)", slug: "giant-trevally-gt", sci:"Caranx ignobilis", env:"Saltwater",

     habitat:"bordes de arrecifes, formaciones rocosas, rompientes.",

     baits:"Grandes poppers, stickbaits, jigs",

     season:"Tropical warm months",

     regions:["atolones del Mar del Coral", "Maldivas", "Seychelles"]},



    {name:"Caballa Española", slug: "spanish-mackerel", sci:"Scomberomorus commerson", env:"Saltwater",

     habitat:"Promontorios, puntas de arrecifes, escuelas de cebo.",

     baits:"Pececillos trollados, rodajas de metal, cebos vivos.",

     season:"Warm months",

     regions:["Queensland/Norte de Australia", "PNG/Indonesia"]},



    // ===== Asia =====

    {name:"Mahseer (dorado)", slug: "mahseer-golden", sci:"Tor putitora", env:"Freshwater",

     habitat:"Ríos de las estribaciones; corrientes rápidas/pozas; migratorios.",

     baits:"Cucharas, cucharillas, tapones; masa/cebos en algunas regiones",

     season:"Descenso posterior al monzón; despeje de la baja presión invernal",

     regions:["ríos del Himalaya indio", "Nepal foothills"]},



    {name:"Cabeza de serpiente (gigante)", slug: "snakehead-giant", sci:"Channa micropeltes", env:"Freshwater",

     habitat:"Lagos/canales invadidos por maleza; depredador de emboscada.",

     baits:"Ranas, cebos, cebos para nadar; cebo vivo",

     season:"Crecida en la temporada de lluvias; pesca a la vista en aguas bajas",

     regions:["Embalses de Malasia/Tailandia", "Borneo lakes"]},



    {name:"Rohu", slug: "rohu", sci:"Labeo rohita", env:"Freshwater",

     habitat:"Grandes ríos, estanques, embalses.",

     baits:"Masa/attas, maíz, pan; alimentadores de método",

     season:"Meses cálidos; dependiente del monzón",

     regions:["Cuenca del Ganges (IN/BD)", "Pakistan canals"]},



    {name:"Bagre gigante del Mekong", slug: "giant-mekong-catfish", sci:"Pangasianodon gigas", env:"Freshwater",

     habitat:"Grandes cauces fluviales; pozos profundos; embalses (con peces).",

     baits:"Métodos de pellets/cebo; vivir/cortar en algunas áreas",

     season:"Varía; suele ser en meses cálidos.",

     regions:["Cuenca del Mekong (TH/LA/VN/CN)"]},



    {name:"carpa siamesa", slug: "siamese-carp", sci:"Catlocarpio siamensis", env:"Freshwater",

     habitat:"Llanuras aluviales, embalses (con peces).",

     baits:"Boilies/pellets/método; aparejo pesado",

     season:"Warm months",

     regions:["Embalses/pesquerías de Tailandia"]},



    // ===== Africa =====

    {name:"Perca del Nilo", slug: "nile-perch", sci:"Lates niloticus", env:"Freshwater",

     habitat:"Estructura del lago/río, desniveles; emboscada.",

     baits:"Swimbaits profundos, cebos vivos, tapones para curricán",

     season:"Estaciones secas; poca luz",

     regions:["Lago Victoria (EA)", "Lago Nasser (EG)"]},



    {name:"pez tigre", slug: "tigerfish", sci:"Hydrocynus vittatus", env:"Freshwater",

     habitat:"Ríos rápidos; bancos de arena/remolinos; tramos despejados.",

     baits:"Cucharas, cucharillas, pececillos; líderes de alambre",

     season:"Temporada seca (caudales más bajos y claros)",

     regions:["Zambezi, Okavango (BW/NA/ZM)"]},



    {name:"Pez amarillo (boca pequeña)", slug: "yellowfish-smallmouth", sci:"Labeobarbus aeneus", env:"Freshwater",

     habitat:"Rápidos/corrientes; pesca a la vista; mosca/señuelo.",

     baits:"Ninfas, pequeñas manivelas, plásticos blandos.",

     season:"Primavera-otoño",

     regions:["Río Vaal (Sudáfrica)"]},



    {name:"galjoen", slug: "galjoen", sci:"Dichistius capensis", env:"Saltwater",

     habitat:"Plataformas rocosas para la práctica del surf en Sudáfrica; aguas bravas.",

     baits:"Cebo rojo/mejillones; plantillas pequeñas",

     season:"Invierno-primavera (agua más fría)",

     regions:["Playas rocosas del Cabo Occidental (Sudáfrica)"]},



    {name:"Kob (oscuro/manchado)", slug: "kob-dusky-spotted", sci:"Argyrosomus japonicus", env:"Saltwater",

     habitat:"Pozas de oleaje, desembocaduras de ríos, estuarios.",

     baits:"Salmonetes vivos, plásticos blandos, colas de caballo",

     season:"Otoño-invierno (regional)",

     regions:["costa sudafricana", "Australia Occidental (como Mulloway)"]},



    // ===== South America / Caribbean =====

    {name:"Pavo real", slug: "peacock-bass", sci:"Cichla temensis", env:"Freshwater",

     habitat:"Bosques inundados, lagunas; oleaje explosivo en la superficie.",

     baits:"Grandes cebos de utilería, stickbaits, jigs",

     season:"Temporada seca (bajo nivel de agua)",

     regions:["Río Negro (BR)", "Orinoco (VE/CO)"]},



    {name:"dorado dorado", slug: "golden-dorado", sci:"Salminus brasiliensis", env:"Freshwater",

     habitat:"Descensos rápidos, vetas de roca; estructura pesada.",

     baits:"Serpentinas, Jerkbaits, Cucharas (líder de alambre)",

     season:"Primavera-otoño (regional)",

     regions:["Marisma ibera (AR)", "Bolivia jungle rivers", "Río Uruguay"]},



    {name:"pacú", slug: "pacu", sci:"Colosoma/Piaractus spp.", env:"Freshwater",

     habitat:"Ríos lentos, bosques inundados.",

     baits:"Fruit, nuts, corn, pellets; flies",

     season:"Caída de frutos por exceso de agua; meses cálidos",

     regions:["Cuenca amazónica (BR/PE/BO)"]},



    {name:"Piraíba (Lau Lau)", slug: "pira-ba-lau-lau", sci:"Brachyplatystoma filamentosum", env:"Freshwater",

     habitat:"Canales profundos del Amazonas; confluencias.",

     baits:"Cebos cortados enormes; aparejo pesado",

     season:"Varía según el río; a menudo, aguas en caída.",

     regions:["Amazon principal (BR)"]},



    {name:"Payara (pez vampiro)", slug: "payara-vampire-fish", sci:"Hydrolycus scomberoides", env:"Freshwater",

     habitat:"Recintos rocosos rápidos y saltos de agua; agua oxigenada.",

     baits:"Cucharas grandes, jigs, stickbaits; grandes serpentinas",

     season:"Lower water periods",

     regions:["Tribus del Orinoco/Amazonas (VE/CO/BR)"]},



    {name:"pez hueso", slug: "bonefish", sci:"Albula vulpes", env:"Saltwater",

     habitat:"Llanuras poco profundas, hierba marina, arena.",

     baits:"Moscas para camarones pequeños, jigs",

     season:"Clima tropical todo el año; clave de mareas y ángulo solar.",

     regions:["bahamas", "Cayos de Florida", "Yucatán"]},



    {name:"Permiso", slug: "permit", sci:"Trachinotus falcatus", env:"Saltwater",

     habitat:"Aguas poco profundas; peces que se aferran a la cola; cautelosos.",

     baits:"Moscas cangrejo, jigs pequeños; cangrejos vivos",

     season:"Primavera-otoño (ventanas de mareas)",

     regions:["Belice", "Yucatán", "Llaves"]},

  ];



  function mergeEnrichment(){

    const db = Array.isArray(window.SPECIES_DB) ? window.SPECIES_DB : (window.SPECIES_DB = []);

    const norm = x => String(x||"").toLowerCase().trim();

    const isEmpty = v => v==null || (typeof v==="cadena" && !v.trim()) || (Array.isArray(v)&&!v.length);

    const keys = ["ambiente","hábitat","cebos","estación","profundidad","alias","imagen","regiones"];



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
