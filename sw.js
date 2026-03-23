const CACHE = 'tt-admin-v2';
const PRECACHE = ['/admin.html', '/icons/icon-192.png', '/icons/icon-512.png', '/manifest.json'];

// Network-only domains — never cache these
const NETWORK_ONLY = ['firebase', 'googleapis', 'gstatic', 'web3forms', 'firestore'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Always go to network for Firebase, external APIs, non-GET
  if (e.request.method !== 'GET') return;
  if (NETWORK_ONLY.some(d => url.includes(d))) return;

  // Cache-first for local assets, network fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cache only successful same-origin responses
        if (res.ok && url.startsWith(self.location.origin)) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/admin.html'));
    })
  );
});
