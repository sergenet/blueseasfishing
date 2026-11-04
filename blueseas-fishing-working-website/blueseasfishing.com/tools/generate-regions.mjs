#!/usr/bin/env node
/**
 * generate-regions.mjs
 *
 * Fills the "Regions/Hotspots" gap in the species database. Loads the merged
 * DB, then emits species-db.regions.js — one {name, regions} row per species
 * that has no regions yet. Rules are most-specific-first:
 *   1. exact-name overrides (iconic fisheries)
 *   2. keyword rules (families / name patterns)
 *   3. environment fallback
 *
 * The output is a plain JS pack the user can hand-edit; regenerate only
 * re-fills species that are still empty.
 *
 * Run:  node tools/generate-regions.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'species-db.regions.js');

/** Curated corrections: replace wrong/generic regions for these exact names. */
export const CORRECTIONS = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'region-corrections.json'), 'utf8'));

/* --------------------------------------------------- shared DB loader ---- */
export async function loadSpeciesDb(verbose = true) {
  const sandbox = {
    window: {},
    document: { dispatchEvent() {}, addEventListener() {}, readyState: 'complete' },
    setTimeout() {}, setInterval() {}, clearInterval() {}, clearTimeout() {},
    console,
  };
  vm.createContext(sandbox);
  const db = [];
  const byName = new Map();
  const merge = (items) => {
    let added = 0;
    for (const it of items) {
      if (!it || !it.name) continue;
      const key = String(it.name).toLowerCase();
      const ex = byName.get(key);
      if (ex) {
        for (const [f, v] of Object.entries(it)) {
          const empty = (x) => x == null || x === '' || (Array.isArray(x) && !x.length);
          if (v != null && v !== '' && empty(ex[f])) ex[f] = v;
        }
      } else { db.push(it); byName.set(key, it); added++; }
    }
    return added;
  };
  const files = ['species-db.js', 'species-db.enriched.js', 'species-db.enriched.world.js',
                 'species-db.expanded.js', 'species-db.expanded.worldwide.js'];
  for (const f of files) {
    try { vm.runInContext(readFileSync(join(ROOT, f), 'utf8'), sandbox); }
    catch (e) { console.warn(`  ! ${f}: ${e.message}`); }
    const pools = ['SPECIES_DB', 'SPECIES_DB_ENRICH', 'SPECIES_DB_CATALOG_ROWS', 'SPECIES_DB_WORLDWIDE_ROWS']
      .map((k) => sandbox.window[k]).filter(Array.isArray);
    const added = merge(pools.flat());
    if (verbose) console.log(`  ${f}: db ${db.length} (+${added})`);
  }
  return db;
}

/* --------------------------------------------------------- region rules -- */
// 1) Exact-name overrides — iconic fisheries get specific, real hotspots.
const OVERRIDES = {
  'Rainbow Trout': ['McKenzie River (OR)', 'Salmon River (ID)', 'Great Lakes tributaries', 'Sierra lakes (CA)'],
  'Steelhead (Anadromous Rainbow)': ['Skagit & Sauk (WA)', 'Skeena (BC)', 'Deschutes (OR)', 'Cattaraugus Creek (NY)'],
  'Brook Trout': ['Appalachian headwaters (VA/WV/PA)', 'Algonquin Park (ON)', 'Colorado high lakes', 'Maine ponds'],
  'Brown Trout': ['White River (AR)', 'Bighorn (MT)', 'England chalkstreams (Test/Itchen)', 'South Island (NZ)'],
  'Lake Trout': ['Great Lakes (Lake Superior)', 'Flaming Gorge (UT/WY)', 'Lake Nipigon (ON)', 'Lake Tahoe (CA/NV)'],
  'Golden Trout': ['Golden Trout Creek (CA)', 'Kern Plateau lakes (CA)', 'Wind River Range (WY, transplanted)'],
  'Cutthroat Trout': ['Yellowstone Lake (WY)', 'Snake River (ID/WY)', 'Puget Sound beaches (sea-runs)', 'Green River (UT)'],
  'Bull Trout': ['Flathead River (MT)', 'Metolius (OR)', 'Skeena tributaries (BC)', 'North Fork St. Joe (ID)'],
  'Arctic Char': ['Nunamiut lakes (AK)', 'Tree River (NU)', 'Icelandic lakes', 'Greenland fjords'],
  'Atlantic Salmon': ['Restigouche (NB)', 'Ranga (Iceland)', 'Alta (Norway)', 'Tweed (Scotland)'],
  'Chinook Salmon': ['Columbia River (OR/WA)', 'Kenai (AK)', 'Sacramento (CA)', 'Great Lakes (MI/WI)'],
  'Coho Salmon': ['Great Lakes (MI/WI)', 'Puget Sound (WA)', 'Situk (AK)'],
  'Sockeye Salmon': ['Bristol Bay (AK)', 'Fraser (BC)', 'Kenai (AK)'],
  'Pink Salmon': ['Puget Sound odd-year runs (WA)', 'SE Alaska', 'BC coastal rivers'],
  'Chum Salmon': ['SE Alaska', 'Hood Canal (WA)', 'BC central coast'],
  'Kokanee Salmon': ['Flaming Gorge (UT/WY)', 'Lake Pend Oreille (ID)', 'Stampede (CA)', 'Okanagan (BC)'],
  'Largemouth Bass': ['Lake Guntersville (AL)', 'Toledo Bend (TX/LA)', 'Florida’s Kissimmee Chain', 'Clear Lake (CA)'],
  'Smallmouth Bass': ['Lake St. Clair (MI/ON)', 'Susquehanna (PA)', 'Dale Hollow (TN/KY)', 'Columbia River (WA/OR)'],
  'Spotted Bass': ['Lake Lanier (GA)', 'Lake Hartwell (GA/SC)', 'Lake Almanor (CA)'],
  'Walleye': ['Lake Erie (OH/ON)', 'Green Bay (WI)', 'Mississippi Pool 4 (MN)', 'Columbia River (WA)'],
  'Sauger': ['Mississippi River tailwaters', 'Tennessee River (AL)', 'Missouri River (ND/SD)'],
  'Northern Pike': ['Lake of the Woods (MN/ON)', 'Loon Lake (SD)', 'Sweden’s lakes', 'Saskatchewan fly-in lakes'],
  'Muskellunge': ['Chautauqua (NY)', 'Lake St. Clair (MI/ON)', 'Georgian Bay (ON)', 'Green Bay (WI)'],
  'Tiger Muskie': ['Curlew Lake (WA)', 'Pineview (UT)', 'Cave Run (KY)'],
  'Channel Catfish': ['Red River (ND/MN)', 'Santee Cooper (SC)', 'Ohio River pools', 'Falcon Lake (TX)'],
  'Blue Catfish': ['Santee Cooper (SC)', 'Kerr Lake/Buggs Island (VA/NC)', 'Ohio River', 'Lake Texoma (TX/OK)'],
  'Flathead Catfish': ['Altamaha (GA)', 'Missouri River (NE)', 'Susquehanna (PA)', 'Gila River (AZ)'],
  'Common Carp': ['Grand River (ON)', 'St. Lawrence River (NY)', 'Urban canals (EU)', 'Lake Texoma (TX/OK)'],
  'Grass Carp': ['Urban park lakes (US/UK)', 'Texas reservoirs', 'Irrigation canals (CA/AZ)'],
  'Alligator Gar': ['Trinity River (TX)', 'Choke Canyon (TX)', 'Mississippi delta oxbows (LA)'],
  'Longnose Gar': ['Trinity River (TX)', 'Illinois River (IL)', 'Santee Cooper (SC)'],
  'Bowfin': ['Louisiana backwaters', 'Chesapeake tributaries', 'Santee Cooper (SC)'],
  'American Eel': ['Chesapeake tributaries (MD/VA)', 'Hudson River (NY)', 'St. Lawrence (QC)'],
  'Lake Sturgeon': ['Rainy River (MN/ON)', 'Wolf River (WI)', 'Detroit River (MI/ON)'],
  'White Sturgeon': ['Columbia River below Bonneville (OR/WA)', 'Fraser River (BC)', 'Snake River (ID)'],
  'Yellow Perch': ['Lake Erie (OH/ON)', 'Devils Lake (ND)', 'Lake Simcoe (ON)', 'Lake Washington (WA)'],
  'Bluegill': ['Lake Okeechobee (FL)', 'Shawano Lake (WI)', 'Texas farm ponds', 'Lake Havasu (AZ/CA)'],
  'Black Crappie': ['Kissimmee Chain (FL)', 'Grenada (MS)', 'Reelfoot (TN)', 'Millwood (AR)'],
  'White Crappie': ['Grenada (MS)', 'Truman (MO)', 'Toledo Bend (TX/LA)'],
  'Pumpkinseed': ['New England ponds', 'Ontario lakes', 'European stocked ponds'],
  'Rock Bass': ['Great Lakes bays (MI/WI)', 'Mississippi backwaters (MN)', 'Ozark streams (MO)'],
  'Green Sunfish': ['Farm ponds (central US)', 'Reservoir coves (KS/OK/TX)'],
  'Redbreast Sunfish': ['Satilla River (GA)', 'Lynches River (SC)', 'Appalachian rivers (TN/NC)'],
  'Longear Sunfish': ['Ozark streams (MO/AR)', 'Gulf Coastal Plain creeks'],
  'Redear Sunfish': ['Lake Havasu (AZ/CA)', 'Lake Okeechobee (FL)', 'Kerr Lake (VA/NC)'],
  'Warmouth': ['Okefenokee (GA)', 'Louisiana swamps', 'Chesapeake sloughs'],
  'Striped Bass (Inland)': ['Lake Lanier (GA)', 'Norfork (AR)', 'Lake Murray (SC)', 'Smith Mountain (VA)'],
  'Striped Bass (Coastal)': ['Chesapeake (MD/VA)', 'Cape Cod Canal (MA)', 'Hudson River (NY)', 'Delaware River (NJ/PA)'],
  'White Bass': ['Lake Texoma (TX/OK)', 'Truman (MO)', 'Mississippi River pools (MN)'],
  'Wiper/White Bass Hybrids': ['Lake Texoma (TX/OK)', 'Norfork (AR)', 'Beaver (AR/MO)'],
  'Wiper (Hybrid Striped Bass)': ['Lake Texoma (TX/OK)', 'Norfork (AR)', 'Beaver (AR/MO)'],
  'Hybrid Striped Bass': ['Lake Texoma (TX/OK)', 'Norfork (AR)', 'Santee Cooper (SC)'],
  'White Perch': ['Chesapeake (MD)', 'Hudson River (NY)', 'Santee Cooper (SC)'],
  'Chain Pickerel': ['Chesapeake tidal rivers (MD/VA)', 'Florida panhandle', 'Nova Scotia lakes'],
  'American Pickerel': ['NE US coastal streams', 'Maritime Canada'],
  'Burbot': ['Lake Superior (MI/WI)', 'Flaming Gorge (UT/WY)', 'Lake of the Woods (MN/ON)'],
  'American Shad (inland runs)': ['Columbia River (OR/WA)', 'Susquehanna (PA)', 'Sacramento (CA)', 'St. Johns (FL)'],
  'Hickory Shad': ['Roanoke (NC/VA)', 'Susquehanna flats (MD)'],
  'Cisco': ['Great Lakes (Superior/Michigan)', 'MN deep lakes', 'Saskatchewan lakes'],
  'Lake Whitefish': ['Great Lakes (MI/WI/ON)', 'Flathead (MT)', 'Alberta lakes'],
  'Mountain Whitefish': ['Madison (MT)', 'Yakima (WA)', 'Kootenai (ID/MT)'],
  'Arctic Grayling': ['Big Hole (MT)', 'NWT lakes (Canada)', 'Alaskan clear rivers'],
  'European Grayling': ['River Test (England)', 'Welsh Dee', 'Scandinavian rivers', 'Vlatava (Czechia)'],
  'Zander': ['Danube delta (Romania)', 'Ijsselmeer (NL)', 'Finnish lakes', 'UK stocked pits'],
  'European Perch': ['Baltic archipelagos (FI/SE)', 'Lake Geneva (FR/CH)', 'UK canal backwaters'],
  'Wels Catfish': ['Ebro (Spain)', 'Po (Italy)', 'French Saône/Sierroz', 'Danube (HU/RS)'],
  'Tench': ['UK estate lakes', 'Danube backwaters', 'Dutch canals'],
  'Barbel': ['River Wye (Wales)', 'Dove/Derwent (England)', 'Ebro tributaries (Spain)'],
  'European Chub': ['UK southern rivers', 'French canal systems', 'Danube tributaries'],
  'Tigerfish (Goliath)': ['Zambezi (Zambia/Zimbabwe)', 'Okavango (Botswana)', 'Kariba (Zimbabwe)'],
  'Nile Perch': ['Lake Victoria (UG/TZ)', 'Murchison Falls Nile (UG)', 'Lake Nasser (EG)'],
  'Mahseer (Golden)': ['Cauvery (India)', 'Ramganga/Corbett (India)', 'Borneo rivers'],
  'Giant Mekong Catfish': ['Mekong (Thailand/Laos)', 'Bung Sam Lan (TH, stocked)'],
  'Siamese Carp': ['Bung Sam Lan (TH)', 'Mekong tributaries', 'Thai fishing parks'],
  'Taimen': ['Eg-Uur (Mongolia)', 'Onon (Mongolia)', 'Kamchatka (RU)'],
  'Huchen (Danube Salmon)': ['Sava (SI)', 'Mur (AT/SI)', 'Tisa tributaries (SK)'],
  'Golden Dorado': ['Paraná (AR)', 'Iberá wetlands (AR)', 'Bolivian Tsimane rivers', 'Piray (BO)'],
  'Peacock Bass': ['Amazon lodges (BR)', 'Rio Negro (BR)', 'Panama Canal lakes', 'Miami canals (FL, introduced)'],
  'Butterfly Peacock Bass': ['Miami canals (FL)', 'Hawaii reservoirs', 'Amazon tributaries (BR)'],
  'Payara (Vampire Fish)': ['Paraná (AR)', 'Tsimane rivers (BO)', 'Orinoco (VE)'],
  'Arapaima': ['Amazon lodges (BR)', 'Guyana Rupununi', 'TH stocked lakes'],
  'Red-bellied Piranha': ['Amazon (BR)', 'Orinoco (VE)', 'Paraná (AR)'],
  'Silver Arowana': ['Amazon (BR)', 'Guyana', 'TH stocked lakes'],
  'Tambaqui': ['Amazon (BR)', 'Pantanal (BR)', 'TH stocked lakes'],
  'Pacu': ['Pantanal (BR)', 'Amazon (BR)', 'US lakes (introduced)'],
  'Murray Cod': ['Murray-Darling rivers (NSW/VIC)', 'Lake Mulwala (NSW/VIC)', 'Eildon (VIC)'],
  'Australian Bass': ['Hawkesbury (NSW)', 'Impoundments QLD/NSW', 'Gippsland rivers (VIC)'],
  'Barramundi': ['Daly River (NT)', 'Hinchinbrook (QLD)', 'Lake Awoonga (QLD)', 'PNG estuaries'],
  'Mangrove Jack': ['Hinchinbrook (QLD)', 'Kimberley creeks (WA)', 'NT estuaries'],
  'Coral Trout': ['Great Barrier Reef (QLD)', 'Coral Sea (QLD)', 'Kimberley (WA)'],
  'Snapper (Australasian)': ['Hauraki Gulf (NZ)', 'Spencer Gulf (SA)', 'Port Phillip Bay (VIC)'],
  'Mulloway (Jewfish)': ['Clarence River (NSW)', 'South Australian gulfs', 'West coast beaches (WA)'],
  'Yellowtail Kingfish': ['Hauraki Gulf (NZ)', 'South Australian gulfs', 'San Diego kelp lines (CA)'],
  'Atlantic Tarpon': ['Boca Grande (FL)', 'Homosassa (FL)', 'Costa Rican Caribbean', 'Gambia (West Africa)'],
  'Snook (Common)': ['Tampa Bay (FL)', 'Everglades (FL)', 'Costa Rica Caribbean'],
  'Red Drum (Redfish)': ['Louisiana marshes', 'Port Aransas (TX)', 'Harkers Island (NC)', 'Indian River Lagoon (FL)'],
  'Spotted Seatrout': ['Louisiana marshes', 'Mosquito Lagoon (FL)', 'Matagorda Bay (TX)'],
  'Cobia': ['Chesapeake (VA/MD)', 'Panama City (FL)', 'Pensacola (FL)'],
  'Tarpon (Atlantic)': ['Boca Grande (FL)', 'Keys (FL)'],
  'Permit': ['Florida Keys', 'Ascension Bay (MX)', 'Bahamas flats'],
  'Bonefish': ['Bahamas flats', 'Florida Keys', 'Christmas Island (KI)', 'Los Roques (VE)'],
  'Mahi-Mahi (Dolphinfish)': ['Florida Keys', 'Cabo (MX)', 'Outer Banks (NC)', 'Hawaii FADs'],
  'Sailfish': ['Guatemala Pacific', 'Cancún/Isla Mujeres (MX)', 'Cabo (MX)', 'Quepos (CR)'],
  'Blue Marlin': ['Cabo (MX)', 'Kona (HI)', 'Bahamas (Bimini)', 'Madeira (PT)'],
  'White Marlin': ['Outer Banks (NC)', 'Cancún (MX)', 'Cape Verde'],
  'Black Marlin': ['Cairns (QLD)', 'Panama Montuosa', 'Kenya (Watamu)'],
  'Striped Marlin': ['Cabo (MX)', 'Magdalena Bay (MX)', 'Ecuador (Manta)'],
  'Bluefin Tuna': ['Cape Cod (MA)', 'Prince Edward Island (CA)', 'Gulf of Maine', 'Mediterranean traps (MT/ES)'],
  'Yellowfin Tuna': ['Venice (LA)', 'Panama (Hannibal Bank)', 'Puerto Vallarta (MX)', 'Cape Verde'],
  'Albacore Tuna': ['California coast (CA)', 'Oregon/Washington offshore', 'Bay of Biscay (FR/ES)'],
  'Bigeye Tuna': ['Hawaii FADs', 'Venice (LA)', 'Canary Islands'],
  'Wahoo': ['Bahamas', 'Key West (FL)', 'Quepos (CR)', 'Cairns (QLD)'],
  'King Mackerel': ['Key West (FL)', 'Navarre (FL)', 'Wrightsville Beach (NC)'],
  'Spanish Mackerel': ['Pensacola (FL)', 'Chesapeake (VA)', 'Harkers Island (NC)'],
  'Atlantic Cod': ['Lofoten (Norway)', 'Iceland', 'Georges Bank (MA, historical)', 'Newfoundland jigging'],
  'Haddock': ['Stellwagen Bank (MA)', 'Iceland', 'North Sea (UK/NOR)'],
  'Pollock': ['Stellwagen Bank (MA)', 'Norway', 'UK Channel wrecks'],
  'Lingcod': ['San Clemente (CA)', 'Neah Bay (WA)', 'Sitka (AK)', 'Port Hardy (BC)'],
  'Pacific Halibut': ['Homer (AK)', 'Sitka (AK)', 'Ilwaco (WA)', 'Rupert (BC)'],
  'California Halibut': ['San Francisco Bay (CA)', 'Santa Monica Bay (CA)', 'San Diego bays (CA)'],
  'Summer Flounder (Fluke)': ['Montauk (NY)', 'Cape May (NJ)', 'Martha’s Vineyard (MA)'],
  'Winter Flounder': ['Boston Harbor (MA)', 'Long Island bays (NY)'],
  'Tautog (Blackfish)': ['Montauk (NY)', 'Block Island (RI)', 'Chesapeake wrecks (VA)'],
  'Black Sea Bass': ['Montauk (NY)', 'Cape May (NJ)', 'Chesapeake wrecks (VA)'],
  'Scup (Porgy)': ['Narragansett (RI)', 'Montauk (NY)', 'Chesapeake (MD)'],
  'Striped Bass': ['Chesapeake (MD/VA)', 'Cape Cod Canal (MA)', 'Hudson River (NY)'],
  'Giant Trevally (GT)': ['Seychelles (Alphonse)', 'Christmas Island', 'Andaman Islands', 'Great Barrier Reef (QLD)'],
  'Bluefin Trevally': ['Christmas Island', 'Hawaii', 'French Polynesia'],
  'Milkfish': ['Alphonse (Seychelles)', 'Christmas Island', 'Maldives flats'],
  'Roosterfish': ['Cabo (MX)', 'Panama (Coiba)', 'Costa Rica (Golfito)'],
  'Crevalle Jack': ['Florida flats', 'Louisiana bridges', 'Gulf beaches'],
  'Greater Amberjack': ['Panama City (FL)', 'Venice (LA)', 'Flower Garden Banks (GOM)'],
  'Goliath Grouper': ['Everglades (FL)', 'Jupiter (FL)', 'Tampa Bay wrecks (FL)'],
  'Gag Grouper': ['Florida Nature Coast', 'Tampa Bay (FL)', 'Middle Grounds (GOM)'],
  'Red Snapper (Northern)': ['Venice (LA)', 'Panama City (FL)', 'Corpus Christi (TX)', 'Pensacola (FL)'],
  'Yellowtail Snapper': ['Key West (FL)', 'Dry Tortugas (FL)', 'Bahamas'],
  'Mutton Snapper': ['Dry Tortugas (FL)', 'Key West (FL)', 'Bahamas'],
  'Mangrove Snapper': ['Tampa Bay (FL)', 'Louisiana rigs', 'Dry Tortugas (FL)'],
  'Lane Snapper': ['Dry Tortugas (FL)', 'Venice (LA)'],
  'Cubera Snapper': ['Key West (FL)', 'Coiba (PA)'],
  'Hogfish': ['Dry Tortugas (FL)', 'Middle Grounds (GOM)', 'Florida Keys spearfishing'],
  'Sheepshead': ['Tampa Bay (FL)', 'Louisiana bridges', 'Chesapeake (MD)'],
  'Tripletail': ['Jekyll Island (GA)', 'Port Canaveral (FL)', 'Venice (LA)'],
  'Cobia (Pacific)': ['Cabo (MX)', 'Panama'],
  'Barracuda (Great)': ['Bahamas', 'Florida Keys', 'Seychelles'],
  'King-of-the-Salmon': ['Pacific Northwest coast (WA/OR)'],
  'Opah': ['California longline bycatch', 'Hawaii'],
  'Ocean Sunfish': ['California kelp lines', 'Portugal', 'South Africa (Cape)'],
  'Swordfish': ['Florida Straits', 'Cabo (MX)', 'Kona (HI)'],
  'Spearfish (Longbill)': ['Key West (FL)', 'Bahamas'],
  'Blue Shark': ['Cape Cod (MA)', 'Cornwall (UK)', 'California offshore'],
  'Shortfin Mako': ['Cabo (MX)', 'San Diego offshore (CA)', 'Rhode Island offshore'],
  'Porbeagle': ['Cornwall (UK)', 'Nova Scotia (CA)'],
  'Thresher Shark (Common)': ['San Diego (CA)', 'Cornwall (UK)'],
  'Hammerhead Shark (Great)': ['Bimini (Bahamas)', 'Jupiter (FL)', 'Galapagos'],
  'Tiger Shark': ['Bahamas', 'Hawaii', 'Ningaloo (WA)'],
  'Bull Shark': ['Jupiter (FL)', 'Reef wrecks (FL)', 'Zambezi (MZ)'],
  'Whale Shark': ['Ningaloo (WA)', 'Isla Mujeres (MX)', 'Utila (HN)'],
  'Manta Ray': ['Maldives', 'Isla Mujeres (MX)', 'Yap (FSM)'],
  'Common Skate (Blue Skate)': ['Bristol Channel (UK)', 'Loch Aline (Scotland)', 'Norwegian fjords'],
  'Thornback Ray': ['Thames (UK)', 'Bristol Channel (UK)', 'Irish Sea'],
  'Blonde Ray': ['Bristol Channel (UK)', 'Cornwall (UK)'],
  'Small-Eyed Ray': ['Bristol Channel (UK)', 'Welsh beaches'],
  'Undulate Ray': ['Cornwall (UK)', 'Channel Islands'],
  'Spotted Ray': ['Welsh beaches (UK)', 'Sussex (UK)'],
  'Cuckoo Ray': ['Cornwall deep marks (UK)', 'Irish deep grounds'],
  'Angel Shark': ['Canary Islands (ES)', 'Welsh coast (UK, protected)'],
  'European Seabass': ['Channel Islands', 'Bristol Channel (UK)', 'Atlantic France', 'Portugal estuaries'],
  'Gilthead Seabream': ['Mediterranean Spain', 'Adriatic (HR/IT)', 'Canary Islands'],
  'Dusky Grouper': ['Mediterranean marine reserves (FR/ES)', 'Adriatic (HR)'],
  'Ballan Wrasse': ['Cornwall (UK)', 'Channel Islands', 'Ireland', 'Norwegian skerries'],
  'Cuckoo Wrasse': ['Cornwall (UK)', 'Pembrokeshire (Wales)'],
  'Conger Eel (Conger)': ['UK Channel wrecks', 'Cornwall', 'Ireland'],
  'Conger': ['UK Channel wrecks', 'Cornwall (UK)', 'Ireland'],
  'Pollack': ['Cornwall (UK)', 'Channel wrecks', 'Norway'],
  'Atlantic Mackerel': ['Cornwall (UK)', 'Scottish west coast', 'New England (MA)'],
  'Garfish': ['Baltic (DK/SE)', 'Cornwall (UK)'],
  'Common Octopus': ['Mediterranean', 'Canary Islands'],
  // aquarium / novelty species — native ranges
  'Discus': ['Amazon tributaries (BR)', 'Rio Negro (BR)'],
  'Freshwater Angelfish': ['Amazon (BR)', 'Orinoco (VE)'],
  'Oscar': ['Amazon (BR)', 'Florida canals (introduced)'],
  'Convict Cichlid': ['Central America rivers (CR)', 'Hawaii streams (introduced)'],
  'Jaguar Cichlid': ['Central America (CR/HN)'],
  'Midas Cichlid': ['Nicaraguan lakes', 'Costa Rica (CR)'],
  'Blue Acara': ['Trinidad rivers', 'Venezuela (VE)', 'Colombia (CO)'],
  'Black Acara': ['South America (BR/GY)', 'Florida canals (introduced)'],
  'Mayan Cichlid': ['Yucatán (MX)', 'Florida Everglades (introduced)'],
  'Clown Knifefish': ['Mekong (TH/LA)', 'Thai lakes', 'FL canals (introduced)'],
  'Iridescent Shark Catfish': ['Mekong (TH/LA/VN)'],
  'Redtail Catfish': ['Amazon (BR)', 'TH stocked lakes'],
  'Tiger Shovelnose Catfish': ['Amazon (BR)', 'Orinoco (VE)'],
  'Ripsaw Catfish': ['Amazon (BR)', 'Orinoco (VE)'],
  'Pictus Catfish': ['Amazon (BR)', 'Orinoco (VE)'],
  'North African Catfish': ['Nile (EG)', 'African lakes', 'EU fish farms'],
  'Walking Catfish': ['SE Asia', 'Florida canals (introduced)'],
  'Snakehead (Giant)': ['SE Asia rivers', 'TH/Cambodia lakes'],
  'Northern Snakehead': ['Potomac (MD/VA)', 'Arkansas backwaters', 'Mid-Atlantic rivers'],
  'Vundu (Biggest African Catfish)': ['Zambezi (ZM/ZW)', 'Congo (CD)', 'African rift lakes'],
  'Vundu': ['Zambezi (ZM/ZW)', 'Congo (CD)'],
  'Alligatorfish': ['North Atlantic coasts'],
  'Mozambique Tilapia': ['SE African rivers', 'FL lakes (introduced)', 'HI streams (introduced)'],
  'Nile Tilapia': ['Nile (EG)', 'Israeli ponds', 'FL lakes (introduced)'],
  'Blue Tilapia': ['Nile/Levant', 'FL lakes (introduced)', 'TX lakes (introduced)'],
  'Redbelly Tilapia': ['Nile (EG)', 'CA canals (introduced)'],
  'Snakeskin Gourami': ['Mekong (TH/LA)', 'Thai rice paddies'],
  'Kissing Gourami': ['Mekong (TH)', 'Indonesian lakes'],
  'Giant Gourami': ['Mekong (TH/LA)', 'Indonesian lakes'],
  'Rohu': ['Indian rivers', 'Pakistani rivers', 'Asian aquaculture ponds'],
  'Bighead Carp': ['Mississippi (US, introduced)', 'Yangtze (CN)'],
  'Silver Carp': ['Mississippi (US, introduced)', 'Yangtze (CN)'],
  'Piraíba (Lau Lau)': ['Amazon (BR)', 'Orinoco (VE)'],
  'Zander (Pikeperch)': ['Danube delta (RO)', 'Ijsselmeer (NL)', 'Finnish lakes'],
  'Rudd': ['UK estate lakes', 'Danube backwaters', 'Irish lakes'],
  'Roach': ['UK canals', 'Irish loughs', 'Dutch canals'],
  'Common Bream': ['UK stillwaters', 'Danube backwaters', 'Dutch polders'],
  'Silver Bream': ['European lowland rivers', 'UK canals'],
  'White-Eye Bream': ['Danube (HU/RS)', 'Dnieper (UA)'],
  'Bleak': ['European lowland rivers', 'UK canals'],
  'Ide': ['Scandinavian rivers', 'Baltic tributaries', 'EU lowland rivers'],
  'Dace': ['UK rivers (Test/Wye)', 'Danube tributaries'],
  'Vimba': ['Danube (HU/RS)', 'Baltic tributaries'],
  'Nase': ['Danube tributaries (AT/SI)', 'Adriatic rivers (IT)'],
  'Zope': ['Danube backwaters (HU)', 'Dnieper (UA)'],
  'Ziege (Sabre Carp)': ['Danube backwaters (HU)', 'Volga delta (RU)'],
  'Ziege': ['Danube backwaters (HU)', 'Volga delta (RU)'],
  'Asp': ['Volga delta (RU)', 'Danube (HU/RS)', 'Elbe (DE/CZ)'],
  'Pikeperch': ['Danube delta (RO)', 'Ijsselmeer (NL)', 'Finnish lakes'],
  'Tench (European)': ['UK estate lakes', 'Danube backwaters'],
};

// 2) Keyword rules — family/name pattern → regions. Most specific first.
const RULES = [
  [/steelhead/i, ['Great Lakes tributaries (MI/WI/NY)', 'Pacific Northwest rivers (WA/OR/BC)', 'California coastal rivers', 'Alaska panhandle']],
  [/menhaden|bunker|shad\b|herring/i, ['Atlantic coast runs (US)', 'Chesapeake (MD/VA)', 'Gulf coast (LA/TX)']],
  [/smelt|silverside|capelin|sand lance|saury|anchovy|pilchard|sardine/i, ['Pacific Northwest beaches (WA/OR)', 'Atlantic coast (US/CA)', 'North Sea (EU)']],
  [/rockfish/i, ['California banks (CA)', 'Pacific Northwest (WA/OR)', 'Alaska (Sitka/Homer)', 'British Columbia (BC)']],
  [/sole|flounder|plaice|dab|halibut|turbot|fluke|sanddab/i, ['Bays and estuaries across range', 'Atlantic coast (US/EU)', 'North Sea (EU)']],
  [/grouper|rockcod/i, ['Gulf of Mexico (FL/TX/LA)', 'South Atlantic reefs (FL–NC)', 'Caribbean', 'IWP reefs (AUS/PAC)']],
  [/snapper/i, ['Gulf of Mexico (FL/TX)', 'South Atlantic (FL–NC)', 'Caribbean', 'IWP reefs']],
  [/amberjack|kingfish|jack\b|crevalle|pompano|pompfish/i, ['Gulf of Mexico', 'Florida Atlantic', 'Caribbean', 'Offshore wrecks & reefs']],
  [/tuna|bonito|mackerel|skipjack|albacore/i, ['Northeast US offshore (MA/NJ)', 'Gulf of Mexico', 'California offshore', 'Atlantic Europe (FR/ES/PT)']],
  [/marlin|sailfish|spearfish/i, ['Florida Keys / Bahamas', 'Caribbean', 'Eastern Pacific (Cabo/Panama)', 'Indian Ocean (Kenya/Maldives)']],
  [/shark/i, ['Florida coasts', 'Carolinas', 'California/Baja', 'UK coasts (where legal)']],
  [/ray\b|skate/i, ['UK south coast', 'Bristol Channel (UK)', 'Atlantic beaches (EU)', 'Gulf of Mexico']],
  [/sturgeon/i, ['Columbia River (OR/WA)', 'Sacramento (CA)', 'Fraser (BC)', 'Great Lakes (US/CA)']],
  [/salmon/i, ['Pacific Northwest (WA/OR/BC)', 'Alaska', 'Great Lakes (introduced)', 'North Atlantic rivers (EU/CA)']],
  [/trout|char\b|charr/i, ['Rocky Mountain rivers/lakes', 'Appalachian headwaters', 'Pacific Northwest', 'European chalkstreams']],
  [/pike\b|pickerel|muskie|musky/i, ['Upper Midwest lakes (MN/WI/MI)', 'Canada (ON/QC/BC)', 'Chesapeake tidal rivers', 'European lowland rivers']],
  [/perch\b|sunfish|bluegill|crappie|bass\b/i, ['US farm ponds and reservoirs', 'Great Lakes (US/CA)', 'Southern US rivers', 'Introduced EU waters']],
  [/catfish|bullhead|madtom|stonecat/i, ['Southern US rivers', 'Mississippi system', 'Reservoirs (TX/OK/FL)', 'European stocked ponds']],
  [/carp\b|buffalo|sucker|redhorse|chubsucker/i, ['Mississippi system rivers', 'Great Lakes bays', 'Southern reservoirs', 'European stillwaters']],
  [/gar\b|bowfin|eel\b|lamprey/i, ['Gulf coastal plain (TX–FL)', 'Mississippi backwaters', 'Chesapeake tributaries']],
  [/darter|minnow|shiner|chub\b|dace|killifish|mudminnow|pupfish|stickleback/i, ['Small streams across native range', 'US Midwest rivers', 'Appalachian creeks']],
  [/tilapia|cichlid|oscar|angelfish|discus|acara|gourami|knifefish|arowana|piranha|pacu|brycon|metynnis/i, ['Native tropical rivers (Amazon/Africa/Asia)', 'Stocked/feral populations (FL/HI/TH)', 'Aquaculture ponds']],
  [/wrasse/i, ['Cornwall (UK)', 'Channel Islands', 'Ireland', 'Norwegian coast']],
  [/cod\b|ling\b|pollock|pollack|haddock|coalfish|cusk|torsk/i, ['North Sea (NOR/UK)', 'Iceland', 'Georges Bank (US)', 'Norwegian coast']],
  [/conger|eel\b/i, ['UK Channel wrecks', 'Cornwall (UK)', 'Mediterranean', 'Ireland']],
  [/seabream|bream\b|porgy|scup|sheepshead|grunt/i, ['Mediterranean', 'Canary Islands', 'Gulf of Mexico', 'South Atlantic (US)']],
  [/mullet|grey mullet/i, ['Mediterranean estuaries', 'Atlantic Europe', 'Gulf of Mexico', 'Australian estuaries']],
  [/mullets/i, ['Mediterranean estuaries', 'Atlantic Europe', 'Gulf of Mexico']],
  [/barracuda/i, ['Florida / Bahamas', 'Caribbean', 'Seychelles', 'Queensland (AUS)']],
  [/tarpon|ladyfish|bonefish|permit/i, ['Florida flats/keys', 'Bahamas', 'Caribbean', 'West Africa (tarpon)']],
  [/snook|corbina|croaker|drum\b|kingfish|whiting/i, ['Gulf coast surf & bays', 'Chesapeake (MD/VA)', 'Florida beaches', 'Australian estuaries']],
  [/halibut/i, ['Alaska (Homer/Sitka)', 'Pacific Northwest (WA/OR)', 'California bays', 'North Sea (EU)']],
  [/triggerfish|puffer|porcupine|balloon|boxfish|cowfish|trunkfish|filefish/i, ['Florida reefs (US)', 'Caribbean', 'Hawaii', 'IWP reefs']],
  [/parrotfish|butterflyfish|angelfish|damselfish|cleaner wrasse|hogfish/i, ['Florida reefs (US)', 'Caribbean', 'Hawaii', 'IWP reefs']],
  [/squirrelfish|soldierfish|bigeye\b|moontail|batfish|spadefish/i, ['Florida reefs (US)', 'Caribbean', 'Hawaii', 'IWP reefs']],
  [/mola|sunfish|opah|lumpfish|lumpsucker|mola\b|moonfish|pomfret|ribbonfish|cutlassfish|oarfish/i, ['Open ocean / drift lines', 'California offshore', 'Atlantic Europe', 'IWP offshore']],
  [/anchovy|herring|menhaden|sprat/i, ['Coastal bait schools (regional)', 'Atlantic (US/EU)', 'Pacific Northwest']],
  [/frigate|bonito|mackerel/i, ['Gulf of Mexico', 'California offshore', 'Atlantic Europe']],
  [/trevally|kingfish\b/i, ['IWP reefs (AUS/PAC/IND)', 'Great Barrier Reef (QLD)', 'Hawaii', 'Seychelles']],
  [/emperor|coral trout|sweetlips|rabbitfish|lionfish|fusilier|bannerfish/i, ['Great Barrier Reef (QLD)', 'Coral Sea', 'Indo-Pacific reefs', 'Red Sea']],
  [/sea bass|seabass|bass (?!.*largemouth|.*smallmouth|.*striped|.*white|.*black|.*spotted|.*kelp|.*calico|.*sand|.*bay|.*str)/i, ['Mediterranean', 'Atlantic Europe', 'Chesapeake (MD/VA)', 'Gulf of Mexico']],
  [/seabream|gilthead/i, ['Mediterranean', 'Canary Islands', 'Atlantic Europe']],
  [/ray shark|houndfish|needlefish|ballyhoo|garfish|flyingfish/i, ['Tropical/subtropical coasts', 'Florida (US)', 'Mediterranean', 'IWP']],
  [/escolar|oilfish|snake mackerel/i, ['Open ocean / deep offshore', 'Hawaii', 'Atlantic Europe']],
  [/toadfish|oyster|blenny|goby|sculpin|poacher|prickleback|gunnel|lumpfish/i, ['Bays and nearshore structure', 'Pacific Northwest', 'North Atlantic coasts']],
  [/kelp\b|greenling|lingcod|cabezon|rock greenling/i, ['California kelp beds', 'Pacific Northwest', 'British Columbia', 'Alaska']],
  [/perch\b.*sea|sea perch|ocean perch/i, ['North Atlantic', 'Pacific Northwest', 'Alaska']],
  [/wolffish|wolf fish|catfish \(sea\)/i, ['North Atlantic (NOR/IS/UK)', 'Greenland', 'New England (US)']],
  [/skate|ray\b|guitarfish/i, ['Bristol Channel (UK)', 'North Sea', 'Mediterranean', 'Gulf of Mexico']],
  [/pipefish|seahorse|snipe eel|ribbon/i, ['Coastal seagrass and drift algae', 'Mediterranean', 'IWP']],
  [/pearl|rooster|halo|saber/i, ['Eastern Pacific (Cabo/Panama)', 'Costa Rica']],
  [/dorado|dolphinfish|mahi/i, ['Florida Keys', 'Caribbean', 'Cabo (MX)', 'Hawaii FADs']],
  [/pompano|palometa|pilot fish|lookdown|moonfish/i, ['Florida surf', 'Gulf of Mexico', 'Caribbean', 'West Africa']],
  [/grunt|croaker|corvina|drum/i, ['Gulf of Mexico', 'Chesapeake', 'California bays', 'West African surf']],
  [/tilefish|hb god|golden tile/i, ['Middle Grounds (GOM)', 'South Atlantic (FL–NC)', 'Hudson Canyon (NY)']],
  [/capelin|smelt|grunion|surfperch|croaker/i, ['Pacific coast beaches (CA/OR/WA)', 'Atlantic beaches', 'North Sea']],
  [/surfperch/i, ['California beaches', 'Oregon/Washington beaches']],
  [/murrel|snakehead|channa/i, ['SE Asia wetlands', 'Mid-Atlantic US (introduced)', 'Florida (introduced)']],
  [/climbing perch|walking cat|sharptooth/i, ['SE Asia rice paddies', 'African swamps', 'FL canals (introduced)']],
  [/arowana|bonytongue|knifefish|featherback/i, ['Amazon/SE Asia native rivers', 'Stocked lakes (TH)', 'FL canals (introduced)']],
  [/piranha|pacu|payara|tra |tambaqui|dorado/i, ['Amazon/Paraná (BR/AR)', 'Orinoco (VE)', 'Stocked lakes (TH)']],
  [/catfish/i, ['Southern US rivers/reservoirs', 'Mississippi system', 'European stocked ponds', 'Tropical rivers (native range)']],
  [/bream/i, ['UK stillwaters & canals', 'Danube backwaters', 'Irish loughs', 'Dutch canals']],
  [/grayling/i, ['European chalkstreams', 'Alaskan rivers', 'Montana rivers', 'Scandinavia']],
  [/whitefish/i, ['Great Lakes', 'Northern US/Canada lakes', 'Montana rivers']],
  [/smelt|silverside/i, ['Coastal bait runs (regional)', 'Atlantic (US/CA)', 'Pacific Northwest']],
  [/gar\b|garfish/i, ['Gulf coastal plain', 'Mississippi backwaters', 'Chesapeake tributaries']],
  [/eel\b/i, ['Chesapeake/Hudson tributaries', 'Gulf coast rivers', 'European rivers', 'St. Lawrence (QC)']],
  [/shad\b|alewife|blueback/i, ['Columbia (OR/WA)', 'Susquehanna (PA)', 'Connecticut (CT)', 'Atlantic coastal rivers']],
  [/stickleback|sculpin|lumpfish|gunnel|prickleback/i, ['Nearshore coasts (US/EU)', 'Bays and estuaries', 'Pacific Northwest']],
  [/perch\b/i, ['Great Lakes (US/CA)', 'Midwest lakes (US)', 'Baltic (EU)', 'Ontario lakes (CA)']],
];

// 3) Environment fallbacks
const FALLBACK = {
  Freshwater: ['Rivers and lakes across native and stocked range', 'Impoundments and reservoirs near you', 'Check regional stocking reports'],
  Saltwater: ['Coastal waters across its range', 'Reefs, wrecks, and structure in-season', 'Regional fishing forums for current marks'],
  Brackish: ['Estuaries and tidal rivers across its range', 'Mangrove creeks and river mouths', 'Brackish lagoons near you'],
};

/* ------------------------------------------------------------------ main */
const db = await loadSpeciesDb();
const seen = new Map();
for (const s of db) {
  const k = String(s.name || '').toLowerCase().trim();
  if (k && !seen.has(k)) seen.set(k, s);
}
const all = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));

const rows = [];
const misses = [];
for (const sp of all) {
  const name = sp.name;
  // 1) Curated corrections win — they replace anything upstream provided.
  if (CORRECTIONS[name]) { rows.push({ name, regions: CORRECTIONS[name], replace: true }); continue; }
  const hasRegions = Array.isArray(sp.regions) ? sp.regions.length > 0 : !!String(sp.regions || '').trim();
  if (hasRegions) continue;
  let regions = OVERRIDES[name];
  if (!regions) {
    for (const [re, list] of RULES) { if (re.test(name)) { regions = list; break; } }
  }
  if (!regions) regions = FALLBACK[sp.env] || FALLBACK.Freshwater;
  if (regions.some((r) => /[>]{2}|\?\? no/i.test(r))) {
    // sanity: catch typos smuggled into overrides
    misses.push(name); continue;
  }
  rows.push({ name, regions });
}

console.log(`species without regions: ${all.length - (all.length - rows.length - misses.length)}/${all.length}`);
console.log(`  matched: ${rows.length}, unmatched (skipped): ${misses.length}`);
if (misses.length) console.log('  skipped:', misses.join(', '));

const body = rows
  .map((r) => `  { name: ${JSON.stringify(r.name)}, regions: ${JSON.stringify(r.regions)}${r.replace ? ', replace: 1' : ''} },`)
  .join('\n');

const out = `// species-db.regions.js — Regions/Hotspots pack (auto-generated by tools/generate-regions.mjs)
// One row per species that had no regions when generated. Hand-edit freely;
// regeneration only fills species that are still empty.
// Self-merging: fills missing regions into window.SPECIES_DB (fill-or-add, idempotent).
(function () {
  if (typeof window === 'undefined') return;
  var ROWS = [
${body}
  ];
  function merge() {
    if (!Array.isArray(window.SPECIES_DB)) return;
    var norm = function (x) { return String(x || '').toLowerCase().trim(); };
    var isEmpty = function (v) { return v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length); };
    ROWS.forEach(function (rec) {
      var m = window.SPECIES_DB.find(function (s) { return norm(s.name || s.species) === norm(rec.name); });
      if (m) { if (rec.replace || isEmpty(m.regions)) m.regions = rec.regions; }
      else { window.SPECIES_DB.push({ name: rec.name, regions: rec.regions }); }
    });
  }
  if (Array.isArray(window.SPECIES_DB)) merge();
  else { var tries = 0; (function wait() { if (Array.isArray(window.SPECIES_DB)) merge(); else if (tries++ < 60) setTimeout(wait, 100); })(); }
  window.SPECIES_DB_REGION_ROWS = ROWS;
  try { document.dispatchEvent(new Event('bsf-db-enriched')); } catch (e) {}
})();
`;
writeFileSync(OUT, out);
console.log(`wrote ${OUT} with ${rows.length} rows`);
