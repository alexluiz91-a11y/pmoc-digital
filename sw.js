// PMOC Digital Service Worker
// v2026-06-02-b — Network First para tudo exceto CDN

const CACHE = 'pmoc-cdn-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;

  // NUNCA servir do cache: o app, Firebase, Google
  if (
    url.includes('/pmoc-digital/index.html') ||
    url.includes('/pmoc-digital/v.html') ||
    url.endsWith('/pmoc-digital/') ||
    url.endsWith('/pmoc-digital') ||
    url.includes('firestore.googleapis.com') ||
    url.includes('firebase') ||
    url.includes('googleapis.com') ||
    url.includes('accounts.google.com') ||
    url.includes('gstatic.com')
  ) {
    // Always network, fallback to cache only if offline
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // CDN libraries: cache first (são imutáveis por versão)
  if (
    url.includes('cdnjs.cloudflare.com') ||
    url.includes('cdn.jsdelivr.net') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com')
  ) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          if (resp.ok) {
            caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
          }
          return resp;
        });
      })
    );
    return;
  }

  // Demais recursos: network first
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .catch(() => caches.match(e.request))
  );
});
