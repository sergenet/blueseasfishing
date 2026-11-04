/* branding-live.js — site-wide navbar helper
   - Ensures a “Member Login” link is present and deduped
   - No changes to your HTML files required
*/
(function () {
  var LOGIN_HREF = '/login.html';
  var LOGIN_TEXT = 'Member Login';

  function isLoginLink(a) {
    var href = (a.getAttribute('href') || '').toLowerCase();
    var txt  = (a.textContent || '').toLowerCase();
    return href.includes('/login') || /login|sign\s*in/.test(txt);
  }

  function findNavLists(root) {
    // your site uses #navbar-nav; keep fallbacks for safety
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

    // Already has a login link?
    if (ul.querySelector('a') && Array.from(ul.querySelectorAll('a')).some(isLoginLink)) {
      ul.__bsfLoginDone = true;
      return;
    }

    // Create <li><a>Member Login</a></li>
    var li = document.createElement('li');
    var a  = document.createElement('a');
    a.href = LOGIN_HREF;
    a.textContent = LOGIN_TEXT;
    a.className = 'nav-link';         // matches your theme
    li.appendChild(a);

    // Try to place it just before “Upload a Photo” button if present
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
     Static menus carry <a ... class="member-link">Member Login</a> -> /login.html.
     Once the server says who we are, flip logged-in users to "My Account" -> /members-area.html. */
  var MEMBER_SEL = '.member-link, nav a[href*="/login"], .top a[href*="/login"], header a[href*="/login"]';

  function applyMemberState(user) {
    var links = document.querySelectorAll(MEMBER_SEL);
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      a.setAttribute('data-member-link', '1');
      if (user) {
        a.textContent = 'My Account';
        a.href = '/members-area.html';
      } else {
        a.textContent = 'Member Login';
        a.href = '/login.html';
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
      .catch(function () { /* offline: keep static Member Login label */ });
  }

  // Exposed for QA: simulate either state without a real account.
  window.BSF_BRANDING = { applyMemberState: applyMemberState, refresh: refreshMemberState };

  // Initial pass
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { run(document); refreshMemberState(); });
  } else {
    run(document); refreshMemberState();
  }

  // Watch for late-inserted menus (mobile drawer, template hydrations)
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
