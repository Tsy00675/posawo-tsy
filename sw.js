const CACHE_NAME = 'pmmv-tsy-pwa-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];
const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&family=Sarabun:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CORE_ASSETS).then(function() {
        return Promise.allSettled(
          CDN_ASSETS.map(function(url) {
            return fetch(url, { mode: 'no-cors' }).then(function(res) {
              return cache.put(url, res);
            }).catch(function() {});
          })
        );
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  var req = event.request;
  var url = req.url || '';

  // Never intercept Google Apps Script API calls or non-GET requests
  if (req.method !== 'GET' || url.indexOf('script.google.com') !== -1 || url.indexOf('script.googleusercontent.com') !== -1) {
    return;
  }

  event.respondWith(
    caches.match(req).then(function(cached) {
      if (cached) {
        // Refresh cache in background when online
        fetch(req).then(function(netRes) {
          if (netRes && (netRes.status === 200 || netRes.type === 'opaque')) {
            caches.open(CACHE_NAME).then(function(c) { c.put(req, netRes); });
          }
        }).catch(function() {});
        return cached;
      }
      return fetch(req).then(function(netRes) {
        if (netRes && (netRes.status === 200 || netRes.type === 'opaque')) {
          var copy = netRes.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(req, copy); });
        }
        return netRes;
      }).catch(function() {
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
