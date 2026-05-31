// ════════════════════════════════════════
//  NCDC — firebase-messaging-sw.js
//  هذا الملف مطلوب من Firebase تحديداً
// ════════════════════════════════════════
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyB-zqUZQ5u9AUKislLLl-KAGLoN9nairEo',
  authDomain:        'ncdc-mail-a68ff.firebaseapp.com',
  projectId:         'ncdc-mail-a68ff',
  storageBucket:     'ncdc-mail-a68ff.firebasestorage.app',
  messagingSenderId: '197299236308',
  appId:             '1:197299236308:web:4205dd506cbc0148a53a41'
});

const messaging = firebase.messaging();

// ── استقبال الإشعارات عندما التطبيق في الخلفية أو مغلق ──
messaging.onBackgroundMessage(payload => {
  console.log('[FCM-SW] Background message:', payload);

  const title = payload.notification?.title || 'NCDC — بريد جديد 📬';
  const body  = payload.notification?.body  || 'وصلت مراسلة جديدة';

  self.registration.showNotification(title, {
    body,
    icon:     './icon-192.png',
    badge:    './icon-96.png',
    tag:      'ncdc-mail',
    renotify: true,
    dir:      'rtl',
    lang:     'ar',
    vibrate:  [200, 100, 200],
    data:     { url: './index.html' }
  });
});

// ── الضغط على الإشعار يفتح التطبيق ──
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
