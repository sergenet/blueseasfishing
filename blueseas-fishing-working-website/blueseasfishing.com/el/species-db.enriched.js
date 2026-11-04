/* BlueSeas — species DB enrichment (regions/hotspots + basics)

   - Safe merge: fills missing fields for existing species; adds new ones if absent.

   - Fields used by your gallery: name, sci, env, habitat, baits, season, regions, depth?, alias?, img?

*/

(function(){

  const ENRICHED = [

    // ===== Freshwater — Trout/Salmonids =====

    { name:"Πέστροφα Ουράνιο Τόξο", slug: "rainbow-trout", sci:"Oncorhynchus mykiss", env:"Freshwater",

      habitat:"Κρύα, καθαρά ποτάμια και λίμνες. τουφέκια, ουρές, εισαγωγές.",

      baits:"Ενσωματωμένες κλωστές, κουτάλια, μικρές μανιβέλα, σκουλήκια, αυγά σολομού, μύγες (νύμφες, σερπαντίνες)",

      season:"Άνοιξη–Φθινόπωρο; καλοκαιρινά πρωινά/βράδια. χειμερινά ουρά",

      regions:[

        "Αλπικές λίμνες της Σιέρα Νεβάδα (Καλιφόρνια)", "Δεσχύτες + Μετόλιος (OR)", "Μάντισον + Γκάλατιν (Μοντάνα)",

        "Ουάιλγουοτερ του ποταμού Κολοράντο (Λις Φέρι, Αριζόνα)", "Φυλές των Μεγάλων Λιμνών (Μίσιγκαν/Νέα Υόρκη/Πενσυλβάνια/Οντάριο)"

      ]},

    { name:"Καφέ Πέστροφα", slug: "brown-trout", sci:"Salmo trutta", env:"Freshwater",

      habitat:"Δροσερά ποτάμια με κάλυψη. χαμηλότερες τράπεζες· βαθιές πισίνες? πηγαδάκια.",

      baits:"Βύσματα Minnow, jerkbaits, spinners, nightcrawlers, streamers",

      season:"Άνοιξη–Φθινόπωρο; νυχτερινό ψάρεμα το καλοκαίρι. χειμερινά ουρά",

      regions:[

        "Πηγαία ρυάκια χωρίς παρασυρόμενα νερά (WI/MN/IA)", "Γουάιτ Ρίβερ (AR tailwaters)",

        "Pennsylvania limestone streams", "Freestones του Νότιου Νησιού της Νέας Ζηλανδίας", "Παταγονία (AR/CL)"

      ]},

    { name:"Brook Trout", slug: "brook-trout", sci:"Salvelinus fontinalis", env:"Freshwater",

      habitat:"Μικρά κρύα νερά. λίμνες κάστορα? σκιασμένα τουφέκια.",

      baits:"Μικρές κλωστές, ξηρές μύγες, σκουλήκια, μικροκουτάλια",

      season:"Τέλη άνοιξης-αρχές φθινοπώρου. μεσημέρι στην υψηλή χώρα",

      regions:[

        "Πηγές ποταμών των Απαλαχίων (NC/VA/WV)", "Λίμνες Adirondack (Νέα Υόρκη)",

        "Πηγαία ρυάκια στις Άνω Μεγάλες Λίμνες", "Άγρια φύση Λαμπραντόρ (Καλιφόρνια)"

      ]},

    { name:"Πέστροφα Κοφτερή", slug: "cutthroat-trout", sci:"Oncorhynchus clarkii", env:"Freshwater",

      habitat:"Δυτικές λίμνες, ψηλές λίμνες. αργές ραφές, κοψίματα.",

      baits:"Στεγνές μύγες (χοάνες), μικρά κλωστήρια, κουτάλια",

      season:"Καλοκαίρι – Αρχές Φθινοπώρου (χερσαία αιχμή)",

      regions:[

        "Σύστημα Γέλοουστοουν (WY/MT)", "Σνέικ Ρίβερ (Γουάιος)", "Λίμνες Sierra High (CA)", "Λεκάνη επίπεδης κεφαλής (MT)"

      ]},

    { name:"Steelhead", slug: "steelhead", sci:"Oncorhynchus mykiss (ανάδρομος)", env:"Freshwater",

      habitat:"Κάτω ροές του ποταμού, εκβολές, σχισμές· παλιρροϊκό νερό στις αρχές της σεζόν.",

      baits:"Χάντρες, ζόγκους κάτω από πλωτήρες, κλωστήρες, κουτάλια, αιωρούμενες μύγες",

      season:"Χειμερινές διαδρομές (Δεκ-Φεβρουάριο) & Θερινές διαδρομές (Ιούλιος-Οκτώβριος)",

      regions:[

        "Rogue & Umpqua (OR)", "Trinity & Klamath (CA)", "Hoh & Bogachiel (WA)",

        "Φυλές των Μεγάλων Λιμνών (Μίσιγκαν/Νέα Υόρκη/Πενσυλβάνια/Οντάριο)"

      ]},

    { name:"Σολομός Σινούκ", slug: "chinook-salmon", sci:"Oncorhynchus tshawytscha", env:"Freshwater",

      habitat:"Παλίρροια μέχρι τα μέσα του ποταμού. βαθιές υποδοχές κατά τη διάρκεια του φωτός της ημέρας.",

      baits:"Εξέδρες ρέγγας/γαύρου, κλωστήρες, βύσματα, αυγοτάραχο",

      season:"Φθινοπωρινά τρεξίματα? ελατήρια σε ορισμένα συστήματα",

      regions:["Ποταμός Κολούμπια (ΟΥΑ/ΟΡΕΓΚΟΝ)", "Κενάι (ΑΚ)", "Σύστημα Σακραμέντο (Καλιφόρνια)", "Fraser (BC)"]},

    { name:"Σολομός Coho", slug: "coho-salmon", sci:"Oncorhynchus kisutch", env:"Freshwater",

      habitat:"Πιο αργές πισίνες και μαλακές άκρες κοντά στη δομή.",

      baits:"Κλωστές, τρεμούλες, μικρές τάπες, αυγοτάραχο",

      season:"Φθινόπωρο (Σεπτέμβριος – Νοέμβριος)",

      regions:["Φυλές Puget Sound (WA)", "Ρεύματα Νοτιοανατολικής Αλάσκας", "Oregon coastal rivers", "Φυλές των Μεγάλων Λιμνών"]},



    // ===== Freshwater — Warm/Coolwater =====

    { name:"Largemouth Bass", slug: "largemouth-bass", sci:"Micropterus salmoides", env:"Freshwater",

      habitat:"Ζιζάνια, ξύλο, αποβάθρες, κανάλια κολπίσκων. ρηχά την άνοιξη.",

      baits:"σκουλήκια Senko, spinnerbaits, jigs + craws, βατράχια, chatterbaits",

      season:"Ωοτοκία (άνοιξη), κορυφαίο νερό (καλοκαιρινή αυγή/σούρουπο), φθινοπωρινή καταδίωξη",

      regions:["Λίμνη Οκιτσόμπι (Φλόριντα)","Λέικ Φορκ (Τέξας)","Γκάντερσβιλ (Αλαμπάμα)","Κλίαρ Λέικ (Καλιφόρνια)","Σαμ Ρέιμπερν (Τέξας)"]},

    { name:"Smallmouth Bass", slug: "smallmouth-bass", sci:"Micropterus dolomieu", env:"Freshwater",

      habitat:"Βραχώδη ποτάμια/λίμνες; τρέχουσες ραφές? χαλίκια σημεία.",

      baits:"Ned rigs, σωλήνες, jerkbaits, μανιβέλα, topwater walkers",

      season:"Ωοτοκία αργά την άνοιξη. Βαθιές καμπούρες καλοκαίρι? πτώση δόλωμα τρέχει",

      regions:["Ποταμός Σεντ Λόρενς (Νέα Υόρκη/Οντάριο)","Μεγάλες Λίμνες ύφαλος","Susquehanna (PA)","Κομητεία Ντορ (Ουισκόνσιν)"]},

    { name:"Ραβδωτή πέρκα", slug: "striped-bass", sci:"Morone saxatilis", env:"Freshwater",

      habitat:"Σημεία δεξαμενής, κανάλια ποταμών. φώτα νυχτερινής γέφυρας.",

      baits:"Δολώματα κολύμβησης, bucktails, ζωντανά σκίαστρα, απόκοσμοι τοπικού νερού",

      season:"Άνοιξη τρεξίματα? τσίμπημα καλοκαιρινής νύχτας? πτώση blitz",

      regions:["Σακ-Σαν Χοακίν Δέλτα (ΚΑ)","Λίμνη Τέξομα (ΟΚ/Τέξας)","Hudson River (NY)","Chesapeake tributaries"]},

    { name:"Walleye", slug: "walleye", sci:"Sander vitreus", env:"Freshwater",

      habitat:"Βραχώδη σημεία, διαχωριστικές γραμμές, άκρες ζιζανίων. τροφοδότες χαμηλού φωτισμού.",

      baits:"Jig + minnow, πλατφόρμες ζωντανού δολώματος, μανιβέλα, λεπίδες",

      season:"Ανοιξιάτικα ποτάμια μετά την ωοτοκία. καλοκαιρινές καμπούρες? φθινοπωρινό νυχτερινό δάγκωμα",

      regions:["Λίμνη Ήρι (Οχάιο/Πενσυλβάνια/ΟΝ)","Λίμνη των Δασών (Μινεσότα/Οντάριο)","Ποταμός Κολούμπια (Ουάσινγκτον)","Γκριν Μπέι (Ουισκόνσιν)"]},

    { name:"Βόρειος Λούτσος", slug: "northern-pike", sci:"Esox lucius", env:"Freshwater",

      habitat:"Ζιζάνια, κολπίσκοι, εκβολές ποταμών. σημεία ενέδρας.",

      baits:"Σπινερμπιτς, κουτάλια, σπασμωδικά, μεγάλα μαγιό",

      season:"Πάγος ρηχά? καλοκαιρινά ζιζάνια? πτώση μεγάλο δόλωμα",

      regions:["Οριακά Ύδατα (MN/ON)","Saskatchewan lakes","Alaska sloughs","Irish loughs"]},

    { name:"Muskellunge", slug: "muskellunge", sci:"Esox masquinongy", env:"Freshwater",

      habitat:"Σημεία, ζιζάνια, μεταβάσεις βράχου/ξύλου. ακολουθεί & σχήμα-8.",

      baits:"Διπλό 10 bucktails, jerkbaits, glide baits, rubber",

      season:"Τέλη Άνοιξης–Φθινόπωρο. παράθυρα ανατολής/δύσης φεγγαριού",

      regions:["Λίμνη Σεντ Κλερ (Μίσιγκαν/ΟΝ)","Γκριν Μπέι (Ουισκόνσιν)","Άγιος Λαυρέντιος (Νέα Υόρκη/Οντάριο)","Λίμνη Ιγκλ (ΟΝ)"]},

    { name:"Bluegill", slug: "bluegill", sci:"Lepomis macrochirus", env:"Freshwater",

      habitat:"Άκρες ζιζανίων, ρηχοί όρμοι, αποβάθρες. κλινοσκεπάσματα ελατήριο.",

      baits:"Κομμάτια σκουληκιών, μικρά τζινγκ, μικροπλαστικά, μύγες",

      season:"Άνοιξη ωοτοκίας? καλοκαιρινή σκιά? χειμερινές βαθιές λεκάνες",

      regions:["Λίμνες/λίμνες σε εθνικό επίπεδο (ΗΠΑ)","Γραμμές ζιζανίων σε φυσικές λίμνες","Λίμνες αγροκτημάτων (ΝΑ/ΜΔ)"]},

    { name:"Black Crappie", slug: "black-crappie", sci:"Pomoxis nigromaculatus", env:"Freshwater",

      habitat:"Σωροί βούρτσας, όρθια ξυλεία, αποβάθρες. σχολεία σε αναστολή.",

      baits:"Μικρές τζίζες, μιννοτούρες, μικρο μανιβέλα",

      season:"Σταδιοποίηση πριν την αναπαραγωγή (τέλη χειμώνα), ωοτοκία (άνοιξη), σχολεία φθινοπώρου",

      regions:["Δεξαμενές του Μισισιπή","Λίμνη Κεντάκι","Minnesota natural lakes","Oklahoma timber reservoirs"]},

    { name:"Γατόψαρο καναλιού", slug: "channel-catfish", sci:"Ictalurus punctatus", env:"Freshwater",

      habitat:"Βαθιές τρύπες, εξωτερικές στροφές, σχισμή, ζεστές εισροές.",

      baits:"Κόψιμο δόλωμα, βρώμα δόλωμα, συκώτι κοτόπουλου, ζωντανό δόλωμα",

      season:"Καλοκαιρινές νύχτες? μετά από βροχές? χειμωνιάτικες βαθιές τρύπες",

      regions:["Ρεντ Ρίβερ (Βόρεια Ντακότα/Μινεσότα)","Σάντι Κούπερ (Νότια Καρολίνα)","Ποταμός Τρίνιτι (Τέξας)","Ο ποταμός Μιζούρι ρέει"]},

    { name:"Κοινός Κυπρίνος", slug: "common-carp", sci:"Cyprinus carpio", env:"Freshwater",

      habitat:"Ρηχές λάσπες, ζεστοί κόλποι, δίνες ποταμών.",

      baits:"Καλαμπόκι, μπάλες ζύμης, ψωμί, βραστά. μύγες (κυπρίνοι)",

      season:"Τέλη Άνοιξης-Φθινόπωρο (ψάρια όρασης σε επίπεδες)",

      regions:["Λιμάνια των Μεγάλων Λιμνών","Κανάλια/ποτάμια Ηνωμένου Βασιλείου + ΕΕ","Ύστερα νερά του ποταμού Μιζούρι","Αστικές λίμνες (ΗΠΑ)"]},



    // ===== Saltwater — Inshore/Coastal =====

    { name:"Red Drum (Κοκκινόψαρο)", slug: "red-drum-redfish", sci:"Sciaenops ocellatus", env:"Saltwater",

      habitat:"Έβαλα, στρείδια, διαμερίσματα, κοψίματα σερφ. κινούμενη παλίρροια.",

      baits:"Χρυσά κουτάλια, ουρές κουπιών + τζινγκς, φελλός + γαρίδες, κομμένο μπαρμπούνι",

      season:"Όλο το χρόνο. Φθινόπωρο τρέχει ταύρος? χειμωνιάτικες λίμνες",

      regions:["Louisiana marshes","Laguna Madre (TX)","Mosquito/Indian River (Φλόριντα)","Ρυάκια Τσάρλεστον (SC)"]},

    { name:"Spotted Seatrout", slug: "spotted-seatrout", sci:"Cynoscion nebulosus", env:"Saltwater",

      habitat:"Χλοοτάπητες, λακκούβες, γούρνες, φώτα αποβάθρας.",

      baits:"Μαλακά πλαστικά, topwater walk-the-dog, γαρίδες κάτω από φελλό",

      season:"Άνοιξη–Φθινόπωρο; χειμερινά βαθιά κανάλια",

      regions:["Τάμπα Μπέι (Φλόριντα)","Laguna Madre (TX)","Louisiana interior bays","Λιμνοθάλασσα Indian River (Φλόριντα)"]},

    { name:"Κοροϊδευτικός μορφασμός", slug: "snook", sci:"Centropomus undecimalis", env:"Saltwater",

      habitat:"Σημεία μαγκρόβιων δασών, γέφυρες, περάσματα· όχθες ρευμάτων.",

      baits:"Ουρές κουπιών, σκιές σπασμωδικών, ζωντανή καρφίτσα/γαρίδα, κορυφαίο νερό",

      season:"Καλοκαιρινές νύχτες· μεταβάσεις άνοιξης/φθινοπώρου",

      regions:["Παραλίες και κολπίσκοι στη Νότια Φλόριντα","Δέκα Χιλιάδες Νησιά (Φλόριντα)","Λιμνοθάλασσα Mosquito (Φλόριντα)","Εκβολές ποταμών του Ειρηνικού στην Κόστα Ρίκα"]},

    { name:"Είδος μεγάλου ιχθύος", slug: "tarpon", sci:"Megalops atlanticus", env:"Saltwater",

      habitat:"Παραλίες, κολπίσκοι, γέφυρες, κανάλια· κυματιστά κοπάδια ψαριών.",

      baits:"Ζωντανά μπαρμπούνια/καβούρια, μεγάλα κολυμπούνια, μύγες",

      season:"Μεταναστεύσεις άνοιξης-καλοκαιριού· νεαρά άτομα του φθινοπώρου σε ρυάκια",

      regions:["Μπόκα Γκράντε (Φλόριντα)","Ισλαμοράδα (Φλόριντα Κις)","Νότια ακτή του Πουέρτο Ρίκο","Γιουκατάν (Μεξικό)"]},

    { name:"Southern Flounder", slug: "southern-flounder", sci:"Paralichthys lethostigma", env:"Saltwater",

      habitat:"Άκρες καναλιών, αποχετεύσεις, σημεία. ενέδρα στο κάτω μέρος.",

      baits:"Ουρές κουπιών + τζόγκες, λασπόνερα, γαρίδες",

      season:"Φθινόπωρο τρέξιμο για να περάσει? ανοιξιάτικες αποχετεύσεις ελών",

      regions:["Γκάλβεστον + Σαμπίν (Τέξας)","Μόμπιλ Μπέι (Αλαμπάμα)","Πάμλικο Σάουντ (NC)","Περιοχή Τσάρλεστον (SC)"]},

    { name:"ιππόγλωσσα Καλιφόρνια", slug: "california-halibut", sci:"Paralichthys californicus", env:"Saltwater",

      habitat:"Αμμώδη διαμερίσματα κοντά σε δομή. λιμάνια? άκρες φύκια.",

      baits:"Σαρδέλα/γαύρος drift, swimbaits, bucktails",

      season:"Τέλη Άνοιξης-Καλοκαίρι κοντά στην ακτή. χειμερινά λιμάνια",

      regions:["Σάντα Μόνικα Μπέι (Καλιφόρνια)","Κόλπος Σαν Ντιέγκο (ΚΑ)","Μοντερέι Μπέι (Καλιφόρνια)","Νησιά της Μάγχης (CA)"]},

    { name:"Yellowtail Amberjack", slug: "yellowtail-amberjack", sci:"Seriola lalandi dorsalis", env:"Saltwater",

      habitat:"Άκρες φυκιών, ανοιχτοί ορυζώνες, βραχώδεις ψηλές περιοχές.",

      baits:"Ζωντανή σαρδέλα σε flyline, επιφανειακό σίδερο, yo-yo jigs",

      season:"Τέλη Άνοιξης–Φθινόπωρο (πιέσεις με ζεστό νερό)",

      regions:["Καταλίνα/Σαν Κλεμέντε (ΚΑ)","Γραμμές φυκιών Baja Norte","Νησί Σέδρος (Μεξικό)","Cortez/43 Fathom όχθες (CA)"]},

    { name:"Κραγιασμένο μπάσο άμμου", slug: "barred-sand-bass", sci:"Paralabrax nebulifer", env:"Saltwater",

      habitat:"Παραλίες, προβλήτες, κολπίσκοι, φύκια. παλίρροια/τρέχοντα άκρα.",

      baits:"Πλαστικά μαγιό σε κεφαλές, λωρίδες γαύρου, μικρά σίδερα",

      season:"Όλο το χρόνο. καλοκαιρινό δάγκωμα άμμου/δομής",

      regions:["Σάντα Μόνικα + Πενσυλβάνια (Καλιφόρνια)","Από το Ντάνα Πόιντ προς το φύκι του Όσιανσαϊντ (Καλιφόρνια)","Προβλήτες Mission + San Diego Bay (CA)"]},

    { name:"Λευκό Λαβράκι", slug: "white-seabass", sci:"Atractoscion nobilis", env:"Saltwater",

      habitat:"Καλαμάρια, καλαμάρια, παράκτιες ρίψεις. χαμηλό φωτισμό.",

      baits:"Ζωντανά καλαμάρια, κολύμβηση, χορευτικά με αργό ρυθμό",

      season:"Τέλη άνοιξης-αρχές καλοκαιριού (καλαμαράκια γεννούν)",

      regions:["Καλαμάρια Catalina (Καλιφόρνια)","Σάντα Μπάρμπαρα Κανάλι (Καλιφόρνια)","Νήσος Σαν Κλεμέντε (ΚΑ)"]},

    { name:"Lingcod", slug: "lingcod", sci:"Ophiodon elongatus", env:"Saltwater",

      habitat:"Βράχοι, προεξοχές, ύφαλοι. ισχυρή συγγένεια δομής.",

      baits:"Jigging metal, μεγάλα swimbaits, ολόκληρο δόλωμα",

      season:"Οι ανοιχτές εποχές ποικίλλουν. πρωταρχική άνοιξη",

      regions:["Ύφαλοι κοντά στην ακτή του Όρεγκον/Ουάσινγκτον","Μοντερέι/Κάρμελ Πίνακλς (Καλιφόρνια)","εξωτερική ακτή της Βρετανικής Κολομβίας"]},

    { name:"Λυθρίνι", slug: "red-snapper", sci:"Lutjanus campechanus", env:"Saltwater",

      habitat:"Υπεράκτιοι ύφαλοι, ναυάγια, εξέδρες· από το μέσο του νερού έως τον πυθμένα.",

      baits:"Κόψιμο δόλωμα, ζωντανή καρφίτσα, κάθετες σέλες",

      season:"Ρυθμιζόμενη· καλοκαιρινές εποχές του Κόλπου",

      regions:["Πλατφόρμες άντλησης πετρελαίου στον Κόλπο (Τέξας/Λουιζιάνα)","Ύφαλοι Panhandle (Φλόριντα)","Alabama artificial reefs"]},

    { name:"Γκαγκ Σφυρίδα", slug: "gag-grouper", sci:"Mycteroperca microlepis", env:"Saltwater",

      habitat:"Βραχώδεις προεξοχές, ασβεστολιθικός πυθμένας, ναυάγια· θηρευτές-ενέδρες.",

      baits:"Ζωντανή καρφίτσα, βύσματα συρτής, τζινγκς",

      season:"Φθινόπωρο-Χειμώνας κοντά στην ακτή (δροσερά μέτωπα)· ανοιχτά όλο το χρόνο",

      regions:["Υπεράκτιες προεξοχές στον κόλπο της Τάμπα (Φλόριντα)","Βράχοι Big Bend (Φλόριντα)","Ναυάγια στον Κόλπο (Φλόριντα/Αλαμπάμα)"]},

    { name:"Mahi-mahi (δελφίνι)", slug: "mahi-mahi-dolphinfish", sci:"Coryphaena hippurus", env:"Saltwater",

      habitat:"Offshore weedlines, floatsam, τρέχοντα άκρα.",

      baits:"Φτερά συρτή, balllyhoo, poppers, jigs",

      season:"Τέλη Άνοιξης-Φθινόπωρο (θερμά ρεύματα)",

      regions:["Η άκρη του Ρεύματος του Κόλπου της Φλόριντα","Εξωτερικές τράπεζες (NC)","Άκρες τάφρων στο Πουέρτο Ρίκο","Baja offshore paddies"]}

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

        ["env","ενδιαίτημα","δολώματα","εποχή","βάθος","ψευδώνυμο","img"].forEach(k=>{

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
