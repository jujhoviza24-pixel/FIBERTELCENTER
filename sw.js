/* ════════════════════════════════════════
   Fibertel Center — Service Worker
   Archivo: sw.js
   Ubicación: raíz del repositorio en GitHub
   (mismo nivel que index.html)
════════════════════════════════════════ */

const CACHE_NAME = 'fibertel-center-v1';

// Archivos a guardar en caché para modo offline
const ASSETS = [
  './',
  './index.html'
];

/* —— INSTALL: guarda los archivos en caché —— */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* —— ACTIVATE: limpia cachés viejos —— */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* —— FETCH: responde con caché si no hay internet —— */
self.addEventListener('fetch', event => {
  // Solo interceptar GET
  if (event.request.method !== 'GET') return;

  // No interceptar requests a Google Sheets / APIs externas
  if (event.request.url.includes('script.google.com')) return;
  if (event.request.url.includes('fonts.googleapis.com')) return;
  if (event.request.url.includes('cdnjs.cloudflare.com')) return;

  event.respondWith(
    // Primero intenta la red
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, la guarda en caché
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, usa la caché
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Si no hay caché, devuelve la app principal
          return caches.match('./index.html');
        });
      })
  );
});
