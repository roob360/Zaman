/* Service worker: cache aset statis agar aplikasi bisa dibuka tanpa jaringan.
   Naikkan VERSI setiap kali ada rilis agar cache lama dibuang. */
const VERSI = 'zaman-v0.1.0';
const ASET = ['./', 'index.html', 'css/tokens.css', 'css/app.css', 'js/ui.js', 'js/sim.js', 'js/worker.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSI).then(c => c.addAll(ASET)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSI).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Jaringan dulu agar pembaruan cepat terlihat, cache sebagai cadangan saat luring.
  e.respondWith(fetch(e.request).then(r => { const k = r.clone(); caches.open(VERSI).then(c => c.put(e.request, k)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
