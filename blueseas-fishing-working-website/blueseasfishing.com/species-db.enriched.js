/* BlueSeas — species DB enrichment (regions/hotspots + basics)

   - Safe merge: fills missing fields for existing species; adds new ones if absent.

   - Fields used by your gallery: name, sci, env, habitat, baits, season, regions, depth?, alias?, img?

*/

(function(){

  const ENRICHED = [

    // ===== Freshwater — Trout/Salmonids =====

    { name:"Rainbow Trout", sci:"Oncorhynchus mykiss", env:"Freshwater",

      habitat:"Cold, clear rivers and lakes; riffles, tailouts, inlets.",

      baits:"Inline spinners, spoons, small cranks, worms, salmon eggs, flies (nymphs, streamers)",

      season:"Spring–Fall; summer mornings/evenings; winter tailwaters",

      regions:[

        "Sierra Nevada alpine lakes (CA)", "Deschutes + Metolius (OR)", "Madison + Gallatin (MT)",

        "Colorado River tailwater (Lees Ferry, AZ)", "Great Lakes tribs (MI/NY/PA/ON)"

      ]},

    { name:"Brown Trout", sci:"Salmo trutta", env:"Freshwater",

      habitat:"Cool rivers with cover; undercut banks; deep pools; spring creeks.",

      baits:"Minnow plugs, jerkbaits, spinners, nightcrawlers, streamers",

      season:"Spring–Fall; night fishing in summer; winter tailwaters",

      regions:[

        "Driftless spring creeks (WI/MN/IA)", "White River (AR tailwaters)",

        "Pennsylvania limestone streams", "NZ South Island freestones", "Patagonia (AR/CL)"

      ]},

    { name:"Brook Trout", sci:"Salvelinus fontinalis", env:"Freshwater",

      habitat:"Small cold headwaters; beaver ponds; shaded riffles.",

      baits:"Small spinners, dry flies, worms, micro spoons",

      season:"Late Spring–Early Fall; mid-day in high country",

      regions:[

        "Appalachian headwaters (NC/VA/WV)", "Adirondack ponds (NY)",

        "Upper Great Lakes spring creeks", "Labrador wilderness (CA)"

      ]},

    { name:"Cutthroat Trout", sci:"Oncorhynchus clarkii", env:"Freshwater",

      habitat:"Western freestones, high lakes; slow seams, cutbanks.",

      baits:"Dry flies (hoppers), small spinners, spoons",

      season:"Summer–Early Fall (terrestrial peak)",

      regions:[

        "Yellowstone system (WY/MT)", "Snake River (WY)", "Sierra high lakes (CA)", "Flathead basin (MT)"

      ]},

    { name:"Steelhead", sci:"Oncorhynchus mykiss (anadromous)", env:"Freshwater",

      habitat:"Lower river runs, tailouts, slots; tidewater early season.",

      baits:"Beads, jigs under floats, spinners, spoons, swung flies",

      season:"Winter runs (Dec–Feb) & Summer runs (Jul–Oct)",

      regions:[

        "Rogue & Umpqua (OR)", "Trinity & Klamath (CA)", "Hoh & Bogachiel (WA)",

        "Great Lakes tribs (MI/NY/PA/ON)"

      ]},

    { name:"Chinook Salmon", sci:"Oncorhynchus tshawytscha", env:"Freshwater",

      habitat:"Tidewater to mid-river runs; deep slots during daylight.",

      baits:"Herring/anchovy rigs, spinners, plugs, roe",

      season:"Fall runs; springers in some systems",

      regions:["Columbia River (WA/OR)", "Kenai (AK)", "Sacramento system (CA)", "Fraser (BC)"]},

    { name:"Coho Salmon", sci:"Oncorhynchus kisutch", env:"Freshwater",

      habitat:"Slower pools and soft edges near structure.",

      baits:"Spinners, twitching jigs, small plugs, roe",

      season:"Fall (Sep–Nov)",

      regions:["Puget Sound tribs (WA)", "Southeast AK streams", "Oregon coastal rivers", "Great Lakes tribs"]},



    // ===== Freshwater — Warm/Coolwater =====

    { name:"Largemouth Bass", sci:"Micropterus salmoides", env:"Freshwater",

      habitat:"Weeds, wood, docks, creek channels; shallow in spring.",

      baits:"Senko worms, spinnerbaits, jigs + craws, frogs, chatterbaits",

      season:"Spawn (spring), topwater (summer dawn/dusk), fall shad chase",

      regions:["Lake Okeechobee (FL)","Lake Fork (TX)","Guntersville (AL)","Clear Lake (CA)","Sam Rayburn (TX)"]},

    { name:"Smallmouth Bass", sci:"Micropterus dolomieu", env:"Freshwater",

      habitat:"Rocky rivers/lakes; current seams; gravel points.",

      baits:"Ned rigs, tubes, jerkbaits, cranks, topwater walkers",

      season:"Spawn late spring; deep humps summer; fall bait runs",

      regions:["St. Lawrence River (NY/ON)","Great Lakes shoals","Susquehanna (PA)","Door County (WI)"]},

    { name:"Striped Bass", sci:"Morone saxatilis", env:"Freshwater",

      habitat:"Reservoir points, river channels; night bridge lights.",

      baits:"Swim baits, bucktails, live shad, topwater spooks",

      season:"Spring runs; summer night bite; fall blitz",

      regions:["Sac-San Joaquin Delta (CA)","Lake Texoma (OK/TX)","Hudson River (NY)","Chesapeake tributaries"]},

    { name:"Walleye", sci:"Sander vitreus", env:"Freshwater",

      habitat:"Rocky points, breaklines, weed edges; low-light feeders.",

      baits:"Jig + minnow, live bait rigs, crankbaits, blades",

      season:"Spring rivers post-spawn; summer humps; fall night bite",

      regions:["Lake Erie (OH/PA/ON)","Lake of the Woods (MN/ON)","Columbia River (WA)","Green Bay (WI)"]},

    { name:"Northern Pike", sci:"Esox lucius", env:"Freshwater",

      habitat:"Weed beds, back bays, river mouths; ambush spots.",

      baits:"Spinnerbaits, spoons, jerkbaits, big swimbaits",

      season:"Ice-out shallow; summer weeds; fall big bait",

      regions:["Boundary Waters (MN/ON)","Saskatchewan lakes","Alaska sloughs","Irish loughs"]},

    { name:"Muskellunge", sci:"Esox masquinongy", env:"Freshwater",

      habitat:"Points, weeds, rock/wood transitions; follows & figure-8.",

      baits:"Double 10 bucktails, jerkbaits, glide baits, rubber",

      season:"Late Spring–Fall; moonrise/sunset windows",

      regions:["Lake St. Clair (MI/ON)","Green Bay (WI)","St. Lawrence (NY/ON)","Eagle Lake (ON)"]},

    { name:"Bluegill", sci:"Lepomis macrochirus", env:"Freshwater",

      habitat:"Weed edges, shallow coves, docks; bedding flats spring.",

      baits:"Worm pieces, small jigs, micro plastics, flies",

      season:"Spring spawn; summer shade; winter deep basins",

      regions:["Nationwide ponds/lakes (US)","Weedlines of natural lakes","Farm ponds (SE/MW)"]},

    { name:"Black Crappie", sci:"Pomoxis nigromaculatus", env:"Freshwater",

      habitat:"Brush piles, standing timber, docks; suspended schools.",

      baits:"Small jigs, minnows, micro crankbaits",

      season:"Pre-spawn staging (late winter), spawn (spring), fall schools",

      regions:["Mississippi Reservoirs","Kentucky Lake","Minnesota natural lakes","Oklahoma timber reservoirs"]},

    { name:"Channel Catfish", sci:"Ictalurus punctatus", env:"Freshwater",

      habitat:"Deep holes, outside bends, riprap, warm inflows.",

      baits:"Cut bait, stink bait, chicken liver, live bait",

      season:"Summer nights; after rains; winter deep holes",

      regions:["Red River (ND/MN)","Santee Cooper (SC)","Trinity River (TX)","Missouri River runs"]},

    { name:"Common Carp", sci:"Cyprinus carpio", env:"Freshwater",

      habitat:"Shallow mud flats, warm bays, river eddies.",

      baits:"Corn, dough balls, bread, boilies; flies (carp bugs)",

      season:"Late Spring–Fall (sight fish on flats)",

      regions:["Great Lakes harbors","UK + EU canals/rivers","Missouri River backwaters","Urban ponds (US)"]},



    // ===== Saltwater — Inshore/Coastal =====

    { name:"Red Drum (Redfish)", sci:"Sciaenops ocellatus", env:"Saltwater",

      habitat:"Marshes, oyster bars, flats, surf cuts; moving tide.",

      baits:"Gold spoons, paddle tails + jigs, popping cork + shrimp, cut mullet",

      season:"Year-round; fall bull runs; winter back lakes",

      regions:["Louisiana marshes","Laguna Madre (TX)","Mosquito/Indian River (FL)","Charleston creeks (SC)"]},

    { name:"Spotted Seatrout", sci:"Cynoscion nebulosus", env:"Saltwater",

      habitat:"Grass flats, potholes, troughs, dock lights.",

      baits:"Soft plastics, topwater walk-the-dog, shrimp under cork",

      season:"Spring–Fall; winter deep channels",

      regions:["Tampa Bay (FL)","Laguna Madre (TX)","Louisiana interior bays","Indian River Lagoon (FL)"]},

    { name:"Snook", sci:"Centropomus undecimalis", env:"Saltwater",

      habitat:"Mangrove points, bridges, passes; current edges.",

      baits:"Paddle tails, jerk shads, live pinfish/shrimp, topwater",

      season:"Summer nights; spring/fall transitions",

      regions:["South FL beaches + inlets","Ten Thousand Islands (FL)","Mosquito Lagoon (FL)","Costa Rica Pacific estuaries"]},

    { name:"Tarpon", sci:"Megalops atlanticus", env:"Saltwater",

      habitat:"Beaches, inlets, bridges, channels; rolling fish schools.",

      baits:"Live mullet/crabs, large swimbaits, flies",

      season:"Spring–Summer migrations; fall juveniles in creeks",

      regions:["Boca Grande (FL)","Islamorada (FL Keys)","Puerto Rico south coast","Yucatan (MX)"]},

    { name:"Southern Flounder", sci:"Paralichthys lethostigma", env:"Saltwater",

      habitat:"Edges of channels, drains, points; ambush on bottom.",

      baits:"Paddle tails + jigs, mud minnows, shrimp",

      season:"Fall run to passes; spring marsh drains",

      regions:["Galveston + Sabine (TX)","Mobile Bay (AL)","Pamlico Sound (NC)","Charleston area (SC)"]},

    { name:"California Halibut", sci:"Paralichthys californicus", env:"Saltwater",

      habitat:"Sandy flats near structure; harbors; edges of kelp.",

      baits:"Sardine/anchovy drift, swimbaits, bucktails",

      season:"Late Spring–Summer nearshore; winter harbors",

      regions:["Santa Monica Bay (CA)","San Diego Bay (CA)","Monterey Bay (CA)","Channel Islands (CA)"]},

    { name:"Yellowtail Amberjack", sci:"Seriola lalandi dorsalis", env:"Saltwater",

      habitat:"Kelp edges, offshore paddies, rocky high spots.",

      baits:"Live sardine on flyline, surface iron, yo-yo jigs",

      season:"Late Spring–Fall (warm water pushes)",

      regions:["Catalina/San Clemente (CA)","Baja Norte kelp lines","Cedros Island (MX)","Cortez/43 Fathom banks (CA)"]},

    { name:"Barred Sand Bass", sci:"Paralabrax nebulifer", env:"Saltwater",

      habitat:"Beaches, jetties, inlets, kelp lines; tide/current edges.",

      baits:"Plastic swimbaits on leadheads, anchovy strips, small irons",

      season:"Year-round; summer sand/structure bite",

      regions:["Santa Monica + PV (CA)","Dana Point to Oceanside kelp (CA)","Mission + San Diego Bay jetties (CA)"]},

    { name:"White Seabass", sci:"Atractoscion nobilis", env:"Saltwater",

      habitat:"Kelp lines, squid beds, coastal drop-offs; low light.",

      baits:"Live squid, swimbaits, slow-pitch jigs",

      season:"Late Spring–Early Summer (squid spawns)",

      regions:["Catalina squid grounds (CA)","Santa Barbara Channel (CA)","San Clemente Island (CA)"]},

    { name:"Lingcod", sci:"Ophiodon elongatus", env:"Saltwater",

      habitat:"Rockpiles, ledges, reefs; strong structure affinity.",

      baits:"Jigging metal, big swimbaits, whole bait",

      season:"Open seasons vary; prime spring",

      regions:["Oregon/WA nearshore reefs","Monterey/Carmel pinnacles (CA)","BC outer coast"]},

    { name:"Red Snapper", sci:"Lutjanus campechanus", env:"Saltwater",

      habitat:"Offshore reefs, wrecks, rigs; mid-water to bottom.",

      baits:"Cut bait, live pinfish, vertical jigs",

      season:"Regulated; summer Gulf seasons",

      regions:["Gulf oil rigs (TX/LA)","Panhandle reefs (FL)","Alabama artificial reefs"]},

    { name:"Gag Grouper", sci:"Mycteroperca microlepis", env:"Saltwater",

      habitat:"Rocky ledges, limestone bottom, wrecks; ambush predators.",

      baits:"Live pinfish, trolling plugs, jigs",

      season:"Fall–Winter nearshore (cool fronts); offshore year-round",

      regions:["Tampa Bay offshore ledges (FL)","Big Bend rocks (FL)","Gulf wrecks (FL/AL)"]},

    { name:"Mahi-mahi (Dolphinfish)", sci:"Coryphaena hippurus", env:"Saltwater",

      habitat:"Offshore weedlines, floatsam, current edges.",

      baits:"Trolling feathers, ballyhoo, poppers, jigs",

      season:"Late Spring–Fall (warm currents)",

      regions:["Florida Gulf Stream edge","Outer Banks (NC)","Puerto Rico trench edges","Baja offshore paddies"]}

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

        ["env","habitat","baits","season","depth","alias","img"].forEach(k=>{

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
