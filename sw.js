// PMOC Digital Service Worker v2026-06-02
const CACHE = 'pmoc-v2026-06-02';

// On install: skip waiting immediately
self.addEventListener('install', e => {
  self.skipWaiting();
});

// On activate: delete ALL old caches and take control
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: Network First for everything
// Only cache CDN libraries (not index.html)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;

  // Never cache: Firebase, Google APIs, the app itself
  if (url.includes('firestore.googleapis.com') ||
      url.includes('firebase') ||
      url.includes('googleapis.com') ||
      url.includes('accounts.google.com') ||
      url.includes('gstatic.com') ||
      url.includes('index.html') ||
      url.endsWith('/pmoc-digital/') ||
      url.endsWith('/pmoc-digital')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // CDN libraries: cache first (they don't change)
  if (url.includes('cdnjs.cloudflare.com') ||
      url.includes('cdn.jsdelivr.net') ||
      url.includes('fonts.googleapis.com') ||
      url.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return resp;
        });
      })
    );
    return;
  }

  // Everything else: network first
  e.respondWith(
    fetch(e.request)
      .catch(() => caches.match(e.request))
  );
});
