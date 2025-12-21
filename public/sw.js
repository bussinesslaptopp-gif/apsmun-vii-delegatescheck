const CACHE_NAME = 'apsmun-delegate-cache-v2';
const urlsToCache = [
  '/',
  '/delegates.xlsx',
  '/dc.xlsx',
  '/ec.xlsx',
  '/manifest.json'
];

self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Cache the essential files for the app shell to work offline
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
    // We only want to handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // We don't cache QR code downloads or anything that isn't a GET request
                if (!event.request.url.includes('data:image')) {
                    cache.put(event.request, responseToCache);
                }
              });

            return networkResponse;
          }
        ).catch(err => {
            // Network request failed, try to serve a fallback page if it's a navigation request
            if (event.request.mode === 'navigate') {
                return caches.match('/');
            }
            // For other requests like images, if they fail and aren't in cache, there's not much we can do.
            // The browser will handle the error.
            return;
        });
      })
    );
});

// This helps activate the new service worker faster and cleans up old caches
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
