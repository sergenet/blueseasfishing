/* membership.js v4 — front-end member state + tiered free ID limits + premium token */
(function () {
  'use strict';
  var KEY = 'bsf_member_v3';
  var USAGE_KEY = 'bsf_usage_v1';
  var tokenState = { token: null, exp: 0, inflight: null };

  /* Tiered daily AI-identification limits (premium = unlimited).
     Mirrors money-config.js; both read BSF_MONEY_CONFIG when present. */
  var cfg = (window.BSF_MONEY_CONFIG && window.BSF_MONEY_CONFIG.PREMIUM) || {};
  var DAILY_FREE_LIMIT = cfg.FREE_DAILY_LIMIT || 3;
  var DAILY_MEMBER_LIMIT = cfg.MEMBER_DAILY_LIMIT || 5;

  function read(jsonKey, fallback) {
    try { return JSON.parse(localStorage.getItem(jsonKey) || JSON.stringify(fallback)); }
    catch (e) { return fallback; }
  }
  function write(jsonKey, obj) { try { localStorage.setItem(jsonKey, JSON.stringify(obj)); } catch (e) {} }

  function today() { return new Date().toISOString().slice(0, 10); }

  function getMember() { return read(KEY, { status: 'guest' }); }
  function setMember(m) { write(KEY, m); document.dispatchEvent(new Event('bsf-member-change')); }

  function getUsage() {
    var u = read(USAGE_KEY, { byDay: {} });
    var now = Date.now();
    Object.keys(u.byDay).forEach(function (d) {
      if (Math.abs(now - Date.parse(d)) > 35 * 24 * 3600 * 1000) delete u.byDay[d];
    });
    return u;
  }
  function setUsage(u) { write(USAGE_KEY, u); document.dispatchEvent(new Event('bsf-usage-change')); }

  function usedToday() {
    var u = getUsage(); var k = today();
    return (u.byDay[k] && u.byDay[k].identify) || 0;
  }

  function limitFor() {
    var s = getMember().status;
    if (s === 'premium') return Infinity;
    return s === 'member' ? DAILY_MEMBER_LIMIT : DAILY_FREE_LIMIT;
  }

  function remainingFree() {
    var lim = limitFor();
    if (lim === Infinity) return Infinity;
    return Math.max(0, lim - usedToday());
  }

  function recordIdentify() {
    if (getMember().status === 'premium') return;
    var u = getUsage(); var k = today();
    u.byDay[k] = u.byDay[k] || {};
    u.byDay[k].identify = (u.byDay[k].identify || 0) + 1;
    setUsage(u);
  }

  /* Premium/free-member token for the AI API (X-BSF-Premium header).
     Minted same-origin by /api/premium-token.php, verified server-side.
     Short-lived (10 min); cached 9.5 min; failures degrade to guest quota. */
  function getPremiumToken() {
    var s = getMember().status;
    if (s !== 'premium' && s !== 'member') return Promise.resolve(null);
    var now = Date.now();
    if (tokenState.token && tokenState.exp > now + 30000) return Promise.resolve(tokenState.token);
    if (tokenState.inflight) return tokenState.inflight;
    tokenState.inflight = fetch('/api/premium-token.php', { credentials: 'include' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        tokenState.inflight = null;
        if (j && j.ok && j.data && j.data.token) {
          tokenState.token = j.data.token;
          tokenState.exp = now + ((j.data.expires_in || 600) - 30) * 1000;
          return tokenState.token;
        }
        tokenState.token = null; tokenState.exp = 0;
        return null;
      })
      .catch(function () { tokenState.inflight = null; return null; });
    return tokenState.inflight;
  }

  /* Converge the local usage meter with the server's authoritative count
     (e.g. after a 429: the member may have used IDs on another device). */
  function syncUsage(serverUsed) {
    if (getMember().status === 'premium') return;
    var n = parseInt(serverUsed, 10);
    if (!Number.isFinite(n) || n < 0) return;
    var u = getUsage(); var k = today();
    u.byDay[k] = u.byDay[k] || {};
    if (n > (u.byDay[k].identify || 0)) { u.byDay[k].identify = n; setUsage(u); }
  }

  function canIdentify() {
    var s = getMember().status;
    return s === 'premium' || remainingFree() > 0;
  }

  window.BSF = Object.assign(window.BSF || {}, {
    member: getMember,
    isMember: function () { var s = getMember().status; return s === 'member' || s === 'premium'; },
    isPremium: function () { return getMember().status === 'premium'; },
    login: function (o) { o = o || {}; setMember({ email: o.email || '', name: o.name || '', status: o.status || 'member' }); },
    logout: function () { tokenState = { token: null, exp: 0, inflight: null }; setMember({ status: 'guest' }); },
    /* Free ID quota API */
    canIdentify: canIdentify,
    recordIdentify: recordIdentify,
    getPremiumToken: getPremiumToken,
    syncUsage: syncUsage,
    remainingFree: remainingFree,
    usedToday: usedToday,
    limitFor: limitFor,
    DAILY_FREE_LIMIT: DAILY_FREE_LIMIT,
    DAILY_MEMBER_LIMIT: DAILY_MEMBER_LIMIT
  });

  /* v5: silent server sync on every page load — keeps tier/login state truthful
     across devices and after password/status changes on the server. Without this,
     a device that logged in before a status change keeps showing stale limits. */
  fetch('/api/membership.php?action=me', { credentials: 'include' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      var u = (j && j.ok && j.data) ? j.data.user : null;
      var cur = getMember();
      if (u && u.email) {
        if (cur.email !== u.email || cur.status !== u.status) {
          setMember({ email: u.email, name: u.name || '', status: u.status || 'member' });
        }
      } else if (cur.status !== 'guest') {
        setMember({ status: 'guest' }); // session expired server-side
      }
    })
    .catch(function () { /* offline: keep local state */ });
})();
