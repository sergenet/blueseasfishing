// tools/i18n/apply-hand-translations.mjs — fill the MT-quota residue.
//
// When MyMemory's daily quota died mid-run, a small set of strings fell back
// to English in the mirrored auth/commerce pages (trip-planner was hit
// hardest; a few one-offs in subscribe/login/premium/members-area/
// premium-success/gear-recommendations). This script applies curated
// translations for exactly those strings, matching the terminology the main
// i18n pipeline already uses on the index/footer pages of each language.
//
// Safety rules:
//   * exact, case-sensitive replacement — only fires on the EN source text;
//     already-translated text is untouched (inherently idempotent).
//   * quote-containing translations are never written inside <script> blocks
//     (would break JS string literals) — they apply to markup only.
//   * brand text ("Blue Seas Fishing ...") is never matched.
//
// Run: node tools/i18n/apply-hand-translations.mjs
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const LOCALES = ['es', 'fr', 'de', 'pt', 'ru', 'el', 'ar'];

const SCRIPT_RE = /(<script\b[^>]*>[\s\S]*?<\/script>)/i;

const TRIP_TITLE = 'Trip Planner — Multi-Fish Species &amp; Bait Plans | Blue Seas Premium';
const TRIP = {
  es: {
    [TRIP_TITLE]: 'Planificador de viajes — Planes multi-especie y de cebo | Blue Seas Premium',
    'Pick a destination and a month — we cross-reference all 548 species profiles and build a multi-fish target list with baits, seasons and hotspot data.':
      'Elige un destino y un mes: contrastamos los 548 perfiles de especies y creamos una lista multi-especie con cebos, temporadas y datos de puntos calientes.',
    'Premium feature.': 'Función Premium.',
    'Premium members plan trips': 'Los miembros Premium planifican viajes',
    'The Trip Planner is included with Premium — alongside unlimited AI identifications and the weekly bite brief.':
      'El planificador de viajes está incluido en Premium, junto con identificaciones ilimitadas con IA y el boletín semanal de picadas.',
    'Destination': 'Destino',
    'Any destination (browse by region)': 'Cualquier destino (explorar por región)',
    'Global — all waters': 'Global — todas las aguas',
    'Travel month': 'Mes de viaje',
    'Water type': 'Tipo de agua',
    'Fresh &amp; salt': 'Dulce y salada',
    'Freshwater only': 'Solo agua dulce',
    'Saltwater only': 'Solo agua salada',
    'Build my trip plan': 'Crear mi plan de viaje',
    'Print / save as PDF': 'Imprimir / guardar como PDF',
  },
  fr: {
    [TRIP_TITLE]: 'Planificateur de voyage — Plans multi-espèces et appâts | Blue Seas Premium',
    'Pick a destination and a month — we cross-reference all 548 species profiles and build a multi-fish target list with baits, seasons and hotspot data.':
      "Choisissez une destination et un mois — nous croisons les 548 profils d'espèces et construisons une liste multi-espèces avec appâts, saisons et données de spots.",
    'Premium feature.': 'Fonctionnalité Premium.',
    'Premium members plan trips': 'Les membres Premium planifient leurs voyages',
    'The Trip Planner is included with Premium — alongside unlimited AI identifications and the weekly bite brief.':
      'Le planificateur de voyage est inclus dans Premium, aux côtés des identifications IA illimitées et du bulletin hebdomadaire des prises.',
    // "Destination" is identical in French — skip
    'Any destination (browse by region)': 'Toute destination (parcourir par région)',
    'Global — all waters': 'Global — toutes les eaux',
    'Travel month': 'Mois de voyage',
    'Water type': "Type d'eau",
    'Fresh &amp; salt': 'Douce et salée',
    'Freshwater only': 'Eau douce uniquement',
    'Saltwater only': 'Eau salée uniquement',
    'Build my trip plan': 'Créer mon plan de voyage',
    'Print / save as PDF': 'Imprimer / enregistrer en PDF',
  },
  de: {
    [TRIP_TITLE]: 'Trip-Planer — Pläne für mehrere Fischarten &amp; Köder | Blue Seas Premium',
    'Pick a destination and a month — we cross-reference all 548 species profiles and build a multi-fish target list with baits, seasons and hotspot data.':
      'Wählen Sie ein Ziel und einen Monat — wir gleichen alle 548 Artenprofile ab und erstellen eine Zielliste mit Ködern, Jahreszeiten und Hotspot-Daten.',
    'Premium feature.': 'Premium-Funktion.',
    'Premium members plan trips': 'Premium-Mitglieder planen ihre Reisen',
    'The Trip Planner is included with Premium — alongside unlimited AI identifications and the weekly bite brief.':
      'Der Trip-Planer ist Teil von Premium — zusammen mit unbegrenzter KI-Fischidentifikation und dem wöchentlichen Biss-Briefing.',
    'Destination': 'Reiseziel',
    'Any destination (browse by region)': 'Beliebiges Ziel (nach Region stöbern)',
    'Global — all waters': 'Global — alle Gewässer',
    'Travel month': 'Reisemonat',
    'Water type': 'Wassertyp',
    'Fresh &amp; salt': 'Süß- &amp; Salzwasser',
    'Freshwater only': 'Nur Süßwasser',
    'Saltwater only': 'Nur Salzwasser',
    'Build my trip plan': 'Meinen Trip planen',
    'Print / save as PDF': 'Drucken / als PDF speichern',
  },
  pt: {
    [TRIP_TITLE]: 'Planejador de viagem — Planos multiespécie e iscas | Blue Seas Premium',
    'Pick a destination and a month — we cross-reference all 548 species profiles and build a multi-fish target list with baits, seasons and hotspot data.':
      'Escolha um destino e um mês — cruzamos os 548 perfis de espécies e montamos uma lista multiespécie com iscas, épocas e dados de pontos quentes.',
    'Premium feature.': 'Recurso Premium.',
    'Premium members plan trips': 'Membros Premium planejam viagens',
    'The Trip Planner is included with Premium — alongside unlimited AI identifications and the weekly bite brief.':
      'O planejador de viagem está incluído no Premium, ao lado das identificações ilimitadas com IA e do boletim semanal de mordidas.',
    'Destination': 'Destino',
    'Any destination (browse by region)': 'Qualquer destino (navegar por região)',
    'Global — all waters': 'Global — todas as águas',
    'Travel month': 'Mês da viagem',
    'Water type': 'Tipo de água',
    'Fresh &amp; salt': 'Doce e salgada',
    'Freshwater only': 'Somente água doce',
    'Saltwater only': 'Somente água salgada',
    'Build my trip plan': 'Montar meu plano de viagem',
    'Print / save as PDF': 'Imprimir / salvar como PDF',
  },
  ru: {
    [TRIP_TITLE]: 'Планировщик путешествий — Планы по нескольким видам и наживке | Blue Seas Premium',
    'Pick a destination and a month — we cross-reference all 548 species profiles and build a multi-fish target list with baits, seasons and hotspot data.':
      'Выберите направление и месяц — мы сверим все 548 профилей видов и составим список целей с наживкой, сезонами и данными о местах клёва.',
    'Premium feature.': 'Функция Premium.',
    'Premium members plan trips': 'Участники Premium планируют путешествия',
    'The Trip Planner is included with Premium — alongside unlimited AI identifications and the weekly bite brief.':
      'Планировщик путешествий входит в Premium, наряду с безлимитной идентификацией рыбы ИИ и еженедельной сводкой клёва.',
    'Destination': 'Направление',
    'Any destination (browse by region)': 'Любое направление (просмотр по регионам)',
    'Global — all waters': 'Все воды — весь мир',
    'Travel month': 'Месяц поездки',
    'Water type': 'Тип воды',
    'Fresh &amp; salt': 'Пресная и солёная',
    'Freshwater only': 'Только пресная вода',
    'Saltwater only': 'Только солёная вода',
    'Build my trip plan': 'Составить мой план поездки',
    'Print / save as PDF': 'Печать / сохранить в PDF',
  },
  el: {
    [TRIP_TITLE]: 'Σχεδιαστής ταξιδιού — Σχέδια για πολλά είδη και δολώματα | Blue Seas Premium',
    'Pick a destination and a month — we cross-reference all 548 species profiles and build a multi-fish target list with baits, seasons and hotspot data.':
      'Επιλέξτε προορισμό και μήνα — συγκρίνουμε και τα 548 προφίλ ειδών και φτιάχνουμε λίστα στόχων με δολώματα, εποχές και δεδομένα hotspots.',
    'Premium feature.': 'Λειτουργία Premium.',
    'Premium members plan trips': 'Τα μέλη Premium σχεδιάζουν τα ταξίδια τους',
    'The Trip Planner is included with Premium — alongside unlimited AI identifications and the weekly bite brief.':
      'Ο σχεδιαστής ταξιδιού ανήκει στο Premium, μαζί με την απεριόριστη αναγνώριση ψαριών AI και το εβδομαδιαίο δελτίο δαγκωμάτων.',
    'Destination': 'Προορισμός',
    'Any destination (browse by region)': 'Οποιοσδήποτε προορισμός (περιήγηση ανά περιοχή)',
    'Global — all waters': 'Παγκόσμια — όλα τα νερά',
    'Travel month': 'Μήνας ταξιδιού',
    'Water type': 'Τύπος νερού',
    'Fresh &amp; salt': 'Γλυκό &amp; αλμυρό',
    'Freshwater only': 'Μόνο γλυκό νερό',
    'Saltwater only': 'Μόνο αλμυρό νερό',
    'Build my trip plan': 'Φτιάξτε το σχέδιο ταξιδιού μου',
    'Print / save as PDF': 'Εκτύπωση / αποθήκευση ως PDF',
  },
  ar: {
    [TRIP_TITLE]: 'مخطط الرحلة — خطط لعدة أنواع وأطُعم | Blue Seas Premium',
    'Pick a destination and a month — we cross-reference all 548 species profiles and build a multi-fish target list with baits, seasons and hotspot data.':
      'اختر وجهة وشهرًا — نطابق جميع ملفات الأنواع الـ548 ونبني قائمة أهداف متعددة الأسماك مع الأطُعم والفصول وبيانات النقاط الساخنة.',
    'Premium feature.': 'ميزة مميزة.',
    'Premium members plan trips': 'الأعضاء المميزون يخططون لرحلاتهم',
    'The Trip Planner is included with Premium — alongside unlimited AI identifications and the weekly bite brief.':
      'مخطط الرحلة متضمن في الإصدار المميز، إلى جانب تحديد الأسماك غير المحدود بالذكاء الاصطناعي والنشرة الأسبوعية للعضّات.',
    'Destination': 'الوجهة',
    'Any destination (browse by region)': 'أي وجهة (تصفح حسب المنطقة)',
    'Global — all waters': 'عالمي — جميع المياه',
    'Travel month': 'شهر السفر',
    'Water type': 'نوع الماء',
    'Fresh &amp; salt': 'عذب ومالح',
    'Freshwater only': 'مياه عذبة فقط',
    'Saltwater only': 'مياه مالحة فقط',
    'Build my trip plan': 'أنشئ خطة رحلتي',
    'Print / save as PDF': 'طباعة / حفظ كـ PDF',
  },
};

// One-off residues per locale+file (dump-verified). "logo" keys target the
// logo accent only so the "Blue Seas Fishing" brand text is never touched.
const ONESIES = {
  es: {
    'subscribe.html': { 'Stay on the Bite': 'Sigue las picadas', 'Fish Identification': 'Identificación de peces' },
  },
  fr: {
    'subscribe.html': { 'Stay on the Bite': 'Restez informé des prises', 'Shop Gear': 'Acheter du matériel', 'Blog': 'Blogue' },
    'login.html': { 'Shop Gear': 'Acheter du matériel' },
    'premium.html': { 'Shop Gear': 'Acheter du matériel' },
    'members-area.html': { 'Shop Gear': 'Acheter du matériel', 'Advanced Species Intel': 'Informations avancées sur les espèces' },
    'gear-recommendations.html': { 'Shop Gear': 'Acheter du matériel' },
  },
  de: {
    'subscribe.html': { 'Photo Gallery': 'Fotogalerie' },
    'login.html': { 'Email': 'E-Mail' },
    'members-area.html': {},
    'gear-recommendations.html': {},
  },
  pt: {
    'subscribe.html': { "What's biting in": 'O que está mordendo em', 'Explore': 'Explorar', 'Community': 'Comunidade', 'Blog': 'Blogue' },
    'login.html': { 'Email': 'E-mail' },
  },
  ru: {
    'subscribe.html': { 'You are subscribed': 'Вы подписаны' },
    'members-area.html': { 'Advanced Species Intel': 'Расширенная информация о видах' },
  },
  el: {
    'subscribe.html': { 'Forum': 'φόρουμ', 'Blog': 'Ιστολόγιο' },
    'login.html': { 'Forum': 'φόρουμ' },
    'premium.html': { 'Forum': 'φόρουμ' },
    'members-area.html': { 'Forum': 'φόρουμ', 'Advanced Species Intel': 'Προηγμένες πληροφορίες για τα είδη' },
  },
  ar: {
    'premium-success.html': {
      'Please keep this page open.': 'يرجى إبقاء هذه الصفحة مفتوحة.',
      'Continue to Members Area': 'المتابعة إلى منطقة الأعضاء',
    },
  },
};

// Logo accent + back-link (targeted, brand-safe) per locale/file.
const TARGETED = {
  es: { 'gear-recommendations.html': [['>← Back<', '>← Atrás<']] },
  fr: { 'gear-recommendations.html': [['>← Back<', '>← Retour<']] },
  de: {
    'gear-recommendations.html': [['>← Back<', '>← Zurück<']],
    'subscribe.html': [['logo-accent">Fishing<', 'logo-accent">Angeln<']],
    'premium.html': [['logo-accent">Fishing<', 'logo-accent">Angeln<']],
    'trip-planner.html': [['logo-accent">Fishing<', 'logo-accent">Angeln<']],
  },
  pt: { 'gear-recommendations.html': [['>← Back<', '>← Voltar<']] },
  ru: { 'gear-recommendations.html': [['>← Back<', '>← Назад<']] },
  el: { 'gear-recommendations.html': [['>← Back<', '>← Πίσω<']] },
  ar: { 'gear-recommendations.html': [['>← Back<', '>← رجوع<']] },
};

const GEAR = {
  es: { 'Gear Recommendations': 'Recomendaciones de equipo', 'Tackle Starter Kits': 'Kit inicial de aparejos', 'Versatile assortments to cover most situations.': 'Conjuntos versátiles para cubrir la mayoría de las situaciones.', 'Fishing Pliers': 'Pinzas de pesca', 'Corrosion-resistant pliers for quick, safe releases.': 'Pinzas resistentes a la corrosión para soltar rápido y con seguridad.', 'Topwater Walkers': 'Señuelos de superficie', '“Walk the dog” baits for explosive dawn bites.': 'Señuelos «walk the dog» para picadas explosivas al amanecer.' },
  fr: { 'Gear Recommendations': "Recommandations d'équipement", 'Tackle Starter Kits': "Kits de départ d'attirails", 'Versatile assortments to cover most situations.': 'Ensembles polyvalents couvrant la plupart des situations.', 'Fishing Pliers': 'Pinces de pêche', 'Corrosion-resistant pliers for quick, safe releases.': 'Pinces résistantes à la corrosion pour un relâchement rapide et sûr.', 'Topwater Walkers': 'Leurres de surface', '“Walk the dog” baits for explosive dawn bites.': 'Leurres « walk the dog » pour des prises explosives à l’aube.' },
  de: { 'Gear Recommendations': 'Ausrüstungsempfehlungen', 'Tackle Starter Kits': 'Startersets für die Tackle-Box', 'Versatile assortments to cover most situations.': 'Vielseitige Sets für die meisten Situationen.', 'Fishing Pliers': 'Angelzangen', 'Corrosion-resistant pliers for quick, safe releases.': 'Korrosionsbeständige Zangen für schnelle, sichere Rücksetzer.', 'Topwater Walkers': 'Oberflächenköder (Walk the Dog)', '“Walk the dog” baits for explosive dawn bites.': '„Walk-the-dog“-Köder für explosive Morgenbisse.' },
  pt: { 'Gear Recommendations': 'Recomendações de equipamento', 'Tackle Starter Kits': 'Kits iniciais de montagem', 'Versatile assortments to cover most situations.': 'Conjuntos versátiles para cobrir a maioria das situações.', 'Fishing Pliers': 'Alicates de pesca', 'Corrosion-resistant pliers for quick, safe releases.': 'Alicates resistentes à corrosão para solturas rápidas e seguras.', 'Topwater Walkers': 'Iscas de superfície', '“Walk the dog” baits for explosive dawn bites.': 'Iscas «walk the dog» para mordidas explosivas ao amanhecer.' },
  ru: { 'Gear Recommendations': 'Рекомендации по снаряжению', 'Tackle Starter Kits': 'Стартовые наборы снастей', 'Versatile assortments to cover most situations.': 'Универсальные наборы для большинства ситуаций.', 'Fishing Pliers': 'Рыбацкие клещи', 'Corrosion-resistant pliers for quick, safe releases.': 'Коррозионностойкие клещи для быстрого и безопасного отпускания рыбы.', 'Topwater Walkers': 'Поверхностные приманки', '“Walk the dog” baits for explosive dawn bites.': 'Приманки «walk the dog» для взрывных поклёвок на рассвете.' },
  el: { 'Gear Recommendations': 'Συστάσεις εξοπλισμού', 'Tackle Starter Kits': 'Σετ εκκίνησης ειδών', 'Versatile assortments to cover most situations.': 'Πολύχρηστα σετ που καλύπτουν τις περισσότερες περιπτώσεις.', 'Fishing Pliers': 'Πιέστρες ψαρέματος', 'Corrosion-resistant pliers for quick, safe releases.': 'Ανθεκτικές στη διάβρωση πιέστρες για γρήγορη και ασφαλή απελευθέρωση.', 'Topwater Walkers': 'Επιφανειακά δολώματα', '“Walk the dog” baits for explosive dawn bites.': 'Δολώματα «walk the dog» για εκρηκτικά δαγκώματα την αυγή.' },
  ar: { 'Gear Recommendations': 'توصيات المعدات', 'Tackle Starter Kits': 'أطقم صناديق الطُعم الابتدائية', 'Versatile assortments to cover most situations.': 'مجموعات متنوعة تغطي معظم الحالات.', 'Fishing Pliers': 'ملقط الصيد', 'Corrosion-resistant pliers for quick, safe releases.': 'ملاقط مقاومة للتآكل للإفلات السريع والآمن.', 'Topwater Walkers': 'طُعم سطحي', '“Walk the dog” baits for explosive dawn bites.': 'أطواق «walk the dog» لعضّات مفاجئة عند الفجر.' },
};

const quotey = (s) => /['"`\\]/.test(s);

function applyPair(html, en, tx, inScriptAllowed) {
  if (!html.includes(en)) return [html, 0];
  let count = 0;
  const safeForScript = !quotey(tx);
  // split with a CAPTURE group so script blocks stay in `parts` (odd index)
  // and survive the join — without the group, split drops them.
  const parts = html.split(new RegExp(SCRIPT_RE.source, 'gi'));
  const isScript = (i) => i % 2 === 1;
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i] || !parts[i].includes(en)) continue;
    if (isScript(i) && !(inScriptAllowed && safeForScript)) continue;
    const before = parts[i];
    parts[i] = parts[i].split(en).join(tx);
    count += Math.abs(before.length - parts[i].length) / en.length;
  }
  return [parts.join(''), count];
}

let total = 0;
// TRIP is keyed locale → {enString: translation} (applies to trip-planner.html)
const JOB = [
  ['trip-planner.html', (code) => TRIP[code]],
  ['gear-recommendations.html', (code) => ({ ...GEAR[code], ...(ONESIES[code]?.['gear-recommendations.html'] || {}) })],
  ['subscribe.html', (code) => ONESIES[code]?.['subscribe.html'] || {}],
  ['login.html', (code) => ONESIES[code]?.['login.html'] || {}],
  ['premium.html', (code) => ONESIES[code]?.['premium.html'] || {}],
  ['members-area.html', (code) => ONESIES[code]?.['members-area.html'] || {}],
  ['premium-success.html', (code) => ONESIES[code]?.['premium-success.html'] || {}],
];

for (const code of Object.keys(TRIP)) {
  for (const [file, mapFn] of JOB) {
    const f = join(ROOT, code, file);
    if (!existsSync(f)) continue;
    const map = mapFn(code);
    const entries = Object.entries(map);
    const targeted = TARGETED[code]?.[file] || [];
    if (!entries.length && !targeted.length) continue;
    let src = readFileSync(f, 'utf8');
    const out0 = src;
    for (const [en, tx] of entries) {
      // in-script replacement allowed for markup-only option defaults etc.
      const [next, n] = applyPair(src, en, tx, true);
      if (n) { src = next; total += n; }
    }
    for (const [from, to] of targeted) {
      if (src.includes(from)) { src = src.split(from).join(to); total++; }
    }
    if (src !== out0) { writeFileSync(f, src, 'utf8'); console.log(`  ✓ ${code}/${file}`); }
  }
}
console.log(`apply-hand-translations: ${total} replacements`);

// ── Shared nav / footer / home strings (index nav + footer on every page) ───
// The main MT pass died before translating the index nav/footer, so these
// hand translations land site-wide via exact EN string matching.
{
  const en2tx = {
    'Member Login': {
      es: 'Iniciar sesión', fr: 'Connexion', de: 'Anmelden', pt: 'Entrar',
      ru: 'Вход', el: 'Σύνδεση', ar: 'تسجيل الدخول' },
    'Community Gallery': {
      es: 'Galería de la comunidad', fr: 'Galerie de la communauté', de: 'Community-Galerie',
      pt: 'Galeria da comunidade', ru: 'Галерея сообщества', el: 'Γκαλερί κοινότητας', ar: 'معرض المجتمع' },
    'Upload a Photo': {
      es: 'Sube una foto', fr: 'Téléversez une photo', de: 'Foto hochladen',
      pt: 'Envie uma foto', ru: 'Загрузить фото', el: 'Ανεβάστε φωτογραφία', ar: 'ارفع صورة' },
    'Identify Fish': {
      es: 'Identificar un pez', fr: 'Identifier un poisson', de: 'Fisch bestimmen',
      pt: 'Identificar um peixe', ru: 'Определить рыбу', el: 'Ταυτοποίηση ψαριού', ar: 'تعرّف على السمك' },
    'Species Database': {
      es: 'Base de datos de especies', fr: 'Base de données des espèces', de: 'Arten-Datenbank',
      pt: 'Banco de dados de espécies', ru: 'База данных видов', el: 'Βάση δεδομένων ειδών', ar: 'قاعدة بيانات الأنواع' },
    'Go Premium': {
      es: 'Hazte Premium', fr: 'Devenez Premium', de: 'Premium werden',
      pt: 'Assine o Premium', ru: 'Оформите Premium', el: 'Γίνετε Premium', ar: 'اشترك في Premium' },
    'Subscribe': {
      es: 'Suscríbete', fr: 'Abonnez-vous', de: 'Abonnieren', pt: 'Inscreva-se',
      ru: 'Подписаться', el: 'Εγγραφή', ar: 'اشترك' },
    'Weekly Regional Bite Brief': {
      es: 'Boletín semanal regional', fr: 'Brief régional hebdomadaire', de: 'Wöchentlicher Regionalbericht',
      pt: 'Boletim regional semanal', ru: 'Еженедельный региональный обзор',
      el: 'Εβδομαδιαίο περιφερειακό δελτίο', ar: 'النشرة الإقليمية الأسبوعية' },
    "What's Biting — Monthly Fishing Calendar": {
      fr: "Qu'est-ce qui mord — Calendrier mensuel de la pêche",
      de: 'Was beißt — Monatlicher Angelkalender',
      el: 'Τι δαγκώνει — Μηνιαίο ημερολόγιο άγρας' },
    'Gear Recommendations': {
      es: 'Recomendaciones de equipo', fr: 'Conseils de matériel', de: 'Ausrüstungsempfehlungen',
      pt: 'Recomendações de equipamento', ru: 'Рекомендации по снаряжению',
      el: 'Προτάσεις εξοπλισμού', ar: 'توصيات المعدات' },
    'Fishing Tips & Gear Recommendations': {
      es: 'Consejos de pesca y recomendaciones de equipo',
      fr: 'Conseils de pêche et matériel recommandé',
      de: 'Angel-Tipps und Ausrüstungsempfehlungen',
      pt: 'Dicas de pesca e recomendações de equipamento',
      ru: 'Советы по рыбалке и рекомендации по снаряжению',
      el: 'Συμβουλές άγρας και προτάσεις εξοπλισμού',
      ar: 'نصائح الصيد وتوصيات المعدات' },
    'I agree to receive Blue Seas Fishing email updates.': {
      es: 'Acepto recibir actualizaciones por correo de Blue Seas Fishing.',
      fr: "J'accepte de recevoir les actualisations de Blue Seas Fishing par e-mail.",
      de: 'Ich möchte E-Mail-Updates von Blue Seas Fishing erhalten.',
      pt: 'Concordo em receber atualizações por e-mail do Blue Seas Fishing.',
      ru: 'Я согласен получать обновления Blue Seas Fishing по электронной почте.',
      el: 'Συμφωνώ να λαμβάνω ενημερώσεις με email από το Blue Seas Fishing.',
      ar: 'أوافق على تلقي تحديثات Blue Seas Fishing عبر البريد الإلكتروني.' },
    'I agree to receive the weekly bite brief by email.': {
      es: 'Acepto recibir el boletín semanal por correo electrónico.',
      fr: "J'accepte de recevoir le brief hebdomadaire par e-mail.",
      de: 'Ich möchte den wöchentlichen Biss-Report per E-Mail erhalten.',
      pt: 'Concordo em receber o boletim semanal por e-mail.',
      ru: 'Я согласен получать еженедельный обзор по электронной почте.',
      el: 'Συμφωνώ να λαμβάνω το εβδομαδιαίο δελτίο με email.',
      ar: 'أوافق على تلقي النشرة الأسبوعية عبر البريد الإلكتروني.' },
    'Upload a fish photo for AI-assisted species identification, browse 400+ species guides with identifying features, and get practical fishing tips and gear recommendations.': {
      es: 'Sube una foto de un pez para identificación asistida por IA, consulta más de 400 guías de especies con rasgos distintivos y consejos prácticos de pesca y equipo.',
      fr: "Téléversez une photo de poisson pour une identification assistée par IA, parcourez plus de 400 fiches d'espèces avec leurs caractéristiques et des conseils de pêche pratiques.",
      de: 'Laden Sie ein Fischfoto hoch zur KI-gestützten Artbestimmung, stöbern Sie in über 400 Artenporträts mit Erkennungsmerkmalen und erhalten Sie praktische Angel- und Ausrüstungstipps.',
      pt: 'Envie uma foto de um peixe para identificação assistida por IA, navegue por mais de 400 guias de espécies com características de identificação e dicas práticas de pesca e equipamento.',
      ru: 'Загрузите фото рыбы для идентификации с помощью ИИ, изучите более 400 руководств по видам с отличительными признаками и получите практические советы по рыбалке и снастям.',
      el: 'Ανεβάστε φωτογραφία ψαριού για ταυτοποίηση με βοήθεια ΤΝ, περιηγηθείτε σε πάνω από 400 οδηγούς ειδών με χαρακτηριστικά αναγνώρισης και πρακτικές συμβουλές άγρας και εξοπλισμού.',
      ar: 'ارفع صورة سمكة للتعريف المساعد بالذكاء الاصطناعي، وتصفح أكثر من 400 دليل للأنواع مع ملامح التمييز ونصائح عملية للصيد والمعدات.' },
  };
  // footer/legal + brief-form strings follow the same nav layout everywhere,
  // so walk every page in the locale tree, not just the core ones
  const walkHtml = (dir, acc = []) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walkHtml(p, acc);
      else if (e.name.endsWith('.html')) acc.push(p);
    }
    return acc;
  };
  const FOOTER_EN2TX = {
    '>Your region<': {
      es: '>Tu región<', fr: '>Votre région<', de: '>Ihre Region<', pt: '>Sua região<',
      ru: '>Ваш регион<', el: '>Η περιοχή σας<', ar: '>منطقتك<' },
    'Your ultimate destination for AI-powered fish identification and fishing expertise.': {
      es: 'Tu destino definitivo para la identificación de peces con IA y consejos de pesca.',
      fr: "Votre destination ultime pour l'identification de poissons par IA et l'expertise en pêche.",
      de: 'Ihr ultimatives Ziel für KI-gestützte Fischbestimmung und Angel-Expertise.',
      pt: 'Seu destino definitivo para identificação de peixes com IA e conhecimento de pesca.',
      ru: 'Ваш главный источник ИИ-определения рыбы и рыболовного опыта.',
      el: 'Ο προορισμός σας για ταυτοποίηση ψαριών με ΤΝ και τεχνικές άγρας.',
      ar: 'وجهتك المثلى لتعريف الأسماك بالذكاء الاصطناعي وخبرة الصيد.' },
    '>Explore<': {
      es: '>Explorar<', fr: '>Explorer<', de: '>Entdecken<', pt: '>Explorar<',
      ru: '>Обзор<', el: '>Εξερεύνηση<', ar: '>استكشف<' },
    '>Fish Identification<': {
      es: '>Identificación de peces<', fr: '>Identification des poissons<', de: '>Fischbestimmung<',
      pt: '>Identificação de peixes<', ru: '>Определение рыб<', el: '>Ταυτοποίηση ψαριών<', ar: '>تعريف الأسماك<' },
    '>Fishing Tips<': {
      es: '>Consejos de pesca<', fr: '>Conseils de pêche<', de: '>Angel-Tipps<', pt: '>Dicas de pesca<',
      ru: '>Советы по рыбалке<', el: '>Συμβουλές άγρας<', ar: '>نصائح الصيد<' },
    '>Community<': {
      es: '>Comunidad<', fr: '>Communauté<', de: '>Community<', pt: '>Comunidade<',
      ru: '>Сообщество<', el: '>Κοινότητα<', ar: '>المجتمع<' },
    '>Photo Gallery<': {
      es: '>Galería de fotos<', fr: '>Galerie de photos<', de: '>Fotogalerie<', pt: '>Galeria de fotos<',
      ru: '>Фотогалерея<', el: '>Γκαλερί φωτογραφιών<', ar: '>معرض الصور<' },
    '>Legal<': {
      es: '>Legal<', fr: '>Informations légales<', de: '>Rechtliches<', pt: '>Jurídico<',
      ru: '>Правовая информация<', el: '>Νομικά<', ar: '>قانوني<' },
    '>Privacy Policy<': {
      es: '>Política de privacidad<', fr: '>Politique de confidentialité<', de: '>Datenschutzerklärung<',
      pt: '>Política de privacidade<', ru: '>Политика конфиденциальности<', el: '>Πολιτική απορρήτου<', ar: '>سياسة الخصوصية<' },
    '>Terms of Service<': {
      es: '>Términos del servicio<', fr: ">Conditions d'utilisation<", de: '>Nutzungsbedingungen<',
      pt: '>Termos do serviço<', ru: '>Условия использования<', el: '>Όροι υπηρεσίας<', ar: '>شروط الخدمة<' },
    '>Cookie Policy<': {
      es: '>Política de cookies<', fr: '>Politique de cookies<', de: '>Cookie-Richtlinie<',
      pt: '>Política de cookies<', ru: '>Политика использования cookie<', el: '>Πολιτική cookies<', ar: '>سياسة ملفات تعريف الارتباط<' },
    '>Contact Us<': {
      es: '>Contáctanos<', fr: '>Contactez-nous<', de: '>Kontakt<', pt: '>Fale conosco<',
      ru: '>Свяжитесь с нами<', el: '>Επικοινωνήστε μαζί μας<', ar: '>اتصل بنا<' },
    '&copy; 2025 BlueSeasFishing.com. All rights reserved.': {
      es: '&copy; 2025 BlueSeasFishing.com. Todos los derechos reservados.',
      fr: '&copy; 2025 BlueSeasFishing.com. Tous droits réservés.',
      de: '&copy; 2025 BlueSeasFishing.com. Alle Rechte vorbehalten.',
      pt: '&copy; 2025 BlueSeasFishing.com. Todos os direitos reservados.',
      ru: '&copy; 2025 BlueSeasFishing.com. Все права защищены.',
      el: '&copy; 2025 BlueSeasFishing.com. Με επιφύλαξη κάθε δικαιώματος.',
      ar: '&copy; 2025 BlueSeasFishing.com. جميع الحقوق محفوظة.' },
    '>What\u2019s Biting — ': {
      fr: '>Qu\u2019est-ce qui mord — ', el: '>Τι δαγκώνει — ' },
    ">What's Biting – ": {
      de: '>Was beißt – ' },
    ">What's Biting — ": {
      fr: '>Qu\u2019est-ce qui mord — ', de: '>Was beißt — ', el: '>Τι δαγκώνει — ' },
  };
  let navTotal = 0, navFiles = 0;
  for (const L of LOCALES) {
    const pages = walkHtml(join(ROOT, L));
    for (const p of pages) {
      let html = readFileSync(p, 'utf8');
      const before = html;
      for (const [en, txs] of Object.entries({ ...en2tx, ...FOOTER_EN2TX })) {
        const tx = txs[L];
        if (!tx || !html.includes(en)) continue;
        const [out, c] = applyPair(html, en, tx, true);
        html = out; navTotal += c;
      }
      if (html !== before) { writeFileSync(p, html, 'utf8'); navFiles++; }
    }
  }
  console.log(`shared nav/footer map: ${navTotal} replacements across ${navFiles} files`);
}
