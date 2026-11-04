/* BlueSeas — species DB enrichment (regions/hotspots + basics)

   - Safe merge: fills missing fields for existing species; adds new ones if absent.

   - Fields used by your gallery: name, sci, env, habitat, baits, season, regions, depth?, alias?, img?

*/

(function(){

  const ENRICHED = [

    // ===== Freshwater — Trout/Salmonids =====

    { name:"Truta arco-íris", slug: "rainbow-trout", sci:"Oncorhynchus mykiss", env:"Freshwater",

      habitat:"Rios e lagos frios e claros; rifles, caudas, entradas.",

      baits:"Spinners em linha, colheres, pequenas manivelas, minhocas, ovos de salmão, moscas (ninfas, serpentinas)",

      season:"Primavera–Outono; manhãs/noites de verão; águas residuais de inverno",

      regions:[

        "Lagos alpinos da Sierra Nevada (CA)", "Deschutes + Metolius (OR)", "Madison + Galatina (MT)",

        "Rio Colorado (Lees Ferry, AZ)", "Afluentes dos Grandes Lagos (MI/NY/PA/ON)"

      ]},

    { name:"Truta Marrom", slug: "brown-trout", sci:"Salmo trutta", env:"Freshwater",

      habitat:"Rios frescos com cobertura; minar os bancos; piscinas profundas; riachos de primavera.",

      baits:"Plugues para peixinhos, jerkbaits, spinners, nightcrawlers, streamers",

      season:"Primavera–Outono; pesca noturna no verão; águas residuais de inverno",

      regions:[

        "Riachos de nascente sem deriva (WI/MN/IA)", "Rio Branco (águas abaixo da represa do Arkansas)",

        "Pennsylvania limestone streams", "Pedras calcárias da Ilha Sul da Nova Zelândia", "Patagônia (AR/CL)"

      ]},

    { name:"Truta de riacho", slug: "brook-trout", sci:"Salvelinus fontinalis", env:"Freshwater",

      habitat:"Pequenas cabeceiras frias; lagoas de castores; rifles sombreados.",

      baits:"Pequenas fiandeiras, moscas secas, minhocas, micro colheres",

      season:"Final da primavera – início do outono; meio-dia em terras altas",

      regions:[

        "Nascentes dos Apalaches (Carolina do Norte/Virgínia/Virgínia Ocidental)", "Lagoas de Adirondack (NY)",

        "riachos de nascente dos Grandes Lagos Superiores", "Região selvagem de Labrador (CA)"

      ]},

    { name:"Truta Assassina", slug: "cutthroat-trout", sci:"Oncorhynchus clarkii", env:"Freshwater",

      habitat:"Pedras ocidentais, lagos altos; costuras lentas, margens cortadas.",

      baits:"Moscas secas (funis), pequenos fiandeiros, colheres",

      season:"Verão – início do outono (pico terrestre)",

      regions:[

        "Sistema Yellowstone (WY/MT)", "Rio Snake (WY)", "Lagos altos da Serra (CA)", "Bacia Flathead (MT)"

      ]},

    { name:"Truta prateada", slug: "steelhead", sci:"Oncorhynchus mykiss (anádromo)", env:"Freshwater",

      habitat:"Corredeiras na parte baixa do rio, trechos com remansos, canais estreitos; trechos de maré no início da temporada.",

      baits:"Miçangas, gabaritos para carros alegóricos, fiandeiros, colheres, moscas balançadas",

      season:"Corridas de inverno (dezembro a fevereiro) e corridas de verão (julho a outubro)",

      regions:[

        "Rogue e Umpqua (OR)", "Trinity & Klamath (CA)", "Hoh & Bogachiel (WA)",

        "Afluentes dos Grandes Lagos (MI/NY/PA/ON)"

      ]},

    { name:"Salmão Chinook", slug: "chinook-salmon", sci:"Oncorhynchus tshawytscha", env:"Freshwater",

      habitat:"Tidewater corre até o meio do rio; fendas profundas durante a luz do dia.",

      baits:"Equipamentos de arenque/anchova, fiandeiros, plugs, ovas",

      season:"Corridas de outono; springers em alguns sistemas",

      regions:["Rio Columbia (WA/OR)", "Kenai (AK)", "Sistema Sacramento (CA)", "Fraser (BC)"]},

    { name:"Salmão prateado", slug: "coho-salmon", sci:"Oncorhynchus kisutch", env:"Freshwater",

      habitat:"Piscinas mais lentas e bordas suaves perto da estrutura.",

      baits:"Spinners, gabaritos de contração, pequenos plugues, ovas",

      season:"Outono (setembro a novembro)",

      regions:["Tribos do Puget Sound (WA)", "Córregos do sudeste do Alasca", "Oregon coastal rivers", "afluentes dos Grandes Lagos"]},



    // ===== Freshwater — Warm/Coolwater =====

    { name:"Baixo Largemouth", slug: "largemouth-bass", sci:"Micropterus salmoides", env:"Freshwater",

      habitat:"Ervas daninhas, madeira, docas, canais de riachos; raso na primavera.",

      baits:"Minhocas Senko, spinnerbaits, jigs + craws, sapos, chatterbaits",

      season:"Desova (primavera), águas superficiais (amanhecer/anoitecer do verão), perseguição à sombra no outono",

      regions:["Lago Okeechobee (FL)","Lago Fork (TX)","Guntersville (AL)","Lago Claro (CA)","Sam Rayburn (TX)"]},

    { name:"Baixo de boca pequena", slug: "smallmouth-bass", sci:"Micropterus dolomieu", env:"Freshwater",

      habitat:"Rios/lagos rochosos; costuras atuais; pontos de cascalho.",

      baits:"Ned rigs, tubos, jerkbaits, manivelas, caminhantes de água superior",

      season:"Desova no final da primavera; verão profundo; isca de queda corre",

      regions:["Rio São Lourenço (NY/ON)","Bancos de areia dos Grandes Lagos","Susquehanna (PA)","Condado de Door (WI)"]},

    { name:"Robalo listrado", slug: "striped-bass", sci:"Morone saxatilis", env:"Freshwater",

      habitat:"Pontos de reservatórios, canais de rios; luzes da ponte noturna.",

      baits:"Iscas para nadar, bucktails, sável vivo, fantasmas de águas superficiais",

      season:"Corridas de primavera; mordida noturna de verão; blitz de outono",

      regions:["Delta Sac-San Joaquin (CA)","Lago Texoma (OK/TX)","Rio Hudson (NY)","Chesapeake tributaries"]},

    { name:"Walleye", slug: "walleye", sci:"Sander vitreus", env:"Freshwater",

      habitat:"Pontos rochosos, quebras, bordas de ervas daninhas; alimentadores com pouca luz.",

      baits:"Jig + peixinho, equipamentos de isca viva, crankbaits, lâminas",

      season:"Rios de nascente pós-desova; corcundas de verão; mordida de noite de outono",

      regions:["Lago Erie (OH/PA/ON)","Lago dos Bosques (MN/ON)","Rio Columbia (WA)","Baía Verde (WI)"]},

    { name:"Lúcio do Norte", slug: "northern-pike", sci:"Esox lucius", env:"Freshwater",

      habitat:"Canteiros de ervas daninhas, baías traseiras, fozes de rios; locais de emboscada.",

      baits:"Spinnerbaits, colheres, jerkbaits, grandes swimbaits",

      season:"Raso com gelo; ervas daninhas de verão; cair grande isca",

      regions:["Águas Limite (MN/ON)","Saskatchewan lakes","Alaska sloughs","Irish loughs"]},

    { name:"Muskellunge", slug: "muskellunge", sci:"Esox masquinongy", env:"Freshwater",

      habitat:"Pontas, ervas daninhas, transições rocha/madeira; segue a figura 8.",

      baits:"Duplo 10 bucktails, jerkbaits, iscas deslizantes, borracha",

      season:"Final da primavera-outono; janelas do nascer/pôr do sol",

      regions:["Lago St. Clair (MI/ON)","Baía Verde (WI)","São Lourenço (NY/ON)","Lago Eagle (ON)"]},

    { name:"Bluegill", slug: "bluegill", sci:"Lepomis macrochirus", env:"Freshwater",

      habitat:"Bordas com ervas daninhas, enseadas rasas, docas; mola de apartamentos de cama.",

      baits:"Pedaços de minhocas, pequenos gabaritos, microplásticos, moscas",

      season:"Desova de primavera; sombra de verão; bacias profundas de inverno",

      regions:["Lagoas/lagoas em todo o país (EUA)","Linhas de vegetação aquática em lagos naturais","Tanques agrícolas (SE/MW)"]},

    { name:"Tipo de peixe preto", slug: "black-crappie", sci:"Pomoxis nigromaculatus", env:"Freshwater",

      habitat:"Estacas de arbustos, madeira em pé, docas; escolas suspensas.",

      baits:"Pequenos gabaritos, peixinhos, micro crankbaits",

      season:"Preparação pré-desova (final do inverno), desova (primavera), cardumes de outono",

      regions:["Reservatórios do Mississippi","Lago Kentucky","Minnesota natural lakes","Oklahoma timber reservoirs"]},

    { name:"Peixe-gato do canal", slug: "channel-catfish", sci:"Ictalurus punctatus", env:"Freshwater",

      habitat:"Buracos profundos, curvas externas, enrocamento, influxos quentes.",

      baits:"Isca cortada, isca fedorenta, fígado de galinha, isca viva",

      season:"Noites de verão; depois das chuvas; buracos profundos de inverno",

      regions:["Rio Vermelho (ND/MN)","Santee Cooper (SC)","Rio Trinity (TX)","Corre o rio Missouri"]},

    { name:"Carpa Comum", slug: "common-carp", sci:"Cyprinus carpio", env:"Freshwater",

      habitat:"Planícies lamacentas rasas, baías quentes, redemoinhos de rios.",

      baits:"Milho, bolinhas de massa, pão, fervuras; moscas (insetos da carpa)",

      season:"Final da primavera-outono (observe peixes em planícies)",

      regions:["Portos dos Grandes Lagos","Canais/rios do Reino Unido e da UE","remansos do rio Missouri","Lagoas urbanas (EUA)"]},



    // ===== Saltwater — Inshore/Coastal =====

    { name:"Tambor Vermelho (Cantarilho)", slug: "red-drum-redfish", sci:"Sciaenops ocellatus", env:"Saltwater",

      habitat:"Pântanos, bares de ostras, flats, cortes de surf; maré em movimento.",

      baits:"Colheres de ouro, rabo de remo + gabaritos, rolha + camarão, tainha cortada",

      season:"Durante todo o ano; corridas de touros no outono; lagos de inverno",

      regions:["Louisiana marshes","Laguna Madre (TX)","Mosquito/Rio Índico (FL)","Córregos de Charleston (SC)"]},

    { name:"Truta manchada", slug: "spotted-seatrout", sci:"Cynoscion nebulosus", env:"Saltwater",

      habitat:"Gramados, buracos, calhas, luzes de cais.",

      baits:"Plásticos macios, passeio com cachorro na água, camarão sob cortiça",

      season:"Primavera–Outono; canais profundos de inverno",

      regions:["Baía de Tampa (Flórida)","Laguna Madre (TX)","Louisiana interior bays","Lagoa do Rio Indiano (FL)"]},

    { name:"robalo", slug: "snook", sci:"Centropomus undecimalis", env:"Saltwater",

      habitat:"Pontas de mangue, pontes, passagens; margens de correnteza.",

      baits:"Rabo de remo, jerk shads, pinfish/camarão vivo, topwater",

      season:"Noites de verão; transições primavera/outono",

      regions:["Praias e enseadas do sul da Flórida","Dez Mil Ilhas (FL)","Lagoa dos Mosquitos (FL)","Estuários do Pacífico da Costa Rica"]},

    { name:"Tarpão", slug: "tarpon", sci:"Megalops atlanticus", env:"Saltwater",

      habitat:"Praias, enseadas, pontes, canais; cardumes de peixes ondulantes.",

      baits:"Tainhas/caranguejos vivos, iscas grandes, moscas",

      season:"Migrações de primavera-verão; juvenis no outono em riachos.",

      regions:["Boca Grande (FL)","Islamorada (Florida Keys)","costa sul de Porto Rico","Yucatán (MX)"]},

    { name:"Linguado do Sul", slug: "southern-flounder", sci:"Paralichthys lethostigma", env:"Saltwater",

      habitat:"Bordas de canais, drenos, pontos; emboscada no fundo.",

      baits:"Rabo de remo + gabaritos, peixinhos de lama, camarão",

      season:"Queda corrida para passes; drenos de pântano de primavera",

      regions:["Galveston + Sabine (TX)","Baía de Mobile (AL)","Pamlico Sound (Carolina do Norte)","Área de Charleston (SC)"]},

    { name:"Halibute da Califórnia", slug: "california-halibut", sci:"Paralichthys californicus", env:"Saltwater",

      habitat:"Apartamentos arenosos próximos à estrutura; portos; bordas de algas.",

      baits:"Deriva de sardinha/anchova, swimbaits, bucktails",

      season:"Final da primavera-verão perto da costa; portos de inverno",

      regions:["Baía de Santa Mônica (CA)","Baía de San Diego (CA)","Baía de Monterey (CA)","Ilhas do Canal (CA)"]},

    { name:"Amberjack de cauda amarela", slug: "yellowtail-amberjack", sci:"Seriola lalandi dorsalis", env:"Saltwater",

      habitat:"Bordas de algas, arrozais à beira-mar, pontos altos rochosos.",

      baits:"Sardinha viva em flyline, ferro de superfície, gabaritos de ioiô",

      season:"Final da primavera – Outono (empurrões de água quente)",

      regions:["Catalina/San Clemente (CA)","Linhas de algas marinhas da Baja Norte","Ilha Cedros (MX)","Bancos Cortez/43 Fathom (CA)"]},

    { name:"Robalo Barrado de Areia", slug: "barred-sand-bass", sci:"Paralabrax nebulifer", env:"Saltwater",

      habitat:"Praias, molhes, enseadas, linhas de algas; bordas de maré/corrente.",

      baits:"Iscas de plástico em cabeças de chumbo, tiras de anchova, ferros pequenos",

      season:"Durante todo o ano; mordida de areia / estrutura de verão",

      regions:["Santa Mônica + PV (CA)","Algas marinhas de Dana Point a Oceanside (CA)","Mission + quebra-mares da Baía de San Diego (CA)"]},

    { name:"Robalo Branco", slug: "white-seabass", sci:"Atractoscion nobilis", env:"Saltwater",

      habitat:"Linhas de algas, leitos de lulas, declives costeiros; pouca luz.",

      baits:"Lulas vivas, iscas de natação, gabaritos de passo lento",

      season:"Final da primavera – início do verão (desova de lulas)",

      regions:["Bancos de lulas de Catalina (CA)","Canal de Santa Bárbara (CA)","Ilha de San Clemente (CA)"]},

    { name:"Lingcod", slug: "lingcod", sci:"Ophiodon elongatus", env:"Saltwater",

      habitat:"Pilhas de pedras, saliências, recifes; forte afinidade estrutural.",

      baits:"Jigging metal, iscas grandes, iscas inteiras",

      season:"As temporadas abertas variam; primavera",

      regions:["Recifes costeiros de Oregon/WA","Pináculos de Monterey/Carmel (CA)","costa externa da Colúmbia Britânica"]},

    { name:"Pargo Vermelho", slug: "red-snapper", sci:"Lutjanus campechanus", env:"Saltwater",

      habitat:"Recifes em alto-mar, naufrágios, plataformas; da meia-água até o fundo.",

      baits:"Isca cortada, pinfish vivo, gabaritos verticais",

      season:"Regulamentado; temporadas de verão no Golfo",

      regions:["Plataformas de petróleo no Golfo (TX/LA)","Recifes de Panhandle (FL)","Alabama artificial reefs"]},

    { name:"Garoupa", slug: "gag-grouper", sci:"Mycteroperca microlepis", env:"Saltwater",

      habitat:"Bordas rochosas, fundo calcário, destroços; predadores de emboscada.",

      baits:"Pinfish vivo, plugues de corrico, gabaritos",

      season:"Outono-inverno próximo à costa (frentes frias); em alto mar durante todo o ano.",

      regions:["Plataformas rochosas costeiras da Baía de Tampa (FL)","Big Bend é incrível (Flórida)","Naufrágios no Golfo (FL/AL)"]},

    { name:"Mahi-mahi (peixe-golfinho)", slug: "mahi-mahi-dolphinfish", sci:"Coryphaena hippurus", env:"Saltwater",

      habitat:"Weedlines offshore, floatsam, bordas atuais.",

      baits:"Penas de pesca, ballyhoo, poppers, gabaritos",

      season:"Final da primavera-outono (correntes quentes)",

      regions:["Borda da Corrente do Golfo da Flórida","Bancos Externos (NC)","Bordas das trincheiras de Porto Rico","Baja offshore paddies"]}

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

        ["ENV","habitat","iscas","flanche","Profundidade","pseudónimo","imagem"].forEach(k=>{

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
