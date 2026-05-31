
// ══════════════════════════════════════════
//  NCDC Manager — sw.js (No FCM needed)
//  يراقب Firestore مباشرة من الخلفية
// ══════════════════════════════════════════
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js');

const CACHE = 'ncdc-v10';
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyB-zqUZQ5u9AUKislLLl-KAGLoN9nairEo',
  authDomain:        'ncdc-mail-a68ff.firebaseapp.com',
  projectId:         'ncdc-mail-a68ff',
  storageBucket:     'ncdc-mail-a68ff.firebasestorage.app',
  messagingSenderId: '197299236308',
  appId:             '1:197299236308:web:4205dd506cbc0148a53a41'
};

let db = null;
let lastCount = 0;
let watchInterval = null;
let isWatching = false;

function initDB() {
  if (db) return db;
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    return db;
  } catch(e) {
    console.error('[SW] Firebase init error:', e);
    return null;
  }
}

// ── مراقبة Firestore بالـ polling كل 15 ثانية ──
async function checkNewMails() {
  try {
    const db = initDB();
    if (!db) return;

    const snap = await db.collection('mails')
      .where('archived', '==', false)
      .get();

    const newMails = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(m => m.status === 'new' || m.status === undefined);

    const currentCount = newMails.length;

    if (lastCount > 0 && currentCount > lastCount) {
      // يوجد بريد جديد!
      const newest = newMails[0];
      self.registration.showNotification('وصل بريد جديد 📬', {
        body: (newest.subject || 'مراسلة جديدة') + ' — ' + (newest.party || newest.from || ''),
        icon: '/ncdc-manager-mobile/icon-192.png',
        badge: '/ncdc-manager-mobile/icon-96.png',
        tag: 'ncdc-new-' + newest.id,
        renotify: true,
        dir: 'rtl',
        lang: 'ar',
        vibrate: [200, 100, 200, 100, 200],
        data: { url: '/ncdc-manager-mobile/index.html' }
      });
    }
    lastCount = currentCount;
  } catch(e) {
    console.warn('[SW] Check error:', e);
  }
}

// ── Install ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(['./index.html','./manifest.json','./icon-192.png'])
       .catch(e => console.warn('[SW] cache:', e))
    )
  );
  self.skipWaiting();
});

// ── Activate ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
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
      url.hostname.includes('firebase')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          caches.open(CACHE).then(c => c.put(event.request, res.clone()));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(c => c || fetch(event.request))
    );
  }
});

// ── رسائل من الصفحة ──
self.addEventListener('message', event => {
  const type = event.data?.type;

  // بدء المراقبة عند تسجيل الدخول
  if (type === 'START_WATCH') {
    if (!isWatching) {
      isWatching = true;
      // أول قراءة لتحديد العدد الحالي بدون إشعار
      checkNewMails();
      // ثم مراقبة كل 15 ثانية
      watchInterval = setInterval(checkNewMails, 15000);
      console.log('[SW] Started watching Firestore');
    }
  }

  // إيقاف المراقبة عند الخروج
  if (type === 'STOP_WATCH') {
    isWatching = false;
    if (watchInterval) { clearInterval(watchInterval); watchInterval = null; }
    lastCount = 0;
    console.log('[SW] Stopped watching');
  }

  // إشعار مباشر من الصفحة (التطبيق مفتوح)
  if (type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(event.data.title || 'NCDC مدير', {
      body:     event.data.body || 'وصل بريد جديد',
      icon:     '/ncdc-manager-mobile/icon-192.png',
      badge:    '/ncdc-manager-mobile/icon-96.png',
      tag:      event.data.tag || 'ncdc',
      renotify: true,
      dir:      'rtl',
      vibrate:  [180, 80, 180],
      data:     { url: '/ncdc-manager-mobile/index.html' }
    });
  }
});

// ── فتح التطبيق عند الضغط على الإشعار ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/ncdc-manager-mobile/index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('ncdc-manager') && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
