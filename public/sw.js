const CACHE_NAME = 'apsmun-universal-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/delegates.xlsx',
  '/dc.xlsx',
  '/ec.xlsx',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching essential assets');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Cache hit - return response
        if (cachedResponse) {
          // While we have a cached response, fetch a new one in the background
          // to keep the cache fresh.
          fetch(event.request).then(networkResponse => {
             if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse);
                });
             }
          });
          return cachedResponse;
        }

        // Not in cache - fetch from network and cache it
        return fetch(event.request).then(
          networkResponse => {
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

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
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});
