/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { clientsClaim } from 'workbox-core';
import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
} from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// App shell fallback: any navigation is answered with the precached index.html,
// so the app opens offline on first navigation after install.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  }),
);

registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 })],
  }),
);

// Share target: the POST arrives before any page is listening, so stash the
// shared file in a cache and let the app pull it after the redirect lands.
const SHARE_CACHE = 'share-target';
export const SHARED_BUNDLE_URL = '/shared-bundle';

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'POST') return;
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && url.pathname === '/') {
    event.respondWith(handleShareTarget(event.request));
  }
});

async function handleShareTarget(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get('bundle');
    if (file instanceof File) {
      const cache = await caches.open(SHARE_CACHE);
      await cache.put(
        SHARED_BUNDLE_URL,
        new Response(await file.text(), {
          headers: {
            'Content-Type': 'application/json',
            'X-File-Name': encodeURIComponent(file.name),
          },
        }),
      );
    }
  } catch {
    // Redirect regardless; the app finds no stashed file and shows nothing.
  }
  return Response.redirect('/?shared=1', 303);
}
