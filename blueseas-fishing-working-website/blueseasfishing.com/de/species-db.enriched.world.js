/* BlueSeas — World enrichment pack (multiregion)

   Safe merge: fills missing fields; adds new species if not present.

   Fields: name, sci, env, habitat, baits, season, regions, depth?, alias?, img?

*/

(function(){

  const ENRICHED = [

    // ===== North America — Freshwater (adds or fills) =====

    {name:"Seeforelle", slug: "lake-trout", sci:"Salvelinus namaycush", env:"Freshwater",

     habitat:"Tiefkalte Seen; Hauptseebecken, Buckel, Spitzen.",

     baits:"Jigging Tubes, Schwimmköder, Löffel, toter Köder",

     season:"Eiszeit tief; Frühling flach; Sommerthermokline",

     regions:["Große Seen (MI/ON)", "Flaming Gorge (UT/WY)", "Seen des Ontario-Schildes", "Tahoesee, CA/NVComment"]},



    {name:"Kokanee<x> 0</x> N", slug: "kokanee-salmon", sci:"Oncorhynchus nerka (Binnenland)", env:"Freshwater",

     habitat:"Pelagisch, Schulbildung über tiefen Becken; Sommerthermokline.",

     baits:"Dodger + Hoochie/Mais, kleine Löffel",

     season:"Frühjahr Sommer",

     regions:["Flaming Gorge (UT/WY)", "Wallowa (OR)", "Stampede (CA)", "Binnenseen von British Columbia"]},



    {name:"Rotlachs", slug: "sockeye-salmon", sci:"Oncorhynchus nerka", env:"Freshwater",

     habitat:"Flüsse + Seen während der Pisten; Seeausgänge.",

     baits:"Fliegen (knochenfischartig spärlich), kleine Löffel",

     season:"Summer runs",

     regions:["Bristol Bay (AK)", "Fraser-System (BC)"]},



    {name:"Rosa<x> 0</x> N", slug: "pink-salmon", sci:"Oncorhynchus gorbuscha", env:"Freshwater",

     habitat:"Gezeiten zu niedrigeren Flüssen; Fahrspuren in Küstennähe.",

     baits:"Kleine Löffel, Spinner, Jigs",

     season:"Sommerläufe in ungeraden Jahren (viele Gebiete)",

     regions:["Puget Sound (WA)", "Alaska", "BC Küstenflüsse"]},



    {name:"Chum Lachs", slug: "chum-salmon", sci:"Oncorhynchus keta", env:"Freshwater",

     habitat:"Untere Flüsse, Gezeitenabschüttungen.",

     baits:"Jigs, Spinner, auffällige Fliegen",

     season:"Late fall",

     regions:["Alaska", "Puget Sound (WA)", "Flüsse in British Columbia"]},



    {name:"Stierforelle", slug: "bull-trout", sci:"Salvelinus confluentus", env:"Freshwater",

     habitat:"Kalte, verbundene Flusssysteme; wandernd; tiefe Pools.",

     baits:"Große Luftschlangen, Schwimmköder, Löffel",

     season:"Spring–Fall (wo offen)",

     regions:["Alberta/BC Flüsse", "Idaho/Montana Systeme"]},



    {name:"Arktische Äsche", slug: "arctic-grayling", sci:"Thymallus arcticus", env:"Freshwater",

     habitat:"Kalte klare Flüsse/Seen; Riffles & Pools.",

     baits:"Trockenfliegen, kleine Spinner, Mikrolöffel",

     season:"Sommer-Frühherbst",

     regions:["Alaska interior", "NWT/Yukon", "Montana high country"]},



    {name:"Weißer Crappie", slug: "white-crappie", sci:"Pomoxis annularis", env:"Freshwater",

     habitat:"Bürste/stehendes Holz; verschmutzte Reservoirs.",

     baits:"Kleine Vorrichtungen, Elritzen, Klingen",

     season:"Prespawn-Inszenierung im Spätwinter; Frühlings-Spawn; Herbstschulen",

     regions:["Mississippi reservoirs", "Oklahoma lakes", "Kentucky"]},



    {name:"Gelbbarsch", slug: "yellow-perch", sci:"Perca flavescens", env:"Freshwater",

     habitat:"Unkrautkanten, mitteltiefe Abflachungen, Beckenschulen.",

     baits:"Kleine Vorrichtungen, Löffel, Elritzen",

     season:"Ganzjährig; Prime Ice & Frühling/Herbst",

     regions:["Seen im oberen Mittleren Westen", "Simcoe-See (ON)"]},



    {name:"Blauer Wels", slug: "blue-catfish", sci:"Ictalurus furcatus", env:"Freshwater",

     habitat:"Große Flüsse; Kanalvorsprünge; Dämme.",

     baits:"Cut Shad, Echter Bonito, Lebendköder",

     season:"Sommerlicher Nachtbiss; tiefe Winterlöcher",

     regions:["James River (VA)", "Mississippi", "Santee Cooper (SC)"]},



    {name:"Flachkopfwelse", slug: "flathead-catfish", sci:"Pylodictis olivaris", env:"Freshwater",

     habitat:"Blockaden, tiefe Löcher, Außenbögen.",

     baits:"Live Bluegill/Shad; große Flussköder",

     season:"Warme Monate (Nacht); Sturz tagsüber in aktuelle",

     regions:["Stauseen/Flüsse in Kansas", "Ohio River", "AZ-Kanäle (eingeführt)"]},



    {name:"Alligatorhecht", slug: "alligator-gar", sci:"Atractosteus spatula", env:"Freshwater",

     habitat:"Backwaters, Bayous, langsame Flüsse.",

     baits:"Lebend-/Schnittköder; Seilköder (Zahngewirr)",

     season:"Warm months",

     regions:["Trinity River (TX)", "Coastal TX/LA Bayous"]},



    {name:"Kettenpflücker", slug: "chain-pickerel", sci:"Esox niger", env:"Freshwater",

     habitat:"Unkrautige Buchten, Backwaters.",

     baits:"Spinnerbaits, Löffel, Jerkbaits",

     season:"Frühling-Fall; Winter im Süden",

     regions:["Südost-US-Teiche/-Seen", "Mittelatlantische Gezeitenbäche"]},



    // ===== NA — Inshore/Coastal =====

    {name:"Schwarzer Trommler", slug: "black-drum", sci:"Pogonias cromis", env:"Saltwater",

     habitat:"Austernbarren, Kanäle, Surfschnitte; Anlegestellen.",

     baits:"Krabben, Garnelen, Schnittköder; Jigs",

     season:"Ganzjährig; große Trommelläufe im Frühling",

     regions:["Laguna Madre (TX)", "Louisiana marshes", "Mosquito Lagoon (FL)", "Äußere Banken (NC)"]},



    {name:"Schafkopf", slug: "sheepshead", sci:"Archosargus probatocephalus", env:"Saltwater",

     habitat:"Pfeiler, Anlegestellen, Austernbetten.",

     baits:"Geigerkrebse, Garnelen, Seepocken",

     season:"Spätwinter-Frühlingsgipfel",

     regions:["FL-Brücken/-einlässe", "Louisiana marshes", "TX-Anlegestellen"]},



    {name:"Schwarzer Sägebarsch", slug: "black-sea-bass", sci:"Centropristis striata", env:"Saltwater",

     habitat:"Küstennahe Wracks/Riffe, Felsvorsprünge.",

     baits:"Vorrichtungen, Tintenfischstreifen, Muscheln",

     season:"Spring–Fall (Tiefenverschiebungen mit Temp)",

     regions:["NJ–MA Riffe", "Chesapeake/Virginia Wracks"]},



    {name:"Tautog (Schwarzfisch)", slug: "tautog-blackfish", sci:"Tautoga onitis", env:"Saltwater",

     habitat:"Steinhaufen, Wracks, Stege.",

     baits:"Grüne Krabben, Asiatische Krabben auf Jigs",

     season:"Frühling & Spätherbst Prime",

     regions:["RI/CT/NY Wracks/Riffe", "NJ Anlegestellen"]},



    {name:"Blaufisch", slug: "bluefish", sci:"Pomatomus saltatrix", env:"Saltwater",

     habitat:"Surfrisse, Buchten, Blitze auf Köderschulen.",

     baits:"Metalle, Oberwasser, Schwimmer; Schnittköder",

     season:"Frühlings-Fall-Migrationen",

     regions:["NY–MA Surf", "NJ Rips", "Äußere Banken (NC)"]},



    {name:"Makrele", slug: "atlantic-mackerel", sci:"Scomber scombrus", env:"Saltwater",

     habitat:"Schulen Nearshore/Offshore; Strukturkanten.",

     baits:"Sabikis, kleine Metalle, Federn",

     season:"Frühjahr-Frühsommer",

     regions:["Golf von Maine", "UK/IE-Küsten (auch in EU-Packung)"]},



    {name:"Falscher Weißer Thun (Little Tunny)", slug: "false-albacore-little-tunny", sci:"Euthynnus alletteratus", env:"Saltwater",

     habitat:"Nearshore-Blitze auf Glasminnows; Risse.",

     baits:"Epoxidschablonen, Metalle, kleine Fliegen",

     season:"Spätsommer-Fall",

     regions:["Cape Cod–NJ (Herbstlauf)", "Äußere Banken (NC)"]},



    {name:"Kalifornischer Schafskopf", slug: "california-sheephead", sci:"Semicossyphus pulcher", env:"Saltwater",

     habitat:"Kelpwälder, Riffe, Felsformationen.",

     baits:"Crabs/shrimp, squid; jigs",

     season:"Ganzjährig (bester Sommer/Herbst)",

     regions:["SoCal Seetangleitungen", "Hongkong"]},



    {name:"Seetang (Calico) Bass", slug: "kelp-calico-bass", sci:"Paralabrax clathratus", env:"Saltwater",

     habitat:"Seetangkanten, Kesselfelsen, Häfen.",

     baits:"Schwimmköder, Oberflächeneisen, Kunststoffe",

     season:"Spätfrühling-Fall",

     regions:["Catalina/Palos Verdes (CA)", "La Jolla Seetang (CA)"]},



    {name:"Zinnoberroter Steinfisch", slug: "vermilion-rockfish", sci:"Sebastes miniatus", env:"Saltwater",

     habitat:"Tiefe Riffe/Felsvorsprünge; harter Boden.",

     baits:"Vorrichtungen, Köderanlagen, langsame Steigung",

     season:"Open seasons vary",

     regions:["Monterey/Carmel (Kalifornien)", "Oregon/WA Riffe"]},



    {name:"Cabezon", slug: "cabezon", sci:"Scorpaenichthys marmoratus", env:"Saltwater",

     habitat:"Flache, felsige Riffe, Seetang-Taschen.",

     baits:"Jigs mit Köder, Schwimmköder",

     season:"Rockfish seasons",

     regions:["Zentral-/Nordkalifornien, Oregon, Washington"]},



    // ===== Offshore — Pelagics (global use) =====

    {name:"Gelbflossenthun", slug: "yellowfin-tuna", sci:"Thunnus albacares", env:"Saltwater",

     habitat:"Blaues Wasser, Temperaturunterbrechungen, Stromkanten.",

     baits:"Schleppfedern, Zedernstöpsel, Druckknöpfe, lebende Köder",

     season:"Warmwassermonate; saisonale Wanderungen",

     regions:["Südkalifornisches/Baja California Offshore-Gebiet", "Florida Golfstrom", "Kanarische Inseln.", "Ufer des Indischen Ozeans"]},



    {name:"Blauflossenthun", slug: "bluefin-tuna", sci:"Thunnus thynnus", env:"Saltwater",

     habitat:"Offshore-Köderkonzentrationen; Regalkanten.",

     baits:"Stickbaits, Poppers, Jigs, Lebendköder; Trolled Spread",

     season:"Variiert (Frühling-Fall in NA/EU)",

     regions:["Cape Cod/Golf von Maine", "Äußere Banken (NC)", "Mittelmeer"]},



    {name:"Wahoo", slug: "wahoo", sci:"Acanthocybium solandri", env:"Saltwater",

     habitat:"Steilabfälle, Hochgeschwindigkeitsbauwerke passieren.",

     baits:"Hochgeschwindigkeits-Trolling, Tieftaucher, Jigs",

     season:"Warme Jahreszeiten; Mondgezeiten",

     regions:["Straße von Bahamas/Florida", "Baja peninsula", "Hawaii ledges"]},



    {name:"Atlantischer Blauer Marlin", slug: "blue-marlin", sci:"Makaira nigricans", env:"Saltwater",

     habitat:"Tiefblaues Wasser in der Nähe von Seebergen; Köderkonzentrationen.",

     baits:"Trollköder, Teaser + Pitchköder",

     season:"Tropische/subtropische warme Jahreszeiten",

     regions:["Azoren", "Madeira,", "Golfstrom Bahamas", "Cabo San Lucas (Mexiko)"]},



    {name:"Segelfisch", slug: "sailfish", sci:"Istiophorus platypterus", env:"Saltwater",

     habitat:"Kanten/Weedlines; Köderschulen; Farbveränderungen.",

     baits:"Trolliges Ballyhoo, Baggerteaser, Pechköder",

     season:"Winter FL/Karibik; saisonal anderswo",

     regions:["Palm Beach–Islamorada (FL)", "Guatemala", "Costa Rica Pazifik"]},



    {name:"Schwertfisch", slug: "swordfish", sci:"Xiphias gladius", env:"Saltwater",

     habitat:"Tiefe Tropfenstruktur; tägliche vertikale Migrationen.",

     baits:"Deep-Drop-Kalmar, Boje/Drift-Taktik",

     season:"Nachtsommer; Tag ganzjährig in einigen Bereichen tief fallen",

     regions:["Florida Keys", "SoCal-Schluchten", "Med canyons"]},



    // ===== Europe (fresh + salt) =====

    {name:"Atlantik Salmon", slug: "atlantic-salmon", sci:"Salmo salar", env:"Freshwater",

     habitat:"Riffles, Pools, Runs; klassische Lachsflüsse.",

     baits:"Fliege (Haarflügel, Tuben), Spinner, Löffel",

     season:"Variiert am Fluss; Frühlings-Fall",

     regions:["Norwegen Gaula", "Schottland Spey/Dee", "Iceland rivers", "Russland Kola"]},



    {name:"Zander", slug: "zander", sci:"Sander lucioperca", env:"Freshwater",

     habitat:"Langsame Flüsse und tiefe Seen; Struktur/Kanten.",

     baits:"Jigged Shads, Kurbelköder, lebende Köder",

     season:"Frühling-Fall; Nacht im Sommer",

     regions:["Becken Ostsee/Elbe/Donau", "UK-Reservoirs (bestückt)"]},



    {name:"Europäischer Barsch", slug: "european-perch", sci:"Perca fluviatilis", env:"Freshwater",

     habitat:"Weedlines, Piers, Kanäle; Schwärmen von Raubtieren.",

     baits:"Kleine weiche Kunststoffe, Spinner, Dropshot",

     season:"Ganzjährig; bester Frühling/Herbst",

     regions:["UK-Kanäle/-Seen", "Scandinavia lakes", "Flüsse in der Mitte der EU"]},



    {name:"Schleie", slug: "tench", sci:"Tinca tinca", env:"Freshwater",

     habitat:"Weedy Stillwaters; Margen; warme Monate aktiv.",

     baits:"Würmer, Mais, Brot, Boilies (Method Feeder)",

     season:"FRÜHLING SOMMER",

     regions:["UK/EU Stillgewässer & Kanäle"]},



    {name:"Barbe", slug: "barbel", sci:"Barbus barbus", env:"Freshwater",

     habitat:"Schotterpisten, schnelle Flüsse; auf dem Grund.",

     baits:"Pellets, Boilies, Fleisch, Käse; Feeder-Rigs",

     season:"Sommer-Fall",

     regions:["Fluss Wye/Trent/Severn (GB)", "Rhein/Seine/Donau"]},



    {name:"Döbel", slug: "european-chub", sci:"Squalius cephalus", env:"Freshwater",

     habitat:"Flüsse mit Abdeckung; Kanten; Brückenbecken.",

     baits:"Brot, Würmer, kleine Köder, Fliegen",

     season:"Ganzjährig; Low-Clear-Water-Sight-Fishing",

     regions:["UK/EU Flüsse & Kanäle"]},



    {name:"Wolfsbarsch", slug: "european-seabass", sci:"Dicentrarchus labrax", env:"Saltwater",

     habitat:"Surfstrände, Flussmündungen, Felsspuren.",

     baits:"Weiche Kunststoffe, Oberflächenstopfen, Metalle, Köder",

     season:"Spätfrühling-Herbst",

     regions:["UK/IE/FR Atlantikküste", "Mediterranean harbors"]},



    {name:"Meerbrasse", slug: "gilthead-seabream", sci:"Sparus aurata", env:"Saltwater",

     habitat:"Mediterrane Fels-/Sandbuchten; Häfen.",

     baits:"Krabben, Garnelen, Schalentiere; kleine Vorrichtungen",

     season:"Warm months",

     regions:["Küste Spanien/Italien/Griechenland"]},



    {name:"Kabeljau", slug: "atlantic-cod", sci:"Gadus morhua", env:"Saltwater",

     habitat:"Ufer, Wracks, Riffe; kälteres Wasser.",

     baits:"Jigs, Köder-Rigs (Muscheln/Tintenfische), Pirken",

     season:"Winterfrühling in vielen Bereichen",

     regions:["Norway fjords", "Island", "UK Nordsee Wracks"]},



    {name:"Pollack", slug: "pollack", sci:"Pollachius pollachius", env:"Saltwater",

     habitat:"Seetang-Felsspuren, Wracks; Mittelwasserjäger.",

     baits:"Schatten auf Jigheads, Metalle",

     season:"der Frühling, den Herbst",

     regions:["UK/IE Atlantikküste", "Bretagne"]},



    {name:"Steinbutt", slug: "turbot", sci:"Scophthalmus maximus", env:"Saltwater",

     habitat:"Sandige Ufer in der Nähe von Gezeitenabfahrten; Surfstrände.",

     baits:"Fischstreifen, Sandalen; Schlepplöffel",

     season:"Frühjahr Sommer",

     regions:["Nordseebänke", "Biscay beaches"]},



    // ===== Australia / New Zealand / Pacific =====

    {name:"Baramundi", slug: "barramundi", sci:"Lates calcarifer", env:"Brackish",

     habitat:"Mangrovenbäche, Haken, Abflüsse; Aufstauungen.",

     baits:"Hardbodies, weiche Vibes, Schwimmköder; lebende Meerbarbe",

     season:"Tropische Regenzeit gebaut; Aufstauungen ganzjährig",

     regions:["NT/QLD Gezeitenbäche (AU)", "Kakadu Billabongs (AU)", "Oberseitige Dämme"]},



    {name:"Murray Cod", slug: "murray-cod", sci:"Maccullochella peelii", env:"Freshwater",

     habitat:"Große Flusshälse, Felsbarren; Hinterhalt schlägt zu.",

     baits:"Große Schwimmköder, Wakebaits, Spinnerbaits",

     season:"Im Frühjahr (AU) geschlossen; Hauptsommer/Herbst",

     regions:["Murray-Darling-Becken (AU)"]},



    {name:"Australischer Bass", slug: "australian-bass", sci:"Macquaria novemaculeata", env:"Freshwater",

     habitat:"Ostküstenflüsse; Hänge/Stromschnellen; Brackwasser im Winter.",

     baits:"Oberflächendreher, Spinnerköder, Kunststoffe",

     season:"Sommeroberfläche; Winterbrackisch geschult",

     regions:["NSW/QLD Rivers (AU)"]},



    {name:"Dunkler Flachkopf", slug: "dusky-flathead", sci:"Platycephalus fuscus", env:"Saltwater",

     habitat:"Mündungssandböden, Abflüsse, Drop-offs; Sit-and-Ambush.",

     baits:"Weiche Kunststoffe, Vibes, Garnelenköder",

     season:"der Frühling, den Herbst",

     regions:["NSW/QLD-Mündungen (AU)"]},



    {name:"Schnapper (Australasian)", slug: "snapper-australasian", sci:"Pagrus auratus", env:"Saltwater",

     habitat:"Riffe, Muschelbetten, Kanäle; Köderschulen.",

     baits:"Softbaits, Micro-Jigs, Ledger-Rigs",

     season:"Frühlings-Spawn; Herbst-Aufarbeitungen",

     regions:["Hauraki Gulf (Neuseeland)", "SA/VIC Riffe (AU)"]},



    {name:"Gelbschwanz-Kingfish", slug: "yellowtail-kingfish", sci:"Seriola lalandi", env:"Saltwater",

     habitat:"Stifte, Stromkanten, Seetangleisten.",

     baits:"Lebendköder, Topwater Stickbaits, Jigs",

     season:"Sommer/Herbst",

     regions:["Bay of Islands (Neuseeland)", "NSW Südküste (AU)"]},



    {name:"Riesenmakrele (GT)", slug: "giant-trevally-gt", sci:"Caranx ignobilis", env:"Saltwater",

     habitat:"Riffkanten, Bommies, Surfbreaks.",

     baits:"Große Poppers, Stickbaits, Jigs",

     season:"Tropical warm months",

     regions:["Korallenmeer-Atolle", "Malediven", "Simbabwe Somalia"]},



    {name:"Makrelen", slug: "spanish-mackerel", sci:"Scomberomorus commerson", env:"Saltwater",

     habitat:"Landzungen, Riffpunkte, Köderschulen.",

     baits:"Elritzen, Metallscheiben, lebende Köder",

     season:"Warm months",

     regions:["QLD/Nord-AU", "PNG/Indonesien"]},



    // ===== Asia =====

    {name:"Mahseer (Golden)", slug: "mahseer-golden", sci:"Tor putitora", env:"Freshwater",

     habitat:"Vorgebirgige Flüsse; schnelle Läufe/Pools; wandernd.",

     baits:"Löffel, Spinner, Pfropfen; Teig/Köder in einigen Regionen",

     season:"Post-Monsun-Tropfen; Winter niedrig klar",

     regions:["Indische Himalaya-Flüsse", "Nepal foothills"]},



    {name:"Schlangenkopf (Riese)", slug: "snakehead-giant", sci:"Channa micropeltes", env:"Freshwater",

     habitat:"Von Unkraut erstickte Seen/Kanäle; Raubtier aus dem Hinterhalt.",

     baits:"Frösche, Summerköder, Schwimmköder; lebende Köder",

     season:"Hochwasser in der Regenzeit; Angeln bei niedrigem Wasserstand",

     regions:["Malaysia/Thailand Stauseen", "Borneo lakes"]},



    {name:"Rohu", slug: "rohu", sci:"Labeo rohita", env:"Freshwater",

     habitat:"Große Flüsse, Teiche, Stauseen.",

     baits:"Teig/Attas, Mais, Brot; Method Feeder",

     season:"Warme Monate; Monsunabhängig",

     regions:["Gangesbecken (IN/BD)", "Pakistan canals"]},



    {name:"Riesen-Mekong-Wels", slug: "giant-mekong-catfish", sci:"Pangasianodon gigas", env:"Freshwater",

     habitat:"Große Flusskanäle; tiefe Löcher; Stauseen (bestückt).",

     baits:"Pellet-/Groundbait-Methoden; in einigen Bereichen leben/schneiden",

     season:"Variiert; oft warme Monate",

     regions:["Mekong-Becken (TH/LA/VN/CN)"]},



    {name:"Siamkarpfen", slug: "siamese-carp", sci:"Catlocarpio siamensis", env:"Freshwater",

     habitat:"Überschwemmungsgebiete, Stauseen (bestückt).",

     baits:"Boilies/Pellets/Methode; schweres Gerät",

     season:"Warm months",

     regions:["Thailändische Stauseen/Fischerei"]},



    // ===== Africa =====

    {name:"Nilbarsch", slug: "nile-perch", sci:"Lates niloticus", env:"Freshwater",

     habitat:"See-/Flussstruktur, Drop-offs; Hinterhalt.",

     baits:"Tiefe Schwimmköder, lebende Köder, Trolling-Plugs",

     season:"Trockene Jahreszeiten; wenig Licht",

     regions:["Viktoriasee (EA)", "Nassersee (EG)"]},



    {name:"Tigerfisch", slug: "tigerfish", sci:"Hydrocynus vittatus", env:"Freshwater",

     habitat:"Schnelle Flüsse; Sandbänke/Wirbel; freie Abfahrten.",

     baits:"Spinner, Löffel, Elritzen; Drahtführer",

     season:"Trockenzeit (niedrigere, klarere Strömungen)",

     regions:["Sambesi, Okavango (BW/NA/ZM)"]},



    {name:"Gelbfisch (Smallmouth)", slug: "yellowfish-smallmouth", sci:"Labeobarbus aeneus", env:"Freshwater",

     habitat:"Riffles/Läufe; Angeln; Fliegen/Ködern.",

     baits:"Nymphen, kleine Kurbeln, weiche Kunststoffe",

     season:"der Frühling, den Herbst",

     regions:["Vaal (ZA)"]},



    {name:"Südafrikanischer Galjoen", slug: "galjoen", sci:"Dichistius capensis", env:"Saltwater",

     habitat:"Südafrikanische Surffelsen; Wildwasser.",

     baits:"Roter Köder/Miesmuscheln; kleine Jigs",

     season:"Winterfrühling (kühleres Wasser)",

     regions:["Felsstrände Westkap (ZA)"]},



    {name:"Kob (dunkler/gefleckter Kob)", slug: "kob-dusky-spotted", sci:"Argyrosomus japonicus", env:"Saltwater",

     habitat:"Surflöcher, Flussmündungen, Flussmündungen.",

     baits:"Lebende Meeräsche, weiche Kunststoffe, Bucktails",

     season:"Herbst-Winter (regional)",

     regions:["Südafrikanische Küste", "Westaustralien (als Mulloway)"]},



    // ===== South America / Caribbean =====

    {name:"Grüner Augenfleck Kammbarsch", slug: "peacock-bass", sci:"Cichla temensis", env:"Freshwater",

     habitat:"Überschwemmtes Holz, Lagunen; explosives Oberwasser.",

     baits:"Große Requisitenköder, Stickbaits, Jigs",

     season:"Trockenzeit (Niedrigwasser)",

     regions:["Rio Negro (BR)", "Orinoko (VE/CO)"]},



    {name:"Goldenes Dorado", slug: "golden-dorado", sci:"Salminus brasiliensis", env:"Freshwater",

     habitat:"Schnelle Läufe, Felsnähte; schwere Struktur.",

     baits:"Streamer, Jerkbaits, Löffel (Drahtführer)",

     season:"Frühjahr-Herbst (regional)",

     regions:["Ibera-Sumpf (AR)", "Bolivia jungle rivers", "Uruguay-Fluss"]},



    {name:"Pacu", slug: "pacu", sci:"Colossoma/Piaractus spp.", env:"Freshwater",

     habitat:"Langsame Flüsse, überschwemmte Wälder.",

     baits:"Fruit, nuts, corn, pellets; flies",

     season:"Hoher Wassertropfen; warme Monate",

     regions:["Amazonasbecken (BR/PE/BO)"]},



    {name:"Piraíba (Lau Lau)", slug: "pira-ba-lau-lau", sci:"Brachyplatystoma filamentosum", env:"Freshwater",

     habitat:"Tiefe Amazon-Kanäle; Zusammenflüsse.",

     baits:"Riesige Schnittköder; schweres Tackle",

     season:"Variiert je nach Fluss; oft fallendes Wasser",

     regions:["Amazon-Hauptstamm (BR)"]},



    {name:"Payara (Vampirfisch)", slug: "payara-vampire-fish", sci:"Hydrolycus scomberoides", env:"Freshwater",

     habitat:"Schnelle felsige Läufe und Stürze; sauerstoffreiches Wasser.",

     baits:"Große Löffel, Vorrichtungen, Stickbaits; große Luftschlangen",

     season:"Lower water periods",

     regions:["Orinoco-/Amazonas-Stämme (VE/CO/BR)"]},



    {name:"Knochenfisch", slug: "bonefish", sci:"Albula vulpes", env:"Saltwater",

     habitat:"Flache Wohnungen, Schildkrötengras, Sand.",

     baits:"Kleine Garnelenfliegen, Schablonen",

     season:"Ganzjährige Tropen; Gezeiten + SONNENWINKEL-TASTE",

     regions:["Aruba", "Florida Keys", "Yucatán"]},



    {name:"Genehmigung", slug: "permit", sci:"Trachinotus falcatus", env:"Saltwater",

     habitat:"Flache Wohnungen; Schwanzfische; vorsichtig.",

     baits:"Krabbenfliegen, kleine Vorrichtungen; lebende Krabben",

     season:"Frühjahr-Herbst (Gezeitenfenster)",

     regions:["Belize", "Yucatán", "Tasten"]},

  ];



  function mergeEnrichment(){

    const db = Array.isArray(window.SPECIES_DB) ? window.SPECIES_DB : (window.SPECIES_DB = []);

    const norm = x => String(x||"").toLowerCase().trim();

    const isEmpty = v => v==null || (typeof v==="String" && !v.trim()) || (Array.isArray(v)&&!v.length);

    const keys = ["ENV","Habitat","Koeder","Saison","tufe","Alias","Bild","Regionen"];



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
