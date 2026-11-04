/**
 * nav-back.js — site-wide Back / Home pill + scroll-to-top button (injected, no template changes)
 *
 * Back/Home pill:
 * - Skips the homepage entirely (path "/" or /index.html)
 * - Back: returns to the previous page when the visitor came from within the
 *   site (referrer is us); otherwise behaves as a Home link, so it never dead-ends
 * - Home: links to the homepage OF THE CURRENT LANGUAGE (/<lang>/ for locale
 *   mirrors, / for English) — v3 fix: it used to hard-link to / and dumped
 *   Spanish/Greek/etc. visitors back onto the English site
 *
 * Scroll-to-top button:
 * - On every page, homepage included — long pages get a floating "?" up-arrow
 * - Hidden until the visitor scrolls past ~400px, then fades in (bottom-right,
 *   so it never collides with the Back/Home pill at bottom-left)
 * - Respects prefers-reduced-motion (instant jump instead of smooth scroll)
 *
 * - Both sit above the safe area on mobile, below the gallery modal (z-index 9000 < 9999)
 * - All styles injected here so this one file is self-contained
 */
(function () {
  'use strict';
  var path = location.pathname.replace(/\/+$/, '') || '/';
  var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
  if (!/^[a-z]{2}$/.test(lang)) lang = 'en';
  var homeUrl = lang === 'en' ? '/' : '/' + lang + '/';
  var isHome = path === '/' || path === '/index.html' ||
    (lang !== 'en' && (path === '/' + lang || path === '/' + lang + '/index.html'));

  /* localized pill labels — one shared file serves every language mirror */
  var LBL = {
    en:    { back: '\u2190 Back',      home: 'Home',      top: 'Back to top',           nav: 'Back and home navigation' },
    es:    { back: '\u2190 Atrás',     home: 'Inicio',    top: 'Volver arriba',         nav: 'Navegación de atrás e inicio' },
    fr:    { back: '\u2190 Retour',    home: 'Accueil',   top: 'Retour en haut',        nav: 'Navigation retour et accueil' },
    de:    { back: '\u2190 Zurück',    home: 'Start',     top: 'Nach oben',             nav: 'Zurück- und Start-Navigation' },
    pt:    { back: '\u2190 Voltar',    home: 'Início',    top: 'Voltar ao topo',        nav: 'Navegação de volta e início' },
    ru:    { back: '\u2190 Назад',     home: 'Главная',   top: 'Наверх',                nav: 'Навигация «назад» и «главная»' },
    el:    { back: '\u2190 Πίσω',      home: 'Αρχική',    top: 'Επιστροφή στην κορυφή', nav: 'Πλοήγηση πίσω και αρχική' },
    ar:    { back: '\u2190 رجوع',      home: 'الرئيسية',  top: 'العودة إلى الأعلى',     nav: 'التنقل للخلف والرئيسية' }
  };
  var T = LBL[lang] || LBL.en;

  var css = [
    '#bsf-backbar{position:fixed;left:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));',
    'z-index:9000;display:flex;gap:8px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;}',
    '#bsf-backbar a{display:inline-block;padding:9px 16px;border-radius:999px;',
    'background:#1a365d;color:#fff;font-size:14px;font-weight:600;line-height:1;',
    'text-decoration:none;box-shadow:0 4px 14px rgba(3,7,18,.35);border:1px solid rgba(255,255,255,.25);',
    '-webkit-tap-highlight-color:transparent;}',
    '#bsf-backbar a:active{transform:translateY(1px);}',
    '#bsf-backbar a:hover{background:#2c5282;}',

    '#bsf-scrolltop{position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));',
    'z-index:9000;width:44px;height:44px;border-radius:50%;background:#1a365d;color:#fff;',
    'border:1px solid rgba(255,255,255,.25);font-size:20px;line-height:1;cursor:pointer;',
    'box-shadow:0 4px 14px rgba(3,7,18,.35);opacity:0;pointer-events:none;',
    'transition:opacity .25s ease,background .2s ease;-webkit-tap-highlight-color:transparent;}',
    '#bsf-scrolltop.is-visible{opacity:1;pointer-events:auto;}',
    '#bsf-scrolltop:hover{background:#2c5282;}',
    '#bsf-scrolltop:active{transform:translateY(1px);}',
    '#bsf-scrolltop:focus-visible{outline:2px solid #68d391;outline-offset:2px;}',

    '@media print{#bsf-backbar,#bsf-scrolltop{display:none}}'
  ].join('');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---- Back / Home pill (not on the homepage) ---- */
  if (!isHome && !document.getElementById('bsf-backbar')) {
    var bar = document.createElement('div');
    bar.id = 'bsf-backbar';
    bar.setAttribute('role', 'navigation');
    bar.setAttribute('aria-label', T.nav);

    var back = document.createElement('a');
    back.href = homeUrl;
    var sameSite = false;
    try {
      sameSite = !!(document.referrer && new URL(document.referrer).hostname === location.hostname);
    } catch (e) { sameSite = false; }
    if (sameSite) {
      back.addEventListener('click', function (ev) {
        ev.preventDefault();
        history.back();
      });
    }
    back.textContent = T.back;

    var home = document.createElement('a');
    home.href = homeUrl;
    home.textContent = T.home;

    bar.appendChild(back);
    bar.appendChild(home);
    document.body.appendChild(bar);
  }

  /* ---- Scroll-to-top button (every page) ---- */
  if (!document.getElementById('bsf-scrolltop')) {
    var btn = document.createElement('button');
    btn.id = 'bsf-scrolltop';
    btn.type = 'button';
    btn.setAttribute('aria-label', T.top);
    btn.title = T.top;
    btn.textContent = '\u2191';
    document.body.appendChild(btn);

    var SHOW_AFTER = 400;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var update = function () {
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      btn.classList.toggle('is-visible', y > SHOW_AFTER);
    };

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(function () { update(); ticking = false; });
      }
    }, { passive: true });

    btn.addEventListener('click', function () {
      try {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      } catch (e) {
        window.scrollTo(0, 0);
      }
    });

    update();
  }
})();
