/* Blue Seas Fishing service worker — v1
 * Strategy:
 *  - pages (HTML): network-first, fall back to cache, then /offline.html
 *  - static assets (icons, css, js, images): cache-first (immutable-ish)
 *  - /api/: NEVER cached (live data only)
 */
const VERSION = 'bsf-v4';
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;       // never touch cross-origin (API host, affiliates)
  if (url.pathname.startsWith('/api/')) return;          // live data: bypass SW entirely
  if (/^\/admin(\/|$)/.test(url.pathname)) return;       // owner dashboard: never store its HTML

  if (event.request.mode === 'navigate' || (event.request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(VERSION).then((c) => c.put(event.request, copy));
          return resp;
        })
        .catch(() => caches.match(event.request).then((hit) => hit || caches.match(OFFLINE_URL)))
    );
    return;
  }

  if (/\.(css|js)$/i.test(url.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(VERSION).then((c) => c.put(event.request, copy));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (/\.(png|jpe?g|webp|gif|svg|ico|woff2?|json|txt)$/i.test(url.pathname) || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(event.request).then((hit) =>
        hit ||
        fetch(event.request).then((resp) => {
          const copy = resp.clone();
          caches.open(VERSION).then((c) => c.put(event.request, copy));
          return resp;
        })
      )
    );
  }
});
