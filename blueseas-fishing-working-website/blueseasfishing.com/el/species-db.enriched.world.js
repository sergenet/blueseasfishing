/* BlueSeas — World enrichment pack (multiregion)

   Safe merge: fills missing fields; adds new species if not present.

   Fields: name, sci, env, habitat, baits, season, regions, depth?, alias?, img?

*/

(function(){

  const ENRICHED = [

    // ===== North America — Freshwater (adds or fills) =====

    {name:"Πέστροφα Λίμνης", slug: "lake-trout", sci:"Salvelinus namaycush", env:"Freshwater",

     habitat:"Βαθιές κρύες λίμνες, λεκάνες κυρίων λιμνών, καμπούρες, αιχμές.",

     baits:"Σωλήνες jigging, swimbaits, κουτάλια, νεκρό δόλωμα",

     season:"Βαθιά εποχή πάγου, ανοιξιάτικη ρηχή, καλοκαιρινή θερμοκλινής",

     regions:["Μεγάλες Λίμνες (MI/ON)", "Φλεγόμενο Φαράγγι (UT/WY)", "Λίμνες Ontario Shield", "Λίμνη Ταχόη, CA/ NVComment"]},



    {name:"Σολομός Kokanee", slug: "kokanee-salmon", sci:"Oncorhynchus νέρκα (μεσόγεια)", env:"Freshwater",

     habitat:"Πελαγική, σχολική φοίτηση σε βαθιές λεκάνες, θερινή θερμοκλινής.",

     baits:"Dodger + hoochie/καλαμπόκι, μικρά κουτάλια",

     season:"ΆΝΟΙΞΗ-ΚΑΛΟΚΑΊΡΙ",

     regions:["Φλεγόμενο Φαράγγι (UT/WY)", "Γουάλοουα (Όρεγκον)", "Stampede (Καλιφόρνια)", "BC εσωτερικές λίμνες"]},



    {name:"Sockeye Salmon", slug: "sockeye-salmon", sci:"Oncorhynchus nerka", env:"Freshwater",

     habitat:"Ποτάμια + λίμνες κατά τη διάρκεια διαδρομών, έξοδοι λίμνης.",

     baits:"Μύγες (αραιές σε στυλ ψαριού), μικρά κουτάλια",

     season:"Summer runs",

     regions:["Μπρίστολ Μπέι (Αλάσκα)", "Σύστημα Fraser (BC)"]},



    {name:"Ροζ Salmon", slug: "pink-salmon", sci:"Oncorhynchus gorbuscha", env:"Freshwater",

     habitat:"Παλίρροια σε χαμηλότερα ποτάμια. Ταξιδέψτε σε λωρίδες κοντά στην ακτή.",

     baits:"Μικρά κουτάλια, spinners, jigs",

     season:"Καλοκαιρινά τρεξίματα μονών ετών (σε πολλές περιοχές)",

     regions:["Puget Sound (WA)", "ΝΑ ΑΛΑΣΚΑ", "BC παράκτιοι ποταμοί"]},



    {name:"Chum Salmon", slug: "chum-salmon", sci:"Oncorhynchus keta", env:"Freshwater",

     habitat:"Χαμηλότερα ποτάμια, νεροτσουλήθρες.",

     baits:"Jigs, spinners, φανταχτερές μύγες",

     season:"Late fall",

     regions:["ΝΑ ΑΛΑΣΚΑ", "Puget Sound (WA)", "Ποτάμια BC"]},



    {name:"Πέστροφα ταύρος", slug: "bull-trout", sci:"Salvelinus confluentus", env:"Freshwater",

     habitat:"Ψυχρά, συνδεδεμένα ποτάμια συστήματα, μεταναστευτικά, βαθιές λίμνες.",

     baits:"Μεγάλες streamers, swimbaits, κουτάλια",

     season:"Άνοιξη-Πτώση (όπου είναι ανοιχτή)",

     regions:["Ποταμοί της Αλμπέρτα/Βρετανικής Κολομβίας", "Συστήματα Αϊντάχο/Μοντάνα"]},



    {name:"Αρκτικό Grayling", slug: "arctic-grayling", sci:"Thymallus arcticus", env:"Freshwater",

     habitat:"Κρύα, καθαρά ποτάμια/λίμνες, τουφέκια και πισίνες.",

     baits:"Ξηρές μύγες, μικρά κλώσματα, μικρά κουτάλια",

     season:"Καλοκαίρι-πρωί φθινόπωρο",

     regions:["Alaska interior", "ΒΔ/Γιούκον", "Montana high country"]},



    {name:"White Crappie", slug: "white-crappie", sci:"Pomoxis annularis", env:"Freshwater",

     habitat:"Βούρτσα/όρθια ξυλεία, λεκιασμένες δεξαμενές.",

     baits:"Μικρά jigs, minnows, λεπίδες",

     season:"Prespawn στα τέλη του χειμώνα, άνοιξη, φθινοπωρινά σχολεία",

     regions:["Mississippi reservoirs", "Oklahoma lakes", "Λίμνη Κεντάκι"]},



    {name:"Κίτρινη πέρκα", slug: "yellow-perch", sci:"Perca flavescens", env:"Freshwater",

     habitat:"Άκρες ζιζανίων, διαμερίσματα μεσαίου βάθους, σχολές λεκανών.",

     baits:"Μικρά παζλ, κουτάλια, ψαράκια",

     season:"Όλο το χρόνο, ασταρώστε τον πάγο και την άνοιξη/φθινόπωρο",

     regions:["Άνω Μεσοδυτικές λίμνες", "Λίμνη Σίμκοε (Οντάριο)"]},



    {name:"Γατόψαρο μπλε", slug: "blue-catfish", sci:"Ictalurus furcatus", env:"Freshwater",

     habitat:"Μεγάλα ποτάμια, περβάζια καναλιών, φράγματα.",

     baits:"Cut shad, skipjack, ζωντανό δόλωμα",

     season:"Καλοκαιρινή νυχτερινή μπουκιά, χειμερινές βαθιές τρύπες",

     regions:["Τζέιμς Ρίβερ (Βιρτζίνια)", "Ποταμός Μισισιπής", "Σάντι Κούπερ (Νότια Καρολίνα)"]},



    {name:"Γατόψαρο πλατυκέφαλο", slug: "flathead-catfish", sci:"Pylodictis olivaris", env:"Freshwater",

     habitat:"Λογαριές, βαθιές τρύπες, εξωτερικές στροφές.",

     baits:"Ζωντανά bluegill/shad, μεγάλα δολώματα ποταμού",

     season:"Ζεστούς μήνες (νύχτα). Πτώση κατά τη διάρκεια της ημέρας στην τρέχουσα",

     regions:["Δεξαμενές/ποτάμια του Κάνσας", "Ποταμός Οχάιο", "Διώρυγες AZ (εισήχθησαν)"]},



    {name:"GAR Αλιγάτορα", slug: "alligator-gar", sci:"Atractosteus spatula", env:"Freshwater",

     habitat:"Ομβρίων, ορμητικών, αργών ποταμών.",

     baits:"Ζωντανό/κομμένο δόλωμα, δέλεαρ σχοινιών (μπέρδεμα δοντιών)",

     season:"Warm months",

     regions:["Ποταμός Τρίνιτι (Τέξας)", "Παράκτια TX/LA Bayous"]},



    {name:"Αλυσοπρίονο", slug: "chain-pickerel", sci:"Esox niger", env:"Freshwater",

     habitat:"Κόλποι με βότανα, τέλματα.",

     baits:"Spinnerbaits, κουτάλια, jerkbaits",

     season:"Άνοιξη–Φθινόπωρο; χειμώνα στο Νότο",

     regions:["Λίμνες/λίμνες της Νοτιοανατολικής Αμερικής", "Παλιρροιακά ρυάκια στον Μεσοατλαντικό"]},



    // ===== NA — Inshore/Coastal =====

    {name:"Μαύρο τύμπανο", slug: "black-drum", sci:"Pogonias cromis", env:"Saltwater",

     habitat:"Oyster bars, κανάλια, κοψίματα σερφ. προβλήτες.",

     baits:"Καβούρι, γαρίδες, κομμένο δόλωμα? τζιγκ",

     season:"Όλο το χρόνο. άνοιξη μεγάλο τύμπανο τρέχει",

     regions:["Laguna Madre (TX)", "Louisiana marshes", "Λιμνοθάλασσα Mosquito (Φλόριντα)", "Εξωτερικές τράπεζες (NC)"]},



    {name:"Προβατοκέφαλος", slug: "sheepshead", sci:"Archosargus probatocephalus", env:"Saltwater",

     habitat:"Πάσσαλοι, προβλήτες, κρεβάτια με στρείδια.",

     baits:"Καβούρια, γαρίδες, καβούρια",

     season:"Κορυφή αργά χειμώνα-άνοιξη",

     regions:["Γέφυρες/εισόδους FL", "Louisiana marshes", "προβλήτες του Τέξας"]},



    {name:"Λαβράκι Μαύρης Θάλασσας", slug: "black-sea-bass", sci:"Centropristis striata", env:"Saltwater",

     habitat:"Παράκτια ναυάγια/ύφαλοι, προεξοχές.",

     baits:"Ζόγκες, λωρίδες καλαμαριού, αχιβάδες",

     season:"Άνοιξη-Φθινόπωρο (μετατοπίσεις βάθους με τη θερμοκρασία)",

     regions:["Ύφαλοι Νιου Τζέρσεϊ-Μασαχουσέτη", "Ναυάγια Τσέσαπικ/Βιρτζίνια"]},



    {name:"Tautog (Μαύροψαρο)", slug: "tautog-blackfish", sci:"Tautoga onitis", env:"Saltwater",

     habitat:"Βράχοι, ναυάγια, προβλήτες.",

     baits:"Πράσινα καβούρια, ασιατικά καβούρια σε σέγα",

     season:"Άνοιξη & αργά το φθινόπωρο prime",

     regions:["Ναυάγια/ύφαλοι Ρόουντ Άιλαντ/Κονέκτικατ/Νέα Υόρκη", "προβλήτες του Νιου Τζέρσεϊ"]},



    {name:"Bluefish", slug: "bluefish", sci:"Pomatomus saltatrix", env:"Saltwater",

     habitat:"Surf rips, inlets, blitzes σε σχολές δολωμάτων.",

     baits:"Μέταλλα, τοπικά νερά, κολυμβητές. κομμένο δόλωμα",

     season:"Μεταναστεύσεις άνοιξης-φθινοπώρου",

     regions:["Σερφ από τη Νέα Υόρκη έως τη Μασαχουσέτη", "Νιου Τζέρσεϊ σχίζει", "Εξωτερικές τράπεζες (NC)"]},



    {name:"Σκουμπρί Ατλαντικού", slug: "atlantic-mackerel", sci:"Scomber scombrus", env:"Saltwater",

     habitat:"Σχολεία κοντά στην ακτή/υπεράκτια· άκρες κατασκευών.",

     baits:"Sabikis, μικρά μέταλλα, φτερά",

     season:"Άνοιξη–Αρχές καλοκαιριού",

     regions:["Κόλπος του Μέιν", "Ακτές Ηνωμένου Βασιλείου/Ιρλανδίας (επίσης στο πακέτο της ΕΕ)"]},



    {name:"False Albacore (Little Tunny)", slug: "false-albacore-little-tunny", sci:"Euthynnus alletteratus", env:"Saltwater",

     habitat:"Αστραπιαία χτυπήματα κοντά στην ακτή σε γυάλινους ψαράδες· σχισίματα.",

     baits:"Εποξειδικές σέλες, μέταλλα, μικρές μύγες",

     season:"Τέλη καλοκαιριού - Φθινόπωρο",

     regions:["Κέιπ Κοντ–Νιου Τζέρσεϊ (φθινοπωρινός αγώνας δρόμου)", "Εξωτερικές τράπεζες (NC)"]},



    {name:"Προβατίνα Καλιφόρνια", slug: "california-sheephead", sci:"Semicossyphus pulcher", env:"Saltwater",

     habitat:"Κρεβάτια φυκιών, ύφαλοι, βραχώδης δομή.",

     baits:"Crabs/shrimp, squid; jigs",

     season:"Όλο το χρόνο (καλύτερο καλοκαίρι/φθινόπωρο)",

     regions:["Γραμμές φυκιών SoCal", "Νησιά της Μάγχης (CA)"]},



    {name:"Kelp (Calico) Bass", slug: "kelp-calico-bass", sci:"Paralabrax clathratus", env:"Saltwater",

     habitat:"Άκρες φύκια, βράχοι λέβητα, λιμάνια.",

     baits:"Μαγιό, σίδερα επιφανειών, πλαστικά",

     season:"Τέλη άνοιξης – Φθινόπωρο",

     regions:["Καταλίνα/Πάλος Βέρντες (ΚΑ)", "Φύκια Λα Χόγια (Καλιφόρνια)"]},



    {name:"Vermilion Rockfish", slug: "vermilion-rockfish", sci:"Sebastes miniatus", env:"Saltwater",

     habitat:"Βαθύι ύφαλοι/προεξοχές. σκληρός πάτος.",

     baits:"Ζόγκες, αρματωσιές με δολώματα, αργούς ρυθμούς",

     season:"Open seasons vary",

     regions:["Μοντερέι/Κάρμελ (Καλιφόρνια)", "Ύφαλοι Όρεγκον/Ουάσινγκτον"]},



    {name:"Cabezon", slug: "cabezon", sci:"Scorpaenichthys marmoratus", env:"Saltwater",

     habitat:"Ρηχοί βραχώδεις ύφαλοι, τσέπες από φύκια.",

     baits:"Jigs με δόλωμα, swimbaits",

     season:"Rockfish seasons",

     regions:["Κεντρική/Βόρεια Καλιφόρνια, Όρεγκον, Ουάσινγκτον"]},



    // ===== Offshore — Pelagics (global use) =====

    {name:"Κιτρινόπτερος τόνος", slug: "yellowfin-tuna", sci:"Thunnus albacares", env:"Saltwater",

     habitat:"Μπλε νερό, διαλείμματα θερμοκρασίας, τρέχουσες άκρες.",

     baits:"Φτερά συρτής, βύσματα κέδρου, poppers, ζωντανό δόλωμα",

     season:"Μήνες με ζεστό νερό. εποχιακές μεταναστεύσεις",

     regions:["Νότια Καλιφόρνια/Μπάχα, υπεράκτια", "Ρεύμα του Κόλπου της Φλόριντα", "Κανάρια Νησιά.", "Οι όχθες του Ινδικού Ωκεανού"]},



    {name:"Ερυθρός τόνος", slug: "bluefin-tuna", sci:"Thunnus thynnus", env:"Saltwater",

     habitat:"Συγκέντρωση υπεράκτιων δολωμάτων. άκρες ραφιών.",

     baits:"Stickbaits, poppers, jigs, live bait? τρολαρισμένο άπλωμα",

     season:"Ποικίλει (άνοιξη-φθινόπωρο σε NA/EU)",

     regions:["Κέιπ Κοντ/Κόλπος του Μέιν", "Εξωτερικές τράπεζες (NC)", "Μεσογειακή"]},



    {name:"Ουάχου", slug: "wahoo", sci:"Acanthocybium solandri", env:"Saltwater",

     habitat:"Απότομες αποβολές, πάσες κατασκευής υψηλής ταχύτητας.",

     baits:"Τρολάρισμα υψηλής ταχύτητας, βαθιές δύτες, jigs",

     season:"Ζεστές εποχές. σεληνιακές παλίρροιες",

     regions:["Στενά Μπαχάμες/Φλόριντα", "Baja peninsula", "Hawaii ledges"]},



    {name:"Μπλε Μάρλιν", slug: "blue-marlin", sci:"Makaira nigricans", env:"Saltwater",

     habitat:"Καταγάλανα νερά κοντά σε βουνά. συγκεντρώσεις δολωμάτων.",

     baits:"Τρολαρίσματα, πειράγματα + δολώματα πίσσας",

     season:"Τροπικές/υποτροπικές θερμές εποχές",

     regions:["Αζόρες", "Μαδέρα", "Gulf Stream Μπαχάμες", "Κάμπο Σαν Λούκας (Μεξικό)"]},



    {name:"Ιστιοφόρο", slug: "sailfish", sci:"Istiophorus platypterus", env:"Saltwater",

     habitat:"Άκρες/ζιζάνια. σχολεία δολωμάτων? αλλαγές χρώματος.",

     baits:"Trolled balllyhoo, dredge teasers, pitch baits",

     season:"Χειμώνας FL/Καραϊβική; εποχιακά αλλού",

     regions:["Παλμ Μπιτς–Ισλαμοράδα (Φλόριντα)", "Γουατεμάλα", "Κόστα Ρίκα Ειρηνικός"]},



    {name:"Ξιφία", slug: "swordfish", sci:"Xiphias gladius", env:"Saltwater",

     habitat:"Δομή βαθιάς πτώσης. ημερήσιες κάθετες μεταναστεύσεις.",

     baits:"Καλαμάρι βαθιάς πτώσης, τακτικές σημαδούρας/drift",

     season:"Νύχτα καλοκαίρι? ημέρα βαθιά πτώση όλο το χρόνο σε ορισμένες περιοχές",

     regions:["Φλόριντα Κις", "Φαράγγια της Νότιας Καλιφόρνια", "Med canyons"]},



    // ===== Europe (fresh + salt) =====

    {name:"Σολομός Ατλαντικού", slug: "atlantic-salmon", sci:"Salmo salar", env:"Freshwater",

     habitat:"Ραβδιά, λιμνούλες, τρεχούμενα νερά· κλασικά ποτάμια με σολομό.",

     baits:"Μύγα (φτερά μαλλιών, σωλήνες), κλωστές, κουτάλια",

     season:"Ποικίλλει ανάλογα με το ποτάμι· άνοιξη-φθινόπωρο",

     regions:["Νορβηγία Γκάουλα", "Σκωτία Σπέι/Ντι", "Iceland rivers", "Ρωσία Κόλα"]},



    {name:"Ζάντερ", slug: "zander", sci:"Sander lucioperca", env:"Freshwater",

     habitat:"Αργά ποτάμια & βαθιές λίμνες. δομή/άκρες.",

     baits:"Σκιερές σκιές, μανιβέλα, ζωντανό δόλωμα",

     season:"Άνοιξη-Φθινόπωρο· νύχτα το καλοκαίρι",

     regions:["Λεκάνες Βαλτικής/Έλβα/Δούναβη", "Δεξαμενές του Ηνωμένου Βασιλείου (εφοδιασμένες)"]},



    {name:"Ευρωπαϊκή Πέρκα", slug: "european-perch", sci:"Perca fluviatilis", env:"Freshwater",

     habitat:"Ζιζανιοκτόνα, προβλήτες, κανάλια· αρπακτικά που μαζεύονται σε ρηχά νερά.",

     baits:"Μικρά μαλακά πλαστικά, spinners, dropshot",

     season:"Όλο το χρόνο· καλύτερα άνοιξη/φθινόπωρο",

     regions:["Κανάλια/λίμνες του Ηνωμένου Βασιλείου", "Scandinavia lakes", "Ποταμοί της Κεντρικής ΕΕ"]},



    {name:"Είδος κυπρίνου", slug: "tench", sci:"Tinca tinca", env:"Freshwater",

     habitat:"Χλοοτάπητες ήρεμες λίμνες· περιθώρια· ζεστοί μήνες δραστηριότητας.",

     baits:"Σκουλήκια, καλαμπόκι, ψωμί, μπόιλιες (τροφοδότης μεθόδου)",

     season:"Τέλη άνοιξης-καλοκαιριού",

     regions:["Νερά και κανάλια ΗΒ/ΕΕ"]},



    {name:"Μπάρα", slug: "barbel", sci:"Barbus barbus", env:"Freshwater",

     habitat:"Χαλικώδεις διαδρομές, γρήγορα ποτάμια· στον πυθμένα.",

     baits:"Pellets, boilies, κρέας, τυρί? τροφοδοτικές εγκαταστάσεις",

     season:"Καλοκαίρι–Φθινόπωρο",

     regions:["Ποταμός Γουάι/Τρεντ/Σέβερν (Ηνωμένο Βασίλειο)", "Ρήνος/Σηκουάνας/Δούναβης"]},



    {name:"European Chub", slug: "european-chub", sci:"Squalius cephalus", env:"Freshwater",

     habitat:"Ποτάμια με κάλυψη· άκρες· λιμνούλες γεφυρών.",

     baits:"Ψωμί, σκουλήκια, μικρά θέλγητρα, μύγες",

     season:"Όλο το χρόνο· ψάρεμα με χαμηλή καθαρότητα νερού",

     regions:["Ποτάμια και κανάλια ΗΒ/ΕΕ"]},



    {name:"Ευρωπαϊκό Λαβράκι", slug: "european-seabass", sci:"Dicentrarchus labrax", env:"Saltwater",

     habitat:"Παραλίες για σερφ, εκβολές ποταμών, σημάδια από βράχους.",

     baits:"Μαλακά πλαστικά, βύσματα επιφάνειας, μέταλλα, δόλωμα",

     season:"Τέλη άνοιξης-φθινόπωρο",

     regions:["Ακτές του Ατλαντικού Ηνωμένου Βασιλείου/Ιρλανδίας/Γαλλίας", "Mediterranean harbors"]},



    {name:"Gilthead Seabream", slug: "gilthead-seabream", sci:"Sparus aurata", env:"Saltwater",

     habitat:"Μεσογειακοί βραχώδεις/αμμώδεις κόλποι· λιμάνια.",

     baits:"Καβούρι, γαρίδες, οστρακοειδή? μικρές τζόγκες",

     season:"Warm months",

     regions:["Ακτές Ισπανίας/Ιταλίας/Ελλάδας"]},



    {name:"Atlantic Cod", slug: "atlantic-cod", sci:"Gadus morhua", env:"Saltwater",

     habitat:"Τράπεζες, ναυάγια, ύφαλοι. πιο κρύο νερό.",

     baits:"Ζόγκες, δολώματα (αχιβάδα/καλαμαράκια), πιρκ",

     season:"Χειμώνα-άνοιξη σε πολλές περιοχές",

     regions:["Norway fjords", "Ισλανδία", "Ναυάγια στη Βόρεια Θάλασσα του Ηνωμένου Βασιλείου"]},



    {name:"Είδος γάδου", slug: "pollack", sci:"Pollachius pollachius", env:"Saltwater",

     habitat:"Σημάδια από βράχους με φύκια, ναυάγια· κυνηγοί στα μέσα του νερού.",

     baits:"Σκιές σε jigheads, μέταλλα",

     season:"Άνοιξη–φθινόπωρο",

     regions:["Ακτές του Ατλαντικού Ηνωμένου Βασιλείου/Ιρλανδίας", "Βρετανή"]},



    {name:"Καλκάνι", slug: "turbot", sci:"Scophthalmus maximus", env:"Saltwater",

     habitat:"Αμμώδεις όχθες κοντά σε παλιρροϊκά νερά· παραλίες για σέρφινγκ.",

     baits:"Λωρίδες ψαριών, αμμόχελα. σέρνοντας κουτάλια",

     season:"Άνοιξη–καλοκαίρι",

     regions:["Όχθες της Βόρειας Θάλασσας", "Biscay beaches"]},



    // ===== Australia / New Zealand / Pacific =====

    {name:"Μπαραμούντι", slug: "barramundi", sci:"Lates calcarifer", env:"Brackish",

     habitat:"Ρυάκια μαγκρόβιων εκτάσεων, εμπλοκές, αποχετεύσεις· κατακρατήσεις.",

     baits:"Σκληρά σώματα, απαλές δονήσεις, κολύμπι. ζωντανό μπαρμπούνι",

     season:"Κατασκευή κατά την τροπική περίοδο των βροχών· κατακρατήσεις όλο το χρόνο",

     regions:["Παλιρροιακά ρυάκια NT/QLD (AU)", "Μπιλαμπόνγκ Κακάντου (Αυστραλία)", "Φράγματα Top End"]},



    {name:"Murray Cod", slug: "murray-cod", sci:"Maccullochella peelii", env:"Freshwater",

     habitat:"Μεγάλες εμπλοκές στο ποτάμι, βραχώδεις φραγμοί· ενέδρες.",

     baits:"Μεγάλα κολυμπήματα, wakebaits, spinnerbaits",

     season:"Κλειστά την άνοιξη (AU)· ιδανικά την άνοιξη/φθινόπωρο",

     regions:["Λεκάνη Murray-Darling (AU)"]},



    {name:"Αυστραλιανό μπάσο", slug: "australian-bass", sci:"Macquaria novemaculeata", env:"Freshwater",

     habitat:"Ποτάμια της ανατολικής ακτής· εμπλοκές/ορμητικά ρέματα· υφάλμυρα το χειμώνα.",

     baits:"Surface walkers, spinnerbaits, πλαστικά",

     season:"Καλοκαιρινή επιφάνεια· χειμερινή υφάλμυρη σχοινωμένη",

     regions:["Ποταμοί NSW/QLD (AU)"]},



    {name:"Dusky Flathead", slug: "dusky-flathead", sci:"Platycephalus fuscus", env:"Saltwater",

     habitat:"Αμμώδεις εκβολές ποταμών, αποχετεύσεις, σημεία απόρριψης· ενέδρα.",

     baits:"Μαλακά πλαστικά, vibes, θέλγητρα γαρίδας",

     season:"Άνοιξη–φθινόπωρο",

     regions:["Εκβολές ποταμών NSW/QLD (AU)"]},



    {name:"Snapper (Αυστραλιανή)", slug: "snapper-australasian", sci:"Pagrus auratus", env:"Saltwater",

     habitat:"Ύφαλοι, μύδια, κανάλια· κοπάδια δολωμάτων.",

     baits:"Softbaits, micro-jigs, ledger rigs",

     season:"Άνοιξη ωοτοκίας· φθινοπωρινές εργασίες",

     regions:["Κόλπος Χαουράκι (Νέα Ζηλανδία)", "Ύφαλοι Νότιας Αφρικής/Βικιταλικής πολιτείας (AU)"]},



    {name:"Kingfish Yellowtail", slug: "yellowtail-kingfish", sci:"Seriola lalandi", env:"Saltwater",

     habitat:"Καρφίτσες, άκρες ρεύματος, περβάζια φυκιών.",

     baits:"Ζωντανά δολώματα, κορυφαίες μπότες, τζίγκ",

     season:"Καλοκαίρι–φθινόπωρο",

     regions:["Κόλπος των Νήσων (Νέα Ζηλανδία)", "Νότια ακτή της Νέας Νότιας Ουαλίας (AU)"]},



    {name:"Giant Trevally (GT)", slug: "giant-trevally-gt", sci:"Caranx ignobilis", env:"Saltwater",

     habitat:"Άκρες υφάλων, βραχώδεις ακτές, διάλειμμα σερφ.",

     baits:"Μεγάλα poppers, stickbaits, jigs",

     season:"Tropical warm months",

     regions:["Ατόλες της Κοραλλιογενούς Θάλασσας", "Μαλδίβες", "Σεϋχέλλες"]},



    {name:"Ισπανικό σκουμπρί", slug: "spanish-mackerel", sci:"Scomberomorus commerson", env:"Saltwater",

     habitat:"Ακρωφόρα, σημεία υφάλων, σχολεία δολωμάτων.",

     baits:"Τρολαρισμένα minnows, μεταλλικές φέτες, ζωντανά δολώματα",

     season:"Warm months",

     regions:["Κουίνσλαντ/Βόρεια Αυστραλία", "PNG/Ινδονησία"]},



    // ===== Asia =====

    {name:"Mahseer (Χρυσός)", slug: "mahseer-golden", sci:"Tor putitora", env:"Freshwater",

     habitat:"Ποτάμια στους πρόποδες· ορμητικά νερά/λίμνες· μεταναστευτικά.",

     baits:"Κουτάλια, κλωστήρες, βύσματα. ζύμη/δολώματα σε ορισμένες περιοχές",

     season:"Πτώση μετά τους μουσώνες. Χειμερινό χαμηλό καθαρός ουρανός",

     regions:["Ινδικά ποτάμια Ιμαλάια", "Nepal foothills"]},



    {name:"Snakehead (Γίγαντας)", slug: "snakehead-giant", sci:"Channa micropeltes", env:"Freshwater",

     habitat:"Λίμνες/κανάλια πνιγμένα από ζιζάνια· αρπακτικό σε ενέδρα.",

     baits:"Βάτραχοι, μπαζμπαϊτ, κολύμπι? ζωντανό δόλωμα",

     season:"Υψηλή περιεκτικότητα νερού σε υγρή περίοδο· ψάρεμα με ορατότητα σε χαμηλή περιεκτικότητα νερού",

     regions:["Ταμιευτήρες Μαλαισίας/Ταϊλάνδης", "Borneo lakes"]},



    {name:"Rohu", slug: "rohu", sci:"Labeo rohita", env:"Freshwater",

     habitat:"Μεγάλα ποτάμια, λίμνες, δεξαμενές.",

     baits:"Ζύμη/άττες, καλαμπόκι, ψωμί; τροφοδότες μεθόδου",

     season:"Ζεστοί μήνες· εξαρτώμενος από τους μουσώνες",

     regions:["Λεκάνη του Γάγγη (IN/BD)", "Pakistan canals"]},



    {name:"Γιγαντιαίο γατόψαρο Μεκόνγκ", slug: "giant-mekong-catfish", sci:"Pangasianodon gigas", env:"Freshwater",

     habitat:"Μεγάλα ποτάμια κανάλια· βαθιές τρύπες· δεξαμενές (γεμάτες).",

     baits:"Μέθοδοι πέλλετ/δόλωμα. ζωντανό/κομμένο σε ορισμένες περιοχές",

     season:"Ποικίλλει· συχνά ζεστοί μήνες",

     regions:["Λεκάνη Μεκόνγκ (TH/LA/VN/CN)"]},



    {name:"Κυπρίνος Σιαμ", slug: "siamese-carp", sci:"Catlocarpio siamensis", env:"Freshwater",

     habitat:"Πλημμυρικές πεδιάδες, δεξαμενές (εφοδιασμένες).",

     baits:"Boilies/pellets/μέθοδος; βαρύ τάκλιν",

     season:"Warm months",

     regions:["Ταϊλανδικές δεξαμενές/αλιευτικές περιοχές"]},



    // ===== Africa =====

    {name:"Nile Perch", slug: "nile-perch", sci:"Lates niloticus", env:"Freshwater",

     habitat:"Δομή λίμνης/ποτάμου, σημεία απόρριψης· ενέδρα.",

     baits:"Βαθιά κολύμβηση, ζωντανό δόλωμα, βύσματα συρτή",

     season:"Ξηρές εποχές· χαμηλό φως",

     regions:["Λίμνη Βικτώρια (EA)", "Λίμνη Νάσερ (EG)"]},



    {name:"Tigerfish", slug: "tigerfish", sci:"Hydrocynus vittatus", env:"Freshwater",

     habitat:"Γρήγορα ποτάμια. Αμμόλοφοι/δίνες. Καθαρά ρεύματα.",

     baits:"Κλώσσες, κουτάλια, minnows. συρματόσχοινα",

     season:"Ξηρή περίοδος (χαμηλότερες, καθαρότερες ροές)",

     regions:["Ζαμβέζι, Οκαβάνγκο (Ασπρόμαυρο/Μαύρο/Ζανγκζού)"]},



    {name:"Κιτρινόψαρο (Smallmouth)", slug: "yellowfish-smallmouth", sci:"Labeobarbus aeneus", env:"Freshwater",

     habitat:"Ψάρεμα με σκοπευτικό/δόλωμα· ψάρεμα με πετονιά/δόλωμα.",

     baits:"Νύμφες, μικρές στρόφαλοι, μαλακά πλαστικά",

     season:"Άνοιξη–φθινόπωρο",

     regions:["Ποταμός Βάαλ (ZA)"]},



    {name:"Galjoen", slug: "galjoen", sci:"Dichistius capensis", env:"Saltwater",

     habitat:"Νοτιοαφρικανικά βράχια με κυματισμό· καταγάλανα νερά.",

     baits:"Κόκκινο δόλωμα/μύδια; μικρές τζόγκες",

     season:"Χειμώνας–άνοιξη (πιο δροσερό νερό)",

     regions:["Βραχώδεις παραλίες στο Δυτικό Ακρωτήριο (ZA)"]},



    {name:"Kob (Dusky/Spotted)", slug: "kob-dusky-spotted", sci:"Argyrosomus japonicus", env:"Saltwater",

     habitat:"Τρύπες για σερφ, εκβολές ποταμών, εκβολές ποταμών.",

     baits:"Ζωντανό μπαρμπούνι, μαλακά πλαστικά, μπουκτέιλ",

     season:"Φθινόπωρο–χειμώνας (περιφερειακό)",

     regions:["Ακτή της Νότιας Αφρικής", "Δυτική Αυστραλία (ως Mulloway)"]},



    // ===== South America / Caribbean =====

    {name:"Peacock Bass", slug: "peacock-bass", sci:"Cichla temensis", env:"Freshwater",

     habitat:"Πλημμυρισμένη ξυλεία, λιμνοθάλασσες· εκρηκτικά επιφανειακά ύδατα.",

     baits:"Μεγάλα δολώματα στηρίγματα, ξυλάκια, τζίγκ",

     season:"Ξηρή περίοδος (χαμηλό νερό)",

     regions:["Ρίο Νέγκρο (BR)", "Ορινόκο (VE/CO)"]},



    {name:"Golden Dorado", slug: "golden-dorado", sci:"Salminus brasiliensis", env:"Freshwater",

     habitat:"Γρήγορες διαδρομές, ραφές από βράχους· βαριά δομή.",

     baits:"Streamers, jerkbaits, κουτάλια (wire leader)",

     season:"Άνοιξη–φθινόπωρο (περιφερειακό)",

     regions:["Ιμπέρα Μαρς (AR)", "Bolivia jungle rivers", "Ποταμός Ουρουγουάη"]},



    {name:"Pacu", slug: "pacu", sci:"Κολοσόσμα/Piaractus spp.", env:"Freshwater",

     habitat:"Αργά ποτάμια, πλημμυρισμένα δάση.",

     baits:"Fruit, nuts, corn, pellets; flies",

     season:"Υψηλή πτώση καρπών στο νερό· ζεστοί μήνες",

     regions:["Λεκάνη του Αμαζονίου (BR/PE/BO)"]},



    {name:"Piraíba (Lau Lau)", slug: "pira-ba-lau-lau", sci:"Brachyplatystoma filamentosum", env:"Freshwater",

     habitat:"Deep κανάλια Amazon. συρροές.",

     baits:"Τεράστια κομμένα δολώματα? βαρύ τάκλιν",

     season:"Ποικίλλει ανάλογα με το ποτάμι. Συχνά πέφτει νερό",

     regions:["Κύριο κατάστημα Amazon (BR)"]},



    {name:"Payara (Ψάρι Βαμπίρ)", slug: "payara-vampire-fish", sci:"Hydrolycus scomberoides", env:"Freshwater",

     habitat:"Γρήγορες βραχώδεις διαδρομές και βουτιές· οξυγονωμένο νερό.",

     baits:"Μεγάλα κουτάλια, σέγα, ραβδιά. μεγάλες σερπαντίνες",

     season:"Lower water periods",

     regions:["Φυλές Ορινόκο/Αμαζονίου (VE/CO/BR)"]},



    {name:"Οστεόψαρο", slug: "bonefish", sci:"Albula vulpes", env:"Saltwater",

     habitat:"Ρηχά επίπεδα εδάφη, χόρτο χελώνας, άμμος.",

     baits:"Μικρές γαρίδες μύγες, τζίγκ",

     season:"Τροπικές περιοχές όλο το χρόνο· παλίρροιες + κλειδί γωνίας ήλιου",

     regions:["Μπαχάμες", "Φλόριντα Κις", "Γιουκατάν"]},



    {name:"Άδεια", slug: "permit", sci:"Trachinotus falcatus", env:"Saltwater",

     habitat:"Ρηχά επίπεδα νερά· ψάρια που σκαρφαλώνουν· επιφυλακτικά.",

     baits:"Μύγες καβουριών, μικρές σέλες. ζωντανά καβούρια",

     season:"Άνοιξη-φθινόπωρο (παράθυρα παλίρροιας)",

     regions:["Μπελίζ", "Γιουκατάν", "Κλειδιά"]},

  ];



  function mergeEnrichment(){

    const db = Array.isArray(window.SPECIES_DB) ? window.SPECIES_DB : (window.SPECIES_DB = []);

    const norm = x => String(x||"").toLowerCase().trim();

    const isEmpty = v => v==null || (typeof v==="σειρά" && !v.trim()) || (Array.isArray(v)&&!v.length);

    const keys = ["env","ενδιαίτημα","δολώματα","εποχή","βάθος","ψευδώνυμο","img","περιφέρειες"];



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
