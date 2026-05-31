
// ════════════════════════════════════════
//  NCDC — firebase-messaging-sw.js v2
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

// ── استقبال الإشعارات في الخلفية ──
messaging.onBackgroundMessage(payload => {
  console.log('[FCM-SW] Background message received:', payload);

  const title = payload.notification?.title
             || payload.data?.title
             || 'NCDC — بريد جديد 📬';
  const body  = payload.notification?.body
             || payload.data?.body
             || 'وصلت مراسلة جديدة';

  return self.registration.showNotification(title, {
    body,
    icon:     '/ncdc-manager-mobile/icon-192.png',
    badge:    '/ncdc-manager-mobile/icon-96.png',
    tag:      'ncdc-mail',
    renotify: true,
    dir:      'rtl',
    lang:     'ar',
    vibrate:  [200, 100, 200],
    data:     { url: '/ncdc-manager-mobile/index.html' }
  });
});

// ── فتح التطبيق عند الضغط على الإشعار ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url
           || '/ncdc-manager-mobile/index.html';
  event.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
      for(const c of list){
        if(c.url.includes('ncdc-manager') && 'focus' in c) return c.focus();
      }
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});
