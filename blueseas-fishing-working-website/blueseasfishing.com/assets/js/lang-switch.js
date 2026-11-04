/* lang-switch.js — language switcher anchored top-right of the site header.
 * Detects the current locale from <html lang>, shows its flag on the button,
 * and links to the same path under the target locale prefix.
 * v3: header-anchored (was a floating bottom-right pill), flag icons from
 * /assets/images/flags/<code>.png.
 * v4: nav gets right padding on wider screens so wrapped menus never run
 * underneath the switcher. Loaded on every page (defer). */
(function () {
  if (window.__bsfLangInit) return;
  window.__bsfLangInit = true;

  var LOCALES = [
    ['en', 'English'], ['es', 'Español'], ['fr', 'Français'],
    ['de', 'Deutsch'], ['pt', 'Português'], ['ru', 'Русский'],
    ['el', 'Ελληνικά'], ['ar', 'العربية']
  ];
  var PREFIXES = LOCALES.map(function (l) { return '/' + l[0]; });
  var FLAG = function (code) {
    return '<img src="/assets/images/flags/' + code + '.png" alt="" width="24" height="16" loading="lazy">';
  };

  function currentLang() {
    var l = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    return /^[a-z]{2}$/.test(l) ? l : 'en';
  }
  function pathInLang(lang) {
    var path = location.pathname;
    // strip any known locale prefix
    for (var i = 0; i < PREFIXES.length; i++) {
      if (path === PREFIXES[i]) return '/';
      if (path.indexOf(PREFIXES[i] + '/') === 0) path = path.slice(PREFIXES[i].length);
    }
    if (lang === 'en') return path;
    return '/' + lang + (path === '/' ? '/' : path);
  }

  var cur = currentLang();

  // self-injected styles (no shared CSS edit needed)
  var css = document.createElement('style');
  css.textContent =
    'html,body{max-width:100%;overflow-x:hidden}' +
    'h1,h2,h3,h4,h5,h6,p,li,td,th,a,span,label,.btn,.card{overflow-wrap:break-word;word-wrap:break-word;hyphens:auto}' +
    '.container,.hero>.container,.hero-content,.wrap,.topwrap,.guide-wrap,.guide-nav-inner{min-width:0;box-sizing:border-box}' +
    '.hero>.container,.hero-content{width:100%}' +
    '.d-flex,.topwrap,.top,.navbar>.container,.nav{flex-wrap:wrap!important;min-width:0}' +
    '.grid>*,.steps>*,.tips-grid>*,.footer-content>*,.hero-stats>*,.quick-grid>*,.plans>*,.sub-grid>*,.row>*,.cols>*{min-width:0;max-width:100%}' +
    '.bsf-lang{position:absolute;right:14px;top:50%;transform:translateY(-50%);z-index:9999;' +
    'font:14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif}' +
    '.bsf-lang-btn{display:flex;align-items:center;gap:7px;padding:7px 12px;border:1px solid #38bdf8;' +
    'border-radius:20px;background:#0b3d5c;color:#fff;cursor:pointer;' +
    'box-shadow:0 4px 14px rgba(0,0,0,.25);font-weight:600}' +
    '.bsf-lang-btn img{border-radius:2px;display:block}' +
    '.bsf-lang-list{position:absolute;right:0;top:calc(100% + 8px);margin:0;padding:6px;list-style:none;' +
    'background:#fff;border:1px solid #cfe3ef;border-radius:12px;' +
    'box-shadow:0 8px 30px rgba(0,0,0,.22);min-width:170px}' +
    '.bsf-lang-list a{display:flex;align-items:center;gap:9px;padding:8px 12px;color:#0b3d5c;' +
    'text-decoration:none;border-radius:8px}' +
    '.bsf-lang-list a:hover{background:#e8f4fc}' +
    '.bsf-lang-list img{border-radius:2px;display:block}' +
    '.bsf-lang-ar{font-size:15px}' +
    '@media (min-width:601px){.navbar,.topbar .topwrap,.top{padding-right:120px!important}nav.guide-nav{padding-right:130px!important}}' +
    '@media (max-width:768px){' +
    '.container,.hero>.container,.hero-content,.wrap,.topwrap{width:100%;max-width:100%}' +
    '.container{padding-left:16px;padding-right:16px}' +
    'h1{font-size:clamp(24px,6.5vw,34px)!important;letter-spacing:-.5px}' +
    'h2{font-size:clamp(20px,5.5vw,28px)!important;letter-spacing:-.5px}' +
    'h3{font-size:clamp(18px,4.5vw,22px)!important}' +
    '.hero .d-flex{flex-direction:column;align-items:stretch}' +
    '.hero .d-flex .btn{width:100%}' +
    '.btn{max-width:100%;white-space:normal;text-align:center}' +
    '.btn-lg{padding:14px 20px;font-size:16px}' +
    '.compare,.st-table,.r-table,.forum-table{display:block;width:100%;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}' +
    '.newsletter-form select{max-width:100%!important;width:100%;flex:1 1 100%}' +
    '.newsletter-form button{flex:1 1 100%;white-space:normal}' +
    '}' +
    '@media (max-width:600px){' +
    '.bsf-lang{right:8px;top:10px;transform:none}' +
    '.bsf-lang-btn{padding:6px 9px}' +
    '.navbar,nav.guide-nav,.topbar .topwrap,.top{padding-right:84px!important}' +
    '.modal .row{grid-template-columns:1fr!important}' +
    '}' +
    '@media (max-width:520px){.hero-stats{grid-template-columns:minmax(0,1fr)!important}}';
  document.head.appendChild(css);

  var wrap = document.createElement('div');
  wrap.className = 'bsf-lang';
  wrap.innerHTML =
    '<button class="bsf-lang-btn" aria-haspopup="listbox" aria-expanded="false" title="Change language">' +
    FLAG(cur) + '<span>' + cur.toUpperCase() + '</span></button><ul class="bsf-lang-list" role="listbox" hidden></ul>';
  var list = wrap.querySelector('.bsf-lang-list');
  var btn = wrap.querySelector('.bsf-lang-btn');

  LOCALES.forEach(function (l) {
    if (l[0] === cur) return;
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.setAttribute('role', 'option');
    a.href = pathInLang(l[0]);
    a.innerHTML = FLAG(l[0]) + '<span>' + l[1] + '</span>';
    if (l[0] === 'ar') a.className = 'bsf-lang-ar';
    li.appendChild(a);
    list.appendChild(li);
  });

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = list.hidden;
    list.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', function () {
    if (!list.hidden) { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
  });

  // Anchor into the site header so it sits top-right in the layout;
  // fall back to the guide nav (species/guide pages), then the body.
  function place() {
    var host = document.querySelector('header.header, header.topbar, .topbar, nav.guide-nav, nav.navbar, .top, header, nav');
    if (!host) { document.body.appendChild(wrap); return; }
    var cs = window.getComputedStyle(host);
    if (cs.position === 'static') host.style.position = 'relative';
    host.appendChild(wrap);
  }
  if (document.body) place();
  else document.addEventListener('DOMContentLoaded', place);
})();
