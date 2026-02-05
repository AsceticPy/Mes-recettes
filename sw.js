const CACHE_NAME = 'recettes-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/recettes.js',
  '/js/app.js',
  '/manifest.json'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Récupération des ressources
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourne la ressource du cache si disponible
        if (response) {
          return response;
        }
        // Sinon, fait la requête réseau
        return fetch(event.request)
          .then((response) => {
            // Vérifie que la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // Clone la réponse pour la mettre en cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
      .catch(() => {
        // Fallback pour les pages HTML
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Mise à jour du cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
