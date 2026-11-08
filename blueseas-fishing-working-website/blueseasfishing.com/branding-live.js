/* branding-live.js — site-wide navbar helper
   - Ensures a localized “Member Login” / “My Account” link is present and deduped
   - Supports en, es, fr, de, pt, ru, el, ar locales
*/
(function () {
  function getLang() {
    var l = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().trim();
    if (l.length > 2) l = l.slice(0, 2);
    return l;
  }

  var TRANSLATIONS = {
    en: { login: 'Member Login', account: 'My Account' },
    es: { login: 'Inicio de sesión de miembro', account: 'Mi cuenta' },
    fr: { login: 'Connexion membre', account: 'Mon compte' },
    de: { login: 'Mitglieder-Login', account: 'Mein Konto' },
    pt: { login: 'Login de membro', account: 'Minha conta' },
    ru: { login: 'Вход для участников', account: 'Мой аккаунт' },
    el: { login: 'Είσοδος μέλους', account: 'Ο λογαριασμός μου' },
    ar: { login: 'دخول الأعضاء', account: 'حسابي' }
  };

  function isLoginLink(a) {
    var href = (a.getAttribute('href') || '').toLowerCase();
    var txt  = (a.textContent || '').toLowerCase();
    return href.includes('/login') || /login|sign\s*in|miembro|mitglieder|connexion|участников|μέλους|الأعضاء/.test(txt);
  }

  function findNavLists(root) {
    var lists = root.querySelectorAll
      ? root.querySelectorAll('#navbar-nav, .navbar-nav, nav ul')
      : [];
    return Array.from(lists).filter(function (ul) {
      return ul.querySelector('a');
    });
  }

  function closestLi(el) {
    return el && el.closest ? el.closest('li') : null;
  }

  function addLoginTo(ul) {
    if (!ul || ul.__bsfLoginDone) return;

    if (ul.querySelector('a') && Array.from(ul.querySelectorAll('a')).some(isLoginLink)) {
      ul.__bsfLoginDone = true;
      return;
    }

    var lang = getLang();
    var t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    var prefix = lang === 'en' ? '' : '/' + lang;

    var li = document.createElement('li');
    var a  = document.createElement('a');
    a.href = prefix + '/login.html';
    a.textContent = t.login;
    a.className = 'nav-link member-link';
    li.appendChild(a);

    var uploadBtn =
      ul.querySelector('a[href*="fish-id"], a[href*="/fish-id.html"], a.btn.btn-primary, a.btn');
    var beforeNode = uploadBtn ? closestLi(uploadBtn) : null;

    if (beforeNode && beforeNode.parentElement === ul) {
      ul.insertBefore(li, beforeNode);
    } else {
      ul.appendChild(li);
    }

    ul.__bsfLoginDone = true;
  }

  function run(root) {
    findNavLists(root).forEach(addLoginTo);
  }

  /* ===== State-aware membership link =====
     Static menus carry <a ... class="member-link">...</a> -> /login.html.
     Once the server says who we are, flip logged-in users to localized "My Account" -> /members-area.html. */
  var MEMBER_SEL = '.member-link, nav a[href*="/login"], .top a[href*="/login"], header a[href*="/login"]';

  function applyMemberState(user) {
    var lang = getLang();
    var t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    var prefix = lang === 'en' ? '' : '/' + lang;

    var links = document.querySelectorAll(MEMBER_SEL);
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      a.setAttribute('data-member-link', '1');
      if (user) {
        a.textContent = t.account;
        a.href = prefix + '/members-area.html';
      } else {
        a.textContent = t.login;
        a.href = prefix + '/login.html';
      }
    }
  }

  function refreshMemberState() {
    fetch('/api/membership.php?action=me', { credentials: 'include' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var u = (j && j.ok && j.data) ? j.data.user : null;
        applyMemberState(u && u.email ? u : null);
      })
      .catch(function () { /* offline: keep static label */ });
  }

  window.BSF_BRANDING = { applyMemberState: applyMemberState, refresh: refreshMemberState };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { run(document); refreshMemberState(); });
  } else {
    run(document); refreshMemberState();
  }

  var mo = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var m = muts[i];
      if (m.addedNodes && m.addedNodes.length) {
        for (var j = 0; j < m.addedNodes.length; j++) {
          var n = m.addedNodes[j];
          if (n.nodeType === 1) run(n);
        }
      }
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
