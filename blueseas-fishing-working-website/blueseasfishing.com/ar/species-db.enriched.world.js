/* BlueSeas — World enrichment pack (multiregion)

   Safe merge: fills missing fields; adds new species if not present.

   Fields: name, sci, env, habitat, baits, season, regions, depth?, alias?, img?

*/

(function(){

  const ENRICHED = [

    // ===== North America — Freshwater (adds or fills) =====

    {name:"بحيرة تراوت", slug: "lake-trout", sci:"Salvelinus namaycush", env:"Freshwater",

     habitat:"بحيرات باردة عميقة أحواض البحيرة الرئيسية، الحدبات، النقاط.",

     baits:"أنابيب القفز، طُعم السباحة، الملاعق، الطُعم الميت",

     season:"موسم الجليد عميق؛ ربيع ضحل. الخط الحراري الصيفي",

     regions:["البحيرات العظمى (ميشيغان/أونتاريو)", "المضيق المشتعل (UT/WY)", "بحيرات درع أونتاريو", "بحيرة تاهو (كاليفورنيا/نيفادا)"]},



    {name:"سلمون كوكاني", slug: "kokanee-salmon", sci:"Oncorhynchus nerka (مُحاط باليابسة)", env:"Freshwater",

     habitat:"أسماك السطح، تتغذى على الأحواض العميقة؛ الخط الحراري الصيفي.",

     baits:"المراوغ + الهوتشي / الذرة، ملاعق صغيرة",

     season:"الربيع والصيف",

     regions:["المضيق المشتعل (UT/WY)", "والووا (أوريغون)", "ستامبيد (كاليفورنيا)", "بحيرات كولومبيا البريطانية الداخلية"]},



    {name:"سمك السلمون السوكي", slug: "sockeye-salmon", sci:"Oncorhynchus nerka", env:"Freshwater",

     habitat:"الأنهار + البحيرات أثناء الجري. منافذ البحيرة.",

     baits:"الذباب (متناثر على شكل سمكة عظمية) وملاعق صغيرة",

     season:"Summer runs",

     regions:["خليج بريستول (ألاسكا)", "نظام فريزر (كولومبيا البريطانية)"]},



    {name:"السلمون الوردي", slug: "pink-salmon", sci:"Oncorhynchus gorbuscha", env:"Freshwater",

     habitat:"المد والجزر إلى الأنهار المنخفضة. ممرات السفر بالقرب من الشاطئ.",

     baits:"ملاعق صغيرة، المغازل، الرقص",

     season:"جولات الصيف الفردية (العديد من المناطق)",

     regions:["بوجيه ساوند (واشنطن)", "جنوب شرق ألاسكا", "أنهار ساحل كولومبيا البريطانية"]},



    {name:"سمك السلمون", slug: "chum-salmon", sci:"Oncorhynchus keta", env:"Freshwater",

     habitat:"الأنهار المنخفضة، ومياه المد والجزر.",

     baits:"الرقص، المغازل، الذباب المبهرج",

     season:"Late fall",

     regions:["جنوب شرق ألاسكا", "بوجيه ساوند (واشنطن)", "أنهار كولومبيا البريطانية"]},



    {name:"تراوت الثور", slug: "bull-trout", sci:"Salvelinus confluentus", env:"Freshwater",

     habitat:"أنظمة أنهار باردة ومتصلة؛ مهاجرة؛ برك عميقة.",

     baits:"اللافتات الكبيرة، سويمبيتس، ملاعق",

     season:"الربيع - الخريف (حيثما يكون مفتوحاً)",

     regions:["أنهار ألبرتا/كولومبيا البريطانية", "أنظمة أيداهو/مونتانا"]},



    {name:"القطب الشمالي غرايلينغ", slug: "arctic-grayling", sci:"Thymallus arcticus", env:"Freshwater",

     habitat:"الأنهار/البحيرات الباردة والواضحة؛ بنادق وحمامات.",

     baits:"الذباب الجاف، المغازل الصغيرة، الملاعق الصغيرة",

     season:"الصيف - أوائل الخريف",

     regions:["Alaska interior", "الأقاليم الشمالية الغربية/يوكون", "Montana high country"]},



    {name:"الكرابي الأبيض", slug: "white-crappie", sci:"Pomoxis annularis", env:"Freshwater",

     habitat:"فرشاة/خشب واقف؛ الخزانات الملطخة.",

     baits:"الرقص الصغيرة، البلم، شفرات",

     season:"مرحلة ما قبل التكاثر في أواخر الشتاء؛ تفرخ الربيع. مدارس الخريف",

     regions:["Mississippi reservoirs", "Oklahoma lakes", "بحيرة كنتاكي"]},



    {name:"جثم أصفر", slug: "yellow-perch", sci:"Perca flavescens", env:"Freshwater",

     habitat:"حواف الأعشاب، المسطحات متوسطة العمق، مدارس الحوض.",

     baits:"الرقص الصغيرة والملاعق والبلم",

     season:"على مدار السنة؛ الجليد الرئيسي والربيع/الخريف",

     regions:["بحيرات الغرب الأوسط العلوي", "بحيرة سيمكو (أونتاريو)"]},



    {name:"سمك السلور الأزرق", slug: "blue-catfish", sci:"Ictalurus furcatus", env:"Freshwater",

     habitat:"الأنهار الكبيرة حواف القناة السدود.",

     baits:"قطع الشاد، الوثب، الطعم الحي",

     season:"لدغة ليلة الصيف. ثقوب عميقة في الشتاء",

     regions:["نهر جيمس (فرجينيا)", "نهر المسيسيبي", "سانتي كوبر (SC)"]},



    {name:"سمك السلور فلاتههيد", slug: "flathead-catfish", sci:"Pylodictis olivaris", env:"Freshwater",

     habitat:"قطع الأشجار، والثقوب العميقة، والانحناءات الخارجية.",

     baits:"يعيش الخيشوم/شاد؛ الطعوم النهرية الكبيرة",

     season:"الأشهر الدافئة (ليلا)؛ سقوط النهار في التيار",

     regions:["خزانات/أنهار كانساس", "نهر أوهايو", "قنوات أريزونا (تم إدخالها)"]},



    {name:"التمساح جار", slug: "alligator-gar", sci:"Atractosteus spatula", env:"Freshwater",

     habitat:"المياه النائية، بايوس، الأنهار البطيئة.",

     baits:"الطعم الحي/المقطع؛ سحر الحبل (تشابك الأسنان)",

     season:"Warm months",

     regions:["نهر ترينيتي (تكساس)", "مستنقعات ساحل تكساس/لوس أنجلوس"]},



    {name:"سلسلة بيكريل", slug: "chain-pickerel", sci:"Esox niger", env:"Freshwater",

     habitat:"الخلجان الأعشاب والمياه النائية.",

     baits:"Spinnerbaits، ملاعق، Jerkbaits",

     season:"الربيع والخريف. الشتاء في الجنوب",

     regions:["برك/بحيرات جنوب شرق الولايات المتحدة", "الجداول المدية في منتصف المحيط الأطلسي"]},



    // ===== NA — Inshore/Coastal =====

    {name:"طبل أسود", slug: "black-drum", sci:"Pogonias cromis", env:"Saltwater",

     habitat:"قضبان المحار، والقنوات، وقطع الأمواج؛ الأرصفة البحرية.",

     baits:"سرطان البحر، الروبيان، قطع الطعم؛ الرقص",

     season:"على مدار السنة؛ تشغيل طبل الربيع الكبير",

     regions:["لاجونا مادري (TX)", "Louisiana marshes", "بحيرة البعوض (فلوريدا)", "البنوك الخارجية (NC)"]},



    {name:"شيبشيد", slug: "sheepshead", sci:"Archosargus probatocephalus", env:"Saltwater",

     habitat:"الدعائم والأرصفة البحرية وأسرّة المحار.",

     baits:"سرطان البحر، الجمبري، البرنقيل",

     season:"ذروة أواخر الشتاء والربيع",

     regions:["جسور/مداخل فلوريدا", "Louisiana marshes", "أرصفة تكساس"]},



    {name:"باس البحر الأسود", slug: "black-sea-bass", sci:"Centropristis striata", env:"Saltwater",

     habitat:"حطام السفن / الشعاب المرجانية والحواف.",

     baits:"الرقص، شرائح الحبار، المحار",

     season:"الربيع-الخريف (يتغير العمق مع درجة الحرارة)",

     regions:["الشعاب المرجانية في نيوجيرسي وماساتشوستس", "حطام السفن في خليج تشيسابيك/فرجينيا"]},



    {name:"توتوج (السمكة السوداء)", slug: "tautog-blackfish", sci:"Tautoga onitis", env:"Saltwater",

     habitat:"أكوام الصخور، وحطام السفن، والأرصفة البحرية.",

     baits:"السرطان الأخضر، السرطان الآسيوي على الرقص",

     season:"الربيع وأواخر الخريف رئيس الوزراء",

     regions:["حطام السفن/الشعاب المرجانية في رود آيلاند/كونيتيكت/نيويورك", "أرصفة نيوجيرسي"]},



    {name:"بلوفيش", slug: "bluefish", sci:"Pomatomus saltatrix", env:"Saltwater",

     habitat:"تمزيق الأمواج، ومداخل، وهجمات خاطفة على مدارس الطُعم.",

     baits:"المعادن، المياه السطحية، السباحون. قطع الطعم",

     season:"هجرة الربيع والخريف",

     regions:["ركوب الأمواج بين نيويورك وماساتشوستس", "نيوجيرسي تتمزق", "البنوك الخارجية (NC)"]},



    {name:"الماكريل الأطلسي", slug: "atlantic-mackerel", sci:"Scomber scombrus", env:"Saltwater",

     habitat:"المدارس القريبة من الشاطئ/البعيدة عن الشاطئ؛ حواف الهيكل.",

     baits:"السبكيس، المعادن الصغيرة، الريش",

     season:"الربيع - أوائل الصيف",

     regions:["خليج مين", "سواحل المملكة المتحدة/أيرلندا (متوفرة أيضاً في حزمة الاتحاد الأوروبي)"]},



    {name:"الباكور الكاذب (التوني الصغير)", slug: "false-albacore-little-tunny", sci:"Euthynnus alletteratus", env:"Saltwater",

     habitat:"هجمات خاطفة بالقرب من الشاطئ على أسماك صغيرة زجاجية؛ تيارات ساحبة.",

     baits:"رقصات إيبوكسي، معادن، ذباب صغير",

     season:"أواخر الصيف - الخريف",

     regions:["كيب كود - نيوجيرسي (سباق الخريف)", "البنوك الخارجية (NC)"]},



    {name:"كاليفورنيا شيبهيد", slug: "california-sheephead", sci:"Semicossyphus pulcher", env:"Saltwater",

     habitat:"أحواض عشب البحر، والشعاب المرجانية، والتكوينات الصخرية.",

     baits:"Crabs/shrimp, squid; jigs",

     season:"مناسب على مدار السنة (أفضل وقت في الصيف/الخريف)",

     regions:["خطوط عشب البحر في جنوب كاليفورنيا", "جزر القنال (كاليفورنيا)"]},



    {name:"عشب البحر (كاليكو) باس", slug: "kelp-calico-bass", sci:"Paralabrax clathratus", env:"Saltwater",

     habitat:"حواف عشب البحر وصخور المرجل والموانئ.",

     baits:"طعوم السباحة، مكاوي السطح، البلاستيك",

     season:"أواخر الربيع-الخريف",

     regions:["كاتالينا/بالوس فيرديس (كاليفورنيا)", "عشب البحر في لا جولا (كاليفورنيا)"]},



    {name:"الزنجفر روكفيش", slug: "vermilion-rockfish", sci:"Sebastes miniatus", env:"Saltwater",

     habitat:"الشعاب المرجانية العميقة/الحواف؛ القاع الصلب.",

     baits:"الرقص، منصات الطعم، خطوة بطيئة",

     season:"Open seasons vary",

     regions:["مونتيري/كارمل (كاليفورنيا)", "الشعاب المرجانية في ولايتي أوريغون وواشنطن"]},



    {name:"كابيزون", slug: "cabezon", sci:"Scorpaenichthys marmoratus", env:"Saltwater",

     habitat:"الشعاب الصخرية الضحلة، وجيوب عشب البحر.",

     baits:"الرقص مع الطعم، swimbaits",

     season:"Rockfish seasons",

     regions:["وسط/شمال كاليفورنيا، أوريغون، واشنطن"]},



    // ===== Offshore — Pelagics (global use) =====

    {name:"سمكة التونة الصفراء", slug: "yellowfin-tuna", sci:"Thunnus albacares", env:"Saltwater",

     habitat:"المياه الزرقاء، فواصل درجات الحرارة، الحواف الحالية.",

     baits:"ريش التصيد، وسدادات خشب الأرز، والبوبر، والطُعم الحي",

     season:"أشهر المياه الدافئة؛ الهجرات الموسمية",

     regions:["سواحل جنوب كاليفورنيا/باخا", "تيار الخليج في فلوريدا", "جزر الكناري", "بنوك المحيط الهندي"]},



    {name:"سمكة التونة ذات الزعانف الزرقاء", slug: "bluefin-tuna", sci:"Thunnus thynnus", env:"Saltwater",

     habitat:"تركيزات الطعم في عرض البحر؛ حواف الرف.",

     baits:"الطُعم العصي، والبوبرس، والرقص، والطُعم الحي؛ انتشار التصيد",

     season:"يختلف (الربيع-الخريف في أمريكا الشمالية/الاتحاد الأوروبي)",

     regions:["كيب كود/خليج مين", "البنوك الخارجية (NC)", "البحر الأبيض المتوسط"]},



    {name:"واهو", slug: "wahoo", sci:"Acanthocybium solandri", env:"Saltwater",

     habitat:"إنزالات شديدة الانحدار، ويمر هيكل عالي السرعة.",

     baits:"التصيد عالي السرعة، الغواصين العميقين، الرقص",

     season:"المواسم الدافئة؛ المد والجزر القمرية",

     regions:["مضيق جزر البهاما/فلوريدا", "Baja peninsula", "Hawaii ledges"]},



    {name:"بلو مارلن", slug: "blue-marlin", sci:"Makaira nigricans", env:"Saltwater",

     habitat:"المياه الزرقاء العميقة بالقرب من الجبال البحرية؛ تركيزات الطعم.",

     baits:"السحر المتصيد، المضايقون + الطعوم الملعب",

     season:"المواسم الدافئة الاستوائية/شبه الاستوائية",

     regions:["جزر الأزور", "ماديرا", "تيار الخليج جزر البهاما", "كابو سان لوكاس (المكسيك)"]},



    {name:"سمكة ابو شراع", slug: "sailfish", sci:"Istiophorus platypterus", env:"Saltwater",

     habitat:"الحواف/الأعشاب الضارة؛ مدارس الطعم؛ تغيرات اللون.",

     baits:"باليهو المتصيدة، دعابات التجريف، طعوم الملعب",

     season:"الشتاء فلوريدا / منطقة البحر الكاريبي. موسمية في أماكن أخرى",

     regions:["بالم بيتش - إسلامورادا (فلوريدا)", "غواتيمالا", "كوستاريكا باسيفيك"]},



    {name:"سمك أبو سيف", slug: "swordfish", sci:"Xiphias gladius", env:"Saltwater",

     habitat:"هيكل قطرة عميقة. الهجرات العمودية اليومية.",

     baits:"الحبار العميق، تكتيكات العوامة/الانجراف",

     season:"ليل الصيف؛ يوم هبوط عميق على مدار السنة في بعض المناطق",

     regions:["فلوريدا كيز", "أودية جنوب كاليفورنيا", "Med canyons"]},



    // ===== Europe (fresh + salt) =====

    {name:"سمك السلمون الأطلسي", slug: "atlantic-salmon", sci:"Salmo salar", env:"Freshwater",

     habitat:"منحدرات، برك، مجاري مائية؛ أنهار نموذجية لسمك السلمون.",

     baits:"الذبابة (أجنحة الشعر، الأنابيب)، المغازل، الملاعق",

     season:"يختلف باختلاف النهر؛ من الربيع إلى الخريف",

     regions:["النرويج غاولا", "اسكتلندا سبي/دي", "Iceland rivers", "روسيا كولا"]},



    {name:"زاندر", slug: "zander", sci:"Sander lucioperca", env:"Freshwater",

     habitat:"الأنهار البطيئة والبحيرات العميقة. هيكل/حواف.",

     baits:"مظلات راقصة، طُعم حي، طُعم حي",

     season:"الربيع - الخريف؛ الليل في الصيف",

     regions:["أحواض بحر البلطيق/إلبه/الدانوب", "خزانات المياه في المملكة المتحدة (المخزنة)"]},



    {name:"جثم الأوروبي", slug: "european-perch", sci:"Perca fluviatilis", env:"Freshwater",

     habitat:"خطوط الأعشاب، والأرصفة، والقنوات؛ الحيوانات المفترسة التي تتجمع في أسراب.",

     baits:"قطع بلاستيكية صغيرة ناعمة، غزل، قطرة قطرة",

     season:"على مدار السنة؛ أفضل وقت للزراعة في الربيع/الخريف",

     regions:["قنوات/بحيرات المملكة المتحدة", "Scandinavia lakes", "أنهار وسط الاتحاد الأوروبي"]},



    {name:"تنش", slug: "tench", sci:"Tinca tinca", env:"Freshwater",

     habitat:"المياه الراكدة المليئة بالأعشاب؛ الحواف؛ نشطة خلال الأشهر الدافئة.",

     baits:"الديدان والذرة والخبز والغليان (طريقة التغذية)",

     season:"أواخر الربيع - الصيف",

     regions:["المملكة المتحدة/الاتحاد الأوروبي المياه الساكنة والقنوات"]},



    {name:"باربل", slug: "barbel", sci:"Barbus barbus", env:"Freshwater",

     habitat:"مجاري حصوية، أنهار سريعة الجريان؛ في القاع.",

     baits:"الكريات، الدمامل، اللحوم، الجبن؛ منصات التغذية",

     season:"الصيف - الخريف",

     regions:["نهر واي/ترينت/سيفرن (المملكة المتحدة)", "نهر الراين/السين/الدانوب"]},



    {name:"الشوب الأوروبي", slug: "european-chub", sci:"Squalius cephalus", env:"Freshwater",

     habitat:"أنهار ذات غطاء نباتي؛ حواف؛ برك جسرية.",

     baits:"الخبز والديدان والطعم الصغير والذباب",

     season:"على مدار السنة؛ صيد الأسماك بالنظر في المياه الصافية المنخفضة",

     regions:["الأنهار والقنوات في المملكة المتحدة والاتحاد الأوروبي"]},



    {name:"القاروص الأوروبي", slug: "european-seabass", sci:"Dicentrarchus labrax", env:"Saltwater",

     habitat:"شواطئ ركوب الأمواج، ومصبات الأنهار، وعلامات الصخور.",

     baits:"مواد بلاستيكية ناعمة، وسدادات سطحية، ومعادن، وطُعم",

     season:"أواخر الربيع - الخريف",

     regions:["سواحل المحيط الأطلسي في المملكة المتحدة/أيرلندا/فرنسا", "Mediterranean harbors"]},



    {name:"الدنيس جيلتهيد", slug: "gilthead-seabream", sci:"Sparus aurata", env:"Saltwater",

     habitat:"الخلجان الصخرية/الرملية في البحر الأبيض المتوسط؛ الموانئ.",

     baits:"سرطان البحر والروبيان والمحار. رقصات صغيرة",

     season:"Warm months",

     regions:["سواحل إسبانيا/إيطاليا/اليونان"]},



    {name:"سمك القد الأطلسي", slug: "atlantic-cod", sci:"Gadus morhua", env:"Saltwater",

     habitat:"البنوك والحطام والشعاب المرجانية. الماء البارد.",

     baits:"الرقص، منصات الطعم (البطلينوس / الحبار)، البيرك",

     season:"الشتاء والربيع في العديد من المناطق",

     regions:["Norway fjords", "أيسلندا", "حطام السفن في بحر الشمال البريطاني"]},



    {name:"بولاك", slug: "pollack", sci:"Pollachius pollachius", env:"Saltwater",

     habitat:"علامات صخرية مغطاة بالأعشاب البحرية، حطام سفن؛ مطاردون في منتصف المياه.",

     baits:"شاد على جيغيدس والمعادن",

     season:"الربيع - الخريف",

     regions:["ساحل المحيط الأطلسي في المملكة المتحدة/أيرلندا", "بريتاني"]},



    {name:"سمك الترس", slug: "turbot", sci:"Scophthalmus maximus", env:"Saltwater",

     habitat:"ضفاف رملية بالقرب من مجاري المد والجزر؛ شواطئ مناسبة لركوب الأمواج.",

     baits:"شرائح السمك، السانديل؛ سحب الملاعق",

     season:"الربيع - الصيف",

     regions:["ضفاف بحر الشمال", "Biscay beaches"]},



    // ===== Australia / New Zealand / Pacific =====

    {name:"الباراموندي", slug: "barramundi", sci:"Lates calcarifer", env:"Brackish",

     habitat:"جداول أشجار المانغروف، والعوائق، والمصارف؛ والسدود.",

     baits:"الأجسام الصلبة، والمشاعر الناعمة، وطعم السباحة؛ البوري الحي",

     season:"بناء خلال موسم الأمطار الاستوائية؛ أحواض بناء السفن على مدار السنة",

     regions:["الجداول المدية في الإقليم الشمالي/كوينزلاند (أستراليا)", "بحيرات كاكادو (أستراليا)", "سدود الطرف العلوي"]},



    {name:"موراي كود", slug: "murray-cod", sci:"Maccullochella peelii", env:"Freshwater",

     habitat:"عوائق كبيرة في النهر، وحواجز صخرية؛ وهجمات كمائن.",

     baits:"طعوم السباحة الكبيرة، طعوم الاستيقاظ، الطعوم الدوارة",

     season:"مغلق في الربيع (أستراليا)؛ ذروة الموسم في الصيف/الخريف",

     regions:["حوض موراي-دارلينج (أستراليا)"]},



    {name:"الأسترالية باس", slug: "australian-bass", sci:"Macquaria novemaculeata", env:"Freshwater",

     habitat:"أنهار الساحل الشرقي؛ عوائق/منحدرات سريعة؛ مياه مالحة في الشتاء.",

     baits:"المشايات السطحية، الطعوم الدوارة، البلاستيك",

     season:"سطح الماء في الصيف؛ مياه مالحة في الشتاء",

     regions:["أنهار نيو ساوث ويلز/كوينزلاند (أستراليا)"]},



    {name:"فلاتهيد داكن", slug: "dusky-flathead", sci:"Platycephalus fuscus", env:"Saltwater",

     habitat:"المسطحات الرملية في مصبات الأنهار، والمصارف، والمنحدرات؛ أسلوب الكمين والانتظار.",

     baits:"البلاستيك اللين، المشاعر، طُعم الجمبري",

     season:"الربيع - الخريف",

     regions:["مصبات الأنهار في نيو ساوث ويلز/كوينزلاند (أستراليا)"]},



    {name:"سنابر (أستراليا)", slug: "snapper-australasian", sci:"Pagrus auratus", env:"Saltwater",

     habitat:"الشعاب المرجانية، وأحواض بلح البحر، والقنوات؛ وتجمعات الطعم.",

     baits:"الطعوم الناعمة، والرقصات الدقيقة، وأجهزة دفتر الأستاذ",

     season:"التكاثر الربيعي؛ الاستعدادات الخريفية",

     regions:["خليج هاوراكي (نيوزيلندا)", "الشعاب المرجانية في جنوب أستراليا/فيكتوريا (أستراليا)"]},



    {name:"سمكة كنعد صفراء الذيل", slug: "yellowtail-kingfish", sci:"Seriola lalandi", env:"Saltwater",

     habitat:"دبابيس، حواف التيار، حواف عشب البحر.",

     baits:"الطعوم الحية، والطعوم العصوية في المياه السطحية، والرقص",

     season:"الصيف - الخريف",

     regions:["خليج الجزر (نيوزيلندا)", "الساحل الجنوبي لولاية نيو ساوث ويلز (أستراليا)"]},



    {name:"عملاق تريفالي (GT)", slug: "giant-trevally-gt", sci:"Caranx ignobilis", env:"Saltwater",

     habitat:"حواف الشعاب المرجانية، والصخور المرجانية، ومواقع ركوب الأمواج.",

     baits:"بوبرس كبيرة، ستيكبيتس، والرقص",

     season:"Tropical warm months",

     regions:["جزر مرجانية في بحر المرجان", "جزر المالديف", "سيشيل"]},



    {name:"الماكريل الاسباني", slug: "spanish-mackerel", sci:"Scomberomorus commerson", env:"Saltwater",

     habitat:"الرؤوس، نقاط الشعاب المرجانية، مدارس الطُعم.",

     baits:"سمك المنوة المصطاد، شرائح معدنية، طعوم حية",

     season:"Warm months",

     regions:["كوينزلاند/شمال أستراليا", "بابوا غينيا الجديدة/إندونيسيا"]},



    // ===== Asia =====

    {name:"محسير (الذهبي)", slug: "mahseer-golden", sci:"Tor putitora", env:"Freshwater",

     habitat:"أنهار سفوح الجبال؛ مجاري سريعة/برك؛ مهاجرة.",

     baits:"الملاعق، المغازل، المقابس. العجين/الطعوم في بعض المناطق",

     season:"انخفاض ما بعد الرياح الموسمية؛ انحسار منخفض شتوي",

     regions:["أنهار جبال الهيمالايا الهندية", "Nepal foothills"]},



    {name:"رأس الأفعى (العملاق)", slug: "snakehead-giant", sci:"Channa micropeltes", env:"Freshwater",

     habitat:"بحيرات/قنوات مليئة بالأعشاب؛ مفترس يتربص بالفرائس.",

     baits:"الضفادع، الطنانة، الطعوم السباحة؛ الطعم الحي",

     season:"ارتفاع منسوب المياه في موسم الأمطار؛ صيد الأسماك بالنظر في المياه المنخفضة",

     regions:["خزانات المياه في ماليزيا/تايلاند", "Borneo lakes"]},



    {name:"روهو", slug: "rohu", sci:"Labeo rohita", env:"Freshwater",

     habitat:"أنهار كبيرة، برك، خزانات مياه.",

     baits:"العجين/العطاس، الذرة، الخبز؛ مغذيات الطريقة",

     season:"أشهر دافئة؛ تعتمد على الرياح الموسمية",

     regions:["حوض نهر الغانج (الهند/بنغلاديش)", "Pakistan canals"]},



    {name:"سمك السلور الميكونغ العملاق", slug: "giant-mekong-catfish", sci:"Pangasianodon gigas", env:"Freshwater",

     habitat:"قنوات نهرية كبيرة؛ حفر عميقة؛ خزانات (مُخزّنة).",

     baits:"طرق الحبيبات/الطعم الأرضي؛ يعيش / قطع في بعض المناطق",

     season:"يختلف؛ غالباً ما تكون أشهر دافئة",

     regions:["حوض نهر ميكونغ (تايلاند/لوس أنجلوس/فيتنام/الصين)"]},



    {name:"الكارب السيامي", slug: "siamese-carp", sci:"Catlocarpio siamensis", env:"Freshwater",

     habitat:"السهول الفيضية، الخزانات (المخزنة).",

     baits:"الدمامل/الكريات/الطريقة؛ معالجة ثقيلة",

     season:"Warm months",

     regions:["خزانات المياه/مصايد الأسماك التايلاندية"]},



    // ===== Africa =====

    {name:"جثم النيل", slug: "nile-perch", sci:"Lates niloticus", env:"Freshwater",

     habitat:"بنية البحيرة/النهر، المنحدرات؛ الكمين.",

     baits:"طُعم السباحة العميق، والطُعم الحي، وسدادات التصيد",

     season:"مواسم الجفاف؛ إضاءة خافتة",

     regions:["بحيرة فيكتوريا (EA)", "بحيرة ناصر (مصر)"]},



    {name:"سمكة النمر", slug: "tigerfish", sci:"Hydrocynus vittatus", env:"Freshwater",

     habitat:"أنهار سريعة الجريان؛ جزر رملية/دوامات؛ مجاري مائية صافية.",

     baits:"الغزالون والملاعق والبلم. قادة الأسلاك",

     season:"موسم الجفاف (تدفقات أقل وأكثر صفاءً)",

     regions:["زامبيزي، أوكافانغو (BW/NA/ZM)"]},



    {name:"السمكة الصفراء (الفم الصغير)", slug: "yellowfish-smallmouth", sci:"Labeobarbus aeneus", env:"Freshwater",

     habitat:"الجداول/المجاري؛ الصيد بالنظر؛ الصيد بالذبابة/الطعم الصناعي.",

     baits:"الحوريات، السواعد الصغيرة، البلاستيك اللين",

     season:"الربيع - الخريف",

     regions:["نهر فال (جنوب أفريقيا)"]},



    {name:"جالجوين", slug: "galjoen", sci:"Dichistius capensis", env:"Saltwater",

     habitat:"منحدرات صخرية لركوب الأمواج في جنوب أفريقيا؛ مياه بيضاء.",

     baits:"الطعم الأحمر / بلح البحر؛ رقصات صغيرة",

     season:"الشتاء - الربيع (مياه أكثر برودة)",

     regions:["شواطئ كيب الغربية الصخرية (جنوب أفريقيا)"]},



    {name:"كوب (معتم/مرقط)", slug: "kob-dusky-spotted", sci:"Argyrosomus japonicus", env:"Saltwater",

     habitat:"أماكن ركوب الأمواج، مصبات الأنهار، مصبات الأنهار.",

     baits:"البوري الحي، والبلاستيك الناعم، والأبزيم",

     season:"الخريف والشتاء (إقليمي)",

     regions:["الساحل الجنوبي لأفريقيا", "غرب أستراليا (باسم مولواي)"]},



    // ===== South America / Caribbean =====

    {name:"الطاووس باس", slug: "peacock-bass", sci:"Cichla temensis", env:"Freshwater",

     habitat:"الأخشاب المغمورة بالمياه، والبحيرات الشاطئية؛ والأمواج السطحية المتفجرة.",

     baits:"الطعوم الدعامة الكبيرة، والطعوم العصي، والرقص",

     season:"موسم الجفاف (انخفاض منسوب المياه)",

     regions:["ريو نيغرو (البرازيل)", "أورينوكو (VE/CO)"]},



    {name:"دورادو الذهبي", slug: "golden-dorado", sci:"Salminus brasiliensis", env:"Freshwater",

     habitat:"مسارات سريعة، طبقات صخرية؛ بنية ثقيلة.",

     baits:"اللافتات، jerkbaits، الملاعق (زعيم الأسلاك)",

     season:"الربيع - الخريف (إقليمي)",

     regions:["مستنقع إيبرا (أركنساس)", "Bolivia jungle rivers", "نهر أوروغواي"]},



    {name:"باكو", slug: "pacu", sci:"كولوسوما / بيراكتوس النيابة.", env:"Freshwater",

     habitat:"أنهار بطيئة الجريان، وغابات غارقة بالمياه.",

     baits:"Fruit, nuts, corn, pellets; flies",

     season:"يؤدي ارتفاع منسوب المياه إلى تساقط الثمار؛ والأشهر الدافئة",

     regions:["حوض الأمازون (البرازيل/بي إي/بوليفيا)"]},



    {name:"بيريبا (لاو لاو)", slug: "pira-ba-lau-lau", sci:"Brachyplatystoma filamentosum", env:"Freshwater",

     habitat:"قنوات أمازون العميقة؛ نقاط الالتقاء.",

     baits:"قطع ضخمة من الطعوم؛ معالجة ثقيلة",

     season:"يختلف باختلاف النهر؛ وغالبًا ما يكون متدفقًا.",

     regions:["أمازون مينستيم (البرازيل)"]},



    {name:"بايارا (الأسماك مصاصة الدماء)", slug: "payara-vampire-fish", sci:"Hydrolycus scomberoides", env:"Freshwater",

     habitat:"منحدرات صخرية سريعة وغطسات حادة؛ مياه غنية بالأكسجين.",

     baits:"ملاعق كبيرة، ورقصات، وطُعم عصي؛ اللافتات الكبيرة",

     season:"Lower water periods",

     regions:["روافد نهر أورينوكو/الأمازون (VE/CO/BR)"]},



    {name:"بونفيش", slug: "bonefish", sci:"Albula vulpes", env:"Saltwater",

     habitat:"مسطحات ضحلة، عشب السلحفاة، رمال.",

     baits:"ذباب جمبري صغير، رقص",

     season:"المناطق الاستوائية على مدار العام؛ المد والجزر + مفتاح زاوية الشمس",

     regions:["جزر البهاما", "فلوريدا كيز", "يوكاتان"]},



    {name:"تصريح", slug: "permit", sci:"Trachinotus falcatus", env:"Saltwater",

     habitat:"مسطحات ضحلة؛ أسماك تلاحق ذيولها؛ حذرة.",

     baits:"ذباب السلطعون، الرقص الصغيرة؛ السرطانات الحية",

     season:"الربيع - الخريف (فترات المد والجزر)",

     regions:["بليز", "يوكاتان", "مفاتيح"]},

  ];



  function mergeEnrichment(){

    const db = Array.isArray(window.SPECIES_DB) ? window.SPECIES_DB : (window.SPECIES_DB = []);

    const norm = x => String(x||"").toLowerCase().trim();

    const isEmpty = v => v==null || (typeof v==="خيط" && !v.trim()) || (Array.isArray(v)&&!v.length);

    const keys = ["بيئة","موطن","الطعوم","موسم","عمق","الاسم المستعار","img","المناطق"];



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
