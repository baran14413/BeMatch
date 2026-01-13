// This is a custom service worker file that will be used by next-pwa.
// It allows for custom caching strategies.

if (typeof self !== 'undefined') {
  // A simple, generic no-op service worker that will do nothing.
  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', () => {
    self.clients.claim();
  });

  // The 'fetch' event listener is intentionally left out.
  // next-pwa will inject its own precaching and runtime caching logic.
  // If you wanted to add your own custom logic, you would do it here.
  // For example, to cache images from a specific domain:
  self.addEventListener('fetch', (event) => {
    if (
      event.request.destination === 'image' ||
      event.request.url.includes('firestore.googleapis.com')
    ) {
      event.respondWith(
        caches.open('dynamic-cache').then((cache) => {
          return cache.match(event.request).then((response) => {
            return (
              response ||
              fetch(event.request).then((fetchResponse) => {
                cache.put(event.request, fetchResponse.clone());
                return fetchResponse;
              })
            );
          });
        })
      );
    }
  });
}
