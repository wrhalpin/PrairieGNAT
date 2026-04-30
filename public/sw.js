import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precache';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';

clientsClaim();
self.skipWaiting();

// Clean up outdated caches
cleanupOutdatedCaches();

// Precache app shell and assets
precacheAndRoute(self.__WB_MANIFEST || []);

// Navigate routes - use network first, fall back to index.html for offline
const navigationRoute = new NavigationRoute(
  new NetworkFirst({
    cacheName: 'navigationCache',
    plugins: [new ExpirationPlugin({ maxEntries: 50 })],
  })
);
registerRoute(navigationRoute);

// CSS and JS - cache first with expiration
registerRoute(
  ({ request }) => request.destination === 'style' || request.destination === 'script',
  new CacheFirst({
    cacheName: 'assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Images - cache first
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
      }),
    ],
  })
);

// Fonts - cache first, long expiry
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// External API calls - network first with fallback
registerRoute(
  ({ url }) => url.origin !== self.location.origin,
  new NetworkFirst({
    cacheName: 'external-api',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// Handle activation and cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!['navigationCache', 'assets', 'images', 'fonts', 'external-api'].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle share target POST requests
self.addEventListener('fetch', (event) => {
  // Handle share target POST requests to root
  if (event.request.method === 'POST' && event.request.url.endsWith('/')) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const file = formData.get('bundle');

          if (file instanceof File) {
            const fileContent = await file.text();

            // Send message to all clients to process the shared file
            const clients = await self.clients.matchAll();
            for (const client of clients) {
              client.postMessage({
                type: 'SHARE_TARGET',
                fileName: file.name,
                fileContent: fileContent,
              });
            }

            // Return redirect to app
            return new Response(null, {
              status: 303,
              headers: { 'Location': '/?shared=1' },
            });
          }
        } catch (error) {
          console.error('Share target error:', error);
        }

        // Fallback: return to app
        return new Response(null, {
          status: 303,
          headers: { 'Location': '/' },
        });
      })()
    );
  } else if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return offline page or cached response
        return caches.match(event.request).then((cached) => {
          return cached || new Response('Offline - unable to fetch this resource', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' }),
          });
        });
      })
    );
  }
});
