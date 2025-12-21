
const CACHE_NAME = 'apsmun-vii-cache-v1';
const urlsToCache = [
  '/',
  '/host-team/dc',
  '/host-team/ec',
  '/host-team/socials',
  '/verify-zip',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/delegates.xlsx',
  '/dc.xlsx',
  '/ec.xlsx',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Add all essential assets to the cache
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // For app pages and assets, use a cache-first strategy
  if (requestUrl.origin === location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Cache hit - return response
          if (response) {
            return response;
          }
          // Not in cache, fetch from network
          return fetch(event.request).then(
            networkResponse => {
              // Check if we received a valid response
              if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
              }

              // Clone the response because it's a stream and can only be consumed once
              const responseToCache = networkResponse.clone();

              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });

              return networkResponse;
            }
          );
        })
    );
  }
});


self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
