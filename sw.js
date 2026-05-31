// ════════════════════════════════════════
//  NCDC Manager — Service Worker v10
// ════════════════════════════════════════
const CACHE_NAME = 'ncdc-manager-v10';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(['./index.html','./manifest.json','./icon-192.png','./icon-512.png'])
           .catch(e => console.warn('[SW] cache warn:', e))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic') ||
      url.hostname.includes('firestore') ||
      url.hostname.includes('firebase')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(res => { caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone())); return res; })
        .catch(() => caches.match('./index.html'))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});

// ── Push Notification ──
self.addEventListener('push', event => {
  let data = { title: 'NCDC — لوحة المدير', body: 'وصل بريد جديد 📬', tag: 'ncdc' };
  try { if (event.data) data = { ...data, ...event.data.json() }; }
  catch(e) { if (event.data) data.body = event.data.text(); }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:     data.body,
      icon:     './icon-192.png',
      badge:    './icon-96.png',
      tag:      data.tag || 'ncdc',
      renotify: true,
      dir:      'rtl',
      lang:     'ar',
      vibrate:  [200, 100, 200],
      data:     { url: './index.html' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('ncdc-manager') && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow('./index.html');
    })
  );
});

// ── رسائل من الصفحة ──
self.addEventListener('message', event => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(event.data.title || 'NCDC مدير', {
      body:     event.data.body || 'وصل بريد جديد',
      icon:     './icon-192.png',
      badge:    './icon-96.png',
      tag:      event.data.tag || 'ncdc',
      renotify: true,
      dir:      'rtl',
      vibrate:  [180, 80, 180],
      data:     { url: './index.html' }
    });
  }
});
