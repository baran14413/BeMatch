// This file must be in the public directory.

// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCtj9XvTW2aiumZhrR3OXQk3U3sh01ffRQ",
  authDomain: "bematch-f168d.firebaseapp.com",
  projectId: "bematch-f168d",
  storageBucket: "bematch-f168d.firebasestorage.app",
  messagingSenderId: "137528078260",
  appId: "1:137528078260:web:9bbd45115bd2aaf8200ce1",
  measurementId: "G-B9HD1ESD1H"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image || '/icons/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
