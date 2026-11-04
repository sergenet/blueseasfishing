/* Expanded catalogue: common and scientific names plus conservative group-level ecology.
   Existing records win; duplicate common or scientific names are excluded at runtime. */
(function () {
  const groups = [
    {
      env: 'Freshwater', habitat: 'البحيرات والأنهار والجداول الباردة والمعتدلة والأراضي الرطبة المتصلة بها',
      baits: 'تعتمد على الأنواع؛ الحشرات والديدان والأسماك الصغيرة والقشريات والذباب أو السحر الاصطناعي عندما يكون ذلك قانونيًا',
      season: 'يختلف ذلك باختلاف مستجمعات المياه واللوائح المحلية',
      fish: [
        ['ثعبان البحر الأمريكي','Anguilla rostrata','american-eel'],['ثعبان البحر الأوروبي','Anguilla anguilla','european-eel'],['ثعبان البحر الياباني','Anguilla japonica','japanese-eel'],
        ['سمكة المجداف الأمريكية','Polyodon spathula','american-paddlefish'],['سمك الحفش مجرفة الأنف','Scaphirhynchus platorynchus','shovelnose-sturgeon'],['سمك الحفش الشاحب','Scaphirhynchus albus','pallid-sturgeon'],
        ['سمك الحفش الأطلسي','Acipenser oxyrinchus','atlantic-sturgeon'],['سمك الحفش قصير الأنف','Acipenser brevirostrum','shortnose-sturgeon'],['سمك الحفش الخليج','Acipenser oxyrinchus desotoi','gulf-sturgeon'],
        ['البربوط','Lota lota','burbot'],['السمكة البيضاء المستديرة','Prosopium cylindraceum','round-whitefish'],['سيسكو','Coregonus artedi','cisco'],['القطب الشمالي غرايلينغ','Thymallus arcticus','arctic-grayling'],
        ['سملت الأمريكية','Osmerus mordax','american-smelt'],['موني','Hiodon tergisus','mooneye'],['العين الذهبية','Hiodon alosoides','goldeye'],['سكيبجاك الرنجة','Alosa chrysochloris','skipjack-herring'],
        ['جيزارد شاد','Dorosoma cepedianum','gizzard-shad'],['ثريدفين شاد','Dorosoma petenense','threadfin-shad'],['ألويفي','Alosa pseudoharengus','alewife'],
        ['كريك تشوب','Semotilus atromaculatus','creek-chub'],['سمكة فالفيش','Semotilus corporalis','fallfish'],['شاينر الذهبي','Notemigonus crysoleucas','golden-shiner'],
        ['سمكة كبيرة الرأس','Pimephales promelas','fathead-minnow'],['الزمرد شاينر','Notropis atherinoides','emerald-shiner'],['شاينر مشترك','Luxilus cornutus','common-shiner'],
        ['نهر تشوب','Nocomis micropogon','river-chub'],['هورنيهيد تشوب','Nocomis biguttatus','hornyhead-chub'],['الداس ذو الأنف الطويل','Rhinichthys cataractae','longnose-dace'],
        ['الداس الأسود','Rhinichthys atratulus','blacknose-dace'],['ستونرولر المركزية','Campostoma anomalum','central-stoneroller'],['شمال Redbelly الداس','Chrosomus eos','northern-redbelly-dace'],
        ['مصاصة بيضاء','Catostomus commersonii','white-sucker'],['مصاصة الأنف الطويل','Catostomus catostomus','longnose-sucker'],['الارتداد','Carpiodes cyprinus','quillback'],
        ['نهر كاربسوكر','Carpiodes carpio','river-carpsucker'],['مصاصة مرقطة','Minytrema melanops','spotted-sucker'],['هوجوكر الشمالية','Hypentelium nigricans','northern-hogsucker'],
        ['الحصان الأحمر الأسود','Moxostoma duquesnei','black-redhorse'],['الحصان الأحمر الذهبي','Moxostoma erythrurum','golden-redhorse'],['قصير الرأس ريدهورس','Moxostoma macrolepidotum','shorthead-redhorse'],
        ['الحصان الأحمر الأكبر','Moxostoma valenciennesi','greater-redhorse'],['الحصان الأحمر الفضي','Moxostoma anisurum','silver-redhorse'],['مصاصة زرقاء','Cycleptus elongatus','blue-sucker']
      ]
    },
    {
      env: 'Freshwater', habitat: 'البحيرات الدافئة، والبرك، والأنهار البطيئة الجريان، والسهول الفيضية، والمياه الراكدة المغطاة بالنباتات',
      baits: 'تعتمد على الأنواع؛ الديدان أو الحشرات أو الأسماك الصغيرة أو القشريات أو الطعوم المحضرة أو الطعوم الصغيرة',
      season: 'غالباً ما تكون أكثر نشاطاً في الأشهر الدافئة؛ تحقق من القواعد المحلية.',
      fish: [
        ['سمكة الشمس الطويلة','Lepomis megalotis','longear-sunfish'],['سمكة الشمس البرتقالية','Lepomis humilis','orangespotted-sunfish'],['سمكة الشمس ذات الصدر الأحمر','Lepomis auritus','redbreast-sunfish'],
        ['سمكة شمس الدولار','Lepomis marginatus','dollar-sunfish'],['بانتام صنفيش','Lepomis symmetricus','bantam-sunfish'],['سمكة شمس الطين','Acantharchus pomotis','mud-sunfish'],
        ['طيارة','Centrarchus macropterus','flier'],['الظل باس','Ambloplites ariommus','shadow-bass'],['سكرامنتو بيرش','Archoplites interruptus','sacramento-perch'],
        ['الثور الأصفر','Ameiurus natalis','yellow-bullhead'],['براون بولهيد','Ameiurus nebulosus','brown-bullhead'],['سمك السلور الأبيض','Ameiurus catus','white-catfish'],
        ['ستونكات','Noturus flavus','stonecat'],['الشرغوف مادوم','Noturus gyrinus','tadpole-madtom'],['الحلزون الثور','Ameiurus brunneus','snail-bullhead'],
        ['جثم القراصنة','Aphredoderus sayanus','pirate-perch'],['المستنقع','Chologaster cornuta','swampfish'],['وسط مدينة مودميناو','Umbra limi','central-mudminnow'],
        ['الأولمبية الطينية','Novumbra hubbsi','olympic-mudminnow'],['بيكريل الأمريكي','Esox americanus','american-pickerel'],['ألاسكا بلاكفيش','Dallia pectoralis','alaska-blackfish'],
        ['بروك سيلفرسايد','Labidesthes sicculus','brook-silverside'],['سيلفرسايد الداخلية','Menidia beryllina','inland-silverside'],['البعوض','Gambusia affinis','mosquitofish'],
        ['سايلفين مولي','Poecilia latipinna','sailfin-molly'],['شيبشيد المنوة','Cyprinodon variegatus','sheepshead-minnow'],['مياه الأمطار كيليفيش','Lucania parva','rainwater-killifish'],
        ['موميشوغ','Fundulus heteroclitus','mummichog'],['النطاقات كيليفيش','Fundulus diaphanus','banded-killifish'],['بلوفين كيليفيش','Lucania goodei','bluefin-killifish'],
        ['لوبيرش','Percina caprodes','logperch'],['جوني دارتر','Etheostoma nigrum','johnny-darter'],['قوس قزح دارتر','Etheostoma caeruleum','rainbow-darter'],
        ['ايوا دارتر','Etheostoma exile','iowa-darter'],['فانتيل دارتر','Etheostoma flabellare','fantail-darter'],['جرينسايد دارتر','Etheostoma blennioides','greenside-darter'],
        ['بلاكسايد دارتر','Percina maculata','blackside-darter'],['قناة دارتر','Percina copelandi','channel-darter'],['يلوفين شاينر','Notropis lutipinnis','yellowfin-shiner'],
        ['أوزارك أسماك','Notropis nubilus','ozark-minnow'],['روزيفيس شاينر','Notropis rubellus','rosyface-shiner'],['سبوتفين شاينر','Cyprinella spiloptera','spotfin-shiner']
      ]
    },
    {
      env: 'Freshwater', habitat: 'الأنهار والبحيرات والخزانات والموائل الفيضية الاستوائية وشبه الاستوائية',
      baits: 'تعتمد على الأنواع؛ المواد النباتية أو الحشرات أو القشريات أو الأسماك الصغيرة أو طعوم العجين أو السحر الاصطناعي',
      season: 'يختلف ذلك باختلاف المناخ ومستوى المياه واللوائح المحلية',
      fish: [
        ['البلطي النيلي','Oreochromis niloticus','nile-tilapia'],['البلطي الأزرق','Oreochromis aureus','blue-tilapia'],['موزمبيق البلطي','Oreochromis mossambicus','mozambique-tilapia'],
        ['البلطي الأحمر','Coptodon zillii','redbelly-tilapia'],['أوسكار','Astronotus ocellatus','oscar'],['الطاووس باس','Cichla ocellaris','peacock-bass'],
        ['فراشة الطاووس باس','Cichla orinocensis','butterfly-peacock-bass'],['جاكوار سيشليد','Parachromis managuensis','jaguar-cichlid'],['ميداس سيشليد','Amphilophus citrinellus','midas-cichlid'],
        ['مايان سيشليد','Mayaheros urophthalmus','mayan-cichlid'],['أكارا السوداء','Cichlasoma bimaculatum','black-acara'],['أكارا الزرقاء','Andinoacara pulcher','blue-acara'],
        ['رمي القرص','Symphysodon discus','discus'],['ملائكية المياه العذبة','Pterophyllum scalare','freshwater-angelfish'],['المدان سيشليد','Amatitlania nigrofasciata','convict-cichlid'],
        ['أرابيما','Arapaima gigas','arapaima'],['الأروانا الفضية','Osteoglossum bicirrhosum','silver-arowana'],['سمكة المهرج','Chitala ornata','clown-knifefish'],
        ['الجورامي العملاق','Osphronemus goramy','giant-gourami'],['تقبيل جورامي','Helostoma temminckii','kissing-gourami'],['جلد الثعبان جورامي','Trichopodus pectoralis','snakeskin-gourami'],
        ['رأس الأفعى العملاق','Channa micropeltes','giant-snakehead'],['رأس الأفعى الشمالية','Channa argus','northern-snakehead'],['رأس الأفعى مخطط','Channa striata','striped-snakehead'],
        ['سمك السلور المشي','Clarias batrachus','walking-catfish'],['سمك السلور شمال أفريقيا','Clarias gariepinus','north-african-catfish'],['سمك السلور ذو الذيل الأحمر','Phractocephalus hemioliopterus','redtail-catfish'],
        ['سمك السلور النمر مجرفة الأنف','Pseudoplatystoma fasciatum','tiger-shovelnose-catfish'],['سمك السلور ريبسو','Oxydoras niger','ripsaw-catfish'],['بيكتوس سمك السلور','Pimelodus pictus','pictus-catfish'],
        ['قزحي الألوان سمك السلور القرش','Pangasianodon hypophthalmus','iridescent-shark-catfish'],['ميكونج سمك السلور العملاق','Pangasianodon gigas','mekong-giant-catfish'],['سمك السلور ويلس','Silurus glanis','wels-catfish'],
        ['تامباكي','Colossoma macropomum','tambaqui'],['باكو','Piaractus mesopotamicus','pacu'],['سمكة البيرانا ذات البطن الحمراء','Pygocentrus nattereri','red-bellied-piranha'],
        ['بايارا','Hydrolycus scomberoides','payara'],['دورادو الذهبي','Salminus brasiliensis','golden-dorado'],['سمكة النمر','Hydrocynus vittatus','tigerfish'],
        ['جالوت تايجرفيش','Hydrocynus goliath','goliath-tigerfish'],['العملاق بارب','Catlocarpio siamensis','giant-barb'],['روهو','Labeo rohita','rohu']
      ]
    },
    {
      env: 'Saltwater', habitat: 'الشعاب المرجانية، والشعاب الصخرية، والبحيرات الشاطئية، والهياكل الساحلية القريبة',
      baits: 'تعتمد على الأنواع؛ الروبيان، وسرطان البحر، والرخويات، والأسماك الصغيرة، والرقص، والمقابس، أو الذباب',
      season: 'يختلف ذلك باختلاف المنطقة ودورة التكاثر ولوائح الصيد',
      fish: [
        ['ناسو الهامور','Epinephelus striatus','nassau-grouper'],['هفوة الهامور','Mycteroperca microlepis','gag-grouper'],['الهامور الأسود','Mycteroperca bonaci','black-grouper'],
        ['الهامور الأحمر','Epinephelus morio','red-grouper'],['وارسو الهامور','Hyporthodus nigritus','warsaw-grouper'],['جالوت الهامور','Epinephelus itajara','goliath-grouper'],
        ['سكامب الهامور','Mycteroperca phenax','scamp-grouper'],['الهامور الثلجي','Hyporthodus niveatus','snowy-grouper'],['الهامور الأصفر','Hyporthodus flavolimbatus','yellowedge-grouper'],
        ['لحم الضأن النهاش','Lutjanus analis','mutton-snapper'],['المانجروف سنابر','Lutjanus griseus','mangrove-snapper'],['لين سنابر','Lutjanus synagris','lane-snapper'],
        ['كوبرا سنابر','Lutjanus cyanopterus','cubera-snapper'],['نهاش الكلب','Lutjanus jocu','dog-snapper'],['نهاش الحرير','Lutjanus vivanus','silk-snapper'],
        ['الزنجفر النهاش','Rhomboplites aurorubens','vermilion-snapper'],['مدير المدرسة سنابر','Lutjanus apodus','schoolmaster-snapper'],['الماهوجني سنابر','Lutjanus mahogoni','mahogany-snapper'],
        ['الملكة تريجرفيش','Balistes vetula','queen-triggerfish'],['سمكة الزناد الرمادية','Balistes capriscus','gray-triggerfish'],['سمكة الزناد المحيطية','Canthidermis sufflamen','ocean-triggerfish'],
        ['سمكة الزناد ذات الذيل الأحمر','Xanthichthys mento','redtail-triggerfish'],['سمكة الزناد تيتان','Balistoides viridescens','titan-triggerfish'],['سمكة بيكاسو الزناد','Rhinecanthus aculeatus','picasso-triggerfish'],
        ['سمكة الببغاء المتوقفة','Sparisoma viride','stoplight-parrotfish'],['سمكة الببغاء قوس قزح','Scarus guacamaia','rainbow-parrotfish'],['ملكة الببغاء','Scarus vetula','queen-parrotfish'],
        ['سمكة الببغاء منتصف الليل','Scarus coelestinus','midnight-parrotfish'],['سمكة الببغاء ذات الرأس الكبير','Bolbometopon muricatum','bumphead-parrotfish'],['الأميرة الببغاء','Scarus taeniopterus','princess-parrotfish'],
        ['خنزير البحر','Lachnolaimus maximus','hogfish'],['كاليفورنيا شيبهيد','Semicossyphus pulcher','california-sheephead'],['بالان وراس','Labrus bergylta','ballan-wrasse'],
        ['الوقواق اللبروس','Labrus mixtus','cuckoo-wrasse'],['بلوستريك منظف اللبروس','Labroides dimidiatus','bluestreak-cleaner-wrasse'],['نابليون وراس','Cheilinus undulatus','napoleon-wrasse'],
        ['السمكة الملائكية الفرنسية','Pomacanthus paru','french-angelfish'],['ملكة الملائكة','Holacanthus ciliaris','queen-angelfish'],['السمك الملائكي الرمادي','Pomacanthus arcuatus','gray-angelfish'],
        ['الإمبراطور أنجيلفيش','Pomacanthus imperator','emperor-angelfish'],['جمال الصخور','Holacanthus tricolor','rock-beauty'],['سمكة الفراشة النحاسية','Chelmon rostratus','copperband-butterflyfish']
      ]
    },
    {
      env: 'Saltwater', habitat: 'الخلجان الساحلية، ومصبات الأنهار، والشواطئ، والأرصفة البحرية، والشعاب المرجانية، ومياه الجرف القاري',
      baits: 'تعتمد على الأنواع؛ أسماك الطعم أو الحبار أو الروبيان أو السرطانات أو الديدان أو الرقصات أو الملاعق أو المقابس أو الذباب',
      season: 'يختلف ذلك باختلاف الهجرة ودرجة الحرارة والمنطقة واللوائح التنظيمية',
      fish: [
        ['الأطلسي تاربون','Megalops atlanticus','atlantic-tarpon'],['منطقة تاربون في المحيطين الهندي والهادئ','Megalops cyprinoides','indo-pacific-tarpon'],['سنوك المشترك','Centropomus undecimalis','common-snook'],
        ['فات سنوك','Centropomus parallelus','fat-snook'],['Swordspine سنوك','Centropomus ensiferus','swordspine-snook'],['تصريح الأطلسي','Trachinotus falcatus','atlantic-permit'],
        ['فلوريدا بومبانو','Trachinotus carolinus','florida-pompano'],['بالوميتا','Trachinotus goodei','palometa'],['السريولا الكبرى','Seriola dumerili','greater-amberjack'],
        ['السريولا الصغرى','Seriola fasciata','lesser-amberjack'],['ألماكو جاك','Seriola rivoliana','almaco-jack'],['كريفال جاك','Caranx hippos','crevalle-jack'],
        ['جاك عين الحصان','Caranx latus','horse-eye-jack'],['العداء الأزرق','Caranx crysos','blue-runner'],['بومبانو الأفريقي','Alectis ciliaris','african-pompano'],
        ['نظرة عامة','Selene vomer','lookdown'],['سمكة القمر الأطلسية','Selene setapinnis','atlantic-moonfish'],['الخنفساء','Elops saurus','ladyfish'],
        ['بونفيش','Albula vulpes','bonefish'],['الأطلسي ثريدفين','Polydactylus octonemus','atlantic-threadfin'],['ثلاثي الذيل','Lobotes surinamensis','tripletail'],
        ['كوبيا','Rachycentron canadum','cobia'],['سمكة سبادفيش الأطلسية','Chaetodipterus faber','atlantic-spadefish'],['سمكة سبادفيش المحيط الهادئ','Chaetodipterus zonatus','pacific-spadefish'],
        ['سمكة الإبرة الأطلسية','Strongylura marina','atlantic-needlefish'],['كلب الصيد','Tylosurus crocodilus','houndfish'],['باليهو','Hemiramphus brasiliensis','ballyhoo'],
        ['السمكة الطائرة الأطلسية','Cheilopogon melanurus','atlantic-flyingfish'],['كاليفورنيا فلاينجفيش','Cheilopogon pinnatibarbatus californicus','california-flyingfish'],['البوري مخطط','Mugil cephalus','striped-mullet'],
        ['البوري الأبيض','Mugil curema','white-mullet'],['منهادن الأطلسي','Brevoortia tyrannus','atlantic-menhaden'],['خليج منهادن','Brevoortia patronus','gulf-menhaden'],
        ['سردين المحيط الهادئ','Sardinops sagax','pacific-sardine'],['بيلشارد الأوروبي','Sardina pilchardus','european-pilchard'],['الأنشوجة الشمالية','Engraulis mordax','northern-anchovy'],
        ['الرنجة الأطلسية','Clupea harengus','atlantic-herring'],['الرنجة المحيط الهادئ','Clupea pallasii','pacific-herring'],['كابلين','Mallotus villosus','capelin'],
        ['الماكريل الأطلسي','Scomber scombrus','atlantic-mackerel'],['إسقمري تشوب المحيط الهادئ','Scomber japonicus','pacific-chub-mackerel'],['جاك ماكريل','Trachurus symmetricus','jack-mackerel']
      ]
    },
    {
      env: 'Saltwater', habitat: 'المحيط المفتوح، والضفاف البحرية، وحواف التيارات، والجبال البحرية، والمياه السطحية العميقة',
      baits: 'تعتمد على الأنواع؛ السحر المتصيد، أسماك الطعم الحية أو الميتة، الحبار، الرقص، البوبرس، أو الذباب',
      season: 'تتميز بقدرة عالية على الهجرة؛ ويختلف توافرها باختلاف التيارات ودرجة الحرارة والتنظيم.',
      fish: [
        ['سمكة التونة ذات الزعانف السوداء','Thunnus atlanticus','blackfin-tuna'],['سمكة التونة طويلة الذيل','Thunnus tonggol','longtail-tuna'],['سمكة التونة ذات الزعانف الزرقاء الجنوبية','Thunnus maccoyii','southern-bluefin-tuna'],
        ['الأطلسي الأزرق مارلن','Makaira nigricans','atlantic-blue-marlin'],['بلاك مارلن','Istiompax indica','black-marlin'],['وايت مارلن','Kajikia albida','white-marlin'],
        ['سمكة الرمح قصيرة المنقار','Tetrapturus angustirostris','shortbill-spearfish'],['سمكة الرمح ذات المنقار الطويل','Tetrapturus pfluegeri','longbill-spearfish'],['سمكة البحر الأبيض المتوسط','Tetrapturus belone','mediterranean-spearfish'],
        ['سمكة أبو شراع في المحيطين الهندي والهادئ','Istiophorus platypterus','indo-pacific-sailfish'],['باراكودا العظيمة','Sphyraena barracuda','great-barracuda'],['باراكودا المحيط الهادئ','Sphyraena argentea','pacific-barracuda'],
        ['اجتماعيون','Lepidocybium flavobrunneum','escolar'],['السمك الزيتي','Ruvettus pretiosus','oilfish'],['أوبا','Lampris guttatus','opah'],
        ['سمكة شمس المحيط','Mola mola','ocean-sunfish'],['شاربتيل مولا','Masturus lanceolatus','sharptail-mola'],['سمكة الشمس النحيلة','Ranzania laevis','slender-sunfish'],
        ['القرش الأزرق','Prionace glauca','blue-shark'],['شورتفين ماكو','Isurus oxyrinchus','shortfin-mako'],['لونجفين ماكو','Isurus paucus','longfin-mako'],
        ['بوربيجل','Lamna nasus','porbeagle'],['سمك السلمون القرش','Lamna ditropis','salmon-shark'],['القرش المحيطي ذو الطرف الأبيض','Carcharhinus longimanus','oceanic-whitetip-shark'],
        ['قرش حريري','Carcharhinus falciformis','silky-shark'],['الدراس الكبير','Alopias superciliosus','bigeye-thresher'],['الدراس المشترك','Alopias vulpinus','common-thresher'],
        ['الدراس البحري','Alopias pelagicus','pelagic-thresher'],['قرش الحوت','Rhincodon typus','whale-shark'],['القرش المتشمس','Cetorhinus maximus','basking-shark'],
        ['مانتا راي','Mobula birostris','manta-ray'],['شعاع الشيطان التشيلي','Mobula tarapacana','chilean-devil-ray'],['اللادغة البحرية','Pteroplatytrygon violacea','pelagic-stingray'],
        ['الأطلسي بومفريت','Brama brama','atlantic-pomfret'],['المحيط الهادئ بومفريت','Brama japonica','pacific-pomfret'],['لوفار','Luvarus imperialis','louvar']
      ]
    },
    {
      env: 'Saltwater', habitat: 'القيعان الصخرية، والشعاب المرجانية، والأعشاب البحرية، وحطام السفن، وموائل الجرف القاري أو المنحدر القاري',
      baits: 'تعتمد على الأنواع؛ الحبار أو شرائح السمك أو القشريات أو الحفارات السفلية أو الرقصات أو المواد البلاستيكية الناعمة',
      season: 'تختلف مستويات المياه ومواسم الصيد المفتوحة؛ تحقق من القواعد الإقليمية الحالية.',
      fish: [
        ['سمكة الصخر الصفراء','Sebastes flavidus','yellowtail-rockfish'],['أرملة روكفيش','Sebastes entomelas','widow-rockfish'],['بلاكجيل روكفيش','Sebastes melanostomus','blackgill-rockfish'],
        ['سمكة الصخور المظلمة','Sebastes crameri','darkblotched-rockfish'],['روزي روكفيش','Sebastes rosaceus','rosy-rockfish'],['سمكة النمر الصخرية','Sebastes nigrocinctus','tiger-rockfish'],
        ['الإبلاغ عن روكفيش','Sebastes rubrivinctus','flag-rockfish'],['تريفيش','Sebastes serriceps','treefish'],['عشب البحر روكفيش','Sebastes atrovirens','kelp-rockfish'],
        ['سمكة العشب الصخرية','Sebastes rastrelliger','grass-rockfish'],['بنك روكفيش','Sebastes rufus','bank-rockfish'],['تشيليببر روكفيش','Sebastes goodei','chilipepper-rockfish'],
        ['كود البقر','Sebastes levis','cowcod'],['جثم المحيط الهادئ','Sebastes alutus','pacific-ocean-perch'],['سمكة الصخور القصيرة','Sebastes borealis','shortraker-rockfish'],
        ['سمكة الصخور الصفراء','Sebastes reedi','yellowmouth-rockfish'],['سيلفر جراي روكفيش','Sebastes brevispinis','silvergray-rockfish'],['سمكة الصخور المخططة','Sebastes saxicola','stripetail-rockfish'],
        ['بيترال سول','Eopsetta jordani','petrale-sole'],['دوفر سول','Microstomus pacificus','dover-sole'],['الإنجليزية سول','Parophrys vetulus','english-sole'],
        ['ريكس سول','Glyptocephalus zachirus','rex-sole'],['روك سول','Lepidopsetta bilineata','rock-sole'],['السمك المفلطح النجمي','Platichthys stellatus','starry-flounder'],
        ['السمك المفلطح ذو الأسنان السهمية','Atheresthes stomias','arrowtooth-flounder'],['جرينلاند الهلبوت','Reinhardtius hippoglossoides','greenland-halibut'],['بليس الأمريكية','Hippoglossoides platessoides','american-plaice'],
        ['السمك المفلطح ذو الذيل الأصفر','Limanda ferruginea','yellowtail-flounder'],['السمك المفلطح الشتاء','Pseudopleuronectes americanus','winter-flounder'],['الساحرة المفلطحة','Glyptocephalus cynoglossus','witch-flounder'],
        ['ريد هاك','Urophycis chuss','red-hake'],['وايت هيك','Urophycis tenuis','white-hake'],['هاك الفضة','Merluccius bilinearis','silver-hake'],
        ['هاك المحيط الهادئ','Merluccius productus','pacific-hake'],['بلو لينغ','Molva dypterygia','blue-ling'],['كوسك','Brosme brosme','cusk']
      ]
    },
    {
      env: 'Saltwater', habitat: 'تتنوع بيئات هذه الكائنات حسب النوع، وتشمل الجرف الساحلي، والشعاب المرجانية، والرمال، والطين، والأعشاب البحرية، أو مصبات الأنهار.',
      baits: 'تعتمد على الأنواع؛ القشريات، الرخويات، الديدان، الأسماك الصغيرة، الطعم المقطوع، أو السحر الاصطناعي',
      season: 'يختلف ذلك باختلاف المنطقة واللوائح',
      fish: [
        ['الأطلسي وولففيش','Anarhichas lupus','atlantic-wolffish'],['رصدت وولففيش','Anarhichas minor','spotted-wolffish'],['المحيط العبوس','Zoarces americanus','ocean-pout'],
        ['سمكة لامبفيش الأطلسية','Cyclopterus lumpus','atlantic-lumpfish'],['المحيط الهادئ شوكي لومبسوكر','Eumicrotremus orbis','pacific-spiny-lumpsucker'],['سكالبين','Myoxocephalus scorpius','sculpin'],
        ['المحيط الهادئ ستاغورن سكالبين','Leptocottus armatus','pacific-staghorn-sculpin'],['سكالبين ذو القرون الطويلة','Myoxocephalus octodecemspinosus','longhorn-sculpin'],['غراب البحر','Hemitripterus americanus','sea-raven'],
        ['صوري الأطلسي','Scomberesox saurus','atlantic-saury'],['صوري المحيط الهادئ','Cololabis saira','pacific-saury'],['الرمال لانس','Ammodytes americanus','sand-lance'],
        ['رمال المحيط الهادئ','Ammodytes hexapterus','pacific-sand-lance'],['سمك القرميد','Lopholatilus chamaeleonticeps','tilefish'],['سمكة القرميد الزرقاء','Caulolatilus microps','blueline-tilefish'],
        ['سمكة القرميد الذهبية','Lopholatilus chamaeleonticeps','golden-tilefish'],['البخاخ الشمالي','Sphoeroides maculatus','northern-puffer'],['البخاخ الجنوبي','Sphoeroides nephelus','southern-puffer'],
        ['البخاخ متقلب','Sphoeroides testudineus','checkered-puffer'],['سمكة النيص','Diodon hystrix','porcupinefish'],['سمكة البالون','Diodon holocanthus','balloonfish'],
        ['سمك الجذع السلس','Lactophrys triqueter','smooth-trunkfish'],['سمكة البقر المخربشة','Acanthostracion quadricornis','scrawled-cowfish'],['سمكة الجذع المرقطة','Lactophrys bicaudalis','spotted-trunkfish'],
        ['ريمورا','Remora remora','remora'],['مصاص القرش','Echeneis naucrates','sharksucker'],['أسماك المحيط الأطلسي','Trichiurus lepturus','atlantic-cutlassfish'],
        ['السمكة الشريطية','Trachipterus arcticus','ribbonfish'],['ملك السلمون','Trachipterus altivelis','king-of-the-salmon'],['سمك المجداف','Regalecus glesne','oarfish'],
        ['مراقب النجوم الأطلسي','Uranoscopus scaber','atlantic-stargazer'],['مراقب النجوم الشمالية','Astroscopus guttatus','northern-stargazer'],['سمكة القرميد الرملية','Malacanthus plumieri','sand-tilefish'],
        ['سمكة السحلية الأطلسية','Synodus saurus','atlantic-lizardfish'],['سمكة السحلية البرية','Synodus foetens','inshore-lizardfish'],['ريف كروكر','Ophioscion punctatissimus','reef-croaker']
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
  try { document.dispatchEvent(new Event('bsf-ديسيبل المخصب')); } catch (_) {}
})();
