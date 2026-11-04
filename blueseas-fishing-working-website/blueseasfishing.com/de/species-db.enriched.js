/* BlueSeas — species DB enrichment (regions/hotspots + basics)

   - Safe merge: fills missing fields for existing species; adds new ones if absent.

   - Fields used by your gallery: name, sci, env, habitat, baits, season, regions, depth?, alias?, img?

*/

(function(){

  const ENRICHED = [

    // ===== Freshwater — Trout/Salmonids =====

    { name:"Regenbogenforelle", slug: "rainbow-trout", sci:"Oncorhynchus mykiss", env:"Freshwater",

      habitat:"Kalte, klare Flüsse und Seen; Gewehre, Tailouts, Einlässe.",

      baits:"Inline-Spinner, Löffel, kleine Kurbeln, Würmer, Lachseier, Fliegen (Nymphen, Streamer)",

      season:"Frühling–Herbst; Sommermorgen/-abende; winterliches Unterwasser",

      regions:[

        "Alpenseen der Sierra Nevada (Kalifornien)", "Deschutes + Metolius (ODER)", "Madison + Gallatin (MT)",

        "Colorado River Tailwater (Lees Ferry, AZ)", "Zuflüsse der Großen Seen (MI/NY/PA/ON)"

      ]},

    { name:"Bachforelle", slug: "brown-trout", sci:"Salmo trutta", env:"Freshwater",

      habitat:"Kühle Flüsse mit Deckung; unterbotene Banken; tiefe Becken; Frühlingsbäche.",

      baits:"Minnow-Plugs, Jerkbaits, Spinner, Nightcrawler, Streamer",

      season:"Frühling–Herbst; Nachtangeln im Sommer; winterliches Unterwasser",

      regions:[

        "Driftless source creeks (WI/MN/IA)", "White River (AR-Unterwasser)",

        "Pennsylvania limestone streams", "Neuseeländische Freisteine auf der Südinsel", "Patagonien (AR/CL)"

      ]},

    { name:"Bachforelle", slug: "brook-trout", sci:"Salvelinus fontinalis", env:"Freshwater",

      habitat:"Kleines kaltes Quellgebiet; Biberteiche; schattierte Gewehre.",

      baits:"Kleine Spinner, Trockenfliegen, Würmer, Mikrolöffel",

      season:"Spätfrühling–Frühherbst; Mittag im Hochland",

      regions:[

        "Quellgebiete der Appalachen (NC/VA/WV)", "Teiche in den Adirondack Mountains (NY)",

        "Quellbäche der oberen Großen Seen", "Labrador-Wildnis (Kalifornien)"

      ]},

    { name:"Halsabschneider-Forelle", slug: "cutthroat-trout", sci:"Oncorhynchus clarkii", env:"Freshwater",

      habitat:"Westliche Freestones, hohe Seen; langsame Nähte, Cutbanks.",

      baits:"Trockenfliegen (Hopper), kleine Spinner, Löffel",

      season:"Sommer–Frühherbst (terrestrischer Höhepunkt)",

      regions:[

        "Yellowstone-System (WY/MT)", "Snake River (WY)", "Sierra High Lakes (Kalifornien)", "Flathead-Becken (MT)"

      ]},

    { name:"Steelhead", slug: "steelhead", sci:"Oncorhynchus mykiss (anadrom)", env:"Freshwater",

      habitat:"Unterlauf des Flusses, Ausläufe, Kanäle; Gezeitenzone zu Beginn der Saison.",

      baits:"Perlen, Vorrichtungen unter Posen, Spinner, Löffel, geschwungene Fliegen",

      season:"Winterläufe (Dez–Feb) und Sommerläufe (Jul–Okt)",

      regions:[

        "Rogue & Umpqua (OR)", "Trinity & Klamath (CA)", "Hoh & Bogachiel (WA)",

        "Zuflüsse der Großen Seen (MI/NY/PA/ON)"

      ]},

    { name:"Chinook-Lachs", slug: "chinook-salmon", sci:"Oncorhynchus tshawytscha", env:"Freshwater",

      habitat:"Gezeitenwasser bis zur Flussmitte; tiefe Schlitze bei Tageslicht.",

      baits:"Herings-/Sardellenvorfächer, Spinner, Wobbler, Rogen",

      season:"Herbstläufe; Federelemente in einigen Systemen",

      regions:["Columbia River (WA/OR)", "Kenai (AK)", "Sacramento-System (Kalifornien)", "Fraser (BC)"]},

    { name:"Coho-Lachs", slug: "coho-salmon", sci:"Oncorhynchus kisutch", env:"Freshwater",

      habitat:"Langsamere Pools und weiche Kanten in der Nähe der Struktur.",

      baits:"Spinner, Twitching Jigs, kleine Wobbler, Rogen",

      season:"Herbst (September–November)",

      regions:["Zuflüsse im Puget Sound (WA)", "Bäche im Südosten Alaskas", "Oregon coastal rivers", "Zuflüsse der Großen Seen"]},



    // ===== Freshwater — Warm/Coolwater =====

    { name:"Forellenbarsch", slug: "largemouth-bass", sci:"Micropterus salmoides", env:"Freshwater",

      habitat:"Unkraut, Holz, Docks, Bachkanäle; im Frühling flach.",

      baits:"Senko-Würmer, Spinnerbaits, Jigs + Craws, Frösche, Chatterbaits",

      season:"Laichen (Frühling), Oberwasser (Sommerdämmerung/-dämmerung), Herbstjagd auf Maifische",

      regions:["Okeechobeesee (FL)","Lake Fork (TX)","Guntersville (AL)","Clear Lake (Kalifornien)","Sam Rayburn (TX)"]},

    { name:"Schwarzbarsch", slug: "smallmouth-bass", sci:"Micropterus dolomieu", env:"Freshwater",

      habitat:"Felsige Flüsse/Seen; aktuelle Nähte; Schotterstellen.",

      baits:"Ned-Rigs, Tubes, Jerkbaits, Kurbeln, Topwater-Walker",

      season:"Laich im späten Frühjahr; tiefe Buckel im Sommer; Herbstköderläufe",

      regions:["Sankt-Lorenz-Strom (NY/ON)","Untiefen der Großen Seen","Susquehanna (PA)","Door County (WI)"]},

    { name:"Streifenbarsch", slug: "striped-bass", sci:"Morone saxatilis", env:"Freshwater",

      habitat:"Staupunkte, Flusskanäle; Nachtbrückenlichter.",

      baits:"Schwimmköder, Bucktails, lebende Maifische, Topwater-Spooks",

      season:"Frühlingsläufe; Sommernachtbiss; Herbstblitz",

      regions:["Sacramento-San Joaquin Delta (Kalifornien)","Lake Texoma (OK/TX)","Hudson River (NY)","Chesapeake tributaries"]},

    { name:"Zander", slug: "walleye", sci:"Sander vitreus", env:"Freshwater",

      habitat:"Felsige Stellen, Bruchkanten, Unkrautkanten; Feeder bei schlechten Lichtverhältnissen.",

      baits:"Jig + Minnow, Lebendköder-Rigs, Kurbelköder, Klingen",

      season:"Frühlingsflüsse nach dem Laichen; Sommerhöcker; Herbstnachtbiss",

      regions:["Eriesee (OH/PA/ON)","Lake of the Woods (MN/ON)","Columbia River (WA)","Green Bay (WI)"]},

    { name:"Hecht", slug: "northern-pike", sci:"Esox lucius", env:"Freshwater",

      habitat:"Unkrautbeete, Hinterbuchten, Flussmündungen; Hinterhaltplätze.",

      baits:"Spinnerbaits, Spoons, Jerkbaits, große Swimbaits",

      season:"Eis ist flach; Sommerunkräuter; großer Köder fallen",

      regions:["Grenzgewässer (MN/ON)","Saskatchewan lakes","Alaska sloughs","Irish loughs"]},

    { name:"Muskellunge", slug: "muskellunge", sci:"Esox masquinongy", env:"Freshwater",

      habitat:"Weichen, Unkraut, Fels-/Waldübergänge; folgt & Abbildung-8.",

      baits:"Double 10 Bucktails, Jerkbaits, Glidebaits, Gummi",

      season:"Spätfrühling–Herbst; Mondaufgangs-/Sonnenuntergangsfenster",

      regions:["Lake St. Clair (MI/ON)","Green Bay (WI)","St. Lawrence (NY/ON)","Eagle Lake (ON)"]},

    { name:"Bluegill", slug: "bluegill", sci:"Lepomis macrochirus", env:"Freshwater",

      habitat:"Unkrautränder, flache Buchten, Hafenbecken; Bettwäsche-Flats-Frühling.",

      baits:"Wurmstücke, kleine Vorrichtungen, Mikroplastik, Fliegen",

      season:"Frühlingslaich; Sommerschatten; Winter tiefe Becken",

      regions:["Bundesweite Teiche/Seen (USA)","Krautkanten natürlicher Seen","Landwirtschaftliche Teiche (SE/MW)"]},

    { name:"Schwarzer Crappie", slug: "black-crappie", sci:"Pomoxis nigromaculatus", env:"Freshwater",

      habitat:"Buschpfähle, stehendes Holz, Docks; suspendierte Schulen.",

      baits:"Kleine Jigs, Minnows, Micro-Crankbaits",

      season:"Vorlaichstadium (Spätwinter), Laichstadium (Frühling), Herbstschwärme",

      regions:["Mississippi-Stauseen","Kentucky","Minnesota natural lakes","Oklahoma timber reservoirs"]},

    { name:"Kanalwels", slug: "channel-catfish", sci:"Ictalurus punctatus", env:"Freshwater",

      habitat:"Tiefe Löcher, Außenbiegungen, Steinschüttungen, warme Zuflüsse.",

      baits:"Schnittköder, Stinkköder, Hühnerleber, Lebendköder",

      season:"Sommernächte; nach Regenfällen; Winter tiefe Löcher",

      regions:["Red River (ND/MN)","Santee Cooper (SC)","Trinity River (TX)","Der Missouri River verläuft"]},

    { name:"Karpfen", slug: "common-carp", sci:"Cyprinus carpio", env:"Freshwater",

      habitat:"Flache Wattflächen, warme Buchten, Flusswirbel.",

      baits:"Mais, Teigbällchen, Brot, Boilies; Fliegen (Karpfenwanzen)",

      season:"Spätfrühling–Herbst (Ansicht von Fischen im Flachland)",

      regions:["Häfen der Großen Seen","Kanäle/Flüsse Großbritanniens und der EU","Nebenarme des Missouri","Städtische Teiche (USA)"]},



    // ===== Saltwater — Inshore/Coastal =====

    { name:"Rote Trommel (Rotbarsch)", slug: "red-drum-redfish", sci:"Sciaenops ocellatus", env:"Saltwater",

      habitat:"Sümpfe, Austernbars, Ebenen, Brandungsabschnitte; bewegte Flut.",

      baits:"Goldlöffel, Paddelschwänze + Jigs, knallender Korken + Garnelen, geschnittene Meeräsche",

      season:"Ganzjährig; Bullenrennen im Herbst; Winter-Rückenseen",

      regions:["Louisiana marshes","Laguna Madre (TX)","Mosquito/Indian River (FL)","Charleston Creeks (SC)"]},

    { name:"Gefleckte Meerforelle", slug: "spotted-seatrout", sci:"Cynoscion nebulosus", env:"Saltwater",

      habitat:"Grasebenen, Schlaglöcher, Tröge, Hafenlichter.",

      baits:"Weiche Kunststoffe, Walk-the-Dog im Oberwasser, Garnelen unter Kork",

      season:"Frühling–Herbst; Winter tiefe Kanäle",

      regions:["Tampa Bay (FL)","Laguna Madre (TX)","Louisiana interior bays","Indian River Lagoon (FL)"]},

    { name:"Snook", slug: "snook", sci:"Centropomus undecimalis", env:"Saltwater",

      habitat:"Mangrovenspitzen, Brücken, Durchgänge; aktuelle Ränder.",

      baits:"Paddelschwänze, Jerk Shads, lebende Nadelfische/Garnelen, Oberwasser",

      season:"Sommernächte; Übergänge zwischen Frühling und Herbst",

      regions:["Strände und Buchten im Süden Floridas","Zehntausend Inseln (FL)","Mosquito Lagoon (FL)","Costa Rica Pazifische Ästuare"]},

    { name:"Tarpon", slug: "tarpon", sci:"Megalops atlanticus", env:"Saltwater",

      habitat:"Strände, Buchten, Brücken, Kanäle; wogende Fischschwärme.",

      baits:"Lebende Meeräsche/Krabben, große Schwimmköder, Fliegen",

      season:"Frühjahrs-Sommer-Wanderungen; Jungfische im Herbst in Bächen",

      regions:["Boca Grande (FL)","Islamorada (FL Keys)","Südküste von Puerto Rico","Yucatán (MX)"]},

    { name:"Südliche Flunder", slug: "southern-flounder", sci:"Paralichthys lethostigma", env:"Saltwater",

      habitat:"Kanten von Kanälen, Abflüssen, Weichen; Hinterhalt unten.",

      baits:"Paddelschwänze + Jigs, Schlammminnows, Garnelen",

      season:"Herbstlauf zu Pässen; Frühlingssumpfabflüsse",

      regions:["Galveston + Sabine (TX)","Mobile Bay (AL)","Pamlico Sound (NC)","Charleston-Gebiet (SC)"]},

    { name:"Kalifornischer Heilbutt", slug: "california-halibut", sci:"Paralichthys californicus", env:"Saltwater",

      habitat:"Sandige Ebenen in der Nähe der Struktur; Häfen; Kanten von Seetang.",

      baits:"Sardinen-/Sardellendrift, Schwimmköder, Bucktails",

      season:"Spätfrühling–Sommer in Küstennähe; Winterhäfen",

      regions:["Santa Monica Bay (Kalifornien)","San Diego Bay (Kalifornien)","Monterey Bay (Kalifornien)","Hongkong"]},

    { name:"Gelbschwanzmakrele", slug: "yellowtail-amberjack", sci:"Seriola lalandi dorsalis", env:"Saltwater",

      habitat:"Kelpwälder, vorgelagerte Reisfelder, felsige Erhebungen.",

      baits:"Lebende Sardine an Fliegenschnur, Oberflächeneisen, Jo-Jo-Vorrichtungen",

      season:"Spätfrühling bis Herbst (warmes Wasser drängt vor)",

      regions:["Catalina/San Clemente (CA)","Kelp-Linien in Baja Norte","Insel Cedros (Mexiko)","Cortez/43 Fathom Banks (CA)"]},

    { name:"Barred Sand Bass", slug: "barred-sand-bass", sci:"Paralabrax nebulifer", env:"Saltwater",

      habitat:"Strände, Stege, Buchten, Kelplinien; Gezeiten-/Strömungsränder.",

      baits:"Plastik-Swimbaits an Bleiköpfen, Sardellenstreifen, kleine Eisen",

      season:"Ganzjährig; Sommersand/Strukturbiss",

      regions:["Santa Monica + PV (CA)","Dana Point bis Oceanside Kelp (CA)","Mission + Molen in der Bucht von San Diego (Kalifornien)"]},

    { name:"Weißer Wolfsbarsch", slug: "white-seabass", sci:"Atractoscion nobilis", env:"Saltwater",

      habitat:"Seetanglinien, Tintenfischbänke, Küstenabhänge; wenig Licht.",

      baits:"Lebende Tintenfische, Swimbaits, Slow-Pitch-Jigs",

      season:"Spätfrühling–Frühsommer (Tintenfischlaich)",

      regions:["Tintenfischgründe vor Catalina (Kalifornien)","Santa Barbara Kanal (Kalifornien)","San Clemente Island (CA)"]},

    { name:"Lingcod", slug: "lingcod", sci:"Ophiodon elongatus", env:"Saltwater",

      habitat:"Felshaufen, Felsvorsprünge, Riffe; starke Strukturaffinität.",

      baits:"Jigging-Metall, große Schwimmköder, ganze Köder",

      season:"Die Öffnungszeiten variieren; Hauptfrühling",

      regions:["Küstennahe Riffe in Oregon/Washington","Monterey/Carmel-Gipfel (Kalifornien)","Außenküste von British Columbia"]},

    { name:"Roter Schnapper", slug: "red-snapper", sci:"Lutjanus campechanus", env:"Saltwater",

      habitat:"Offshore-Riffe, Wracks, Bohrinseln; mittlere Wassertiefe bis Meeresgrund.",

      baits:"Schnittköder, lebende Nadelfische, vertikale Jigs",

      season:"Reguliert; Sommersaison im Golf",

      regions:["Ölplattformen im Golf von Mexiko (Texas/Louisiana)","Panhandle-Riffe (FL)","Alabama artificial reefs"]},

    { name:"Gag-Zackenbarsch", slug: "gag-grouper", sci:"Mycteroperca microlepis", env:"Saltwater",

      habitat:"Felsvorsprünge, Kalksteingrund, Schiffswracks; lauernde Raubtiere.",

      baits:"Lebende Nadelfische, Schleppwobbler, Jigs",

      season:"Herbst–Winter küstennah (Kaltfronten); küstenfern ganzjährig",

      regions:["Felsvorsprünge vor der Küste der Tampa Bay (FL)","Big Bend Felsen (FL)","Schiffswracks im Golf von Mexiko (FL/AL)"]},

    { name:"Mahi-mahi (Delfinfisch)", slug: "mahi-mahi-dolphinfish", sci:"Coryphaena hippurus", env:"Saltwater",

      habitat:"Offshore-Unkrautstreifen, Treibgut, Strömungsränder.",

      baits:"Trolling-Federn, Ballyhoo, Poppers, Jigs",

      season:"Spätfrühling–Herbst (warme Strömungen)",

      regions:["Florida Golfstromrand","Äußere Banken (NC)","Ränder des Puerto-Rico-Grabens","Baja offshore paddies"]}

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

        ["ENV","Habitat","Koeder","Saison","tufe","Alias","Bild"].forEach(k=>{

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
