const CACHE_NAME = 'agribot-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './chat_ui.js',
  './manifest.json'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).catch(err => console.log("Cache error during SW install:", err))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Chỉ cache các request HTTP/HTTPS thông thường
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cập nhật cache nếu fetch thành công các file tĩnh
        if (response.status === 200 && ASSETS.some(asset => e.request.url.includes(asset.replace('./', '')))) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Nếu offline, lấy từ cache
        return caches.match(e.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          return new Response("⚠️ Kết nối mạng không khả dụng và không có dữ liệu cache.");
        });
      })
  );
});
