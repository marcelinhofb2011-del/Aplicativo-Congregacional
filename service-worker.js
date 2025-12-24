const CACHE_NAME = 'cong-v12';
const APP_SHELL_URL = './index.html';
const ASSETS_TO_CACHE = [
  './',
  APP_SHELL_URL,
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Estratégia 'App Shell': para navegação (abrir o app), sempre sirva o index.html do cache primeiro.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(APP_SHELL_URL).then(cachedResponse => {
        // Retorna o app shell do cache. Se não estiver no cache por algum motivo, busca na rede como fallback.
        return cachedResponse || fetch(APP_SHELL_URL);
      })
    );
    return;
  }

  // Estratégia 'Cache First' para todos os outros recursos (JS, CSS, etc.).
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});