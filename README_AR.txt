تطبيق لوحة المدير للهاتف — NCDC

ما هذا الملف؟
- نسخة هاتف تعرض لوحة المدير فقط.
- مربوطة بمشروع Firebase الجديد: ncdc-mali.
- تقرأ نفس Collection: mails.
- تعرض البريد والمرفقات PDF/صور.
- تعطي إشعار عند إضافة أو تعديل بريد في Firestore أثناء فتح التطبيق أو تثبيته.

طريقة الرفع على GitHub:
1) فك الضغط.
2) أنشئ Repository جديد مثل: ncdc-manager-mobile
3) ارفع محتويات هذا المجلد مباشرة:
   index.html
   manifest.json
   service-worker.js
   icons/
4) من Settings > Pages:
   Source: Deploy from a branch
   Branch: main
   Folder: /root
   Save

طريقة التثبيت على الهاتف:
- Android Chrome: افتح الرابط > الثلاث نقاط > Add to Home Screen / Install app
- iPhone Safari: افتح الرابط > Share > Add to Home Screen

الإشعارات:
- اضغط زر 🔔 داخل التطبيق واسمح بالإشعارات.
- هذه النسخة تعطي إشعارات عند فتح التطبيق/تثبيته ووجود اتصال مباشر بـ Firestore.
- الإشعارات عندما يكون التطبيق مغلقًا بالكامل تحتاج إعداد Firebase Cloud Messaging مع VAPID Key وتعديل إضافي.

كلمة مرور المدير الحالية:
1821992
