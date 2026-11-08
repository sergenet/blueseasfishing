(function () {
  'use strict';

  const GA_ID = 'G-5E6LJG6EQE';
  const CLARITY_ID = 'yl50z22f4y';
  const STORAGE_KEY = 'bsf_analytics_consent';
  const AD_CLIENT = 'ca-pub-0467059729557007';
  const ADS_FLAG = '__bsf_adsense_loaded';
  const CMP_WAIT_MS = 3000;

  // googlefc.ConsentModePurposeStatusEnum, compared by value so a rename in
  // Google's bundle cannot change what a number means.
  const CM_GRANTED = 1;
  const CM_DENIED = 2;
  const CM_NOT_APPLICABLE = 3;
  const CM_NOT_CONFIGURED = 4;

  // Google decides EEA coverage from the IP, which this script cannot see.
  // Timezones are a preload hint: in a covered region the AdSense tag has to
  // run to deliver Google's message, and `gdprApplies` then confirms it. If the
  // hint was wrong the message never appears and our own banner takes over.
  // Allowlist rather than "anything starting with Europe/": Istanbul, Moscow
  // and the Balkans are not covered and should keep the opt-in flow.
  const CONSENT_MESSAGE_TIMEZONES = {
    'Europe/Amsterdam': 1, 'Europe/Athens': 1, 'Europe/Berlin': 1,
    'Europe/Bratislava': 1, 'Europe/Brussels': 1, 'Europe/Bucharest': 1,
    'Europe/Budapest': 1, 'Europe/Busingen': 1, 'Europe/Copenhagen': 1,
    'Europe/Dublin': 1, 'Europe/Helsinki': 1, 'Europe/Lisbon': 1,
    'Europe/Ljubljana': 1, 'Europe/Luxembourg': 1, 'Europe/Madrid': 1,
    'Europe/Malta': 1, 'Europe/Mariehamn': 1, 'Europe/Nicosia': 1,
    'Europe/Paris': 1, 'Europe/Prague': 1, 'Europe/Riga': 1,
    'Europe/Rome': 1, 'Europe/Sofia': 1, 'Europe/Stockholm': 1,
    'Europe/Tallinn': 1, 'Europe/Vienna': 1, 'Europe/Vilnius': 1,
    'Europe/Warsaw': 1, 'Europe/Zagreb': 1,
    'Europe/Oslo': 1, 'Europe/Reykjavik': 1, 'Europe/Vaduz': 1,
    'Arctic/Longyearbyen': 1,
    'Europe/London': 1, 'Europe/Belfast': 1, 'Europe/Gibraltar': 1,
    'Europe/Guernsey': 1, 'Europe/Isle_of_Man': 1, 'Europe/Jersey': 1,
    'Europe/Zurich': 1,
    'Africa/Ceuta': 1, 'Atlantic/Azores': 1, 'Atlantic/Canary': 1,
    'Atlantic/Madeira': 1
  };

  let analyticsLoaded = false;
  let analyticsAllowed = false;
  let clarityLoaded = false;
  let eeaMode = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });

  // --- Loading (each loader is idempotent) ---------------------------------

  function loadAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(script);
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      send_page_view: true
    });
    wireEngagementTracking();
  }

  function loadClarity() {
    if (clarityLoaded) return;
    clarityLoaded = true;
    window.clarity = window.clarity || function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.clarity.ms/tag/' + encodeURIComponent(CLARITY_ID);
    document.head.appendChild(script);
  }

  function startAnalytics() {
    analyticsAllowed = true;
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    loadAnalytics();
    loadClarity();
  }

  function stopAnalytics() {
    analyticsAllowed = false;
    window.gtag('consent', 'update', { analytics_storage: 'denied' });
    window['ga-disable-' + GA_ID] = true;
    try {
      if (typeof window.clarity === 'function') window.clarity('consent', false);
    } catch (e) {}
  }

  // --- Advertising ---------------------------------------------------------
  //
  // Ad units are plain <ins class="adsbygoogle"> markup with their own
  // push({}) call. Those pushes queue in window.adsbygoogle while no library is
  // present, and queueing alone makes no request. Outside the EEA the loader is
  // added only after Accept, so the queued units are requested then. Inside the
  // EEA the tag must run for Google's message to appear, and Google's own CMP
  // controls personalisation.
  //
  // Do not replace window.adsbygoogle here: ad-gate.js overrides its push for
  // Premium members, and discarding the array would undo that.

  function loadAdsense() {
    try {
      if (window[ADS_FLAG]) return;
      window[ADS_FLAG] = true;

      if (!document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
        const script = document.createElement('script');
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + AD_CLIENT;
        script.onerror = function () { console.warn('AdSense loader failed to load'); };
        document.head.appendChild(script);
      }
    } catch (e) { console.warn('loadAdsense error', e); }
  }

  // --- Google's certified CMP ---------------------------------------------
  //
  // The AdSense loader above is what delivers Google's European message. In
  // the EEA it is a certified CMP, so its answer — not this site's banner — has
  // to decide whether analytics runs. Showing both would ask the same visitor
  // twice and let the two records disagree.

  function pushToGoogleFc(key, fn) {
    window.googlefc = window.googlefc || {};
    const existing = window.googlefc.callbackQueue;
    // Google documents the keyed-object form; a bare function is its legacy form.
    if (existing !== undefined && !Array.isArray(existing)) return;
    const queue = existing || [];
    queue.push({ [key]: fn });
    window.googlefc.callbackQueue = queue;
  }

  /** Ask the CMP once whether European rules apply. Returns true if it was asked. */
  function pingGdprApplies(callback) {
    if (typeof window.__tcfapi !== 'function') return false;
    try {
      // Google's CMP answers with the data object only — the second "success"
      // argument of the TCF spec is undefined here, so requiring it would throw
      // away every answer and leave the site's own banner up for good.
      window.__tcfapi('ping', 2, function (data) {
        if (!data) return;
        callback(Boolean(data.gdprApplies));
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Resolve only when we know whether the CMP covers this visitor, or when the
   * wait expires. Never showing our banner before that is the whole point: on a
   * European connection the answer is "yes" and our banner would be a duplicate.
   */
  function whenGdprDecision(callback) {
    let settled = false;
    let watch;

    function settle(applies) {
      if (settled) return;
      settled = true;
      callback(applies);
    }

    const fallback = setTimeout(function () { settle(false); }, CMP_WAIT_MS);

    // googlefc.callbackQueue only runs callbacks queued before the CMP became
    // ready, so a slow CMP has to be watched directly. The message can appear
    // seconds after this page fell back to its own banner, and leaving both up
    // would ask the same visitor twice.
    function check() {
      if (eeaMode) {
        clearInterval(watch);
        return;
      }
      pingGdprApplies(function (applies) {
        if (!applies) return;
        clearInterval(watch);
        clearTimeout(fallback);
        if (settled) enterEeaMode();
        else settle(true);
      });
    }

    watch = setInterval(check, 800);
    pushToGoogleFc('CONSENT_API_READY', check);
    check();
  }

  /** 'granted' | 'denied' | 'unknown' from Google's own consent-mode values. */
  function googleAnalyticsDecision() {
    const read = window.googlefc && window.googlefc.getGoogleConsentModeValues;
    if (typeof read !== 'function') return 'unknown';
    let values;
    try {
      values = read();
    } catch (e) {
      return 'unknown';
    }
    if (!values) return 'unknown';
    const status = values.analyticsStoragePurposeConsentStatus;
    if (status === CM_GRANTED || status === CM_NOT_APPLICABLE) return 'granted';
    // NOT_CONFIGURED means Google never asked for analytics consent, so there
    // is nothing to rely on. Treating it as a refusal is deliberate: the
    // alternative silently records European visitors who never agreed.
    if (status === CM_DENIED || status === CM_NOT_CONFIGURED) return 'denied';
    return 'unknown';
  }

  function applyGoogleDecision() {
    const decision = googleAnalyticsDecision();
    if (decision === 'granted') {
      startAnalytics();
    } else if (decision === 'denied') {
      stopAnalytics();
    }
  }

  function enterEeaMode() {
    if (eeaMode) return;
    eeaMode = true;
    removeBanner();
    pushToGoogleFc('CONSENT_MODE_DATA_READY', applyGoogleDecision);
    if (typeof window.__tcfapi === 'function') {
      try {
        window.__tcfapi('addEventListener', 2, applyGoogleDecision,
          ['consentData', 'useractioncomplete', 'cmpuishown', 'tcloaded']);
      } catch (e) {}
    }
    applyGoogleDecision();
    // Google can publish the values a moment after the message is answered.
    let tries = 0;
    const timer = setInterval(function () {
      tries += 1;
      applyGoogleDecision();
      if (tries >= 20) clearInterval(timer);
    }, 500);
  }

  // --- This site's own banner (non-EEA visitors) ---------------------------

  function setConsent(allowed) {
    try {
      localStorage.setItem(STORAGE_KEY, allowed ? 'granted' : 'denied');
    } catch (e) {}
    if (allowed) {
      startAnalytics();
      loadAdsense();
    } else {
      stopAnalytics();
    }
    removeBanner();
  }

  function readStoredChoice() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function removeBanner() {
    const existing = document.getElementById('bsf-consent-banner');
    if (existing) existing.remove();
  }

  // --- Engagement tracking (consent-gated, wired inside loadAnalytics) ---
  let engagementWired = false;
  function wireEngagementTracking() {
    if (engagementWired) return;
    engagementWired = true;

    // Scroll depth: proof that a long page actually got read
    const marks = [25, 50, 75, 100];
    const sent = {};
    window.addEventListener('scroll', function () {
      if (!analyticsAllowed) return;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h <= 0) return;
      const pct = Math.min(100, Math.round((window.scrollY / h) * 100));
      marks.forEach(function (m) {
        if (pct >= m && !sent[m]) {
          sent[m] = true;
          window.gtag('event', 'scroll_depth', { percent_scrolled: m, page_path: location.pathname });
        }
      });
    }, { passive: true });

    // Affiliate clicks: which pages actually send visitors to Awin vendors
    document.addEventListener('click', function (e) {
      if (!analyticsAllowed) return;
      const a = e.target && e.target.closest ? e.target.closest('a[href*="awin1.com"]') : null;
      if (a) {
        window.gtag('event', 'affiliate_click', {
          link_url: a.href,
          page_path: location.pathname,
          transport_type: 'beacon'
        });
      }
    }, { passive: true });
  }

  window.bsfTrack = function (eventName, params) {
    if (!analyticsAllowed) return;
    const safe = Object.assign({}, params || {});
    delete safe.email;
    delete safe.photo;
    delete safe.image;
    delete safe.notes;
    delete safe.location;
    window.gtag('event', eventName, safe);
  };

  function showBanner() {
    if (document.getElementById('bsf-consent-banner')) return;
    const banner = document.createElement('aside');
    banner.id = 'bsf-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Analytics and advertising choice');
    banner.innerHTML = '<div><strong>Optional analytics and ads</strong><p>Allow privacy-conscious analytics and advertising so we can understand which pages and features are useful. We do not send fish photos, identification notes, email addresses, passwords, or payment details.</p><a href="/cookies.html">Cookie details</a></div><div class="bsf-consent-actions"><button type="button" data-choice="decline">Decline</button><button type="button" data-choice="allow">Allow analytics &amp; ads</button></div>';
    const style = document.createElement('style');
    style.textContent = '#bsf-consent-banner{position:fixed;z-index:99999;left:16px;right:16px;bottom:16px;display:flex;gap:20px;align-items:center;justify-content:space-between;max-width:980px;margin:auto;padding:16px 18px;background:#082f49;color:#fff;border:1px solid #38bdf8;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.35);font:15px/1.45 system-ui,sans-serif}#bsf-consent-banner p{margin:.35rem 0}#bsf-consent-banner a{color:#bae6fd}.bsf-consent-actions{display:flex;gap:8px;flex-shrink:0}.bsf-consent-actions button{border:1px solid #7dd3fc;border-radius:8px;padding:9px 13px;cursor:pointer;background:#fff;color:#0c4a6e;font-weight:700}.bsf-consent-actions button:first-child{background:transparent;color:#fff}@media(max-width:680px){#bsf-consent-banner{flex-direction:column;align-items:stretch}.bsf-consent-actions{justify-content:flex-end}}';
    style.id = 'bsf-consent-style';
    if (!document.getElementById('bsf-consent-style')) document.head.appendChild(style);
    document.body.appendChild(banner);
    banner.querySelector('[data-choice="allow"]').addEventListener('click', function () { setConsent(true); });
    banner.querySelector('[data-choice="decline"]').addEventListener('click', function () { setConsent(false); });
  }

  function looksEuropean() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return Boolean(tz && CONSENT_MESSAGE_TIMEZONES[tz]);
    } catch (e) {
      return false;
    }
  }

  function startOwnBannerFlow() {
    const choice = readStoredChoice();
    if (choice === 'granted') {
      startAnalytics();
      loadAdsense();
    } else if (choice !== 'denied') {
      showBanner();
    }
  }

  function start() {
    if (looksEuropean()) {
      // The AdSense tag is what delivers Google's message, so for a covered
      // visitor it has to load before anyone has chosen anything.
      loadAdsense();
      whenGdprDecision(function (applies) {
        if (applies) enterEeaMode();
        else startOwnBannerFlow();
      });
    } else {
      startOwnBannerFlow();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      start();

      document.querySelectorAll('[data-plan]').forEach(function (button) {
        button.addEventListener('click', function () {
          window.bsfTrack('begin_checkout', { plan: button.dataset.plan || 'unknown' });
        });
      });
    });
  } else {
    start();
  }
})();
