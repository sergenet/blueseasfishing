/* BlueSeas — World enrichment pack (multiregion)

   Safe merge: fills missing fields; adds new species if not present.

   Fields: name, sci, env, habitat, baits, season, regions, depth?, alias?, img?

*/

(function(){

  const ENRICHED = [

    // ===== North America — Freshwater (adds or fills) =====

    {name:"Lake Trout", sci:"Salvelinus namaycush", env:"Freshwater",

     habitat:"Deep cold lakes; main-lake basins, humps, points.",

     baits:"Jigging tubes, swimbaits, spoons, dead bait",

     season:"Ice season deep; spring shallow; summer thermocline",

     regions:["Great Lakes (MI/ON)", "Flaming Gorge (UT/WY)", "Ontario Shield lakes", "Lake Tahoe (CA/NV)"]},



    {name:"Kokanee Salmon", sci:"Oncorhynchus nerka (landlocked)", env:"Freshwater",

     habitat:"Pelagic, schooling over deep basins; summer thermocline.",

     baits:"Dodger + hoochie/corn, small spoons",

     season:"Spring–Summer",

     regions:["Flaming Gorge (UT/WY)", "Wallowa (OR)", "Stampede (CA)", "BC interior lakes"]},



    {name:"Sockeye Salmon", sci:"Oncorhynchus nerka", env:"Freshwater",

     habitat:"Rivers + lakes during runs; lake outlets.",

     baits:"Flies (bonefish-style sparse), small spoons",

     season:"Summer runs",

     regions:["Bristol Bay (AK)", "Fraser system (BC)"]},



    {name:"Pink Salmon", sci:"Oncorhynchus gorbuscha", env:"Freshwater",

     habitat:"Tidal to lower rivers; travel lanes near shore.",

     baits:"Small spoons, spinners, jigs",

     season:"Odd-year summer runs (many areas)",

     regions:["Puget Sound (WA)", "SE Alaska", "BC coastal rivers"]},



    {name:"Chum Salmon", sci:"Oncorhynchus keta", env:"Freshwater",

     habitat:"Lower rivers, tidewater sloughs.",

     baits:"Jigs, spinners, flashy flies",

     season:"Late fall",

     regions:["SE Alaska", "Puget Sound (WA)", "BC rivers"]},



    {name:"Bull Trout", sci:"Salvelinus confluentus", env:"Freshwater",

     habitat:"Cold, connected river systems; migratory; deep pools.",

     baits:"Large streamers, swimbaits, spoons",

     season:"Spring–Fall (where open)",

     regions:["Alberta/BC rivers", "Idaho/Montana systems"]},



    {name:"Arctic Grayling", sci:"Thymallus arcticus", env:"Freshwater",

     habitat:"Cold clear rivers/lakes; riffles & pools.",

     baits:"Dry flies, small spinners, micro spoons",

     season:"Summer–Early fall",

     regions:["Alaska interior", "NWT/Yukon", "Montana high country"]},



    {name:"White Crappie", sci:"Pomoxis annularis", env:"Freshwater",

     habitat:"Brush/standing timber; stained reservoirs.",

     baits:"Small jigs, minnows, blades",

     season:"Prespawn staging late winter; spring spawn; fall schools",

     regions:["Mississippi reservoirs", "Oklahoma lakes", "Kentucky Lake"]},



    {name:"Yellow Perch", sci:"Perca flavescens", env:"Freshwater",

     habitat:"Weed edges, mid-depth flats, basin schools.",

     baits:"Small jigs, spoons, minnows",

     season:"Year-round; prime ice & spring/fall",

     regions:["Upper Midwest lakes", "Lake Simcoe (ON)"]},



    {name:"Blue Catfish", sci:"Ictalurus furcatus", env:"Freshwater",

     habitat:"Big rivers; channel ledges; dams.",

     baits:"Cut shad, skipjack, live bait",

     season:"Summer night bite; winter deep holes",

     regions:["James River (VA)", "Mississippi River", "Santee Cooper (SC)"]},



    {name:"Flathead Catfish", sci:"Pylodictis olivaris", env:"Freshwater",

     habitat:"Logjams, deep holes, outside bends.",

     baits:"Live bluegill/shad; big river baits",

     season:"Warm months (night); fall daytime in current",

     regions:["Kansas reservoirs/rivers", "Ohio River", "AZ canals (introduced)"]},



    {name:"Alligator Gar", sci:"Atractosteus spatula", env:"Freshwater",

     habitat:"Backwaters, bayous, slow rivers.",

     baits:"Live/cut bait; rope lures (teeth tangle)",

     season:"Warm months",

     regions:["Trinity River (TX)", "Coastal TX/LA bayous"]},



    {name:"Chain Pickerel", sci:"Esox niger", env:"Freshwater",

     habitat:"Weedy bays, backwaters.",

     baits:"Spinnerbaits, spoons, jerkbaits",

     season:"Spring–Fall; winter in South",

     regions:["Southeast US ponds/lakes", "Mid-Atlantic tidal creeks"]},



    // ===== NA — Inshore/Coastal =====

    {name:"Black Drum", sci:"Pogonias cromis", env:"Saltwater",

     habitat:"Oyster bars, channels, surf cuts; jetties.",

     baits:"Crab, shrimp, cut bait; jigs",

     season:"Year-round; spring big drum runs",

     regions:["Laguna Madre (TX)", "Louisiana marshes", "Mosquito Lagoon (FL)", "Outer Banks (NC)"]},



    {name:"Sheepshead", sci:"Archosargus probatocephalus", env:"Saltwater",

     habitat:"Pilings, jetties, oyster beds.",

     baits:"Fiddler crabs, shrimp, barnacles",

     season:"Late winter–spring peak",

     regions:["FL bridges/inlets", "Louisiana marshes", "TX jetties"]},



    {name:"Black Sea Bass", sci:"Centropristis striata", env:"Saltwater",

     habitat:"Inshore wrecks/reefs, ledges.",

     baits:"Jigs, squid strips, clams",

     season:"Spring–Fall (depth shifts with temp)",

     regions:["NJ–MA reefs", "Chesapeake/Virginia wrecks"]},



    {name:"Tautog (Blackfish)", sci:"Tautoga onitis", env:"Saltwater",

     habitat:"Rockpiles, wrecks, jetties.",

     baits:"Green crabs, Asian crabs on jigs",

     season:"Spring & late fall prime",

     regions:["RI/CT/NY wrecks/reefs", "NJ jetties"]},



    {name:"Bluefish", sci:"Pomatomus saltatrix", env:"Saltwater",

     habitat:"Surf rips, inlets, blitzes on bait schools.",

     baits:"Metals, topwater, swimmers; cut bait",

     season:"Spring–Fall migrations",

     regions:["NY–MA surf", "NJ rips", "Outer Banks (NC)"]},



    {name:"Atlantic Mackerel", sci:"Scomber scombrus", env:"Saltwater",

     habitat:"Schools nearshore/offshore; edges of structure.",

     baits:"Sabikis, small metals, feathers",

     season:"Spring–Early summer",

     regions:["Gulf of Maine", "UK/IE coasts (also in EU pack)"]},



    {name:"False Albacore (Little Tunny)", sci:"Euthynnus alletteratus", env:"Saltwater",

     habitat:"Nearshore blitzes on glass minnows; rips.",

     baits:"Epoxy jigs, metals, small flies",

     season:"Late summer–Fall",

     regions:["Cape Cod–NJ (fall run)", "Outer Banks (NC)"]},



    {name:"California Sheephead", sci:"Semicossyphus pulcher", env:"Saltwater",

     habitat:"Kelp beds, reefs, rocky structure.",

     baits:"Crabs/shrimp, squid; jigs",

     season:"Year-round (best summer/fall)",

     regions:["SoCal kelp lines", "Channel Islands (CA)"]},



    {name:"Kelp (Calico) Bass", sci:"Paralabrax clathratus", env:"Saltwater",

     habitat:"Kelp edges, boiler rocks, harbors.",

     baits:"Swimbaits, surface irons, plastics",

     season:"Late spring–Fall",

     regions:["Catalina/Palos Verdes (CA)", "La Jolla kelp (CA)"]},



    {name:"Vermilion Rockfish", sci:"Sebastes miniatus", env:"Saltwater",

     habitat:"Deep reefs/ledges; hard bottom.",

     baits:"Jigs, bait rigs, slow-pitch",

     season:"Open seasons vary",

     regions:["Monterey/Carmel (CA)", "Oregon/WA reefs"]},



    {name:"Cabezon", sci:"Scorpaenichthys marmoratus", env:"Saltwater",

     habitat:"Shallow rocky reefs, kelp pockets.",

     baits:"Jigs with bait, swimbaits",

     season:"Rockfish seasons",

     regions:["Central/Northern CA, OR, WA"]},



    // ===== Offshore — Pelagics (global use) =====

    {name:"Yellowfin Tuna", sci:"Thunnus albacares", env:"Saltwater",

     habitat:"Blue water, temperature breaks, current edges.",

     baits:"Trolling feathers, cedar plugs, poppers, live bait",

     season:"Warm-water months; seasonal migrations",

     regions:["SoCal/Baja offshore", "Florida Gulf Stream", "Canary Is.", "Indian Ocean banks"]},



    {name:"Bluefin Tuna", sci:"Thunnus thynnus", env:"Saltwater",

     habitat:"Offshore bait concentrations; shelf edges.",

     baits:"Stickbaits, poppers, jigs, live bait; trolled spread",

     season:"Varies (spring–fall in NA/EU)",

     regions:["Cape Cod/Gulf of Maine", "Outer Banks (NC)", "Mediterranean"]},



    {name:"Wahoo", sci:"Acanthocybium solandri", env:"Saltwater",

     habitat:"Steep drop-offs, high-speed structure passes.",

     baits:"High-speed trolling, deep divers, jigs",

     season:"Warm seasons; lunar tides",

     regions:["Bahamas/Florida Straits", "Baja peninsula", "Hawaii ledges"]},



    {name:"Blue Marlin", sci:"Makaira nigricans", env:"Saltwater",

     habitat:"Deep blue water near seamounts; bait concentrations.",

     baits:"Trolled lures, teasers + pitch baits",

     season:"Tropical/subtropical warm seasons",

     regions:["Azores", "Madeira", "Gulf Stream Bahamas", "Cabo San Lucas (MX)"]},



    {name:"Sailfish", sci:"Istiophorus platypterus", env:"Saltwater",

     habitat:"Edges/weedlines; bait schools; color changes.",

     baits:"Trolled ballyhoo, dredge teasers, pitch baits",

     season:"Winter FL/Caribbean; seasonal elsewhere",

     regions:["Palm Beach–Islamorada (FL)", "Guatemala", "Costa Rica Pacific"]},



    {name:"Swordfish", sci:"Xiphias gladius", env:"Saltwater",

     habitat:"Deep drop structure; diurnal vertical migrations.",

     baits:"Deep-drop squid, buoy/drift tactics",

     season:"Night summer; day deep-drop year-round in some areas",

     regions:["Florida Keys", "SoCal canyons", "Med canyons"]},



    // ===== Europe (fresh + salt) =====

    {name:"Atlantic Salmon", sci:"Salmo salar", env:"Freshwater",

     habitat:"Riffles, pools, runs; classic salmon rivers.",

     baits:"Fly (hair wings, tubes), spinners, spoons",

     season:"Varies by river; spring–fall",

     regions:["Norway Gaula", "Scotland Spey/Dee", "Iceland rivers", "Russia Kola"]},



    {name:"Zander", sci:"Sander lucioperca", env:"Freshwater",

     habitat:"Slow rivers & deep lakes; structure/edges.",

     baits:"Jigged shads, crankbaits, live bait",

     season:"Spring–Fall; night in summer",

     regions:["Baltic/Elbe/Danube basins", "UK reservoirs (stocked)"]},



    {name:"European Perch", sci:"Perca fluviatilis", env:"Freshwater",

     habitat:"Weedlines, piers, canals; shoaling predators.",

     baits:"Small soft plastics, spinners, dropshot",

     season:"Year-round; best spring/fall",

     regions:["UK canals/lakes", "Scandinavia lakes", "Central EU rivers"]},



    {name:"Tench", sci:"Tinca tinca", env:"Freshwater",

     habitat:"Weedy stillwaters; margins; warm months active.",

     baits:"Worms, corn, bread, boilies (method feeder)",

     season:"Late spring–summer",

     regions:["UK/EU stillwaters & canals"]},



    {name:"Barbel", sci:"Barbus barbus", env:"Freshwater",

     habitat:"Gravel runs, fast rivers; on bottom.",

     baits:"Pellets, boilies, meat, cheese; feeder rigs",

     season:"Summer–Fall",

     regions:["River Wye/Trent/Severn (UK)", "Rhine/Seine/Danube"]},



    {name:"European Chub", sci:"Squalius cephalus", env:"Freshwater",

     habitat:"Rivers with cover; edges; bridge pools.",

     baits:"Bread, worms, small lures, flies",

     season:"Year-round; low-clear water sight fishing",

     regions:["UK/EU rivers & canals"]},



    {name:"European Seabass", sci:"Dicentrarchus labrax", env:"Saltwater",

     habitat:"Surf beaches, estuaries, rock marks.",

     baits:"Soft plastics, surface plugs, metals, bait",

     season:"Late spring–autumn",

     regions:["UK/IE/FR Atlantic coasts", "Mediterranean harbors"]},



    {name:"Gilthead Seabream", sci:"Sparus aurata", env:"Saltwater",

     habitat:"Mediterranean rocky/sandy bays; harbors.",

     baits:"Crab, shrimp, shellfish; small jigs",

     season:"Warm months",

     regions:["Spain/Italy/Greece coasts"]},



    {name:"Atlantic Cod", sci:"Gadus morhua", env:"Saltwater",

     habitat:"Banks, wrecks, reefs; colder water.",

     baits:"Jigs, bait rigs (clam/squid), pirks",

     season:"Winter–spring in many areas",

     regions:["Norway fjords", "Iceland", "UK North Sea wrecks"]},



    {name:"Pollack", sci:"Pollachius pollachius", env:"Saltwater",

     habitat:"Kelp-y rock marks, wrecks; mid-water chasers.",

     baits:"Shads on jigheads, metals",

     season:"Spring–autumn",

     regions:["UK/IE Atlantic coast", "Brittany"]},



    {name:"Turbot", sci:"Scophthalmus maximus", env:"Saltwater",

     habitat:"Sandy banks near tide runs; surf beaches.",

     baits:"Fish strips, sandeels; dragging spoons",

     season:"Spring–summer",

     regions:["North Sea banks", "Biscay beaches"]},



    // ===== Australia / New Zealand / Pacific =====

    {name:"Barramundi", sci:"Lates calcarifer", env:"Brackish",

     habitat:"Mangrove creeks, snags, drains; impoundments.",

     baits:"Hardbodies, soft vibes, swimbaits; live mullet",

     season:"Tropical wet season build; impoundments year-round",

     regions:["NT/QLD tidal creeks (AU)", "Kakadu billabongs (AU)", "Top End dams"]},



    {name:"Murray Cod", sci:"Maccullochella peelii", env:"Freshwater",

     habitat:"Big river snags, rock bars; ambush strikes.",

     baits:"Big swimbaits, wakebaits, spinnerbaits",

     season:"Closed in spring (AU); prime summer/fall",

     regions:["Murray-Darling basin (AU)"]},



    {name:"Australian Bass", sci:"Macquaria novemaculeata", env:"Freshwater",

     habitat:"East-coast rivers; snags/rapids; brackish in winter.",

     baits:"Surface walkers, spinnerbaits, plastics",

     season:"Summer surface; winter brackish schooled",

     regions:["NSW/QLD rivers (AU)"]},



    {name:"Dusky Flathead", sci:"Platycephalus fuscus", env:"Saltwater",

     habitat:"Estuary sand flats, drains, drop-offs; sit-and-ambush.",

     baits:"Soft plastics, vibes, prawn lures",

     season:"Spring–autumn",

     regions:["NSW/QLD estuaries (AU)"]},



    {name:"Snapper (Australasian)", sci:"Pagrus auratus", env:"Saltwater",

     habitat:"Reefs, mussel beds, channels; bait schools.",

     baits:"Softbaits, micro-jigs, ledger rigs",

     season:"Spring spawn; autumn workups",

     regions:["Hauraki Gulf (NZ)", "SA/VIC reefs (AU)"]},



    {name:"Yellowtail Kingfish", sci:"Seriola lalandi", env:"Saltwater",

     habitat:"Pins, current edges, kelp ledges.",

     baits:"Live baits, topwater stickbaits, jigs",

     season:"Summer–autumn",

     regions:["Bay of Islands (NZ)", "NSW south coast (AU)"]},



    {name:"Giant Trevally (GT)", sci:"Caranx ignobilis", env:"Saltwater",

     habitat:"Reef edges, bommies, surf breaks.",

     baits:"Big poppers, stickbaits, jigs",

     season:"Tropical warm months",

     regions:["Coral Sea atolls", "Maldives", "Seychelles"]},



    {name:"Spanish Mackerel", sci:"Scomberomorus commerson", env:"Saltwater",

     habitat:"Headlands, reef points, bait schools.",

     baits:"Trolled minnows, metal slices, live baits",

     season:"Warm months",

     regions:["QLD/Northern AU", "PNG/Indonesia"]},



    // ===== Asia =====

    {name:"Mahseer (Golden)", sci:"Tor putitora", env:"Freshwater",

     habitat:"Foothill rivers; fast runs/pools; migratory.",

     baits:"Spoons, spinners, plugs; dough/baits in some regions",

     season:"Post-monsoon drop; winter low clear",

     regions:["Indian Himalaya rivers", "Nepal foothills"]},



    {name:"Snakehead (Giant)", sci:"Channa micropeltes", env:"Freshwater",

     habitat:"Weed-choked lakes/canals; ambush predator.",

     baits:"Frogs, buzzbaits, swimbaits; live bait",

     season:"Wet season high water; low-water sight fishing",

     regions:["Malaysia/Thailand reservoirs", "Borneo lakes"]},



    {name:"Rohu", sci:"Labeo rohita", env:"Freshwater",

     habitat:"Large rivers, ponds, reservoirs.",

     baits:"Dough/attas, corn, bread; method feeders",

     season:"Warm months; monsoon dependent",

     regions:["Ganges basin (IN/BD)", "Pakistan canals"]},



    {name:"Giant Mekong Catfish", sci:"Pangasianodon gigas", env:"Freshwater",

     habitat:"Large river channels; deep holes; reservoirs (stocked).",

     baits:"Pellet/groundbait methods; live/cut in some areas",

     season:"Varies; often warm months",

     regions:["Mekong basin (TH/LA/VN/CN)"]},



    {name:"Siamese Carp", sci:"Catlocarpio siamensis", env:"Freshwater",

     habitat:"Floodplains, reservoirs (stocked).",

     baits:"Boilies/pellets/method; heavy tackle",

     season:"Warm months",

     regions:["Thai reservoirs/fisheries"]},



    // ===== Africa =====

    {name:"Nile Perch", sci:"Lates niloticus", env:"Freshwater",

     habitat:"Lake/river structure, drop-offs; ambush.",

     baits:"Deep swimbaits, live bait, trolling plugs",

     season:"Dry seasons; low light",

     regions:["Lake Victoria (EA)", "Lake Nasser (EG)"]},



    {name:"Tigerfish", sci:"Hydrocynus vittatus", env:"Freshwater",

     habitat:"Fast rivers; sandbars/eddies; clear runs.",

     baits:"Spinners, spoons, minnows; wire leaders",

     season:"Dry season (lower, clearer flows)",

     regions:["Zambezi, Okavango (BW/NA/ZM)"]},



    {name:"Yellowfish (Smallmouth)", sci:"Labeobarbus aeneus", env:"Freshwater",

     habitat:"Riffles/runs; sight fishing; fly/lure.",

     baits:"Nymphs, small cranks, soft plastics",

     season:"Spring–autumn",

     regions:["Vaal River (ZA)"]},



    {name:"Galjoen", sci:"Dichistius capensis", env:"Saltwater",

     habitat:"South African surf rock-ledges; white water.",

     baits:"Red bait/mussels; small jigs",

     season:"Winter–spring (cooler water)",

     regions:["Western Cape rocky beaches (ZA)"]},



    {name:"Kob (Dusky/Spotted)", sci:"Argyrosomus japonicus", env:"Saltwater",

     habitat:"Surf holes, river mouths, estuaries.",

     baits:"Live mullet, soft plastics, bucktails",

     season:"Autumn–winter (regional)",

     regions:["South African coast", "Western Australia (as Mulloway)"]},



    // ===== South America / Caribbean =====

    {name:"Peacock Bass", sci:"Cichla temensis", env:"Freshwater",

     habitat:"Flooded timber, lagoons; explosive topwater.",

     baits:"Big prop baits, stickbaits, jigs",

     season:"Dry season (low water)",

     regions:["Rio Negro (BR)", "Orinoco (VE/CO)"]},



    {name:"Golden Dorado", sci:"Salminus brasiliensis", env:"Freshwater",

     habitat:"Fast runs, rock seams; heavy structure.",

     baits:"Streamers, jerkbaits, spoons (wire leader)",

     season:"Spring–autumn (regional)",

     regions:["Ibera Marsh (AR)", "Bolivia jungle rivers", "Uruguay River"]},



    {name:"Pacu", sci:"Colossoma/Piaractus spp.", env:"Freshwater",

     habitat:"Slow rivers, flooded forests.",

     baits:"Fruit, nuts, corn, pellets; flies",

     season:"High water fruit-drop; warm months",

     regions:["Amazon basin (BR/PE/BO)"]},



    {name:"Piraíba (Lau Lau)", sci:"Brachyplatystoma filamentosum", env:"Freshwater",

     habitat:"Deep Amazon channels; confluences.",

     baits:"Huge cut baits; heavy tackle",

     season:"Varies by river; often falling water",

     regions:["Amazon mainstem (BR)"]},



    {name:"Payara (Vampire Fish)", sci:"Hydrolycus scomberoides", env:"Freshwater",

     habitat:"Fast rocky runs and plunges; oxygenated water.",

     baits:"Large spoons, jigs, stickbaits; big streamers",

     season:"Lower water periods",

     regions:["Orinoco/Amazon tribs (VE/CO/BR)"]},



    {name:"Bonefish", sci:"Albula vulpes", env:"Saltwater",

     habitat:"Shallow flats, turtle grass, sand.",

     baits:"Small shrimp flies, jigs",

     season:"Year-round tropics; tides + sun angle key",

     regions:["Bahamas", "Florida Keys", "Yucatán"]},



    {name:"Permit", sci:"Trachinotus falcatus", env:"Saltwater",

     habitat:"Shallow flats; tailing fish; wary.",

     baits:"Crab flies, small jigs; live crabs",

     season:"Spring–autumn (tide windows)",

     regions:["Belize", "Yucatán", "Keys"]},

  ];



  function mergeEnrichment(){

    const db = Array.isArray(window.SPECIES_DB) ? window.SPECIES_DB : (window.SPECIES_DB = []);

    const norm = x => String(x||"").toLowerCase().trim();

    const isEmpty = v => v==null || (typeof v==="string" && !v.trim()) || (Array.isArray(v)&&!v.length);

    const keys = ["env","habitat","baits","season","depth","alias","img","regions"];



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
