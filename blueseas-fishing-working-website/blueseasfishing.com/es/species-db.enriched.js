/* BlueSeas — species DB enrichment (regions/hotspots + basics)

   - Safe merge: fills missing fields for existing species; adds new ones if absent.

   - Fields used by your gallery: name, sci, env, habitat, baits, season, regions, depth?, alias?, img?

*/

(function(){

  const ENRICHED = [

    // ===== Freshwater — Trout/Salmonids =====

    { name:"trucha arcoiris", slug: "rainbow-trout", sci:"Oncorhynchus mykiss", env:"Freshwater",

      habitat:"Ríos y lagos fríos y claros; rifles, tailouts, ensenadas.",

      baits:"Hilanderos, cucharas, manivelas pequeñas, gusanos, huevos de salmón, moscas (ninfas, serpentinas)",

      season:"Primavera-otoño; mañanas/tardes de verano; aguas residuales de invierno",

      regions:[

        "Lagos alpinos de Sierra Nevada (California)", "Deschutes + Metolius (O)", "Madison + Gallatin (MT)",

        "Aguas abajo del río Colorado (Lees Ferry, Arizona)", "Tribus de los Grandes Lagos (MI/NY/PA/ON)"

      ]},

    { name:"Trucha Marrón", slug: "brown-trout", sci:"Salmo trutta", env:"Freshwater",

      habitat:"Ríos frescos con cobertura; bancos socavados; piscinas profundas; arroyos de primavera.",

      baits:"Tapones para pececillos, Jerkbaits, Spinners, Nightcrawlers, Streamers",

      season:"Primavera-otoño; pesca nocturna en verano; aguas residuales de invierno",

      regions:[

        "Arroyos de manantial sin deriva (WI/MN/IA)", "Río Blanco (aguas de cola del río Arkansas)",

        "Pennsylvania limestone streams", "Piedras de arenisca de la Isla Sur de Nueva Zelanda", "Patagonia (AR/CL)"

      ]},

    { name:"trucha de arroyo", slug: "brook-trout", sci:"Salvelinus fontinalis", env:"Freshwater",

      habitat:"Pequeñas cabeceras frías; estanques de castores; rifles sombreados.",

      baits:"Pequeños hilanderos, moscas secas, gusanos, microcucharas.",

      season:"Finales de primavera-principios de otoño; mediodía en el país alto",

      regions:[

        "Cabeceras de los Apalaches (Carolina del Norte/Virginia/Virginia Occidental)", "Estanques de Adirondack (NY)",

        "arroyos de manantial de los Grandes Lagos superiores", "Área silvestre de Labrador (California)"

      ]},

    { name:"Trucha degolladora", slug: "cutthroat-trout", sci:"Oncorhynchus clarkii", env:"Freshwater",

      habitat:"Piedras de sillería occidentales, lagos altos; Costuras lentas, cortes.",

      baits:"Moscas secas (hoppers), pequeños hilanderos, cucharas.",

      season:"Verano-principios de otoño (pico terrestre)",

      regions:[

        "Sistema de Yellowstone (WY/MT)", "Río Snake (Wyoming)", "Lagos de alta montaña de Sierra Nevada (California)", "Cuenca de Flathead (MT)"

      ]},

    { name:"trucha arcoíris", slug: "steelhead", sci:"Oncorhynchus mykiss (anádromo)", env:"Freshwater",

      habitat:"Tramos bajos del río, remansos, estrechos; agua de marea a principios de temporada.",

      baits:"Cuentas, plantillas para flotadores, hilanderos, cucharas, moscas oscilantes.",

      season:"Carreras de invierno (diciembre-febrero) y carreras de verano (julio-octubre)",

      regions:[

        "Pícaro y Umpqua (O)", "Trinidad y Klamath (CA)", "Hoh & Bogachiel (WA)",

        "Tribus de los Grandes Lagos (MI/NY/PA/ON)"

      ]},

    { name:"Salmón Chinook", slug: "chinook-salmon", sci:"Oncorhynchus tshawytscha", env:"Freshwater",

      habitat:"Corre desde la marea hasta la mitad del río; ranuras profundas durante el día.",

      baits:"Aparejos para arenque/anchoa, hilanderos, tapones, huevas",

      season:"Carreras de otoño; saltadores en algunos sistemas",

      regions:["Río Columbia (Washington/Oregón)", "Kenai (Alaska)", "Sistema de Sacramento (CA)", "Fraser (BC)"]},

    { name:"Salmón Coho", slug: "coho-salmon", sci:"Oncorhynchus kisutch", env:"Freshwater",

      habitat:"Piscinas más lentas y bordes suaves cerca de la estructura.",

      baits:"Hilanderos, plantillas giratorias, tapones pequeños, huevas",

      season:"Otoño (septiembre-noviembre)",

      regions:["Tribus de Puget Sound (WA)", "Arroyos del sureste de Alaska", "Oregon coastal rivers", "afluentes de los Grandes Lagos"]},



    // ===== Freshwater — Warm/Coolwater =====

    { name:"Lobina negra", slug: "largemouth-bass", sci:"Micropterus salmoides", env:"Freshwater",

      habitat:"Malezas, madera, muelles, canales de arroyos; poco profundo en primavera.",

      baits:"Gusanos Senko, spinnerbaits, jigs + cangrejos, ranas, chatterbaits",

      season:"Desove (primavera), superficie del agua (amanecer/atardecer de verano), persecución del sábalo otoñal",

      regions:["Lago Okeechobee (Florida)","Lake Fork (TX)","Guntersville (Alabama)","Clear Lake (California)","Sam Rayburn (Texas)"]},

    { name:"Lobina de boca chica", slug: "smallmouth-bass", sci:"Micropterus dolomieu", env:"Freshwater",

      habitat:"Ríos/lagos rocosos; costuras actuales; puntos de grava.",

      baits:"Ned rigs, tubos, Jerkbaits, bielas, topwater walkers",

      season:"Desova a finales de la primavera; verano con jorobas profundas; carreras de cebo de otoño",

      regions:["Río San Lorenzo (Nueva York/Ontario)","Bancos de arena de los Grandes Lagos","Susquehanna (PA)","Condado de Door (Wisconsin)"]},

    { name:"lubina rayada", slug: "striped-bass", sci:"Morone saxatilis", env:"Freshwater",

      habitat:"Puntos de embalses, canales de ríos; luces del puente nocturno.",

      baits:"Cebos para nadar, bucktails, sábalos vivos, fantasmas de superficie",

      season:"Carreras de primavera; picadura de noche de verano; bombardeo de caída",

      regions:["Delta del Sac-San Joaquín (California)","Lago Texoma (OK/TX)","Río Hudson (Nueva York)","Chesapeake tributaries"]},

    { name:"Leucomas", slug: "walleye", sci:"Sander vitreus", env:"Freshwater",

      habitat:"Puntos rocosos, líneas de rotura, bordes de maleza; comederos con poca luz.",

      baits:"Jig + minnow, aparejos de cebo vivo, crankbaits, cuchillas",

      season:"Ríos de primavera después del desove; jorobas de verano; mordida de la noche de otoño",

      regions:["Lago Erie (OH/PA/ON)","Lago de los Bosques (Minnesota/Ontario)","Río Columbia (Washington)","Bahía Verde (Wisconsin)"]},

    { name:"lucio del norte", slug: "northern-pike", sci:"Esox lucius", env:"Freshwater",

      habitat:"Lechos de malezas, bahías traseras, desembocaduras de ríos; puntos de emboscada.",

      baits:"Spinnerbaits, cucharas, Jerkbaits, Swimbaits grandes",

      season:"Salida de hielo poco profunda; malezas de verano; caer gran cebo",

      regions:["Boundary Waters (Minnesota/Ontario)","Saskatchewan lakes","Alaska sloughs","Irish loughs"]},

    { name:"Salón del mosquetón", slug: "muskellunge", sci:"Esox masquinongy", env:"Freshwater",

      habitat:"Puntas, malezas, transiciones roca/madera; sigue y figura-8.",

      baits:"Double 10 bucktails, Jerkbaits, Glide Baits, Goma",

      season:"Finales de primavera-otoño; ventanas de salida/puesta de sol",

      regions:["Lago St. Clair (MI/ON)","Bahía Verde (Wisconsin)","San Lorenzo (Nueva York/Ontario)","Lago Eagle (Ontario)"]},

    { name:"agallas azules", slug: "bluegill", sci:"Lepomis macrochirus", env:"Freshwater",

      habitat:"Bordes de maleza, calas poco profundas, muelles; pisos de cama de primavera.",

      baits:"Trozos de lombrices, jigs pequeños, microplásticos, moscas.",

      season:"desove de primavera; sombra de verano; cuencas profundas de invierno",

      regions:["Estanques/lagos en todo el país (EE. UU.)","Líneas de maleza en lagos naturales","Estanques agrícolas (SE/MW)"]},

    { name:"tipo de pez negro", slug: "black-crappie", sci:"Pomoxis nigromaculatus", env:"Freshwater",

      habitat:"Montones de maleza, madera en pie, muelles; escuelas suspendidas.",

      baits:"Jigs pequeños, pececillos, microcrankbaits",

      season:"Estadificación previa al desove (finales de invierno), desove (primavera), escuelas de otoño",

      regions:["Embalses del Misisipi","Lago Kentucky","Minnesota natural lakes","Oklahoma timber reservoirs"]},

    { name:"Bagre de canal", slug: "channel-catfish", sci:"Ictalurus punctatus", env:"Freshwater",

      habitat:"Agujeros profundos, curvas exteriores, escolleras, corrientes cálidas.",

      baits:"Cebo cortado, cebo apestoso, hígado de pollo, cebo vivo",

      season:"Noches de verano; después de las lluvias; agujeros profundos de invierno",

      regions:["Río Rojo (Dakota del Norte/Minnesota)","Santee Cooper (SC)","Río Trinidad (TX)","El río Misuri corre"]},

    { name:"carpa común", slug: "common-carp", sci:"Cyprinus carpio", env:"Freshwater",

      habitat:"Marismas poco profundas, bahías cálidas, remolinos de ríos.",

      baits:"Maíz, bolitas de masa, pan, Boilies; moscas (chinches de la carpa)",

      season:"Finales de primavera-otoño (vista peces en pisos)",

      regions:["Puertos de los Grandes Lagos","Canales y ríos del Reino Unido y la UE","remansos del río Misuri","Estanques urbanos (EE. UU.)"]},



    // ===== Saltwater — Inshore/Coastal =====

    { name:"Tambor rojo (gallineta nórdica)", slug: "red-drum-redfish", sci:"Sciaenops ocellatus", env:"Saltwater",

      habitat:"Marismas, bares de ostras, llanuras, cortes de surf; marea en movimiento.",

      baits:"Cucharas de oro, colas de paleta + jigs, corcho para hacer estallar + camarones, salmonete cortado",

      season:"Todo el año; caída de encierros; lagos de invierno",

      regions:["Louisiana marshes","Laguna Madre (TX)","Mosquito/Río Indio (Florida)","Arroyos de Charleston (Carolina del Sur)"]},

    { name:"Trucha manchada", slug: "spotted-seatrout", sci:"Cynoscion nebulosus", env:"Saltwater",

      habitat:"Pisos de césped, baches, bebederos, luces de muelle.",

      baits:"Plásticos blandos, paseos en superficie, camarones bajo corcho",

      season:"Primavera-otoño; canales profundos de invierno",

      regions:["Bahía de Tampa (Florida)","Laguna Madre (TX)","Louisiana interior bays","Laguna Indian River (Florida)"]},

    { name:"róbalo", slug: "snook", sci:"Centropomus undecimalis", env:"Saltwater",

      habitat:"Puntas de manglares, puentes, pasos; márgenes de corrientes.",

      baits:"Colas de paleta, sábalos, pinfish/camarones vivos, aguas superficiales",

      season:"Noches de verano; transiciones primavera/otoño",

      regions:["Playas y ensenadas del sur de Florida","Diez Mil Islas (Florida)","Laguna de Mosquitos (Florida)","estuarios del Pacífico de Costa Rica"]},

    { name:"sábalo", slug: "tarpon", sci:"Megalops atlanticus", env:"Saltwater",

      habitat:"Playas, ensenadas, puentes, canales; bancos de peces que se mueven al compás.",

      baits:"Salmonetes/cangrejos vivos, cebos de baño grandes, moscas",

      season:"Migraciones de primavera-verano; ejemplares jóvenes en otoño en los arroyos.",

      regions:["Boca Grande (Florida)","Islamorada (Cayos de Florida)","costa sur de Puerto Rico","Yucatán (México)"]},

    { name:"platija del sur", slug: "southern-flounder", sci:"Paralichthys lethostigma", env:"Saltwater",

      habitat:"Bordes de canales, desagües, puntos; emboscada en el fondo.",

      baits:"Colas de remo + jigs, pececillos de barro, camarones",

      season:"Carrera de otoño hacia los pases; drenajes de pantanos de primavera",

      regions:["Galveston + Sabine (TX)","Bahía de Mobile (Alabama)","Pamlico Sound (Carolina del Norte)","Área de Charleston (Carolina del Sur)"]},

    { name:"Fletán de California", slug: "california-halibut", sci:"Paralichthys californicus", env:"Saltwater",

      habitat:"Pisos arenosos cerca de la estructura; puertos; bordes de algas.",

      baits:"Deriva de sardina/anchoa, swimbaits, bucktails",

      season:"Finales de primavera-verano cerca de la costa; puertos de invierno",

      regions:["Bahía de Santa Mónica (California)","Bahía de San Diego (California)","Bahía de Monterey (California)","Islas del Canal (CA)"]},

    { name:"Amberjack de cola amarilla", slug: "yellowtail-amberjack", sci:"Seriola lalandi dorsalis", env:"Saltwater",

      habitat:"Bordes de algas, arrozales mar adentro, zonas rocosas elevadas.",

      baits:"Sardina viva en flyline, superficie de hierro, plantillas de yo-yo",

      season:"Finales de primavera-otoño (el agua caliente empuja)",

      regions:["Catalina/San Clemente (CA)","Líneas de algas marinas de Baja Norte","Isla Cedros (México)","Cortez/43 Fathom Banks (CA)"]},

    { name:"Bajo de arena barrado", slug: "barred-sand-bass", sci:"Paralabrax nebulifer", env:"Saltwater",

      habitat:"Playas, embarcaderos, ensenadas, líneas de algas marinas; bordes de marea/corriente.",

      baits:"Swimbaits de plástico sobre cabezas de plomo, tiras de anchoa y planchas pequeñas.",

      season:"Todo el año; mordedura de arena/estructura de verano",

      regions:["Santa Mónica + PV (CA)","Algas marinas de Dana Point a Oceanside (California)","Espigones de Mission y la bahía de San Diego (California)"]},

    { name:"Lubina Blanca", slug: "white-seabass", sci:"Atractoscion nobilis", env:"Saltwater",

      habitat:"Líneas de algas marinas, criaderos de calamares, desniveles costeros; poca luz.",

      baits:"Calamares vivos, swimbaits, jigs de paso lento",

      season:"Finales de primavera-principios de verano (desova el calamar)",

      regions:["Zonas de pesca de calamar de Catalina (California)","Canal de Santa Bárbara (California)","Isla de San Clemente (California)"]},

    { name:"bacalao largo", slug: "lingcod", sci:"Ophiodon elongatus", env:"Saltwater",

      habitat:"Montones de rocas, cornisas, arrecifes; fuerte afinidad estructural.",

      baits:"Jigging metal, grandes swimbaits, cebo entero.",

      season:"Las temporadas abiertas varían; primavera principal",

      regions:["Arrecifes costeros de Oregón/Washington","Pináculos de Monterey/Carmel (California)","costa exterior de la Columbia Británica"]},

    { name:"pargo rojo", slug: "red-snapper", sci:"Lutjanus campechanus", env:"Saltwater",

      habitat:"Arrecifes, pecios y plataformas petrolíferas en alta mar; desde la mitad de la profundidad hasta el fondo marino.",

      baits:"Cebo cortado, pinfish vivo, jigs verticales.",

      season:"Regulado; temporadas de verano en el Golfo",

      regions:["Plataformas petrolíferas del Golfo (TX/LA)","Arrecifes de Panhandle (Florida)","Alabama artificial reefs"]},

    { name:"Mero Mordaza", slug: "gag-grouper", sci:"Mycteroperca microlepis", env:"Saltwater",

      habitat:"Cornisas rocosas, fondo calcáreo, restos de naufragios; depredadores al acecho.",

      baits:"Pinfish vivo, tapones para curricán, jigs",

      season:"Otoño-invierno cerca de la costa (frentes fríos); mar adentro durante todo el año.",

      regions:["Plataformas marinas de la bahía de Tampa (Florida)","Rocas de Big Bend (Florida)","Naufragios en el Golfo (Florida/Alabama)"]},

    { name:"Mahi-mahi (pez delfín)", slug: "mahi-mahi-dolphinfish", sci:"Coryphaena hippurus", env:"Saltwater",

      habitat:"Líneas de maleza en alta mar, flotadores, bordes de corrientes.",

      baits:"Plumas de curricán, ballyhoo, poppers, jigs.",

      season:"Finales de primavera-otoño (corrientes cálidas)",

      regions:["borde de la corriente del Golfo de Florida","Bancos externos (Carolina del Norte)","bordes de trinchera de Puerto Rico","Baja offshore paddies"]}

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

        ["ambiente","hábitat","cebos","estación","profundidad","alias","imagen"].forEach(k=>{

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
