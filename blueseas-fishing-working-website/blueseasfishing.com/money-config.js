/* money-config.js v2 — central monetization config (Awin edition) */
(function () {
  'use strict';
  var c = window.BSF_MONEY_CONFIG || (window.BSF_MONEY_CONFIG = {});

  /* ---- Awin affiliate network ----
     AFFID: your Awin affiliate (publisher) ID — set once approved.
     VENDORS: approved Awin advertisers. Fill `mid` from each advertiser's
     "Create a link" page after approval. Leave mid '' until then. */
  c.AWIN = {
    AFFID: '3104073', // Blue Seas Fishing publisher ID (approved by Awin)
    VENDORS: [
      /* Approved advertisers — `mid` from the Awin directory, `search` appended
         before the query (omit `search` to link the homepage).

         DISABLED 2026-10-31: sharkfishing.xyz is offline. Its A record points at
         a Shopify IP behind a Cloudflare zone that answers 403 "DNS points to
         prohibited IP" to every visitor, so all 96 destination gear boxes were
         sending clicks to an error page. Do not re-enable until the merchant's
         storefront loads in a browser.
      { id: 'sharkfishing', name: 'Shark Fishing T3', mid: '129285', base: 'https://sharkfishing.xyz/', search: '?s=' },
      */

      /* Piscifun — verified live 2026-10-31: 7 deep product links and the
         search endpoint all returned 200. This is the active vendor; the
         destination gear boxes use the first vendor with a `mid`, so it must
         stay above the commented block. */
      { id: 'piscifun', name: 'Piscifun', mid: '89509', base: 'https://www.piscifun.com/', search: 'search?q=' },

      /* WildGuarder — verified live 2026-10-31 in a real browser (the product
         page renders and titles correctly). curl reports intermittent 502s
         because the store throttles scripted requests, not because it is down. */
      { id: 'wildguarder', name: 'WildGuarder', mid: '126831', base: 'https://store.wildguarder.com/', search: 'search?type=product&q=' },

      /* Pending approval — uncomment when accepted:
      { id: 'mysterytacklebox', name: 'Mystery Tackle Box US', mid: '104699', base: 'https://www.mysterytacklebox.com/', search: '/search?q=' },
      { id: 'yakpower', name: 'Yak Power', mid: '124022', base: 'https://yakpower.com/', search: '/?s=' }, */
    ]
  };

  /* ---- Google AdSense ----
     The site has loaded the AdSense script since Sep 2026 but has never
     contained a single <ins class="adsbygoogle"> slot, so it has earned no ad
     impressions at all. tools/add-adsense.mjs reads this block and injects the
     loader on every content page; set the slot IDs below to also add fixed
     in-article and footer units.

     Where to find the IDs: AdSense -> Ads -> By ad unit -> create a "Display"
     unit; the id is the number in data-ad-slot (NOT the ca-pub- client id). */
  c.ADS = {
    CLIENT: 'ca-pub-0467059729557007',
    SLOTS: {
      // Created in AdSense 2026-11-02 as "Blue Seas - In-article" / "Blue Seas - Footer"
      // (both responsive display units). Auto ads is also ON for this site, so
      // these fixed units sit alongside it rather than replacing it.
      inArticle: '2835722251',
      footer: '1522640584'
    }
  };

  /* ---- Subscriptions ---- */
  c.PREMIUM = {
    URL: '/premium.html',
    LABEL: 'Go Premium',
    MONTHLY: '$7.99/mo',
    ANNUAL: '$59/yr',
    /* Free-tier AI identification quota (kept in sync with membership.js) */
    FREE_DAILY_LIMIT: 3,
    MEMBER_DAILY_LIMIT: 5
  };

  /* ---- Gear-box variants for the destination pages ---- */
  c.GEAR_BOXES = [
    { key: 'freshwater', title: 'Freshwater starter kit', body: 'Inline spinners, soft-plastic kits, bass jigs and terminal tackle that covers most freshwater fisheries on this page.', tags: ['inline spinner fishing', 'freshwater fishing tackle kit', 'bass jig craw'] },
    { key: 'saltwater', title: 'Saltwater starter kit', body: 'Metal jigs, paddle-tail combos, fluorocarbon leaders and saltwater-safe reels for inshore species like those listed here.', tags: ['saltwater fishing lures kit', 'paddle tail jig saltwater', 'fluorocarbon leader saltwater'] },
    { key: 'general', title: 'Shore &amp; boat essentials', body: 'Pliers, lip grips, landing nets, headlamps and tackle storage that work for nearly every fishery on this page.', tags: ['fishing pliers lip gripper', 'landing net fishing', 'tackle bag fishing'] }
  ];

  /* ---- Link builder: wraps a vendor URL in an Awin tracking link ---- */
  c.awinLink = function (vendorId, targetUrl) {
    var v = null;
    for (var i = 0; i < c.AWIN.VENDORS.length; i++) {
      if (c.AWIN.VENDORS[i].id === vendorId) { v = c.AWIN.VENDORS[i]; break; }
    }
    if (!v || !v.mid || !c.AWIN.AFFID || !targetUrl) return '';
    return 'https://www.awin1.com/cread.php?awinmid=' + encodeURIComponent(v.mid) +
           '&awinaffid=' + encodeURIComponent(c.AWIN.AFFID) +
           '&ued=' + encodeURIComponent(targetUrl);
  };

  /* ---- First approved vendor + generic search terms for the gear boxes ----
     Used by destination pages to turn the static gearbox into live links.
     No-op (returns empty string) while no approved vendor has a `mid`. */
  c.firstVendor = function () {
    for (var i = 0; i < c.AWIN.VENDORS.length; i++) {
      if (c.AWIN.VENDORS[i].mid) return c.AWIN.VENDORS[i];
    }
    return null;
  };

  c.gearSearchLink = function (variant, query) {
    var v = c.firstVendor();
    if (!v) return '';
    var url = v.base + (v.search || '') + encodeURIComponent(query);
    return c.awinLink(v.id, url);
  };
})();
