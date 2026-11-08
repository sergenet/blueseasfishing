(function () {
  'use strict';

  const GA_ID = 'G-5E6LJG6EQE';
  const CLARITY_ID = 'yl50z22f4y';
  const STORAGE_KEY = 'bsf_analytics_consent';
  let analyticsLoaded = false;
  let clarityLoaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });

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

  function setConsent(allowed) {
    localStorage.setItem(STORAGE_KEY, allowed ? 'granted' : 'denied');
    window.gtag('consent', 'update', {
      analytics_storage: allowed ? 'granted' : 'denied'
    });
    if (allowed) {
      loadAnalytics();
      loadClarity();
    }
    document.getElementById('bsf-consent-banner')?.remove();
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
      if (!window.gtag) return;
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
    if (localStorage.getItem(STORAGE_KEY) !== 'granted') return;
    loadAnalytics();
    const safe = Object.assign({}, params || {});
    delete safe.email;
    delete safe.photo;
    delete safe.image;
    delete safe.notes;
    delete safe.location;
    window.gtag('event', eventName, safe);
  };

  function showBanner() {
    const banner = document.createElement('aside');
    banner.id = 'bsf-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Analytics choice');
    banner.innerHTML = '<div><strong>Optional analytics</strong><p>Allow privacy-conscious analytics so we can understand which pages and features are useful. We do not send fish photos, identification notes, email addresses, passwords, or payment details.</p><a href="/cookies.html">Cookie details</a></div><div class="bsf-consent-actions"><button type="button" data-choice="decline">Decline</button><button type="button" data-choice="allow">Allow analytics</button></div>';
    const style = document.createElement('style');
    style.textContent = '#bsf-consent-banner{position:fixed;z-index:99999;left:16px;right:16px;bottom:16px;display:flex;gap:20px;align-items:center;justify-content:space-between;max-width:980px;margin:auto;padding:16px 18px;background:#082f49;color:#fff;border:1px solid #38bdf8;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.35);font:15px/1.45 system-ui,sans-serif}#bsf-consent-banner p{margin:.35rem 0}#bsf-consent-banner a{color:#bae6fd}.bsf-consent-actions{display:flex;gap:8px;flex-shrink:0}.bsf-consent-actions button{border:1px solid #7dd3fc;border-radius:8px;padding:9px 13px;cursor:pointer;background:#fff;color:#0c4a6e;font-weight:700}.bsf-consent-actions button:first-child{background:transparent;color:#fff}@media(max-width:680px){#bsf-consent-banner{flex-direction:column;align-items:stretch}.bsf-consent-actions{justify-content:flex-end}}';
    document.head.appendChild(style);
    document.body.appendChild(banner);
    banner.querySelector('[data-choice="allow"]').addEventListener('click', function () { setConsent(true); });
    banner.querySelector('[data-choice="decline"]').addEventListener('click', function () { setConsent(false); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const choice = localStorage.getItem(STORAGE_KEY);
    if (choice === 'granted') {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
      loadAnalytics();
      loadClarity();
    } else if (choice !== 'denied') {
      showBanner();
    }

    document.querySelectorAll('[data-plan]').forEach(function (button) {
      button.addEventListener('click', function () {
        window.bsfTrack('begin_checkout', { plan: button.dataset.plan || 'unknown' });
      });
    });
  });
})();
