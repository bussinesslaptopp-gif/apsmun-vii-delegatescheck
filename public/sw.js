
const CACHE_NAME = 'apsmun-v1';
const urlsToCache = [
  '/',
  '/host-team/dc',
  '/host-team/ec',
  '/host-team/socials',
  '/verify-zip',
  '/manifest.json',
  '/delegates.xlsx',
  '/dc.xlsx',
  '/ec.xlsx',
  '/icon-192x192.png',
  '/icon-512x512.png',
  'https://bgs45urr71.ufs.sh/f/5pQTmJ38MJ42myy5VjKZqoiBjE6uNhldJH4fy3szSZkcQAgt'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Use addAll for atomic operation
        return cache.addAll(urlsToCache).catch(error => {
            console.error('Failed to cache initial assets:', error);
            // Even if some assets fail, the service worker will still install.
            // This is better than failing the install completely.
        });
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // IMPORTANT: Clone the request. A request is a stream and
        // can only be consumed once. Since we are consuming this
        // once by cache and once by the browser for fetch, we need
        // to clone the response.
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              if (response && response.type === 'opaque') {
                // Opaque responses are for cross-origin requests. We can't inspect them,
                // but we can still cache them. This is important for things like Google Fonts.
                const responseToCache = response.clone();
                 caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
                return response;
              }
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
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
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
