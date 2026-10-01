/* =========================================================
   Service Worker — نظام إدارة الطلبات
   ========================================================= */
const CACHE_NAME = 'orders-system-v1';
const ASSETS = [
  './excel.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap'
];

// ─── التثبيت: كاش الملفات الأساسية ───
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS).catch(err => console.warn('Cache add failed:', err)))
      .then(() => self.skipWaiting())
  );
});

// ─── التنشيط: امسح الكاشات القديمة ───
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── الجلب: استراتيجية Network First مع fallback للكاش ───
self.addEventListener('fetch', (e) => {
  const req = e.request;

  // تجاهل طلبات Firebase و Google APIs (لازم تكون أونلاين)
  const url = new URL(req.url);
  if(
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    req.method !== 'GET'
  ){
    return; // سيبه للمتصفح
  }

  // Network First — جرّب النت الأول
  e.respondWith(
    fetch(req)
      .then(res => {
        // خزّن نسخة محدّثة في الكاش
        if(res && res.status === 200 && res.type === 'basic'){
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        }
        return res;
      })
      .catch(() => caches.match(req).then(cached => cached || caches.match('./excel.html')))
  );
});

// ─── رسائل من الصفحة (تحديث فوري) ───
self.addEventListener('message', (e) => {
  if(e.data === 'SKIP_WAITING') self.skipWaiting();
});
