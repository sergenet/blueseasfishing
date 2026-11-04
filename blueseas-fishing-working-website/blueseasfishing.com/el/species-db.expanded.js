/* Expanded catalogue: common and scientific names plus conservative group-level ecology.
   Existing records win; duplicate common or scientific names are excluded at runtime. */
(function () {
  const groups = [
    {
      env: 'Freshwater', habitat: 'Δροσερές και εύκρατες λίμνες, ποτάμια, ρυάκια και συνδεδεμένοι υγρότοποι',
      baits: 'Εξαρτάται από το είδος; έντομα, σκουλήκια, μικρά ψάρια, καρκινοειδή, μύγες ή τεχνητά θέλγητρα όπου είναι νόμιμο',
      season: 'Διαφέρει ανάλογα με τη λεκάνη απορροής και τους τοπικούς κανονισμούς',
      fish: [
        ['Αμερικάνικο χέλι','Anguilla rostrata','american-eel'],['Ευρωπαϊκό Χέλι','Anguilla anguilla','european-eel'],['Γιαπωνέζικο χέλι','Anguilla japonica','japanese-eel'],
        ['Αμερικανικό Paddlefish','Polyodon spathula','american-paddlefish'],['Οξύρρυγχος φτυαριού','Scaphirhynchus platorynchus','shovelnose-sturgeon'],['Χλωμός οξύρρυγχος','Scaphirhynchus albus','pallid-sturgeon'],
        ['Ο οξύρρυγχος του Ατλαντικού','Acipenser oxyrinchus','atlantic-sturgeon'],['Κοντόρινος οξύρρυγχος','Acipenser brevirostrum','shortnose-sturgeon'],['Gulf Sturgeon','Acipenser oxyrinchus desotoi','gulf-sturgeon'],
        ['Burbot','Lota lota','burbot'],['Στρογγυλό Ασπροψάρι','Prosopium cylindraceum','round-whitefish'],['Cisco','Coregonus artedi','cisco'],['Αρκτικό Grayling','Thymallus arcticus','arctic-grayling'],
        ['American Smelt','Osmerus mordax','american-smelt'],['Mooneye','Hiodon tergisus','mooneye'],['Goldeye','Hiodon alosoides','goldeye'],['Ρέγγα Skipjack','Alosa chrysochloris','skipjack-herring'],
        ['Γκίζαρντ Σαντ','Dorosoma cepedianum','gizzard-shad'],['Threadfin Shad','Dorosoma petenense','threadfin-shad'],['Alewife','Alosa pseudoharengus','alewife'],
        ['Creek Chub','Semotilus atromaculatus','creek-chub'],['Fallfish','Semotilus corporalis','fallfish'],['Golden Shiner','Notemigonus crysoleucas','golden-shiner'],
        ['Fathead Minnow','Pimephales promelas','fathead-minnow'],['Emerald Shiner','Notropis atherinoides','emerald-shiner'],['Common Shiner','Luxilus cornutus','common-shiner'],
        ['Ποταμός Chub','Nocomis micropogon','river-chub'],['Hornyhead Chub','Nocomis biguttatus','hornyhead-chub'],['Longnose Dace','Rhinichthys cataractae','longnose-dace'],
        ['Blacknose Dace','Rhinichthys atratulus','blacknose-dace'],['Central Stoneroller','Campostoma anomalum','central-stoneroller'],['Northern Redbelly Dace','Chrosomus eos','northern-redbelly-dace'],
        ['Λευκό κορόιδο','Catostomus commersonii','white-sucker'],['Longnose Sucker','Catostomus catostomus','longnose-sucker'],['Quillback','Carpiodes cyprinus','quillback'],
        ['Ποταμός Carpsucker','Carpiodes carpio','river-carpsucker'],['Διάσημο κορόιδο','Minytrema melanops','spotted-sucker'],['Βόρειος χοιρινός','Hypentelium nigricans','northern-hogsucker'],
        ['Black Redhorse','Moxostoma duquesnei','black-redhorse'],['Golden Redhorse','Moxostoma erythrurum','golden-redhorse'],['Shorthead Redhorse','Moxostoma macrolepidotum','shorthead-redhorse'],
        ['Greater Redhorse','Moxostoma valenciennesi','greater-redhorse'],['Silver Redhorse','Moxostoma anisurum','silver-redhorse'],['Μπλε κορόιδο','Cycleptus elongatus','blue-sucker']
      ]
    },
    {
      env: 'Freshwater', habitat: 'Ζεστές λίμνες, λιμνούλες, αργά ποτάμια, πλημμυρικές πεδιάδες και βλάστηση σε τέλματα',
      baits: 'Εξαρτάται από το είδος; σκουλήκια, έντομα, μικρά ψάρια, καρκινοειδή, έτοιμα δολώματα ή μικρά θέλγητρα',
      season: 'Συχνά πιο ενεργό τους ζεστούς μήνες. Ελέγξτε τους τοπικούς κανόνες.',
      fish: [
        ['Μακρύ Sunfish','Lepomis megalotis','longear-sunfish'],['Ηλιόψαρο με πορτοκαλί κηλίδες','Lepomis humilis','orangespotted-sunfish'],['Ηλιόψαρο κοκκινόμαυρο','Lepomis auritus','redbreast-sunfish'],
        ['Sunfish δολαρίων','Lepomis marginatus','dollar-sunfish'],['Bantam Sunfish','Lepomis symmetricus','bantam-sunfish'],['Mud Sunfish','Acantharchus pomotis','mud-sunfish'],
        ['Ιπτάμενος','Centrarchus macropterus','flier'],['Shadow Bass','Ambloplites ariommus','shadow-bass'],['Sacramento Perch','Archoplites interruptus','sacramento-perch'],
        ['Κίτρινο ταυροκεφαλή','Ameiurus natalis','yellow-bullhead'],['Καφέ ταυροκεφαλή','Ameiurus nebulosus','brown-bullhead'],['Λευκό Γατόψαρο','Ameiurus catus','white-catfish'],
        ['Stonecat','Noturus flavus','stonecat'],['Γυρίνος Μάνττομ','Noturus gyrinus','tadpole-madtom'],['Σαλιγκάρι Ταυροκεφαλή','Ameiurus brunneus','snail-bullhead'],
        ['Περκ πειρατής','Aphredoderus sayanus','pirate-perch'],['Βαλτόψαρο','Chologaster cornuta','swampfish'],['Central Mudminnow','Umbra limi','central-mudminnow'],
        ['Ολυμπιακό Μουντμινόου','Novumbra hubbsi','olympic-mudminnow'],['Αμερικανικό Pickerel','Esox americanus','american-pickerel'],['Μαύροψαρο της Αλάσκας','Dallia pectoralis','alaska-blackfish'],
        ['Brook Silverside','Labidesthes sicculus','brook-silverside'],['Inland Silverside','Menidia beryllina','inland-silverside'],['Κουνουπιέρα','Gambusia affinis','mosquitofish'],
        ['Sailfin Molly','Poecilia latipinna','sailfin-molly'],['Sheepshead Minnow','Cyprinodon variegatus','sheepshead-minnow'],['Killifish της βροχής','Lucania parva','rainwater-killifish'],
        ['Mummichog','Fundulus heteroclitus','mummichog'],['Ζωντανό Killifish','Fundulus diaphanus','banded-killifish'],['Bluefin Killifish','Lucania goodei','bluefin-killifish'],
        ['Logperch','Percina caprodes','logperch'],['Τζόνι Ντάρτερ','Etheostoma nigrum','johnny-darter'],['Rainbow Darter','Etheostoma caeruleum','rainbow-darter'],
        ['Αϊόβα Ντάρτερ','Etheostoma exile','iowa-darter'],['Fantail Darter','Etheostoma flabellare','fantail-darter'],['Greenside Darter','Etheostoma blennioides','greenside-darter'],
        ['Blackside Darter','Percina maculata','blackside-darter'],['Channel Darter','Percina copelandi','channel-darter'],['Κιτρινόπτερο γυαλιστερό','Notropis lutipinnis','yellowfin-shiner'],
        ['Ozark Minnow','Notropis nubilus','ozark-minnow'],['Rosyface Shiner','Notropis rubellus','rosyface-shiner'],['Spotfin Shiner','Cyprinella spiloptera','spotfin-shiner']
      ]
    },
    {
      env: 'Freshwater', habitat: 'Τροπικά και υποτροπικά ποτάμια, λίμνες, δεξαμενές και ενδιαιτήματα πλημμυρικών πεδιάδων',
      baits: 'Εξαρτάται από το είδος; φυτικό υλικό, έντομα, καρκινοειδή, μικρά ψάρια, δολώματα ζύμης ή τεχνητά θέλγητρα',
      season: 'Διαφέρει ανάλογα με το κλίμα, τη στάθμη του νερού και τους τοπικούς κανονισμούς',
      fish: [
        ['Νείλος Τιλάπια','Oreochromis niloticus','nile-tilapia'],['Μπλε Τιλάπια','Oreochromis aureus','blue-tilapia'],['Τιλάπια της Μοζαμβίκης','Oreochromis mossambicus','mozambique-tilapia'],
        ['Redbelly Tilapia','Coptodon zillii','redbelly-tilapia'],['Όσκαρ','Astronotus ocellatus','oscar'],['Peacock Bass','Cichla ocellaris','peacock-bass'],
        ['Butterfly Peacock Bass','Cichla orinocensis','butterfly-peacock-bass'],['Jaguar Cichlid','Parachromis managuensis','jaguar-cichlid'],['Μίδας κιχλίδα','Amphilophus citrinellus','midas-cichlid'],
        ['Κιχλίδα των Μάγια','Mayaheros urophthalmus','mayan-cichlid'],['Μαύρη Ακάρα','Cichlasoma bimaculatum','black-acara'],['Μπλε Ακάρα','Andinoacara pulcher','blue-acara'],
        ['Συζήτηση','Symphysodon discus','discus'],['Αγγελόψαρο του γλυκού νερού','Pterophyllum scalare','freshwater-angelfish'],['Κατάδικος Κιχλίδα','Amatitlania nigrofasciata','convict-cichlid'],
        ['Arapaima','Arapaima gigas','arapaima'],['Ασημένια Arowana','Osteoglossum bicirrhosum','silver-arowana'],['Μαχαιρόψαρο κλόουν','Chitala ornata','clown-knifefish'],
        ['Γίγαντας Γκουράμι','Osphronemus goramy','giant-gourami'],['Φιλιά Gourami','Helostoma temminckii','kissing-gourami'],['Snakeskin Gourami','Trichopodus pectoralis','snakeskin-gourami'],
        ['Giant Snakehead','Channa micropeltes','giant-snakehead'],['Northern Snakehead','Channa argus','northern-snakehead'],['Ριγέ Snakehead','Channa striata','striped-snakehead'],
        ['Γατόψαρο που περπατάει','Clarias batrachus','walking-catfish'],['Γατόψαρο Βόρειας Αφρικής','Clarias gariepinus','north-african-catfish'],['Γατόψαρο Redtail','Phractocephalus hemioliopterus','redtail-catfish'],
        ['Γατόψαρο Tiger Shovelnose','Pseudoplatystoma fasciatum','tiger-shovelnose-catfish'],['Γατόψαρο Ripsaw','Oxydoras niger','ripsaw-catfish'],['Γατόψαρο Pictus','Pimelodus pictus','pictus-catfish'],
        ['Ιριδίζον γατόψαρο καρχαρία','Pangasianodon hypophthalmus','iridescent-shark-catfish'],['Γιγαντιαίο γατόψαρο Μεκόνγκ','Pangasianodon gigas','mekong-giant-catfish'],['Γατόψαρο Wels','Silurus glanis','wels-catfish'],
        ['Tambaqui','Colossoma macropomum','tambaqui'],['Pacu','Piaractus mesopotamicus','pacu'],['Κοκκινοκοιλιακό Piranha','Pygocentrus nattereri','red-bellied-piranha'],
        ['Παγάρα','Hydrolycus scomberoides','payara'],['Golden Dorado','Salminus brasiliensis','golden-dorado'],['Tigerfish','Hydrocynus vittatus','tigerfish'],
        ['Goliath Tigerfish','Hydrocynus goliath','goliath-tigerfish'],['Giant Barb','Catlocarpio siamensis','giant-barb'],['Rohu','Labeo rohita','rohu']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Κοραλλιογενείς ύφαλοι, βραχώδεις ύφαλοι, λιμνοθάλασσες και κοντινές παράκτιες δομές',
      baits: 'Εξαρτάται από το είδος; γαρίδες, καβούρια, μαλάκια, μικρά ψάρια, ροδέλες, βύσματα ή μύγες',
      season: 'Ποικίλλει ανάλογα με την περιοχή, τον κύκλο ωοτοκίας και τους κανονισμούς αλιείας',
      fish: [
        ['Σφυρίδα Nassau','Epinephelus striatus','nassau-grouper'],['Γκαγκ Σφυρίδα','Mycteroperca microlepis','gag-grouper'],['Μαύρη σφυρίδα','Mycteroperca bonaci','black-grouper'],
        ['Κόκκινη σφυρίδα','Epinephelus morio','red-grouper'],['Σφυρίδα Βαρσοβίας','Hyporthodus nigritus','warsaw-grouper'],['Γκόλιαθ Σφυρίδα','Epinephelus itajara','goliath-grouper'],
        ['Scamp Grouper','Mycteroperca phenax','scamp-grouper'],['Snowy σφυρίδα','Hyporthodus niveatus','snowy-grouper'],['Yellowedge σφυρίδα','Hyporthodus flavolimbatus','yellowedge-grouper'],
        ['Προβατίνα','Lutjanus analis','mutton-snapper'],['Mangrove Snapper','Lutjanus griseus','mangrove-snapper'],['Lane Snapper','Lutjanus synagris','lane-snapper'],
        ['Cubera Snapper','Lutjanus cyanopterus','cubera-snapper'],['Snapper σκύλου','Lutjanus jocu','dog-snapper'],['Silk Snapper','Lutjanus vivanus','silk-snapper'],
        ['Βεραμίλιον Snapper','Rhomboplites aurorubens','vermilion-snapper'],['Σχολάρχης Snapper','Lutjanus apodus','schoolmaster-snapper'],['Snapper από μαόνι','Lutjanus mahogoni','mahogany-snapper'],
        ['Βασίλισσα Triggerfish','Balistes vetula','queen-triggerfish'],['Grey Triggerfish','Balistes capriscus','gray-triggerfish'],['Ocean Triggerfish','Canthidermis sufflamen','ocean-triggerfish'],
        ['Redtail Triggerfish','Xanthichthys mento','redtail-triggerfish'],['Titan Triggerfish','Balistoides viridescens','titan-triggerfish'],['Πικάσο Triggerfish','Rhinecanthus aculeatus','picasso-triggerfish'],
        ['Stoplight Parrotfish','Sparisoma viride','stoplight-parrotfish'],['Παπαγαλόψαρο ουράνιο τόξο','Scarus guacamaia','rainbow-parrotfish'],['Βασίλισσα Παπαγάλος','Scarus vetula','queen-parrotfish'],
        ['Μεσονυχτιακό παπαγάλο','Scarus coelestinus','midnight-parrotfish'],['Παπαγαλόψαρο Bumphead','Bolbometopon muricatum','bumphead-parrotfish'],['Princess Parrotfish','Scarus taeniopterus','princess-parrotfish'],
        ['Γουρουνόψαρο','Lachnolaimus maximus','hogfish'],['Προβατίνα Καλιφόρνια','Semicossyphus pulcher','california-sheephead'],['Ballan Wrasse','Labrus bergylta','ballan-wrasse'],
        ['Κούκος Wrasse','Labrus mixtus','cuckoo-wrasse'],['Bluestreak Cleaner Wrasse','Labroides dimidiatus','bluestreak-cleaner-wrasse'],['Napoleon Wrasse','Cheilinus undulatus','napoleon-wrasse'],
        ['Γαλλικά Αγγελόψαρα','Pomacanthus paru','french-angelfish'],['Βασίλισσα Αγγελόψαρο','Holacanthus ciliaris','queen-angelfish'],['Γκρι Αγγελόψαρο','Pomacanthus arcuatus','gray-angelfish'],
        ['Αυτοκράτορας Αγγελόψαρο','Pomacanthus imperator','emperor-angelfish'],['Rock Beauty','Holacanthus tricolor','rock-beauty'],['Χαλκοζώνη πεταλούδα','Chelmon rostratus','copperband-butterflyfish']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Παράκτιοι κόλποι, εκβολές ποταμών, παραλίες, προβλήτες, ύφαλοι και ύδατα υφαλοκρηπίδας',
      baits: 'Εξαρτάται από το είδος; δολώματα, καλαμάρια, γαρίδες, καβούρια, σκουλήκια, σέγα, κουτάλια, βύσματα ή μύγες',
      season: 'Ποικίλλει ανάλογα με τη μετανάστευση, τη θερμοκρασία, την περιοχή και τη ρύθμιση',
      fish: [
        ['Ατλάντικ Τάρπον','Megalops atlanticus','atlantic-tarpon'],['Ινδο-Ειρηνικός Τάρπον','Megalops cyprinoides','indo-pacific-tarpon'],['Κοινό Snook','Centropomus undecimalis','common-snook'],
        ['Χοντρός Σνούκ','Centropomus parallelus','fat-snook'],['Swordspine Snook','Centropomus ensiferus','swordspine-snook'],['Άδεια Ατλαντικού','Trachinotus falcatus','atlantic-permit'],
        ['Φλόριντα Πομπάνο','Trachinotus carolinus','florida-pompano'],['Παλομέτα','Trachinotus goodei','palometa'],['Greater Amberjack','Seriola dumerili','greater-amberjack'],
        ['Lesser Amberjack','Seriola fasciata','lesser-amberjack'],['Αλμάκο Τζακ','Seriola rivoliana','almaco-jack'],['Κρεβάλ Τζακ','Caranx hippos','crevalle-jack'],
        ['Τζακ με άλογο','Caranx latus','horse-eye-jack'],['Blue Runner','Caranx crysos','blue-runner'],['Αφρικανός Πομπάνο','Alectis ciliaris','african-pompano'],
        ['Κοιτάζοντας προς τα κάτω','Selene vomer','lookdown'],['Φεγγαρόψαρο του Ατλαντικού','Selene setapinnis','atlantic-moonfish'],['Πασχαλίτσα','Elops saurus','ladyfish'],
        ['Οστεόψαρο','Albula vulpes','bonefish'],['Atlantic Threadfin','Polydactylus octonemus','atlantic-threadfin'],['Τριπλή ουρά','Lobotes surinamensis','tripletail'],
        ['Cobia','Rachycentron canadum','cobia'],['Σπαθόψαρο Ατλαντικού','Chaetodipterus faber','atlantic-spadefish'],['Spadefish του Ειρηνικού','Chaetodipterus zonatus','pacific-spadefish'],
        ['Ατλαντικό Needlefish','Strongylura marina','atlantic-needlefish'],['Κυνόψαρο','Tylosurus crocodilus','houndfish'],['Σαματάς','Hemiramphus brasiliensis','ballyhoo'],
        ['Flyingfish του Ατλαντικού','Cheilopogon melanurus','atlantic-flyingfish'],['Καλιφόρνια Flyingfish','Cheilopogon pinnatibarbatus californicus','california-flyingfish'],['Ριγέ κέφαλος','Mugil cephalus','striped-mullet'],
        ['Λευκό μπαρμπούνι','Mugil curema','white-mullet'],['Atlantic Menhaden','Brevoortia tyrannus','atlantic-menhaden'],['Κόλπος Μενχάντεν','Brevoortia patronus','gulf-menhaden'],
        ['Σαρδέλα Ειρηνικού','Sardinops sagax','pacific-sardine'],['European Pilchard','Sardina pilchardus','european-pilchard'],['Βόρειος γαύρος','Engraulis mordax','northern-anchovy'],
        ['Ρέγγα Ατλαντικού','Clupea harengus','atlantic-herring'],['Ρέγγα Ειρηνικού','Clupea pallasii','pacific-herring'],['Capelin','Mallotus villosus','capelin'],
        ['Σκουμπρί Ατλαντικού','Scomber scombrus','atlantic-mackerel'],['Σκουμπρί Ειρηνικού','Scomber japonicus','pacific-chub-mackerel'],['Τζακ Σκουμπρί','Trachurus symmetricus','jack-mackerel']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Ανοιχτός ωκεανός, παράκτιες όχθες, όχθες ρεύματος, θαλάσσια όρη και βαθιά πελαγικά νερά',
      baits: 'Εξαρτάται από το είδος; τρολαρισμένα θέλγητρα, ζωντανά ή νεκρά δολώματα, καλαμάρια, τζίγκ, poppers ή μύγες',
      season: 'Εξαιρετικά μεταναστευτικό· η διαθεσιμότητα ποικίλλει ανάλογα με το ρεύμα, τη θερμοκρασία και τη ρύθμιση',
      fish: [
        ['Μαύρος τόνος','Thunnus atlanticus','blackfin-tuna'],['Τόνος Longtail','Thunnus tonggol','longtail-tuna'],['Τόνος του Νότου','Thunnus maccoyii','southern-bluefin-tuna'],
        ['Atlantic Blue Marlin','Makaira nigricans','atlantic-blue-marlin'],['Μαύρος Μάρλιν','Istiompax indica','black-marlin'],['White Marlin','Kajikia albida','white-marlin'],
        ['Shortbill Spearfish','Tetrapturus angustirostris','shortbill-spearfish'],['Longbill Spearfish','Tetrapturus pfluegeri','longbill-spearfish'],['Μεσογειακό ψαροτούφεκο','Tetrapturus belone','mediterranean-spearfish'],
        ['Ιστιόψαρο Ινδο-Ειρηνικού','Istiophorus platypterus','indo-pacific-sailfish'],['Great Barracuda','Sphyraena barracuda','great-barracuda'],['Pacific Barracuda','Sphyraena argentea','pacific-barracuda'],
        ['Escolar','Lepidocybium flavobrunneum','escolar'],['ελαιόψαρο','Ruvettus pretiosus','oilfish'],['Opah','Lampris guttatus','opah'],
        ['Ocean Sunfish','Mola mola','ocean-sunfish'],['Αιχμηρή Μόλα','Masturus lanceolatus','sharptail-mola'],['Λεπτό ηλιόψαρο','Ranzania laevis','slender-sunfish'],
        ['Μπλε καρχαρίας','Prionace glauca','blue-shark'],['Κοντόπεντος Μάκο','Isurus oxyrinchus','shortfin-mako'],['Longfin Mako','Isurus paucus','longfin-mako'],
        ['Porbeagle','Lamna nasus','porbeagle'],['Καρχαρίας σολομού','Lamna ditropis','salmon-shark'],['Ωκεάνιος καρχαρίας λευκής άκρης','Carcharhinus longimanus','oceanic-whitetip-shark'],
        ['Μεταξωτός Καρχαρίας','Carcharhinus falciformis','silky-shark'],['Bigeye Thresher','Alopias superciliosus','bigeye-thresher'],['Κοινός Αλωνιστής','Alopias vulpinus','common-thresher'],
        ['Πελαγικός αλωνιστής','Alopias pelagicus','pelagic-thresher'],['Καρχαρίας φαλαινών','Rhincodon typus','whale-shark'],['Καρχαρίας που κολυμπάει','Cetorhinus maximus','basking-shark'],
        ['Μάντα Ρέι','Mobula birostris','manta-ray'],['Χιλιανός Διαβολικός Ρέι','Mobula tarapacana','chilean-devil-ray'],['Pelagic Stingray','Pteroplatytrygon violacea','pelagic-stingray'],
        ['Atlantic Pomfret','Brama brama','atlantic-pomfret'],['Pacific Pomfret','Brama japonica','pacific-pomfret'],['Λούβαρ','Luvarus imperialis','louvar']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Βραχώδεις βυθοί, ύφαλοι, φύκια, ναυάγια και ενδιαιτήματα υφαλοκρηπίδας ή πλαγιάς',
      baits: 'Εξαρτάται από το είδος; καλαμάρια, λωρίδες ψαριών, μαλακόστρακα, πλατφόρμες βυθού, σέγα ή μαλακά πλαστικά',
      season: 'Το βάθος και οι περίοδοι λειτουργίας ποικίλλουν. Ελέγξτε τους ισχύοντες περιφερειακούς κανόνες.',
      fish: [
        ['Rockfish Yellowtail','Sebastes flavidus','yellowtail-rockfish'],['Χήρα Rockfish','Sebastes entomelas','widow-rockfish'],['Blackgill Rockfish','Sebastes melanostomus','blackgill-rockfish'],
        ['Σκουρόχρωμο Rockfish','Sebastes crameri','darkblotched-rockfish'],['Rosy Rockfish','Sebastes rosaceus','rosy-rockfish'],['Tiger Rockfish','Sebastes nigrocinctus','tiger-rockfish'],
        ['Σημαία Rockfish','Sebastes rubrivinctus','flag-rockfish'],['Δεντρόψαρο','Sebastes serriceps','treefish'],['Kelp Rockfish','Sebastes atrovirens','kelp-rockfish'],
        ['Grass Rockfish','Sebastes rastrelliger','grass-rockfish'],['Τράπεζα Rockfish','Sebastes rufus','bank-rockfish'],['Chilipepper Rockfish','Sebastes goodei','chilipepper-rockfish'],
        ['Cowcod','Sebastes levis','cowcod'],['Πέρκα Ειρηνικού Ωκεανού','Sebastes alutus','pacific-ocean-perch'],['Shortraker Rockfish','Sebastes borealis','shortraker-rockfish'],
        ['Yellowmouth Rockfish','Sebastes reedi','yellowmouth-rockfish'],['Silvergray Rockfish','Sebastes brevispinis','silvergray-rockfish'],['Βραχόψαρο Stripetail','Sebastes saxicola','stripetail-rockfish'],
        ['Σόλα Petrale','Eopsetta jordani','petrale-sole'],['Dover Sole','Microstomus pacificus','dover-sole'],['Αγγλική σόλα','Parophrys vetulus','english-sole'],
        ['Ρεξ Σολ','Glyptocephalus zachirus','rex-sole'],['Rock Sole','Lepidopsetta bilineata','rock-sole'],['Starry Flounder','Platichthys stellatus','starry-flounder'],
        ['Arrowtooth Flounder','Atheresthes stomias','arrowtooth-flounder'],['Ιππόγλωσσα Γροιλανδίας','Reinhardtius hippoglossoides','greenland-halibut'],['Αμερικανική Χωματίδα','Hippoglossoides platessoides','american-plaice'],
        ['Χαλόνι Yellowtail','Limanda ferruginea','yellowtail-flounder'],['Χειμερινός Χαλόνι','Pseudopleuronectes americanus','winter-flounder'],['Μαγισσίδα','Glyptocephalus cynoglossus','witch-flounder'],
        ['Κόκκινος Μερλούκος','Urophycis chuss','red-hake'],['Λευκός Μερλούκος','Urophycis tenuis','white-hake'],['Ασημένιος Μερλούκος','Merluccius bilinearis','silver-hake'],
        ['Μερλούκος του Ειρηνικού','Merluccius productus','pacific-hake'],['Μπλε Φτερού','Molva dypterygia','blue-ling'],['Κουσκ','Brosme brosme','cusk']
      ]
    },
    {
      env: 'Saltwater', habitat: 'Παράκτια υφαλοκρηπίδα, ύφαλοι, άμμος, λάσπη, θαλάσσια χόρτα ή εκβολές ποταμών ανάλογα με το είδος',
      baits: 'Εξαρτάται από το είδος; καρκινοειδή, μαλάκια, σκουλήκια, μικρά ψάρια, κομμένο δόλωμα ή τεχνητά θέλγητρα',
      season: 'Διαφέρει ανάλογα με την περιοχή και τους κανονισμούς',
      fish: [
        ['Λύκος του Ατλαντικού','Anarhichas lupus','atlantic-wolffish'],['στίγματα λυκόψαρο','Anarhichas minor','spotted-wolffish'],['Ocean Pout','Zoarces americanus','ocean-pout'],
        ['Ατλαντικός Λαμπρόψαρο','Cyclopterus lumpus','atlantic-lumpfish'],['Pacific Spiny Lumpsucker','Eumicrotremus orbis','pacific-spiny-lumpsucker'],['Sculpin','Myoxocephalus scorpius','sculpin'],
        ['Pacific Staghorn Sculpin','Leptocottus armatus','pacific-staghorn-sculpin'],['Longhorn Sculpin','Myoxocephalus octodecemspinosus','longhorn-sculpin'],['Sea Raven','Hemitripterus americanus','sea-raven'],
        ['Atlantic Saury','Scomberesox saurus','atlantic-saury'],['Pacific Saury','Cololabis saira','pacific-saury'],['Sand Lance','Ammodytes americanus','sand-lance'],
        ['Pacific Sand Lance','Ammodytes hexapterus','pacific-sand-lance'],['κεραμιδόψαρο','Lopholatilus chamaeleonticeps','tilefish'],['Blueline Tilefish','Caulolatilus microps','blueline-tilefish'],
        ['Golden Tilefish','Lopholatilus chamaeleonticeps','golden-tilefish'],['Northern Puffer','Sphoeroides maculatus','northern-puffer'],['Southern Puffer','Sphoeroides nephelus','southern-puffer'],
        ['Καρό Puffer','Sphoeroides testudineus','checkered-puffer'],['Πορτσόψαρο','Diodon hystrix','porcupinefish'],['Μπαλονόψαρο','Diodon holocanthus','balloonfish'],
        ['Λείος κορμός','Lactophrys triqueter','smooth-trunkfish'],['Ξυρισμένο καουπόψαρο','Acanthostracion quadricornis','scrawled-cowfish'],['στικτός κορμός','Lactophrys bicaudalis','spotted-trunkfish'],
        ['Ρεμόρα','Remora remora','remora'],['Καρχαρία','Echeneis naucrates','sharksucker'],['Ατλαντικό Σουπιά','Trichiurus lepturus','atlantic-cutlassfish'],
        ['Κορδέλα','Trachipterus arcticus','ribbonfish'],['Βασιλιάς του Σολομού','Trachipterus altivelis','king-of-the-salmon'],['Oarfish','Regalecus glesne','oarfish'],
        ['Atlantic Stargazer','Uranoscopus scaber','atlantic-stargazer'],['North Stargazer','Astroscopus guttatus','northern-stargazer'],['Sand Tilefish','Malacanthus plumieri','sand-tilefish'],
        ['Σαύρα του Ατλαντικού','Synodus saurus','atlantic-lizardfish'],['Παράκτια Σαύρα','Synodus foetens','inshore-lizardfish'],['Reef Croaker','Ophioscion punctatissimus','reef-croaker']
      ]
    }
  ];

  const existing = Array.isArray(window.SPECIES_DB) ? window.SPECIES_DB : [];
  const names = new Set(existing.map(x => String(x.name || '').toLowerCase()));
  const scientific = new Set(existing.map(x => String(x.sci || '').toLowerCase()));
  const extra = [];
  groups.forEach(group => group.fish.forEach(([name, sci, slug]) => {
    if (names.has(name.toLowerCase()) || scientific.has(sci.toLowerCase())) return;
    names.add(name.toLowerCase()); scientific.add(sci.toLowerCase());
    extra.push({name, slug, sci, env: group.env, habitat: group.habitat, baits: group.baits, season: group.season});
  }));
  window.SPECIES_DB_CATALOG_ROWS = extra;
  window.SPECIES_DB = existing.concat(extra);
  try { document.dispatchEvent(new Event('bsf-db-εμπλουτισμένο')); } catch (_) {}
})();
