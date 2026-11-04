// tools/i18n/localize-trip-planner.mjs — localize the script-generated UI text
// in <locale>/trip-planner.html.
//
// The i18n pipeline masks <script> blocks so functional JS stays byte-identical
// across locales — but mask means COPIED VERBATIM FROM THE EN SOURCE: every
// mirror-auth run rebuilds <locale>/trip-planner.html from the English file,
// which would revert any script edits made directly in the locale files
// (verified 2026-10-16: a mirror run did revert them). So this module is
// imported by mirror-auth.mjs and re-applied after every page regeneration —
// pure string replacement, no network, idempotent.
//
// Also runnable standalone:  node tools/i18n/localize-trip-planner.mjs [--dry-run]
//
// Find patterns that sit INSIDE a larger JS string (result-card markup, the
// "no species" message) are matched as inner substrings — without surrounding
// quotes — so they splice correctly and never break the surrounding JS string.
import { readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');

const EN = {
  months: `var MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];`,
  noSpecies: `No species matched that combination. Try a broader region, another month, or clear the water-type filter.`,
  head: `var head = '<h2 style="margin-top:18px">Your ' + esc(MONTH_NAMES[month-1]) + ' plan for ' + esc(where) + '</h2>' +`,
  sub: `' target species from our 548-profile database, best matches first. Off-season species are marked.</p>';`,
  chip: `(p.inSeason ? 'In season ' + MONTH_NAMES[month-1].slice(0,3) : 'Off-season now')`,
  build: `statusEl.textContent = 'Building plan…';`,
  tip: `'Tip: search the results for "' + q.get('species') + '".'`,
  loadErr: `'Could not load the species database. Refresh to retry.'`,
  global: `'<option value="">Global — all waters</option>'`,
  anyDest: `'<option value="">Any destination (browse by region)</option>'`,
  allWaters: `regionDef ? regionDef.label : 'all waters'`,
  baits: `<strong>Baits &amp; lures</strong>`,
  season: `<strong>Season</strong>`,
  hold: `<strong>Where they hold</strong>`,
  hot: `<strong>Hotspots</strong>`,
  profile: `>Full profile</a>`,
};

const L10N = {
  es: {
    months: `var MONTH_NAMES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];`,
    noSpecies: `Ninguna especie coincidió con esa combinación. Pruebe una región más amplia, otro mes o quite el filtro de tipo de agua.`,
    head: `var head = '<h2 style="margin-top:18px">Su plan de ' + esc(MONTH_NAMES[month-1]) + ' para ' + esc(where) + '</h2>' +`,
    sub: `' especies objetivo de nuestra base de 548 perfiles, primero las mejores coincidencias. Las especies fuera de temporada están marcadas.</p>';`,
    chip: `(p.inSeason ? 'En temporada ' + MONTH_NAMES[month-1].slice(0,3) : 'Fuera de temporada')`,
    build: `statusEl.textContent = 'Creando el plan…';`,
    tip: `'Consejo: busque en los resultados "' + q.get('species') + '".'`,
    loadErr: `'No se pudo cargar la base de datos de especies. Actualice para reintentar.'`,
    global: `'<option value="">Global — todas las aguas</option>'`,
    anyDest: `'<option value="">Cualquier destino (explorar por región)</option>'`,
    allWaters: `regionDef ? regionDef.label : 'todas las aguas'`,
    baits: `<strong>Cebos y señuelos</strong>`,
    season: `<strong>Temporada</strong>`,
    hold: `<strong>Dónde se encuentran</strong>`,
    hot: `<strong>Puntos calientes</strong>`,
    profile: `>Perfil completo</a>`,
  },
  fr: {
    months: `var MONTH_NAMES = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];`,
    noSpecies: `Aucune espèce ne correspond à cette combinaison. Essayez une région plus large, un autre mois ou retirez le filtre de type d’eau.`,
    head: `var head = '<h2 style="margin-top:18px">Votre plan de ' + esc(MONTH_NAMES[month-1]) + ' pour ' + esc(where) + '</h2>' +`,
    sub: `' espèces cibles issues de notre base de 548 profils, les meilleures correspondances d’abord. Les espèces hors saison sont signalées.</p>';`,
    chip: `(p.inSeason ? 'En saison ' + MONTH_NAMES[month-1].slice(0,3) : 'Hors saison')`,
    build: `statusEl.textContent = 'Création du plan…';`,
    tip: `'Astuce : recherchez dans les résultats "' + q.get('species') + '".'`,
    loadErr: `'Impossible de charger la base des espèces. Rechargez la page pour réessayer.'`,
    global: `'<option value="">Global — toutes les eaux</option>'`,
    anyDest: `'<option value="">Toute destination (parcourir par région)</option>'`,
    allWaters: `regionDef ? regionDef.label : 'toutes les eaux'`,
    baits: `<strong>Leurres et appâts</strong>`,
    season: `<strong>Saison</strong>`,
    hold: `<strong>Où les trouver</strong>`,
    hot: `<strong>Spots</strong>`,
    profile: `>Profil complet</a>`,
  },
  de: {
    months: `var MONTH_NAMES = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];`,
    noSpecies: `Keine Art passt zu dieser Kombination. Versuchen Sie eine breitere Region, einen anderen Monat oder entfernen Sie den Wassertyp-Filter.`,
    head: `var head = '<h2 style="margin-top:18px">Ihr ' + esc(MONTH_NAMES[month-1]) + '-Plan für ' + esc(where) + '</h2>' +`,
    sub: `' Zielarten aus unserer Datenbank mit 548 Profilen, beste Treffer zuerst. Arten außerhalb der Saison sind markiert.</p>';`,
    chip: `(p.inSeason ? 'In Saison ' + MONTH_NAMES[month-1].slice(0,3) : 'Außerhalb der Saison')`,
    build: `statusEl.textContent = 'Plan wird erstellt…';`,
    tip: `'Tipp: Suchen Sie in den Ergebnissen nach "' + q.get('species') + '".'`,
    loadErr: `'Die Artdatenbank konnte nicht geladen werden. Seite neu laden und erneut versuchen.'`,
    global: `'<option value="">Global — alle Gewässer</option>'`,
    anyDest: `'<option value="">Jedes Ziel (nach Region durchsuchen)</option>'`,
    allWaters: `regionDef ? regionDef.label : 'allen Gewässern'`,
    baits: `<strong>Köder &amp; Kunstköder</strong>`,
    season: `<strong>Saison</strong>`,
    hold: `<strong>Wo sie stehen</strong>`,
    hot: `<strong>Hotspots</strong>`, // German uses the loanword — identical to EN
    profile: `>Vollständiges Profil</a>`,
  },
  pt: {
    months: `var MONTH_NAMES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];`,
    noSpecies: `Nenhuma espécie correspondeu a essa combinação. Tente uma região mais ampla, outro mês ou remova o filtro de tipo de água.`,
    head: `var head = '<h2 style="margin-top:18px">Seu plano de ' + esc(MONTH_NAMES[month-1]) + ' para ' + esc(where) + '</h2>' +`,
    sub: `' espécies-alvo do nosso banco de 548 perfis, melhores correspondências primeiro. Espécies fora de temporada estão marcadas.</p>';`,
    chip: `(p.inSeason ? 'Em temporada ' + MONTH_NAMES[month-1].slice(0,3) : 'Fora de temporada')`,
    build: `statusEl.textContent = 'Montando o plano…';`,
    tip: `'Dica: pesquise nos resultados por "' + q.get('species') + '".'`,
    loadErr: `'Não foi possível carregar o banco de espécies. Atualize a página para tentar novamente.'`,
    global: `'<option value="">Global — todas as águas</option>'`,
    anyDest: `'<option value="">Qualquer destino (navegar por região)</option>'`,
    allWaters: `regionDef ? regionDef.label : 'todas as águas'`,
    baits: `<strong>Iscas e artificiais</strong>`,
    season: `<strong>Temporada</strong>`,
    hold: `<strong>Onde ficam</strong>`,
    hot: `<strong>Pontos quentes</strong>`,
    profile: `>Perfil completo</a>`,
  },
  ru: {
    months: `var MONTH_NAMES = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];`,
    noSpecies: `Ни один вид не подходит под эту комбинацию. Попробуйте более широкий регион, другой месяц или снимите фильтр типа воды.`,
    head: `var head = '<h2 style="margin-top:18px">Ваш план на ' + esc(MONTH_NAMES[month-1]) + ' для ' + esc(where) + '</h2>' +`,
    sub: `' целевых видов из нашей базы из 548 профилей, лучшие совпадения первыми. Виды вне сезона отмечены.</p>';`,
    chip: `(p.inSeason ? 'В сезоне ' + MONTH_NAMES[month-1].slice(0,3) : 'Сейчас не сезон')`,
    build: `statusEl.textContent = 'Составляем план…';`,
    tip: `'Совет: поиск в результатах по запросу "' + q.get('species') + '".'`,
    loadErr: `'Не удалось загрузить базу видов. Обновите страницу и повторите попытку.'`,
    global: `'<option value="">Все регионы — все воды</option>'`,
    anyDest: `'<option value="">Любое направление (просмотр по регионам)</option>'`,
    allWaters: `regionDef ? regionDef.label : 'всех водах'`,
    baits: `<strong>Приманки</strong>`,
    season: `<strong>Сезон</strong>`,
    hold: `<strong>Места обитания</strong>`,
    hot: `<strong>Места ловли</strong>`,
    profile: `>Полный профиль</a>`,
  },
  el: {
    months: `var MONTH_NAMES = ['ιανουάριος','φεβρουάριος','μάρτιος','απρίλιος','μάιος','ιούνιος','ιούλιος','αύγουστος','σεπτέμβριος','οκτώβριος','νοέμβριος','δεκέμβριος'];`,
    noSpecies: `Κανένα είδος δεν ταιριάζει με αυτόν τον συνδυασμό. Δοκιμάστε μια ευρύτερη περιοχή, άλλον μήνα ή αφαιρέστε το φίλτρο τύπου νερού.`,
    head: `var head = '<h2 style="margin-top:18px">Το πλάνο σας: ' + esc(MONTH_NAMES[month-1]) + ' — ' + esc(where) + '</h2>' +`,
    sub: `' είδη-στόχοι από τη βάση των 548 προφίλ, πρώτα τα καλύτερα. Τα είδη εκτός σεζόν επισημαίνονται.</p>';`,
    chip: `(p.inSeason ? 'Σε σεζόν ' + MONTH_NAMES[month-1].slice(0,3) : 'Εκτός σεζόν τώρα')`,
    build: `statusEl.textContent = 'Δημιουργία πλάνου…';`,
    tip: `'Συμβουλή: αναζητήστε στα αποτελέσματα το "' + q.get('species') + '".'`,
    loadErr: `'Δεν ήταν δυνατή η φόρτωση της βάσης ειδών. Κάντε ανανέωση για επανάληψη.'`,
    global: `'<option value="">Παγκοσμίως — όλα τα νερά</option>'`,
    anyDest: `'<option value="">Οποιοσδήποτε προορισμός (περιήγηση ανά περιοχή)</option>'`,
    allWaters: `regionDef ? regionDef.label : 'όλα τα νερά'`,
    baits: `<strong>Δολώματα</strong>`,
    season: `<strong>Σεζόν</strong>`,
    hold: `<strong>Πού βρίσκονται</strong>`,
    hot: `<strong>Καλύτερα σημεία</strong>`,
    profile: `>Πλήρες προφίλ</a>`,
  },
  ar: {
    months: `var MONTH_NAMES = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];`,
    noSpecies: `لا يوجد نوع يطابق هذا المزيج. جرّب منطقة أوسع أو شهرًا آخر أو أزل تصفية نوع المياه.`,
    head: `var head = '<h2 style="margin-top:18px">خطتك لشهر ' + esc(MONTH_NAMES[month-1]) + ' في ' + esc(where) + '</h2>' +`,
    sub: `' نوعًا مستهدفًا من قاعدة بياناتنا التي تضم 548 ملفًا، أولًا أفضل التطابقات. الأنواع خارج الموسم مميزة.</p>';`,
    chip: `(p.inSeason ? 'في الموسم ' + MONTH_NAMES[month-1].slice(0,3) : 'خارج الموسم الآن')`,
    build: `statusEl.textContent = 'جارٍ إنشاء الخطة…';`,
    tip: `'نصيحة: ابحث في النتائج عن "' + q.get('species') + '".'`,
    loadErr: `'تعذر تحميل قاعدة بيانات الأنواع. حدّث الصفحة للمحاولة مرة أخرى.'`,
    global: `'<option value="">عالمي — كل المياه</option>'`,
    anyDest: `'<option value="">أي وجهة (تصفح حسب المنطقة)</option>'`,
    allWaters: `regionDef ? regionDef.label : 'كل المياه'`,
    baits: `<strong>الطُعم والصناعية</strong>`,
    season: `<strong>الموسم</strong>`,
    hold: `<strong>أين تعيش</strong>`,
    hot: `<strong>أفضل المواقع</strong>`,
    profile: `>الملف الكامل</a>`,
  },
};

/**
 * Apply per-locale script literals to <locale>/trip-planner.html for all
 * locales. Idempotent (locales already localized are reported as such).
 * @returns {{ok: boolean, report: Array<{loc:string, applied:number, already:number}>}}
 */
export function localizeTripPlanner({ dryRun = false, quiet = false } = {}) {
  let hardFail = false;
  const report = [];
  for (const [loc, reps] of Object.entries(L10N)) {
    const file = join(ROOT, loc, 'trip-planner.html');
    if (!existsSync(file)) { console.error(`MISSING FILE ${loc}/trip-planner.html`); hardFail = true; continue; }
    let html = readFileSync(file, 'utf8');
    let applied = 0, already = 0;
    for (const key of Object.keys(EN)) {
      const find = EN[key], replace = reps[key];
      // A locale word identical to English (de "Hotspots") — find === replace
      // counts as already-localized, otherwise every run reports progress and
      // the tool never converges.
      if (replace === find) { already++; continue; }
      if (html.includes(find)) { html = html.split(find).join(replace); applied++; }
      else if (html.includes(replace)) already++;
      else { console.error(`  ${loc}: NOT FOUND and not replaced: ${find.slice(0, 70)}`); hardFail = true; }
    }
    if (!dryRun && applied) writeFileSync(file, html, 'utf8');
    report.push({ loc, applied, already });
    if (!quiet) console.log(`  ${loc}/trip-planner.html: ${applied} replaced, ${already} already localized${dryRun ? ' (dry run)' : ''}`);
  }
  return { ok: !hardFail, report };
}

// CLI entry: run only when invoked directly (not when mirror-auth imports it).
function invokedDirectly() {
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1] ?? '');
  } catch { return false; }
}
if (invokedDirectly()) {
  const { ok } = localizeTripPlanner({ dryRun: process.argv.includes('--dry-run') });
  process.exit(ok ? 0 : 1);
}
