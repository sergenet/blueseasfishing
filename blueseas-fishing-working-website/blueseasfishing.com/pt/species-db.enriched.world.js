/* BlueSeas — World enrichment pack (multiregion)

   Safe merge: fills missing fields; adds new species if not present.

   Fields: name, sci, env, habitat, baits, season, regions, depth?, alias?, img?

*/

(function(){

  const ENRICHED = [

    // ===== North America — Freshwater (adds or fills) =====

    {name:"truta-do-lago", slug: "lake-trout", sci:"Salvelinus namaycush", env:"Freshwater",

     habitat:"Lagos frios profundos; bacias dos lagos principais, corcovas, pontas.",

     baits:"Tubos jigging, swimbaits, colheres, isca morta",

     season:"Estação glacial profunda; primavera rasa; verão termoclina",

     regions:["Grandes Lagos (MI/ON)", "Garganta Flamejante (UT/WY)", "Lagos do Escudo de Ontário", "Lago Tahoe, CA/ NVComment"]},



    {name:"Salmão Kokanee", slug: "kokanee-salmon", sci:"Oncorhynchus nerka (sem litoral)", env:"Freshwater",

     habitat:"Pelágico, escolaridade sobre bacias profundas; termoclina de verão.",

     baits:"Squivo + hoochie/milho, colheres pequenas",

     season:"- Primavera/Verão",

     regions:["Garganta Flamejante (UT/WY)", "Wallowa (OR)", "Estampida (CA)", "BC interior Lakes"]},



    {name:"Salmão Vermelho", slug: "sockeye-salmon", sci:"Oncorhynchus nerka", env:"Freshwater",

     habitat:"Rios + lagos durante as corridas; saídas do lago.",

     baits:"Moscas (esparsas ao estilo peixe ósseo), colheres pequenas",

     season:"Summer runs",

     regions:["Baía de Bristol (AK)", "Sistema Fraser (BC)"]},



    {name:"Rosa Salmon", slug: "pink-salmon", sci:"Oncorhynchus gorbuscha", env:"Freshwater",

     habitat:"Maré para rios mais baixos; trilhas de viagem perto da costa.",

     baits:"Colheres pequenas, fiandeiras, gabaritos",

     season:"Corridas de verão de ano ímpar (muitas áreas)",

     regions:["Puget Sound (WA)", "Sudeste do Alasca", "BC rios costeiros"]},



    {name:"Salmão amigo", slug: "chum-salmon", sci:"Oncorhynchus keta", env:"Freshwater",

     habitat:"Rios mais baixos, pântanos de maré.",

     baits:"Gabaritos, giradores, moscas vistosas",

     season:"Late fall",

     regions:["Sudeste do Alasca", "Puget Sound (WA)", "Rios BC"]},



    {name:"Truta de touro", slug: "bull-trout", sci:"Salvelinus confluentus", env:"Freshwater",

     habitat:"Sistemas fluviais frios e conectados; migratórios; piscinas profundas.",

     baits:"Grandes serpentinas, nadadeiras, colheres",

     season:"Spring–Fall (quando aberto)",

     regions:["Rios Alberta/BC", "Sistemas DE Idaho/Montana"]},



    {name:"Grayling Ártico", slug: "arctic-grayling", sci:"Thymallus arcticus", env:"Freshwater",

     habitat:"Rios/lagos claros e frios; riffles e piscinas.",

     baits:"Moscas secas, pequenos fiandeiros, micro colheres",

     season:"Verão-Começo do Outono",

     regions:["Alaska interior", "NWT/Yukon", "Montana high country"]},



    {name:"perca-anelada", slug: "white-crappie", sci:"Pomoxis annularis", env:"Freshwater",

     habitat:"Escova/madeira em pé; reservatórios manchados.",

     baits:"Pequenos gabaritos, peixinhos, lâminas",

     season:"Encenação de pré-parto no final do inverno; desova da primavera; escolas de outono",

     regions:["Mississippi reservoirs", "Oklahoma lakes", "Lago Kentucky"]},



    {name:"Poleiro Amarelo", slug: "yellow-perch", sci:"Perca flavescens", env:"Freshwater",

     habitat:"Bordas de ervas daninhas, planícies de profundidade média, cardumes de bacias.",

     baits:"Pequenos gabaritos, colheres, peixinhos",

     season:"Durante todo o ano; gelo principal e primavera/outono",

     regions:["Lagos do Alto Centro-Oeste", "Lago Simcoe (ON)"]},



    {name:"Peixe-gato azul", slug: "blue-catfish", sci:"Ictalurus furcatus", env:"Freshwater",

     habitat:"Grandes rios; bordas de canais; barragens.",

     baits:"Cut shad, skipjack, isca viva",

     season:"Mordida de noite de verão; buracos profundos de inverno",

     regions:["Rio James (VA)", "Rio Mississippi", "Santee Cooper (SC)"]},



    {name:"Peixe-gato-de-cabeça-chata", slug: "flathead-catfish", sci:"Pylodictis olivaris", env:"Freshwater",

     habitat:"Engarrafamentos, buracos profundos, curvas externas.",

     baits:"Bluegill/shad vivo; grandes iscas fluviais",

     season:"Meses quentes (noite); dia de outono em corrente",

     regions:["Reservatórios/rios DO Kansas", "Rio Ohio", "Canais AZ (introduzidos)"]},



    {name:"Jacaré Gar", slug: "alligator-gar", sci:"Atractosteus spatula", env:"Freshwater",

     habitat:"Backwaters, rios bayous, lentos.",

     baits:"Isca viva/cortada; iscas de corda (emaranhado de dentes)",

     season:"Warm months",

     regions:["Rio Trinity (TX)", "Coastal TX/LA Bayous"]},



    {name:"lúcio-malhado", slug: "chain-pickerel", sci:"Esox niger", env:"Freshwater",

     habitat:"Baías cheias de ervas daninhas, remansos.",

     baits:"Spinnerbaits, colheres, jerkbaits",

     season:"Primavera e Outono; inverno no Sul",

     regions:["Lagoas/lagos do sudeste dos EUA", "Riachos de maré no meio do Atlântico"]},



    // ===== NA — Inshore/Coastal =====

    {name:"Corvinão negro", slug: "black-drum", sci:"Pogonias cromis", env:"Saltwater",

     habitat:"Barras de ostras, canais, cortes de surf; molhes.",

     baits:"Caranguejo, camarão, isca cortada; gabaritos",

     season:"Durante todo o ano; mola grande tambor corre",

     regions:["Laguna Madre (TX)", "Louisiana marshes", "Lagoa dos Mosquitos (FL)", "Bancos Externos (NC)"]},



    {name:"Sargo-choupa", slug: "sheepshead", sci:"Archosargus probatocephalus", env:"Saltwater",

     habitat:"Pilhas, molhes, camas de ostras.",

     baits:"Caranguejos violinistas, camarões, cracas",

     season:"Pico da primavera-inverno tardio",

     regions:["Pontes/entradas FL", "Louisiana marshes", "Cais TX"]},



    {name:"O peixe das profundezas do mar negro", slug: "black-sea-bass", sci:"Centropristis striata", env:"Saltwater",

     habitat:"Destroços costeiros/recifes, bordas.",

     baits:"Gabaritos, tiras de lula, amêijoas",

     season:"Queda de mola (mudanças de profundidade com temperatura)",

     regions:["Recifes NJ-MA", "Naufrágios em Chesapeake/Virgínia"]},



    {name:"Tautog (Peixe Negro)", slug: "tautog-blackfish", sci:"Tautoga onitis", env:"Saltwater",

     habitat:"Pilhas de rochas, naufrágios, molhes.",

     baits:"Caranguejos verdes, caranguejos asiáticos em gabaritos",

     season:"Primaveril E final DO outono",

     regions:["Naufrágios/recifes RI/CT/NY", "Cais NJ"]},



    {name:"Anchova", slug: "bluefish", sci:"Pomatomus saltatrix", env:"Saltwater",

     habitat:"Rasgos de surf, enseadas, blitzes em cardumes de iscas.",

     baits:"Metais, topwater, nadadores; isca cortada",

     season:"Migrações primavera-queda",

     regions:["Surf NY-MA", "NJ Rips", "Bancos Externos (NC)"]},



    {name:"Sarda", slug: "atlantic-mackerel", sci:"Scomber scombrus", env:"Saltwater",

     habitat:"Escolas nearshore/offshore; bordas da estrutura.",

     baits:"Sabikis, metais pequenos, penas",

     season:"Primavera-Verão Inicial",

     regions:["Golfo do Maine", "Costas do Reino Unido/IE (também no pacote da UE)"]},



    {name:"Albacora Falsa (Pequeno Tunny)", slug: "false-albacore-little-tunny", sci:"Euthynnus alletteratus", env:"Saltwater",

     habitat:"Blitzes perto da costa em vairões de vidro; rasgos.",

     baits:"Gabaritos de epóxi, metais, moscas pequenas",

     season:"Final do verão-outono",

     regions:["Cape Cod–NJ (corrida de outono)", "Bancos Externos (NC)"]},



    {name:"Semicossyphus pulcher", slug: "california-sheephead", sci:"Semicossyphus pulcher", env:"Saltwater",

     habitat:"Leitos de algas, recifes, estrutura rochosa.",

     baits:"Crabs/shrimp, squid; jigs",

     season:"Durante todo o ano (melhor verão/outono)",

     regions:["Linhas de algas SoCal", "Ilhas do Canal (CA)"]},



    {name:"Kelp (calicó) baixo", slug: "kelp-calico-bass", sci:"Paralabrax clathratus", env:"Saltwater",

     habitat:"Bordas de algas, rochas de caldeiras, portos.",

     baits:"Nadadeiras, ferros de superfície, plásticos",

     season:"Final da primavera - Outono",

     regions:["Catalina/Palos Verdes (CA)", "Algas de La Jolla (CA)"]},



    {name:"Peixe-pedra Vermilion", slug: "vermilion-rockfish", sci:"Sebastes miniatus", env:"Saltwater",

     habitat:"Recifes/bordas profundas; fundo duro.",

     baits:"Gabaritos, plataformas de isca, passo lento",

     season:"Open seasons vary",

     regions:["Monterey/Carmel (CA)", "Recifes de Oregon/WA"]},



    {name:"Cabezón", slug: "cabezon", sci:"Scorpaenichthys marmoratus", env:"Saltwater",

     habitat:"Recifes rochosos rasos, bolsos de algas.",

     baits:"Gabaritos com isca, nadadeiras",

     season:"Rockfish seasons",

     regions:["CA Central/Norte, OR, WA"]},



    // ===== Offshore — Pelagics (global use) =====

    {name:"Thunnus albacares", slug: "yellowfin-tuna", sci:"Thunnus albacares", env:"Saltwater",

     habitat:"Água azul, quebras de temperatura, bordas de corrente.",

     baits:"Penas de trollagem, plugues de cedro, molas, isca viva",

     season:"Meses de águas quentes; migrações sazonais",

     regions:["Sul da Califórnia/Baja offshore", "Corrente do Golfo da Flórida", "Ilhas Canárias.", "Bancos do Oceano Índico"]},



    {name:"Atum rabilho", slug: "bluefin-tuna", sci:"Thunnus thynnus", env:"Saltwater",

     habitat:"Concentrações de isca offshore; bordas de prateleira.",

     baits:"Iscas de vara, molas, gabaritos, isca viva; propagação controlada",

     season:"Varia (primavera-queda na América do Norte/UE)",

     regions:["Cape Cod/Golfo do Maine", "Bancos Externos (NC)", "Mediterrâneo"]},



    {name:"Serra-da-índia", slug: "wahoo", sci:"Acanthocybium solandri", env:"Saltwater",

     habitat:"Desembarques íngremes, passagens de estrutura de alta velocidade.",

     baits:"Trollagem de alta velocidade, mergulhadores profundos, gabaritos",

     season:"Estações quentes; marés lunares",

     regions:["Estreito das Bahamas/Flórida", "Baja peninsula", "Hawaii ledges"]},



    {name:"Espadim azul do Atlântico", slug: "blue-marlin", sci:"Makaira nigricans", env:"Saltwater",

     habitat:"Águas azuis profundas perto de montes submarinos; concentrações de iscas.",

     baits:"Iscas Trolled, teasers + iscas pitch",

     season:"Estações quentes tropicais/subtropicais",

     regions:["Açores", "Madeira", "Corrente do Golfo Bahamas", "Cabo San Lucas (MX)"]},



    {name:"Veleiro do Atlântico", slug: "sailfish", sci:"Istiophorus platypterus", env:"Saltwater",

     habitat:"Bordas/linhas de ervas daninhas; escolas de isca; mudanças de cor.",

     baits:"Trolled ballyhoo, teasers de dragagem, iscas de piche",

     season:"FL de inverno/Caribe; sazonal em outro lugar",

     regions:["Palm Beach-Islamorada (FL)", "Guatemala", "Costa Rica Pacífico"]},



    {name:"Peixe-Espada", slug: "swordfish", sci:"Xiphias gladius", env:"Saltwater",

     habitat:"Estrutura de queda profunda; migrações verticais diurnas.",

     baits:"Lulas de queda profunda, táticas de bóia/deriva",

     season:"Noite verão; dia de queda profunda durante todo o ano em algumas áreas",

     regions:["Chaves da Flórida", "Canyons SoCal", "Med canyons"]},



    // ===== Europe (fresh + salt) =====

    {name:"Atlântico Salmon", slug: "atlantic-salmon", sci:"Salmo salar", env:"Freshwater",

     habitat:"Riffles, piscinas, corridas; rios clássicos de salmão.",

     baits:"Mosca (asas de cabelo, tubos), giradores, colheres",

     season:"Varia de acordo com o rio; primavera-queda",

     regions:["Noruega Gaula", "Escócia Spey/Dee", "Iceland rivers", "Rússia Kola"]},



    {name:"Zander", slug: "zander", sci:"Sander lucioperca", env:"Freshwater",

     habitat:"Rios lentos e lagos profundos; estrutura/bordas.",

     baits:"Shads jigged, crankbaits, isca viva",

     season:"Primavera e Outono; noite no verão",

     regions:["Bacias do Báltico/Elba/Danúbio", "Reservatórios do Reino Unido (abastecidos)"]},



    {name:"Perca europeia", slug: "european-perch", sci:"Perca fluviatilis", env:"Freshwater",

     habitat:"Linhas de ervas daninhas, cais, canais; predadores de cardumes.",

     baits:"Pequenos plásticos macios, spinners, dropshot",

     season:"Durante todo o ano; melhor primavera/outono",

     regions:["Canais/lagos do Reino Unido", "Scandinavia lakes", "Rios da UE Central"]},



    {name:"Tenca", slug: "tench", sci:"Tinca tinca", env:"Freshwater",

     habitat:"Águas paradas com ervas daninhas; margens; meses quentes ativos.",

     baits:"Vermes, milho, pão, fervuras (alimentador de métodos)",

     season:"Final da primavera-verão",

     regions:["Águas mortas e canais do Reino Unido/UE"]},



    {name:"Barbo", slug: "barbel", sci:"Barbus barbus", env:"Freshwater",

     habitat:"Corridas de cascalho, rios rápidos; no fundo.",

     baits:"Pellets, boilies, carne, queijo; plataformas alimentadoras",

     season:"Verão Outono",

     regions:["River Wye/Trent/Severn (Reino Unido)", "Reno/Sena/Danúbio"]},



    {name:"Chub Europeu", slug: "european-chub", sci:"Squalius cephalus", env:"Freshwater",

     habitat:"Rios com cobertura; bordas; poças de pontes.",

     baits:"Pão, vermes, pequenas iscas, moscas",

     season:"Durante todo o ano; pesca à vista em águas pouco claras",

     regions:["Rios e canais do Reino Unido/UE"]},



    {name:"robalo-legítimo", slug: "european-seabass", sci:"Dicentrarchus labrax", env:"Saltwater",

     habitat:"Praias de surfe, estuários, marcas de rochas.",

     baits:"Plásticos macios, tampões de superfície, metais, isca",

     season:"Final da primavera-outono",

     regions:["Costas atlânticas do Reino Unido/IE/FR", "Mediterranean harbors"]},



    {name:"Dourada", slug: "gilthead-seabream", sci:"Sparus aurata", env:"Saltwater",

     habitat:"Baías rochosas/arenosas mediterrânicas; portos.",

     baits:"Caranguejo, camarão, marisco; pequenos gabaritos",

     season:"Warm months",

     regions:["Costa da Espanha/Itália/Grécia"]},



    {name:"Bacalhau do Atlântico", slug: "atlantic-cod", sci:"Gadus morhua", env:"Saltwater",

     habitat:"Bancos, naufrágios, recifes; águas mais frias.",

     baits:"Gabaritos, plataformas de isca (molusco/lula), piratas",

     season:"Primavera de inverno em muitas áreas",

     regions:["Norway fjords", "Islândia", "Naufrágios no Mar do Norte do Reino Unido"]},



    {name:"Escamudo", slug: "pollack", sci:"Pollachius pollachius", env:"Saltwater",

     habitat:"Marcas de rocha de algas, naufrágios; caçadores no meio da água.",

     baits:"Sombras em jigheads, metais",

     season:"primavera - outono",

     regions:["Costa atlântica do Reino Unido/IE", "Bretanha"]},



    {name:"Rodovalho", slug: "turbot", sci:"Scophthalmus maximus", env:"Saltwater",

     habitat:"Bancos arenosos perto de corridas de maré; praias de surf.",

     baits:"Tiras de peixe, galeotas; colheres de arrasto",

     season:"- Primavera/Verão",

     regions:["Bancos do Mar do Norte", "Biscay beaches"]},



    // ===== Australia / New Zealand / Pacific =====

    {name:"Perca-gigante", slug: "barramundi", sci:"Lates calcarifer", env:"Brackish",

     habitat:"Riachos de mangue, emaranhados, drenos; represamentos.",

     baits:"Hardbodies, vibrações suaves, swimbaits; tainha viva",

     season:"Construção da estação chuvosa tropical; represamentos durante todo o ano",

     regions:["Riachos DE maré NT/QLD (AU)", "Billabongs de Kakadu (AU)", "Barragens de Extremidade Superior"]},



    {name:"Bacalhau Murray", slug: "murray-cod", sci:"Maccullochella peelii", env:"Freshwater",

     habitat:"Grandes obstáculos do rio, barras de pedra; ataques de emboscada.",

     baits:"Grandes nadadeiras, wakebaits, spinnerbaits",

     season:"Fechado na primavera (AU); verão/outono",

     regions:["Bacia Murray-Darling (AU)"]},



    {name:"Contrabaixo australiano", slug: "australian-bass", sci:"Macquaria novemaculeata", env:"Freshwater",

     habitat:"Rios da costa leste; obstáculos/corredeiras; salobra no inverno.",

     baits:"Andadores de superfície, spinnerbaits, plásticos",

     season:"Superfície de verão; inverno salobra escolarizada",

     regions:["Rios NSW/QLD (AU)"]},



    {name:"Cabeça chata escura", slug: "dusky-flathead", sci:"Platycephalus fuscus", env:"Saltwater",

     habitat:"Planos de areia do estuário, drenos, desembarques; sentar e emboscar.",

     baits:"Plásticos macios, vibrações, iscas de camarão",

     season:"primavera - outono",

     regions:["Estuários NSW/QLD (AU)"]},



    {name:"Snapper (Australásia)", slug: "snapper-australasian", sci:"Pagrus auratus", env:"Saltwater",

     habitat:"Recifes, camas de mexilhões, canais; escolas de isca.",

     baits:"Softbaits, micro-jigs, plataformas de contabilidade",

     season:"Desova de primavera; exames de outono",

     regions:["Golfo de Hauraki (NZ)", "SA/VIC Reefs (AU)"]},



    {name:"Peixe-rei-de-cauda-amarela", slug: "yellowtail-kingfish", sci:"Seriola lalandi", env:"Saltwater",

     habitat:"Pinos, bordas de corrente, bordas de algas.",

     baits:"Iscas vivas, iscas de topwater, gabaritos",

     season:"Verão-outono",

     regions:["Baía das Ilhas (NZ)", "Costa sul DE NSW (AU)"]},



    {name:"Gigante Trevally (GT)", slug: "giant-trevally-gt", sci:"Caranx ignobilis", env:"Saltwater",

     habitat:"Bordas de recife, bommies, surf breaks.",

     baits:"Grandes poppers, stickbaits, gabaritos",

     season:"Tropical warm months",

     regions:["Atóis do Mar de Coral", "Maldivas", "Seicheles"]},



    {name:"Cavala da espécie", slug: "spanish-mackerel", sci:"Scomberomorus commerson", env:"Saltwater",

     habitat:"Cabos, pontos de recife, escolas de isca.",

     baits:"Peixinhos enrolados, fatias de metal, iscos vivos",

     season:"Warm months",

     regions:["Queensland/Norte da Austrália", "PNG/Indonésia"]},



    // ===== Asia =====

    {name:"Mahseer (Dourado)", slug: "mahseer-golden", sci:"Tor putitora", env:"Freshwater",

     habitat:"Rios do sopé; corridas/piscinas rápidas; migratórias.",

     baits:"Colheres, fiandeiros, tampões; massa/iscas em algumas regiões",

     season:"Queda pós-monção; inverno baixo claro",

     regions:["Rios Himalaias indianos", "Nepal foothills"]},



    {name:"Cabeça de Serpente (Gigante)", slug: "snakehead-giant", sci:"Channa micropeltes", env:"Freshwater",

     habitat:"Lagos/canais cercados de ervas daninhas; predador de emboscada.",

     baits:"Sapos, búzios, nadadeiras; isca viva",

     season:"Época chuvosa alta água; pesca à vista em águas baixas",

     regions:["Reservatórios da Malásia/Tailândia", "Borneo lakes"]},



    {name:"Rohu", slug: "rohu", sci:"Labeo rohita", env:"Freshwater",

     habitat:"Grandes rios, lagoas, reservatórios.",

     baits:"Massa/attas, milho, pão; alimentadores de método",

     season:"Meses quentes; dependente das monções",

     regions:["Bacia DO Ganges (IN/BD)", "Pakistan canals"]},



    {name:"Peixe-gato gigante do Mekong", slug: "giant-mekong-catfish", sci:"Pangasianodon gigas", env:"Freshwater",

     habitat:"Grandes canais fluviais; buracos profundos; reservatórios (abastecidos).",

     baits:"Métodos de pellet/groundbait; vivo/cortado em algumas áreas",

     season:"Varia; muitas vezes meses quentes",

     regions:["Bacia do Mekong (TH/LA/VN/CN)"]},



    {name:"Carpa Siamesa", slug: "siamese-carp", sci:"Catlocarpio siamensis", env:"Freshwater",

     habitat:"Planícies de inundação, reservatórios (abastecidos).",

     baits:"Boilies/pellets/método; equipamento pesado",

     season:"Warm months",

     regions:["Reservatórios tailandeses/pesca"]},



    // ===== Africa =====

    {name:"perca-do-nilo", slug: "nile-perch", sci:"Lates niloticus", env:"Freshwater",

     habitat:"Estrutura do lago/rio, desembarques; emboscada.",

     baits:"Swimbaits profundos, isca viva, plugues de trollagem",

     season:"Estações secas; pouca luz",

     regions:["Lago Vitória (EA)", "Lago Nasser (EG)"]},



    {name:"Peixe-tigre", slug: "tigerfish", sci:"Hydrocynus vittatus", env:"Freshwater",

     habitat:"Rios rápidos; bancos de areia/redemoinhos; pistas claras.",

     baits:"Fiandeiras, colheres, peixinhos; líderes de arame",

     season:"Estação seca (fluxos mais baixos e mais claros)",

     regions:["Zambeze, Okavango (BW/NA/ZM)"]},



    {name:"Peixe-amarelo (boca pequena)", slug: "yellowfish-smallmouth", sci:"Labeobarbus aeneus", env:"Freshwater",

     habitat:"Riffles/corridas; pesca à vista; mosca/isca.",

     baits:"Ninfas, pequenas manivelas, plásticos macios",

     season:"primavera - outono",

     regions:["Rio Vaal (ZA)"]},



    {name:"galeão", slug: "galjoen", sci:"Dichistius capensis", env:"Saltwater",

     habitat:"Surf sul-africano de bordas rochosas; água branca.",

     baits:"Isca vermelha/mexilhões; pequenos gabaritos",

     season:"Primavera de inverno (água mais fria)",

     regions:["Praias rochosas do Cabo Ocidental (ZA)"]},



    {name:"Kob (escuro/manchado)", slug: "kob-dusky-spotted", sci:"Argyrosomus japonicus", env:"Saltwater",

     habitat:"Buracos de surf, bocas de rios, estuários.",

     baits:"Tainha viva, plásticos macios, bucktails",

     season:"Outono-inverno (regional)",

     regions:["Costa sul-africana", "Austrália Ocidental (como Mulloway)"]},



    // ===== South America / Caribbean =====

    {name:"Robalo", slug: "peacock-bass", sci:"Cichla temensis", env:"Freshwater",

     habitat:"Madeira inundada, lagoas; águas superficiais explosivas.",

     baits:"Big prop iscas, stickbaits, gabaritos",

     season:"Estação seca (pouca água)",

     regions:["Rio Negro (BR)", "Orinoco (VE/CO)"]},



    {name:"Salminus", slug: "golden-dorado", sci:"Salminus brasiliensis", env:"Freshwater",

     habitat:"Corridas rápidas, costuras rochosas; estrutura pesada.",

     baits:"Serpentinas, jerkbaits, colheres (guia de arame)",

     season:"Primavera-outono (regional)",

     regions:["Pântano de Ibera (AR)", "Bolivia jungle rivers", "Rio Uruguai"]},



    {name:"Pacú", slug: "pacu", sci:"Colossoma/Piaractus spp.", env:"Freshwater",

     habitat:"Rios lentos, florestas inundadas.",

     baits:"Fruit, nuts, corn, pellets; flies",

     season:"Gota de frutas de água alta; meses quentes",

     regions:["Bacia Amazônica (BR/PE/BO)"]},



    {name:"Piraíba (Lau Lau)", slug: "pira-ba-lau-lau", sci:"Brachyplatystoma filamentosum", env:"Freshwater",

     habitat:"Canais profundos da Amazônia; confluências.",

     baits:"Iscas cortadas enormes; equipamento pesado",

     season:"Varia de acordo com o rio; muitas vezes a água cai",

     regions:["Rio Amazonas principal (BR)"]},



    {name:"Payara (Peixe Vampiro)", slug: "payara-vampire-fish", sci:"Hydrolycus scomberoides", env:"Freshwater",

     habitat:"Corridas e mergulhos rochosos rápidos; água oxigenada.",

     baits:"Colheres grandes, gabaritos, stickbaits; serpentinas grandes",

     season:"Lower water periods",

     regions:["Tribos do Orinoco/Amazonas (VE/CO/BR)"]},



    {name:"Butterfishes, silver pomfrets", slug: "bonefish", sci:"Albula vulpes", env:"Saltwater",

     habitat:"Flats rasos, grama de tartaruga, areia.",

     baits:"Pequenas moscas de camarão, gabaritos",

     season:"Trópicos durante todo o ano; marés + tecla de ângulo do sol",

     regions:["Bahamas", "Chaves da Flórida", "Yucatán"]},



    {name:"Licença", slug: "permit", sci:"Trachinotus falcatus", env:"Saltwater",

     habitat:"Flats rasos; peixes de cauda; cauteloso.",

     baits:"Moscas do caranguejo, pequenos gabaritos; caranguejos vivos",

     season:"Primavera-outono (janelas de maré)",

     regions:["Belize", "Yucatán", "Chaves"]},

  ];



  function mergeEnrichment(){

    const db = Array.isArray(window.SPECIES_DB) ? window.SPECIES_DB : (window.SPECIES_DB = []);

    const norm = x => String(x||"").toLowerCase().trim();

    const isEmpty = v => v==null || (typeof v==="corda" && !v.trim()) || (Array.isArray(v)&&!v.length);

    const keys = ["ENV","habitat","iscas","flanche","Profundidade","pseudónimo","imagem","WCA e ESA"];



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
