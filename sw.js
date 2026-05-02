
const CACHE_NAME = 'shiftmaster-v2';

// Kurulum aşaması: Beklemeden hemen yeni versiyona geç
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// Eski önbellekleri (eski sürümdeki dosyaları) temizle
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// AĞ ÖNCELİKLİ (Network-First) MOTOR
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // İnternet çekiyorsa yenisini al ve hafızayı güncelle
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, response.clone());
          return response;
        });
      })
      .catch(() => {
        // Eğer hastanede internet çekmiyorsa hafızadakini (eskiyi) göster
        return caches.match(e.request);
      })
  );
});
