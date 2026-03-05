// Firebase Messaging Service Worker
// Handles background push notifications when the app is closed or in background

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCtj9XvTW2aiumZhrR3OXQk3U3sh01ffRQ",
    authDomain: "bematch-f168d.firebaseapp.com",
    databaseURL: "https://bematch-f168d-default-rtdb.firebaseio.com",
    projectId: "bematch-f168d",
    storageBucket: "bematch-f168d.firebasestorage.app",
    messagingSenderId: "137528078260",
    appId: "1:137528078260:web:9bbd45115bd2aaf8200ce1"
});

const messaging = firebase.messaging();

// Handle background messages (app closed or in background tab)
messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'BeMatch';
    const notificationBody = payload.notification?.body || payload.data?.body || '';
    const notificationType = payload.data?.type || 'app';
    const link = payload.data?.link || '/';

    const notificationOptions = {
        body: notificationBody,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: notificationType + '_' + Date.now(),
        data: { link },
        requireInteraction: notificationType === 'message',
        // Reply action for message notifications
        actions: notificationType === 'message' ? [
            {
                action: 'reply',
                title: 'Cevapla',
                type: 'text',
                placeholder: 'Mesajınızı yazın...'
            },
            {
                action: 'open',
                title: 'Aç'
            }
        ] : [
            {
                action: 'open',
                title: 'Aç'
            }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click — open the app / specific URL
self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const link = event.notification.data?.link || '/';

    if (event.action === 'reply') {
        // User typed a reply — open the chat page
        event.waitUntil(
            clients.openWindow(link)
        );
        return;
    }

    // Focus existing window or open new one
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    if (client.navigate) client.navigate(link);
                    return;
                }
            }
            return clients.openWindow(link);
        })
    );
});
