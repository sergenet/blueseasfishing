/* Expanded catalogue: common and scientific names plus conservative group-level ecology.
   Existing records win; duplicate common or scientific names are excluded at runtime. */
(function () {
  const groups = [
    {
      env: 'Freshwater', habitat: 'Cool and temperate lakes, rivers, streams, and connected wetlands',
      baits: 'Species-dependent; insects, worms, small fish, crustaceans, flies, or artificial lures where legal',
      season: 'Varies by watershed and local regulation',
      fish: [
        ['American Eel','Anguilla rostrata'],['European Eel','Anguilla anguilla'],['Japanese Eel','Anguilla japonica'],
        ['American Paddlefish','Polyodon spathula'],['Shovelnose Sturgeon','Scaphirhynchus platorynchus'],['Pallid Sturgeon','Scaphirhynchus albus'],
        ['Atlantic Sturgeon','Acipenser oxyrinchus'],['Shortnose Sturgeon','Acipenser brevirostrum'],['Gulf Sturgeon','Acipenser oxyrinchus desotoi'],
        ['Burbot','Lota lota'],['Round Whitefish','Prosopium cylindraceum'],['Cisco','Coregonus artedi'],['Arctic Grayling','Thymallus arcticus'],
        ['American Smelt','Osmerus mordax'],['Mooneye','Hiodon tergisus'],['Goldeye','Hiodon alosoides'],['Skipjack Herring','Alosa chrysochloris'],
        ['Gizzard Shad','Dorosoma cepedianum'],['Threadfin Shad','Dorosoma petenense'],['Alewife','Alosa pseudoharengus'],
        ['Creek Chub','Semotilus atromaculatus'],['Fallfish','Semotilus corporalis'],['Golden Shiner','Notemigonus crysoleucas'],
        ['Fathead Minnow','Pimephales promelas'],['Emerald Shiner','Notropis atherinoides'],['Common Shiner','Luxilus cornutus'],
        ['River Chub','Nocomis micropogon'],['Hornyhead Chub','Nocomis biguttatus'],['Longnose Dace','Rhinichthys cataractae'],
        ['Blacknose Dace','Rhinichthys atratulus'],['Central Stoneroller','Campostoma anomalum'],['Northern Redbelly Dace','Chrosomus eos'],
        ['White Sucker','Catostomus commersonii'],['Longnose Sucker','Catostomus catostomus'],['Quillback','Carpiodes cyprinus'],
        ['River Carpsucker','Carpiodes carpio'],['Spotted Sucker','Minytrema melanops'],['Northern Hogsucker','Hypentelium nigricans'],
        ['Black Redhorse','Moxostoma duquesnei'],['Golden Redhorse','Moxostoma erythrurum'],['Shorthead Redhorse','Moxostoma macrolepidotum'],
        ['Greater Redhorse','Moxostoma valenciennesi'],['Silver Redhorse','Moxostoma anisurum'],['Blue Sucker','Cycleptus elongatus']
      ]
    },
    {
      env: 'Freshwater', habitat: 'Warm lakes, ponds, slow rivers, floodplains, and vegetated backwaters',
      baits: 'Species-dependent; worms, insects, small fish, crustaceans, prepared baits, or small lures',
      season: 'Often most active in warm months; check local rules',
      fish: [
        ['Longear Sunfish','Lepomis megalotis'],['Orangespotted Sunfish','Lepomis humilis'],['Redbreast Sunfish','Lepomis auritus'],
        ['Dollar Sunfish','Lepomis marginatus'],['Bantam Sunfish','Lepomis symmetricus'],['Mud Sunfish','Acantharchus pomotis'],
        ['Flier','Centrarchus macropterus'],['Shadow Bass','Ambloplites ariommus'],['Sacramento Perch','Archoplites interruptus'],
        ['Yellow Bullhead','Ameiurus natalis'],['Brown Bullhead','Ameiurus nebulosus'],['White Catfish','Ameiurus catus'],
        ['Stonecat','Noturus flavus'],['Tadpole Madtom','Noturus gyrinus'],['Snail Bullhead','Ameiurus brunneus'],
        ['Pirate Perch','Aphredoderus sayanus'],['Swampfish','Chologaster cornuta'],['Central Mudminnow','Umbra limi'],
        ['Olympic Mudminnow','Novumbra hubbsi'],['American Pickerel','Esox americanus'],['Alaska Blackfish','Dallia pectoralis'],
        ['Brook Silverside','Labidesthes sicculus'],['Inland Silverside','Menidia beryllina'],['Mosquitofish','Gambusia affinis'],
        ['Sailfin Molly','Poecilia latipinna'],['Sheepshead Minnow','Cyprinodon variegatus'],['Rainwater Killifish','Lucania parva'],
        ['Mummichog','Fundulus heteroclitus'],['Banded Killifish','Fundulus diaphanus'],['Bluefin Killifish','Lucania goodei'],
        ['Logperch','Percina caprodes'],['Johnny Darter','Etheostoma nigrum'],['Rainbow Darter','Etheostoma caeruleum'],
        ['Iowa Darter','Etheostoma exile'],['Fantail Darter','Etheostoma flabellare'],['Greenside Darter','Etheostoma blennioides'],
        ['Blackside Darter','Percina maculata'],['Channel Darter','Percina copelandi'],['Yellowfin Shiner','Notropis lutipinnis'],
        ['Ozark Minnow','Notropis nubilus'],['Rosyface Shiner','Notropis rubellus'],['Spotfin Shiner','Cyprinella spiloptera']
      ]
    },
    {
      env: 'Freshwater', habitat: 'Tropical and subtropical rivers, lakes, reservoirs, and floodplain habitats',
      baits: 'Species-dependent; plant material, insects, crustaceans, small fish, dough baits, or artificial lures',
      season: 'Varies by climate, water level, and local regulation',
      fish: [
        ['Nile Tilapia','Oreochromis niloticus'],['Blue Tilapia','Oreochromis aureus'],['Mozambique Tilapia','Oreochromis mossambicus'],
        ['Redbelly Tilapia','Coptodon zillii'],['Oscar','Astronotus ocellatus'],['Peacock Bass','Cichla ocellaris'],
        ['Butterfly Peacock Bass','Cichla orinocensis'],['Jaguar Cichlid','Parachromis managuensis'],['Midas Cichlid','Amphilophus citrinellus'],
        ['Mayan Cichlid','Mayaheros urophthalmus'],['Black Acara','Cichlasoma bimaculatum'],['Blue Acara','Andinoacara pulcher'],
        ['Discus','Symphysodon discus'],['Freshwater Angelfish','Pterophyllum scalare'],['Convict Cichlid','Amatitlania nigrofasciata'],
        ['Arapaima','Arapaima gigas'],['Silver Arowana','Osteoglossum bicirrhosum'],['Clown Knifefish','Chitala ornata'],
        ['Giant Gourami','Osphronemus goramy'],['Kissing Gourami','Helostoma temminckii'],['Snakeskin Gourami','Trichopodus pectoralis'],
        ['Giant Snakehead','Channa micropeltes'],['Northern Snakehead','Channa argus'],['Striped Snakehead','Channa striata'],
        ['Walking Catfish','Clarias batrachus'],['North African Catfish','Clarias gariepinus'],['Redtail Catfish','Phractocephalus hemioliopterus'],
        ['Tiger Shovelnose Catfish','Pseudoplatystoma fasciatum'],['Ripsaw Catfish','Oxydoras niger'],['Pictus Catfish','Pimelodus pictus'],
        ['Iridescent Shark Catfish','Pangasianodon hypophthalmus'],['Mekong Giant Catfish','Pangasianodon gigas'],['Wels Catfish','Silurus glanis'],
        ['Tambaqui','Colossoma macropomum'],['Pacu','Piaractus mesopotamicus'],['Red-bellied Piranha','Pygocentrus nattereri'],
        ['Payara','Hydrolycus scomberoides'],['Golden Dorado','Salminus brasiliensis'],['Tigerfish','Hydrocynus vittatus'],
        ['Goliath Tigerfish','Hydrocynus goliath'],['Giant Barb','Catlocarpio siamensis'],['Rohu','Labeo rohita']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Coral reefs, rocky reefs, lagoons, and nearby coastal structure',
      baits: 'Species-dependent; shrimp, crabs, mollusks, small fish, jigs, plugs, or flies',
      season: 'Varies by region, spawning cycle, and fishery regulation',
      fish: [
        ['Nassau Grouper','Epinephelus striatus'],['Gag Grouper','Mycteroperca microlepis'],['Black Grouper','Mycteroperca bonaci'],
        ['Red Grouper','Epinephelus morio'],['Warsaw Grouper','Hyporthodus nigritus'],['Goliath Grouper','Epinephelus itajara'],
        ['Scamp Grouper','Mycteroperca phenax'],['Snowy Grouper','Hyporthodus niveatus'],['Yellowedge Grouper','Hyporthodus flavolimbatus'],
        ['Mutton Snapper','Lutjanus analis'],['Mangrove Snapper','Lutjanus griseus'],['Lane Snapper','Lutjanus synagris'],
        ['Cubera Snapper','Lutjanus cyanopterus'],['Dog Snapper','Lutjanus jocu'],['Silk Snapper','Lutjanus vivanus'],
        ['Vermilion Snapper','Rhomboplites aurorubens'],['Schoolmaster Snapper','Lutjanus apodus'],['Mahogany Snapper','Lutjanus mahogoni'],
        ['Queen Triggerfish','Balistes vetula'],['Gray Triggerfish','Balistes capriscus'],['Ocean Triggerfish','Canthidermis sufflamen'],
        ['Redtail Triggerfish','Xanthichthys mento'],['Titan Triggerfish','Balistoides viridescens'],['Picasso Triggerfish','Rhinecanthus aculeatus'],
        ['Stoplight Parrotfish','Sparisoma viride'],['Rainbow Parrotfish','Scarus guacamaia'],['Queen Parrotfish','Scarus vetula'],
        ['Midnight Parrotfish','Scarus coelestinus'],['Bumphead Parrotfish','Bolbometopon muricatum'],['Princess Parrotfish','Scarus taeniopterus'],
        ['Hogfish','Lachnolaimus maximus'],['California Sheephead','Semicossyphus pulcher'],['Ballan Wrasse','Labrus bergylta'],
        ['Cuckoo Wrasse','Labrus mixtus'],['Bluestreak Cleaner Wrasse','Labroides dimidiatus'],['Napoleon Wrasse','Cheilinus undulatus'],
        ['French Angelfish','Pomacanthus paru'],['Queen Angelfish','Holacanthus ciliaris'],['Gray Angelfish','Pomacanthus arcuatus'],
        ['Emperor Angelfish','Pomacanthus imperator'],['Rock Beauty','Holacanthus tricolor'],['Copperband Butterflyfish','Chelmon rostratus']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Coastal bays, estuaries, beaches, jetties, reefs, and continental-shelf waters',
      baits: 'Species-dependent; baitfish, squid, shrimp, crabs, worms, jigs, spoons, plugs, or flies',
      season: 'Varies by migration, temperature, region, and regulation',
      fish: [
        ['Atlantic Tarpon','Megalops atlanticus'],['Indo-Pacific Tarpon','Megalops cyprinoides'],['Common Snook','Centropomus undecimalis'],
        ['Fat Snook','Centropomus parallelus'],['Swordspine Snook','Centropomus ensiferus'],['Atlantic Permit','Trachinotus falcatus'],
        ['Florida Pompano','Trachinotus carolinus'],['Palometa','Trachinotus goodei'],['Greater Amberjack','Seriola dumerili'],
        ['Lesser Amberjack','Seriola fasciata'],['Almaco Jack','Seriola rivoliana'],['Crevalle Jack','Caranx hippos'],
        ['Horse-eye Jack','Caranx latus'],['Blue Runner','Caranx crysos'],['African Pompano','Alectis ciliaris'],
        ['Lookdown','Selene vomer'],['Atlantic Moonfish','Selene setapinnis'],['Ladyfish','Elops saurus'],
        ['Bonefish','Albula vulpes'],['Atlantic Threadfin','Polydactylus octonemus'],['Tripletail','Lobotes surinamensis'],
        ['Cobia','Rachycentron canadum'],['Atlantic Spadefish','Chaetodipterus faber'],['Pacific Spadefish','Chaetodipterus zonatus'],
        ['Atlantic Needlefish','Strongylura marina'],['Houndfish','Tylosurus crocodilus'],['Ballyhoo','Hemiramphus brasiliensis'],
        ['Atlantic Flyingfish','Cheilopogon melanurus'],['California Flyingfish','Cheilopogon pinnatibarbatus californicus'],['Striped Mullet','Mugil cephalus'],
        ['White Mullet','Mugil curema'],['Atlantic Menhaden','Brevoortia tyrannus'],['Gulf Menhaden','Brevoortia patronus'],
        ['Pacific Sardine','Sardinops sagax'],['European Pilchard','Sardina pilchardus'],['Northern Anchovy','Engraulis mordax'],
        ['Atlantic Herring','Clupea harengus'],['Pacific Herring','Clupea pallasii'],['Capelin','Mallotus villosus'],
        ['Atlantic Mackerel','Scomber scombrus'],['Pacific Chub Mackerel','Scomber japonicus'],['Jack Mackerel','Trachurus symmetricus']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Open ocean, offshore banks, current edges, seamounts, and deep pelagic water',
      baits: 'Species-dependent; trolled lures, live or dead baitfish, squid, jigs, poppers, or flies',
      season: 'Highly migratory; availability varies by current, temperature, and regulation',
      fish: [
        ['Blackfin Tuna','Thunnus atlanticus'],['Longtail Tuna','Thunnus tonggol'],['Southern Bluefin Tuna','Thunnus maccoyii'],
        ['Atlantic Blue Marlin','Makaira nigricans'],['Black Marlin','Istiompax indica'],['White Marlin','Kajikia albida'],
        ['Shortbill Spearfish','Tetrapturus angustirostris'],['Longbill Spearfish','Tetrapturus pfluegeri'],['Mediterranean Spearfish','Tetrapturus belone'],
        ['Indo-Pacific Sailfish','Istiophorus platypterus'],['Great Barracuda','Sphyraena barracuda'],['Pacific Barracuda','Sphyraena argentea'],
        ['Escolar','Lepidocybium flavobrunneum'],['Oilfish','Ruvettus pretiosus'],['Opah','Lampris guttatus'],
        ['Ocean Sunfish','Mola mola'],['Sharptail Mola','Masturus lanceolatus'],['Slender Sunfish','Ranzania laevis'],
        ['Blue Shark','Prionace glauca'],['Shortfin Mako','Isurus oxyrinchus'],['Longfin Mako','Isurus paucus'],
        ['Porbeagle','Lamna nasus'],['Salmon Shark','Lamna ditropis'],['Oceanic Whitetip Shark','Carcharhinus longimanus'],
        ['Silky Shark','Carcharhinus falciformis'],['Bigeye Thresher','Alopias superciliosus'],['Common Thresher','Alopias vulpinus'],
        ['Pelagic Thresher','Alopias pelagicus'],['Whale Shark','Rhincodon typus'],['Basking Shark','Cetorhinus maximus'],
        ['Manta Ray','Mobula birostris'],['Chilean Devil Ray','Mobula tarapacana'],['Pelagic Stingray','Pteroplatytrygon violacea'],
        ['Atlantic Pomfret','Brama brama'],['Pacific Pomfret','Brama japonica'],['Louvar','Luvarus imperialis']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Rocky bottoms, reefs, kelp, wrecks, and continental-shelf or slope habitats',
      baits: 'Species-dependent; squid, fish strips, crustaceans, bottom rigs, jigs, or soft plastics',
      season: 'Depth and open seasons vary; check current regional rules',
      fish: [
        ['Yellowtail Rockfish','Sebastes flavidus'],['Widow Rockfish','Sebastes entomelas'],['Blackgill Rockfish','Sebastes melanostomus'],
        ['Darkblotched Rockfish','Sebastes crameri'],['Rosy Rockfish','Sebastes rosaceus'],['Tiger Rockfish','Sebastes nigrocinctus'],
        ['Flag Rockfish','Sebastes rubrivinctus'],['Treefish','Sebastes serriceps'],['Kelp Rockfish','Sebastes atrovirens'],
        ['Grass Rockfish','Sebastes rastrelliger'],['Bank Rockfish','Sebastes rufus'],['Chilipepper Rockfish','Sebastes goodei'],
        ['Cowcod','Sebastes levis'],['Pacific Ocean Perch','Sebastes alutus'],['Shortraker Rockfish','Sebastes borealis'],
        ['Yellowmouth Rockfish','Sebastes reedi'],['Silvergray Rockfish','Sebastes brevispinis'],['Stripetail Rockfish','Sebastes saxicola'],
        ['Petrale Sole','Eopsetta jordani'],['Dover Sole','Microstomus pacificus'],['English Sole','Parophrys vetulus'],
        ['Rex Sole','Glyptocephalus zachirus'],['Rock Sole','Lepidopsetta bilineata'],['Starry Flounder','Platichthys stellatus'],
        ['Arrowtooth Flounder','Atheresthes stomias'],['Greenland Halibut','Reinhardtius hippoglossoides'],['American Plaice','Hippoglossoides platessoides'],
        ['Yellowtail Flounder','Limanda ferruginea'],['Winter Flounder','Pseudopleuronectes americanus'],['Witch Flounder','Glyptocephalus cynoglossus'],
        ['Red Hake','Urophycis chuss'],['White Hake','Urophycis tenuis'],['Silver Hake','Merluccius bilinearis'],
        ['Pacific Hake','Merluccius productus'],['Blue Ling','Molva dypterygia'],['Cusk','Brosme brosme']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Coastal shelf, reef, sand, mud, seagrass, or estuarine habitats depending on species',
      baits: 'Species-dependent; crustaceans, mollusks, worms, small fish, cut bait, or artificial lures',
      season: 'Varies by region and regulation',
      fish: [
        ['Atlantic Wolffish','Anarhichas lupus'],['Spotted Wolffish','Anarhichas minor'],['Ocean Pout','Zoarces americanus'],
        ['Atlantic Lumpfish','Cyclopterus lumpus'],['Pacific Spiny Lumpsucker','Eumicrotremus orbis'],['Sculpin','Myoxocephalus scorpius'],
        ['Pacific Staghorn Sculpin','Leptocottus armatus'],['Longhorn Sculpin','Myoxocephalus octodecemspinosus'],['Sea Raven','Hemitripterus americanus'],
        ['Atlantic Saury','Scomberesox saurus'],['Pacific Saury','Cololabis saira'],['Sand Lance','Ammodytes americanus'],
        ['Pacific Sand Lance','Ammodytes hexapterus'],['Tilefish','Lopholatilus chamaeleonticeps'],['Blueline Tilefish','Caulolatilus microps'],
        ['Golden Tilefish','Lopholatilus chamaeleonticeps'],['Northern Puffer','Sphoeroides maculatus'],['Southern Puffer','Sphoeroides nephelus'],
        ['Checkered Puffer','Sphoeroides testudineus'],['Porcupinefish','Diodon hystrix'],['Balloonfish','Diodon holocanthus'],
        ['Smooth Trunkfish','Lactophrys triqueter'],['Scrawled Cowfish','Acanthostracion quadricornis'],['Spotted Trunkfish','Lactophrys bicaudalis'],
        ['Remora','Remora remora'],['Sharksucker','Echeneis naucrates'],['Atlantic Cutlassfish','Trichiurus lepturus'],
        ['Ribbonfish','Trachipterus arcticus'],['King-of-the-Salmon','Trachipterus altivelis'],['Oarfish','Regalecus glesne'],
        ['Atlantic Stargazer','Uranoscopus scaber'],['Northern Stargazer','Astroscopus guttatus'],['Sand Tilefish','Malacanthus plumieri'],
        ['Atlantic Lizardfish','Synodus saurus'],['Inshore Lizardfish','Synodus foetens'],['Reef Croaker','Ophioscion punctatissimus']
      ]
    }
  ];

  const existing = Array.isArray(window.SPECIES_DB) ? window.SPECIES_DB : [];
  const names = new Set(existing.map(x => String(x.name || '').toLowerCase()));
  const scientific = new Set(existing.map(x => String(x.sci || '').toLowerCase()));
  const extra = [];
  groups.forEach(group => group.fish.forEach(([name, sci]) => {
    if (names.has(name.toLowerCase()) || scientific.has(sci.toLowerCase())) return;
    names.add(name.toLowerCase()); scientific.add(sci.toLowerCase());
    extra.push({name, sci, env: group.env, habitat: group.habitat, baits: group.baits, season: group.season});
  }));
  window.SPECIES_DB_CATALOG_ROWS = extra;
  window.SPECIES_DB = existing.concat(extra);
  try { document.dispatchEvent(new Event('bsf-db-enriched')); } catch (_) {}
})();
