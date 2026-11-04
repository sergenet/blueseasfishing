/* ad-gate.js — hides display ads and partner-offer boxes for Premium members.
 *
 * Premium promise: "free pages carry partner offers; members see none of
 * them". Runs on every ad-bearing page; membership comes from the same
 * localStorage cache membership.js maintains (no extra request).
 * Non-premium visitors are untouched.
 */
(function () {
  'use strict';

  function memberStatus() {
    try { return (JSON.parse(localStorage.getItem('bsf_member_v3') || '{}') || {}).status || 'guest'; }
    catch (e) { return 'guest'; }
  }

  if (memberStatus() !== 'premium') return;

  var style = document.createElement('style');
  style.textContent = '.adsbygoogle, ins.adsbygoogle, [id^="google_ads"], .ad-slot, .gear-affiliate-box { display: none !important; }';
  document.head.appendChild(style);

  // Stop AdSense pushes once this page knows the visitor is premium.
  try {
    if (window.adsbygoogle) {
      window.adsbygoogle.push = function () { return undefined; };
    }
  } catch (e) {}

  // Remove ad nodes that already rendered (and any injected later).
  function strip(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('.adsbygoogle, [id^="google_ads"], .ad-slot').forEach(function (n) { n.remove(); });
  }
  strip(document);
  try {
    new MutationObserver(function () { strip(document); })
      .observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
})();
