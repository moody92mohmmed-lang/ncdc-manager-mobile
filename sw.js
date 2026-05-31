// ══════════════════════════════════════════
//  NCDC Manager — sw.js (With Sound)
// ══════════════════════════════════════════
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js');

const CACHE = 'ncdc-v11';
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

// ── صوت الإشعار (Base64 MP3 بسيط — نغمة تنبيه) ──
// نغمة beep قصيرة مُرمَّزة بـ Base64
const NOTIFICATION_SOUND = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhgCenp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6e////////////////////////////////////////////////////////////////////////////////AAAAAExhdmM1OC41MQAAAAAAAAAAAAAAACQAAAAAAAAAAAM6tR9BAAAAAAAAAAAAAAAAAAAAAP/7kGQAAANUAtBUAAAI2QCqDAAAARBJSmQgIABEEklZiAgAEbf///5mIiJiIiIiJmZmZiIiIiImZmZiIiIiJiIiIiZmZmZiIiIiJiIiIiZmZmZiIiJiJmZmZiIiIiZiIiIiZmZmZiIiIiJmZmZiIiIiJiIiIiZmZmZiIiIiJiIiIiZmZmZiIiIiZiIiIiZmZmZiIiIiJmZmZiIiIiZiIiIiZmZmZiIiIiJiIiIiZmZmZiIiJiJmZmZiIiIiZiIiIiZmZmZiIiIiJmZmZiIiIiJiIiIiZmZmZiIiIiJiIiIiZmZmZiIiIiZiIiIiZmZmZiIiIiJmZmZiIiIiZiIiIiZmZmZiIiIiJiIiIiZmZmZiIiJiJmZmZiIiIiZiIiIiZmZmZiIiIiJmZmZiIiIiJiIiIiZmZmZiIiIiJiIiIiZmZmZiIiIiZiIiIiZmZmZiIiIiJmZmZiIiIiZiIiIiZmZmZiIiIiJiIiIiZmZmZiIiJiJmZmZiIiIiZiIiIiZmZmZiIiIiJmZmZiIiIiJiIiIiZmZmZiIiIiJiIiIiZmZmZiIiIiZiIiIiZmZmZiIiIiJmZmZiIiIiZiIiIiZmZmZiIiIiJiIiIiZmZmZiIiJiJmZmZiIiIiZiIiIiZmZmZiIiIiJmZmZiIiIiJiIiIiZmZmZiIiIiJiIiIiZmZmZiIiIiZiIiIiZmZmZiIiIiJmZmZiIiIiZiIiIiZmZmZiIiIiJiIiIiZmZmZiA==';

// ── إرسال الإشعار مع الصوت ──
async function showNotifWithSound(title, body, tag) {
  // إرسال الإشعار
  await self.registration.showNotification(title, {
    body,
    icon:     '/ncdc-manager-mobile/icon-192.png',
    badge:    '/ncdc-manager-mobile/icon-96.png',
    tag:      tag || 'ncdc-mail',
    renotify: true,
    dir:      'rtl',
    lang:     'ar',
    vibrate:  [300, 100, 300, 100, 300],
    silent:   false,
    data:     { url: '/ncdc-manager-mobile/index.html' }
  });

  // تشغيل الصوت عبر إرسال رسالة للصفحة المفتوحة
  const allClients = await clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const client of allClients) {
    client.postMessage({ type: 'PLAY_SOUND' });
  }
}

// ── مراقبة Firestore كل 15 ثانية ──
async function checkNewMails() {
  try {
    const database = initDB();
    if (!database) return;

    const snap = await database.collection('mails')
      .where('archived', '==', false)
      .get();

    const allMails = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const newMails = allMails.filter(m => !m.status || m.status === 'new');
    const currentCount = newMails.length;

    if (lastCount > 0 && currentCount > lastCount) {
      const newest = newMails[0];
      const title = 'وصل بريد جديد 📬';
      const body  = (newest.subject || 'مراسلة جديدة') + ' — ' + (newest.party || newest.from || '');
      await showNotifWithSound(title, body, 'ncdc-' + newest.id);
    }

    lastCount = currentCount;
  } catch(e) {
    console.warn('[SW] Check error:', e.message);
  }
}

// ── Install ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(['./index.html', './manifest.json', './icon-192.png'])
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

  if (type === 'START_WATCH') {
    if (!isWatching) {
      isWatching = true;
      checkNewMails(); // قراءة أولية
      watchInterval = setInterval(checkNewMails, 15000);
      console.log('[SW] Started watching');
    }
  }

  if (type === 'STOP_WATCH') {
    isWatching = false;
    if (watchInterval) { clearInterval(watchInterval); watchInterval = null; }
    lastCount = 0;
  }

  if (type === 'SHOW_NOTIFICATION') {
    showNotifWithSound(
      event.data.title || 'NCDC مدير 📬',
      event.data.body  || 'وصل بريد جديد',
      event.data.tag   || 'ncdc'
    );
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
