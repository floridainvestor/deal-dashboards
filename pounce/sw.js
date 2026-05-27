// Pounce Map service worker v5 — Leaflet + OSM, offline shell only.
// Lead data and Airtable PATCHes always go to the network so field updates stay authoritative.
const CACHE = 'pounce-shell-v5-leaflet';
const SHELL = ['./index.html', './manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Never cache Airtable or map tiles — always live.
  if (url.host.includes('airtable.com') || url.host.includes('cartocdn.com') || url.host.includes('googleapis.com') || url.host.includes('unpkg.com')) return;
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && url.origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
