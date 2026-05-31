// ════════════════════════════════════════
//  NCDC Manager — Service Worker v10
//  يعمل في الخلفية لاستقبال الإشعارات
// ════════════════════════════════════════

const CACHE_NAME = 'ncdc-manager-v10';
const FIREBASE_SCRIPTS = [
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js',
];

// ── تثبيت Service Worker وتخزين الملفات ──
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        './index.html',
        './manifest.json',
        './icons/icon-192.png',
        './icons/icon-512.png',
      ]).catch(err => console.warn('[SW] Cache addAll error (non-fatal):', err));
    })
  );
  self.skipWaiting();
});

// ── تفعيل وحذف الكاش القديم ──
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

// ── استقبال طلبات الشبكة (Network First لـ HTML، Cache for rest) ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // تجاهل طلبات Firebase و Google Fonts
  if (url.hostname.includes('firebasejs') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic') ||
      url.hostname.includes('firestore') ||
      url.hostname.includes('firebase')) {
    return;
  }

  if (event.request.mode === 'navigate') {
    // الصفحة الرئيسية: شبكة أولاً ثم الكاش
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
  } else {
    // باقي الموارد: كاش أولاً
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});

// ── استقبال Push Notifications ──
self.addEventListener('push', event => {
  console.log('[SW] Push received:', event);

  let data = { title: 'NCDC — لوحة المدير', body: 'وصل بريد جديد', tag: 'ncdc-new' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch(e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body:    data.body,
    icon:    './icons/icon-192.png',
    badge:   './icons/icon-96.png',
    tag:     data.tag || 'ncdc-mail',
    renotify: true,
    dir:     'rtl',
    lang:    'ar',
    vibrate: [200, 100, 200],
    data:    { url: './index.html?filter=new' },
    actions: [
      { action: 'open',    title: 'فتح التطبيق' },
      { action: 'dismiss', title: 'تجاهل' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ── الضغط على الإشعار ──
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : './index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // إذا التطبيق مفتوح بالفعل — اجعله في الواجهة
      for (const client of clientList) {
        if (client.url.includes('ncdc-manager') && 'focus' in client) {
          return client.focus();
        }
      }
      // افتح نافذة جديدة
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// ── إشعارات من الصفحة الرئيسية (postMessage) ──
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = event.data;
    self.registration.showNotification(title || 'NCDC مدير', {
      body:    body || 'وصل بريد جديد',
      icon:    './icons/icon-192.png',
      badge:   './icons/icon-96.png',
      tag:     tag || 'ncdc-mail',
      renotify: true,
      dir:     'rtl',
      vibrate: [180, 80, 180],
      data:    { url: './index.html' }
    });
  }
});
