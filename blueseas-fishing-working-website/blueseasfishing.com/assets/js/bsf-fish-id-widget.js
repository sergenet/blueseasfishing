/*!
 * Blue Seas Fishing — embeddable fish-ID widget
 * Usage: <div class="bsf-fish-id" data-height="640"></div>
 *        <script src="https://www.blueseasfishing.com/assets/js/bsf-fish-id-widget.js" defer></script>
 *
 * Replaces each .bsf-fish-id div with a sandboxed iframe embedding
 * /fish-id.html?embed=1 on blueseasfishing.com. The embedded page reports its
 * height via postMessage so the iframe grows with the result card. Iframe is
 * lazy-loaded when scrolled near.
 */
(function () {
  'use strict';
  if (window.__bsfFishIdWidgetLoaded) return;
  window.__bsfFishIdWidgetLoaded = true;

  var ORIGIN = 'https://www.blueseasfishing.com';
  var SRC = ORIGIN + '/fish-id.html?embed=1';

  function mount(el) {
    if (el.getAttribute('data-bsf-mounted') === '1') return;
    el.setAttribute('data-bsf-mounted', '1');

    var height = parseInt(el.getAttribute('data-height') || '640', 10);
    var iframe = document.createElement('iframe');
    iframe.src = SRC;
    iframe.title = 'AI Fish Identification — Blue Seas Fishing';
    iframe.loading = 'lazy';
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.style.cssText = 'width:100%;max-width:100%;border:1px solid #d8e2ea;border-radius:12px;background:#fff;height:' + height + 'px;display:block';

    // Grow with content (capped to avoid runaway)
    window.addEventListener('message', function (event) {
      if (event.origin !== ORIGIN) return;
      var data = event.data || {};
      if (data.type === 'bsf-fish-id:height' && typeof data.height === 'number') {
        var h = Math.max(320, Math.min(data.height, 4000));
        if (Math.abs(h - iframe.style.height.replace('px', '') - 0) > 2) iframe.style.height = h + 'px';
      }
    });

    el.innerHTML = '';
    el.appendChild(iframe);
  }

  function scan() {
    var nodes = document.querySelectorAll('.bsf-fish-id');
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
})();
