const CACHE_NAME = 'cong-v9';
const APP_SHELL_URL = './index.html';
const ASSETS = [
  './',
  APP_SHELL_URL,
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim()) // Take control immediately
  );
});

self.addEventListener('fetch', (event) => {
  // For navigation requests, always serve the app shell (index.html).
  // This is a robust strategy for Single-Page Apps.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(APP_SHELL_URL).then(cachedResponse => {
        // Return from cache, or fetch from network as a fallback.
        return cachedResponse || fetch(APP_SHELL_URL);
      })
    );
    return;
  }

  // For other requests (assets like JS, CSS), use a cache-first strategy.
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});