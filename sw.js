
// ════════════════════════════════════════
//  NCDC Manager — Service Worker v10 FCM
// ════════════════════════════════════════
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const CACHE_NAME = 'ncdc-manager-v10';

// ── تهيئة Firebase في الخلفية ──
firebase.initializeApp({
  apiKey:            'AIzaSyB-zqUZQ5u9AUKislLLl-KAGLoN9nairEo',
  authDomain:        'ncdc-mail-a68ff.firebaseapp.com',
  projectId:         'ncdc-mail-a68ff',
  storageBucket:     'ncdc-mail-a68ff.firebasestorage.app',
  messagingSenderId: '197299236308',
  appId:             '1:197299236308:web:4205dd506cbc0148a53a41'
});

const messaging = firebase.messaging();

// ── استقبال الإشعارات في الخلفية (التطبيق مغلق) ──
messaging.onBackgroundMessage(payload => {
  console.log('[SW] Background message:', payload);

  const title = payload.notification?.title || 'NCDC — بريد جديد 📬';
  const body  = payload.notification?.body  || 'وصلت مراسلة جديدة';
  const data  = payload.data || {};

  self.registration.showNotification(title, {
    body,
    icon:     './icon-192.png',
    badge:    './icon-96.png',
    tag:      data.tag || 'ncdc-mail',
    renotify: true,
    dir:      'rtl',
    lang:     'ar',
    vibrate:  [200, 100, 200],
    data:     { url: './index.html' }
  });
});

// ── Install ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(['./index.html', './manifest.json', './icon-192.png', './icon-512.png'])
           .catch(e => console.warn('[SW] cache warn:', e))
    )
  );
  self.skipWaiting();
});

// ── Activate ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic') ||
      url.hostname.includes('firestore') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('fcm')) return;

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

// ── Notification Click ──
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

// ── رسائل من الصفحة (fallback) ──
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
