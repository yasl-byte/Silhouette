/* Service worker — cache d'abord pour les fichiers de l'application.
   Les appels aux API externes (horaires, versets, livres) passent directement par le réseau :
   leurs réponses sont conservées par l'application elle-même, dans ses données.
   Changer VERSION à chaque mise à jour des fichiers pour forcer le rafraîchissement. */
const VERSION = 'silhouette-v2';
const FILES = [
  './', 'index.html', 'style.css', 'data.js', 'core.js', 'net.js', 'views.js', 'app.js', 'manifest.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== location.origin) return;   // API externes : réseau direct
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match('index.html')))
  );
});
