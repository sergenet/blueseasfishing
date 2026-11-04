// tools/i18n/localize-members-area.mjs — localize the script-generated UI text
// in <locale>/members-area.html.
//
// Same mechanism and rationale as localize-trip-planner.mjs: transformPage
// masks <script> blocks by copying them VERBATIM from the EN source, so the
// members-area script (monthly brief header, season chips, intel search
// messages, save/subscribe status lines, billing/logout button states) ships
// in English on every locale page — and any direct edit to the locale files
// is reverted by the next mirror-auth run. This module is therefore imported
// by mirror-auth.mjs and re-applied right after page regeneration: pure string
// replacement, no network, idempotent.
//
// The `manageReset` value must match the locale's translated HTML button
// (transformPage translates `id="manage-plan">…`), otherwise a failed billing
// redirect would flip the button back to English.
//
// Also runnable standalone: node tools/i18n/localize-members-area.mjs [--dry-run]
import { readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');

const EN = {
  months: `var MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];`,
  briefHead: `'<h3 style="margin-bottom:0">What should be biting in ' + esc(def.label) + ' — ' + MONTH_NAMES[nowMonth-1] + '</h3>' +`,
  noBrief: `No species matched this region yet — our coverage there is still growing.`,
  chip: `(p.inSeason?'In season':'Off-season')`,
  briefBaits: `<div><strong>Baits:</strong> `,
  briefSeason: `<div><strong>Season:</strong> `,
  briefHot: `<div class="muted" style="font-size:14px">Hotspots: `,
  intelIdle: `Start typing to search all 548 species.`,
  intelNoHit: `No species matched “`,
  intelBaits: `<div style="font-size:14px"><strong>Baits:</strong> `,
  intelSeason: `<div style="font-size:14px"><strong>Season:</strong> `,
  profile: `>Profile</a>`,
  premiumMember: `|| 'Premium Member'`,
  loadErr: `Could not load the species database. Refresh to retry.`,
  prefSaved: `'Preferences saved on this device.'`,
  saving: `'Saving…'`,
  savedMail: `'Saved — the brief will arrive weekly at ' + email + '. Check your inbox for a confirmation from contact@blueseasfishing.com.'`,
  savedErr: `'Saved on this device, but the email signup failed: ' + e.message + '. Try again in a moment.'`,
  subFail: `|| 'Subscribe failed'`,
  regionsUnavail: `'<option value="">Regions unavailable</option>'`,
  regionsErr: `'<option value="">Could not load regions — refresh to retry</option>'`,
  validEmail: `'Enter a valid email address.'`,
  agreeReq: `'Please agree to receive the weekly brief.'`,
  subscribing: `'Subscribing…'`,
  signupFail: `|| 'Signup failed'`,
  subscribed: `'You\\'re subscribed — the next brief will arrive at ' + email + '. Check for a confirmation from contact@blueseasfishing.com.'`,
  opening: `managePlan.textContent = 'Opening…';`,
  billingFail: `Could not open billing management.`,
  manageReset: `managePlan.textContent = 'Manage Plan';`,
  loggingOut: `logout.textContent = 'Logging out…';`,
};

const L10N = {
  es: {
    months: `var MONTH_NAMES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];`,
    briefHead: `'<h3 style="margin-bottom:0">Qué debe picar en ' + esc(def.label) + ' — ' + MONTH_NAMES[nowMonth-1] + '</h3>' +`,
    noBrief: `Ninguna especie coincide aún con esta región — nuestra cobertura allí sigue creciendo.`,
    chip: `(p.inSeason?'En temporada':'Fuera de temporada')`,
    briefBaits: `<div><strong>Cebos:</strong> `,
    briefSeason: `<div><strong>Temporada:</strong> `,
    briefHot: `<div class="muted" style="font-size:14px">Puntos calientes: `,
    intelIdle: `Empiece a escribir para buscar entre las 548 especies.`,
    intelNoHit: `Ninguna especie coincidió con “`,
    intelBaits: `<div style="font-size:14px"><strong>Cebos:</strong> `,
    intelSeason: `<div style="font-size:14px"><strong>Temporada:</strong> `,
    profile: `>Perfil</a>`,
    premiumMember: `|| 'Miembro Premium'`,
    loadErr: `No se pudo cargar la base de datos de especies. Actualice para reintentar.`,
    prefSaved: `'Preferencias guardadas en este dispositivo.'`,
    saving: `'Guardando…'`,
    savedMail: `'Guardado — el informe llegará cada semana a ' + email + '. Revise su bandeja de entrada para la confirmación de contact@blueseasfishing.com.'`,
    savedErr: `'Guardado en este dispositivo, pero el registro de correo falló: ' + e.message + '. Inténtelo de nuevo en un momento.'`,
    subFail: `|| 'Error al suscribirse'`,
    regionsUnavail: `'<option value="">Regiones no disponibles</option>'`,
    regionsErr: `'<option value="">No se pudieron cargar las regiones — actualice para reintentar</option>'`,
    validEmail: `'Introduzca una dirección de correo válida.'`,
    agreeReq: `'Acepte recibir el informe semanal.'`,
    subscribing: `'Suscribiendo…'`,
    signupFail: `|| 'Error en el registro'`,
    subscribed: `'Suscrito — el próximo informe llegará a ' + email + '. Busque la confirmación de contact@blueseasfishing.com.'`,
    opening: `managePlan.textContent = 'Abriendo…';`,
    billingFail: `No se pudo abrir la gestión de facturación.`,
    manageReset: `managePlan.textContent = 'Gestionar plan';`,
    loggingOut: `logout.textContent = 'Cerrando sesión…';`,
  },
  fr: {
    months: `var MONTH_NAMES = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];`,
    briefHead: `'<h3 style="margin-bottom:0">Ce qui mord en ' + esc(def.label) + ' — ' + MONTH_NAMES[nowMonth-1] + '</h3>' +`,
    noBrief: `Aucune espèce ne correspond encore à cette région — notre couverture y grandit encore.`,
    chip: `(p.inSeason?'En saison':'Hors saison')`,
    briefBaits: `<div><strong>Appâts:</strong> `,
    briefSeason: `<div><strong>Saison:</strong> `,
    briefHot: `<div class="muted" style="font-size:14px">Spots: `,
    intelIdle: `Commencez à taper pour rechercher parmi les 548 espèces.`,
    intelNoHit: `Aucune espèce ne correspond à “`,
    intelBaits: `<div style="font-size:14px"><strong>Appâts:</strong> `,
    intelSeason: `<div style="font-size:14px"><strong>Saison:</strong> `,
    profile: `>Profil</a>`,
    premiumMember: `|| 'Membre Premium'`,
    loadErr: `Impossible de charger la base des espèces. Rechargez la page pour réessayer.`,
    prefSaved: `'Préférences enregistrées sur cet appareil.'`,
    saving: `'Enregistrement…'`,
    savedMail: `'Enregistré — le brief arrivera chaque semaine à ' + email + '. Vérifiez votre boîte de réception pour la confirmation de contact@blueseasfishing.com.'`,
    savedErr: `'Enregistré sur cet appareil, mais l’inscription par e-mail a échoué : ' + e.message + '. Réessayez dans un instant.'`,
    subFail: `|| 'Échec de l’abonnement'`,
    regionsUnavail: `'<option value="">Régions indisponibles</option>'`,
    regionsErr: `'<option value="">Impossible de charger les régions — rechargez pour réessayer</option>'`,
    validEmail: `'Saisissez une adresse e-mail valide.'`,
    agreeReq: `'Veuillez accepter de recevoir le brief hebdomadaire.'`,
    subscribing: `'Abonnement…'`,
    signupFail: `|| 'Échec de l’inscription'`,
    subscribed: `'Vous êtes abonné — le prochain brief arrivera à ' + email + '. Recherchez la confirmation de contact@blueseasfishing.com.'`,
    opening: `managePlan.textContent = 'Ouverture…';`,
    billingFail: `Impossible d’ouvrir la gestion de facturation.`,
    manageReset: `managePlan.textContent = 'Gérer le forfait';`,
    loggingOut: `logout.textContent = 'Déconnexion…';`,
  },
  de: {
    months: `var MONTH_NAMES = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];`,
    briefHead: `'<h3 style="margin-bottom:0">Was beißt in ' + esc(def.label) + ' — ' + MONTH_NAMES[nowMonth-1] + '</h3>' +`,
    noBrief: `Noch keine Art passt zu dieser Region — unsere Abdeckung dort wächst noch.`,
    chip: `(p.inSeason?'In Saison':'Außerhalb der Saison')`,
    briefBaits: `<div><strong>Köder:</strong> `,
    briefSeason: `<div><strong>Saison:</strong> `,
    briefHot: `<div class="muted" style="font-size:14px">Hotspots: `,
    intelIdle: `Tippen Sie, um alle 548 Arten zu durchsuchen.`,
    intelNoHit: `Keine Art passte zu “`,
    intelBaits: `<div style="font-size:14px"><strong>Köder:</strong> `,
    intelSeason: `<div style="font-size:14px"><strong>Saison:</strong> `,
    profile: `>Profil</a>`,
    premiumMember: `|| 'Premium-Mitglied'`,
    loadErr: `Die Artdatenbank konnte nicht geladen werden. Seite neu laden und erneut versuchen.`,
    prefSaved: `'Einstellungen auf diesem Gerät gespeichert.'`,
    saving: `'Wird gespeichert…'`,
    savedMail: `'Gespeichert — der Brief kommt wöchentlich an ' + email + '. Prüfen Sie Ihr Postfach auf die Bestätigung von contact@blueseasfishing.com.'`,
    savedErr: `'Auf diesem Gerät gespeichert, aber die E-Mail-Anmeldung ist fehlgeschlagen: ' + e.message + '. Bitte gleich erneut versuchen.'`,
    subFail: `|| 'Anmeldung fehlgeschlagen'`,
    regionsUnavail: `'<option value="">Regionen nicht verfügbar</option>'`,
    regionsErr: `'<option value="">Regionen konnten nicht geladen werden — neu laden und erneut versuchen</option>'`,
    validEmail: `'Geben Sie eine gültige E-Mail-Adresse ein.'`,
    agreeReq: `'Bitte stimmen Sie dem wöchentlichen Brief zu.'`,
    subscribing: `'Anmeldung läuft…'`,
    signupFail: `|| 'Registrierung fehlgeschlagen'`,
    subscribed: `'Sie sind angemeldet — das nächste Brief kommt an ' + email + '. Suchen Sie die Bestätigung von contact@blueseasfishing.com.'`,
    opening: `managePlan.textContent = 'Wird geöffnet…';`,
    billingFail: `Die Abrechnungsverwaltung konnte nicht geöffnet werden.`,
    manageReset: `managePlan.textContent = 'Plan verwalten';`,
    loggingOut: `logout.textContent = 'Abmeldung…';`,
  },
  pt: {
    months: `var MONTH_NAMES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];`,
    briefHead: `'<h3 style="margin-bottom:0">O que deve morder em ' + esc(def.label) + ' — ' + MONTH_NAMES[nowMonth-1] + '</h3>' +`,
    noBrief: `Nenhuma espécie corresponde ainda a esta região — nossa cobertura lá ainda está crescendo.`,
    chip: `(p.inSeason?'Em temporada':'Fora de temporada')`,
    briefBaits: `<div><strong>Iscas:</strong> `,
    briefSeason: `<div><strong>Temporada:</strong> `,
    briefHot: `<div class="muted" style="font-size:14px">Pontos quentes: `,
    intelIdle: `Comece a digitar para buscar entre as 548 espécies.`,
    intelNoHit: `Nenhuma espécie correspondeu a “`,
    intelBaits: `<div style="font-size:14px"><strong>Iscas:</strong> `,
    intelSeason: `<div style="font-size:14px"><strong>Temporada:</strong> `,
    profile: `>Perfil</a>`,
    premiumMember: `|| 'Membro Premium'`,
    loadErr: `Não foi possível carregar o banco de espécies. Atualize a página para tentar novamente.`,
    prefSaved: `'Preferências salvas neste dispositivo.'`,
    saving: `'Salvando…'`,
    savedMail: `'Salvo — o boletim chegará semanalmente a ' + email + '. Verifique sua caixa de entrada para a confirmação de contact@blueseasfishing.com.'`,
    savedErr: `'Salvo neste dispositivo, mas o cadastro por e-mail falhou: ' + e.message + '. Tente novamente em instantes.'`,
    subFail: `|| 'Falha na inscrição'`,
    regionsUnavail: `'<option value="">Regiões indisponíveis</option>'`,
    regionsErr: `'<option value="">Não foi possível carregar as regiões — atualize para tentar novamente</option>'`,
    validEmail: `'Digite um endereço de e-mail válido.'`,
    agreeReq: `'Por favor, concorde em receber o boletim semanal.'`,
    subscribing: `'Inscrevendo…'`,
    signupFail: `|| 'Falha no cadastro'`,
    subscribed: `'Inscrito — o próximo boletim chegará a ' + email + '. Procure a confirmação de contact@blueseasfishing.com.'`,
    opening: `managePlan.textContent = 'Abrindo…';`,
    billingFail: `Não foi possível abrir o gerenciamento de cobrança.`,
    manageReset: `managePlan.textContent = 'Gerenciar plano';`,
    loggingOut: `logout.textContent = 'Saindo…';`,
  },
  ru: {
    months: `var MONTH_NAMES = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];`,
    briefHead: `'<h3 style="margin-bottom:0">Что клевает в ' + esc(def.label) + ' — ' + MONTH_NAMES[nowMonth-1] + '</h3>' +`,
    noBrief: `Пока ни один вид не подходит под этот регион — наше покрытие там ещё расширяется.`,
    chip: `(p.inSeason?'В сезоне':'Вне сезона')`,
    briefBaits: `<div><strong>Приманки:</strong> `,
    briefSeason: `<div><strong>Сезон:</strong> `,
    briefHot: `<div class="muted" style="font-size:14px">Места ловли: `,
    intelIdle: `Начните вводить текст, чтобы поискать среди 548 видов.`,
    intelNoHit: `Ни один вид не совпал с “`,
    intelBaits: `<div style="font-size:14px"><strong>Приманки:</strong> `,
    intelSeason: `<div style="font-size:14px"><strong>Сезон:</strong> `,
    profile: `>Профиль</a>`,
    premiumMember: `|| 'Премиум-участник'`,
    loadErr: `Не удалось загрузить базу видов. Обновите страницу и повторите попытку.`,
    prefSaved: `'Настройки сохранены на этом устройстве.'`,
    saving: `'Сохранение…'`,
    savedMail: `'Сохранено — рассылка будет приходить еженедельно на ' + email + '. Проверьте входящие: подтверждение от contact@blueseasfishing.com.'`,
    savedErr: `'Сохранено на этом устройстве, но подписка по почте не удалась: ' + e.message + '. Попробуйте ещё раз через мгновение.'`,
    subFail: `|| 'Не удалось подписаться'`,
    regionsUnavail: `'<option value="">Регионы недоступны</option>'`,
    regionsErr: `'<option value="">Не удалось загрузить регионы — обновите страницу для повтора</option>'`,
    validEmail: `'Введите действительный адрес электронной почты.'`,
    agreeReq: `'Пожалуйста, согласитесь получать еженедельную рассылку.'`,
    subscribing: `'Подписка…'`,
    signupFail: `|| 'Не удалось зарегистрироваться'`,
    subscribed: `'Вы подписаны — следующая рассылка придёт на ' + email + '. Найдите подтверждение от contact@blueseasfishing.com.'`,
    opening: `managePlan.textContent = 'Открытие…';`,
    billingFail: `Не удалось открыть управление оплатой.`,
    manageReset: `managePlan.textContent = 'Управление планом';`,
    loggingOut: `logout.textContent = 'Выход…';`,
  },
  el: {
    months: `var MONTH_NAMES = ['ιανουάριος','φεβρουάριος','μάρτιος','απρίλιος','μάιος','ιούνιος','ιούλιος','αύγουστος','σεπτέμβριος','οκτώβριος','νοέμβριος','δεκέμβριος'];`,
    briefHead: `'<h3 style="margin-bottom:0">Τι δαγκώνει στο ' + esc(def.label) + ' — ' + MONTH_NAMES[nowMonth-1] + '</h3>' +`,
    noBrief: `Κανένα είδος δεν ταιριάζει ακόμα σε αυτή την περιοχή — η κάλυψή μας εκεί αναπτύσσεται ακόμα.`,
    chip: `(p.inSeason?'Σε σεζόν':'Εκτός σεζόν')`,
    briefBaits: `<div><strong>Δολώματα:</strong> `,
    briefSeason: `<div><strong>Σεζόν:</strong> `,
    briefHot: `<div class="muted" style="font-size:14px">Καλύτερα σημεία: `,
    intelIdle: `Γράψτε για αναζήτηση στα 548 είδη.`,
    intelNoHit: `Κανένα είδος δεν ταιριάζει με “`,
    intelBaits: `<div style="font-size:14px"><strong>Δολώματα:</strong> `,
    intelSeason: `<div style="font-size:14px"><strong>Σεζόν:</strong> `,
    profile: `>Προφίλ</a>`,
    premiumMember: `|| 'Μέλος Premium'`,
    loadErr: `Δεν ήταν δυνατή η φόρτωση της βάσης ειδών. Κάντε ανανέωση για επανάληψη.`,
    prefSaved: `'Οι προτιμήσεις αποθηκεύτηκαν σε αυτή τη συσκευή.'`,
    saving: `'Αποθήκευση…'`,
    savedMail: `'Αποθηκεύτηκε — το brief θα φτάνει κάθε εβδομάδα στο ' + email + '. Ελέγξτε τα εισερχόμενα για επιβεβαίωση από contact@blueseasfishing.com.'`,
    savedErr: `'Αποθηκεύτηκε σε αυτή τη συσκευή, αλλά η εγγραφή e-mail απέτυχε: ' + e.message + '. Δοκιμάστε ξανά σε λίγο.'`,
    subFail: `|| 'Η συνδρομή απέτυχε'`,
    regionsUnavail: `'<option value="">Οι περιοχές δεν είναι διαθέσιμες</option>'`,
    regionsErr: `'<option value="">Δεν ήταν δυνατή η φόρτωση των περιοχών — ανανεώστε για επανάληψη</option>'`,
    validEmail: `'Δώστε μια έγκυρη διεύθυνση e-mail.'`,
    agreeReq: `'Συναινέστε να λαμβάνετε το εβδομαδιαίο brief.'`,
    subscribing: `'Συνδρομή…'`,
    signupFail: `|| 'Η εγγραφή απέτυχε'`,
    subscribed: `'Είστε συνδρομητής — το επόμενο brief θα φτάσει στο ' + email + '. Αναζητήστε την επιβεβαίωση από contact@blueseasfishing.com.'`,
    opening: `managePlan.textContent = 'Άνοιγμα…';`,
    billingFail: `Δεν ήταν δυνατό το άνοιγμα της διαχείρισης χρεώσεων.`,
    manageReset: `managePlan.textContent = 'Διαχείριση σχεδίου';`,
    loggingOut: `logout.textContent = 'Αποσύνδεση…';`,
  },
  ar: {
    months: `var MONTH_NAMES = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];`,
    briefHead: `'<h3 style="margin-bottom:0">ما الذي يعض في ' + esc(def.label) + ' — ' + MONTH_NAMES[nowMonth-1] + '</h3>' +`,
    noBrief: `لا يوجد نوع يطابق هذه المنطقة بعد — تغطيتنا هناك ما زالت تتوسع.`,
    chip: `(p.inSeason?'في الموسم':'خارج الموسم')`,
    briefBaits: `<div><strong>الطُعم:</strong> `,
    briefSeason: `<div><strong>الموسم:</strong> `,
    briefHot: `<div class="muted" style="font-size:14px">أفضل المواقع: `,
    intelIdle: `ابدأ بالكتابة للبحث في 548 نوعًا.`,
    intelNoHit: `لا يوجد نوع يطابق “`,
    intelBaits: `<div style="font-size:14px"><strong>الطُعم:</strong> `,
    intelSeason: `<div style="font-size:14px"><strong>الموسم:</strong> `,
    profile: `>الملف</a>`,
    premiumMember: `|| 'عضو مميز'`,
    loadErr: `تعذر تحميل قاعدة بيانات الأنواع. حدّث الصفحة للمحاولة مرة أخرى.`,
    prefSaved: `'تم حفظ التفضيلات على هذا الجهاز.'`,
    saving: `'جارٍ الحفظ…'`,
    savedMail: `'تم الحفظ — سيصل النشرة أسبوعيًا إلى ' + email + '. تحقق من بريدك الوارد لتأكيد من contact@blueseasfishing.com.'`,
    savedErr: `'تم الحفظ على هذا الجهاز، لكن تسجيل البريد الإلكتروني فشل: ' + e.message + '. حاول مرة أخرى بعد لحظات.'`,
    subFail: `|| 'فشل الاشتراك'`,
    regionsUnavail: `'<option value="">المناطق غير متاحة</option>'`,
    regionsErr: `'<option value="">تعذر تحميل المناطق — حدّث للمحاولة مرة أخرى</option>'`,
    validEmail: `'أدخل عنوان بريد إلكتروني صالحًا.'`,
    agreeReq: `'يرجى الموافقة على استلام النشرة الأسبوعية.'`,
    subscribing: `'جارٍ الاشتراك…'`,
    signupFail: `|| 'فشل التسجيل'`,
    subscribed: `'تم اشتراكك — ستصل النشرة التالية إلى ' + email + '. ابحث عن التأكيد من contact@blueseasfishing.com.'`,
    opening: `managePlan.textContent = 'جارٍ الفتح…';`,
    billingFail: `تعذر فتح إدارة الفواتير.`,
    manageReset: `managePlan.textContent = 'إدارة الخطة';`,
    loggingOut: `logout.textContent = 'جارٍ تسجيل الخروج…';`,
  },
};

/**
 * Apply per-locale script literals to <locale>/members-area.html for all
 * locales. Idempotent.
 * @returns {{ok: boolean, report: Array<{loc:string, applied:number, already:number}>}}
 */
export function localizeMembersArea({ dryRun = false, quiet = false } = {}) {
  let hardFail = false;
  const report = [];
  for (const [loc, reps] of Object.entries(L10N)) {
    const file = join(ROOT, loc, 'members-area.html');
    if (!existsSync(file)) { console.error(`MISSING FILE ${loc}/members-area.html`); hardFail = true; continue; }
    let html = readFileSync(file, 'utf8');
    let applied = 0, already = 0;
    for (const key of Object.keys(EN)) {
      const find = EN[key], replace = reps[key];
      // A locale string identical to English (de "Hotspots", shared markup) —
      // find === replace counts as already-localized so the tool converges.
      if (replace === find) { already++; continue; }
      if (html.includes(find)) { html = html.split(find).join(replace); applied++; }
      else if (html.includes(replace)) already++;
      else { console.error(`  ${loc}: NOT FOUND and not replaced: ${find.slice(0, 70)}`); hardFail = true; }
    }
    if (!dryRun && applied) writeFileSync(file, html, 'utf8');
    report.push({ loc, applied, already });
    if (!quiet) console.log(`  ${loc}/members-area.html: ${applied} replaced, ${already} already localized${dryRun ? ' (dry run)' : ''}`);
  }
  return { ok: !hardFail, report };
}

function invokedDirectly() {
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1] ?? '');
  } catch { return false; }
}
if (invokedDirectly()) {
  const { ok } = localizeMembersArea({ dryRun: process.argv.includes('--dry-run') });
  process.exit(ok ? 0 : 1);
}
