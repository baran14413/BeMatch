'use client';
import { useState, useEffect, useCallback } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { isSupported } from 'firebase/messaging/sw';
import { useFirebase } from '@/firebase';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';

export function useFcmToken() {
  const { firebaseApp, firestore, user } = useFirebase();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [isNotificationSupported, setIsNotificationSupported] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const retrieveToken = useCallback(async () => {
    try {
      const supported = await isSupported();
      setIsNotificationSupported(supported);

      if (supported && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        if (Notification.permission === 'granted') {
          const messaging = getMessaging(firebaseApp);
          
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          await navigator.serviceWorker.ready;

          const currentToken = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
          });

          if (currentToken) {
            setFcmToken(currentToken);
            if (user && firestore) {
              const userDocRef = doc(firestore, 'users', user.uid);
              await setDoc(userDocRef, {
                fcmTokens: arrayUnion(currentToken)
              }, { merge: true });
            }
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        }
      }
    } catch (err) {
      console.error('An error occurred while retrieving token. ', err);
      setError(err as Error);
    }
  }, [firebaseApp, firestore, user]);

  const requestPermission = useCallback(async () => {
    if (!isNotificationSupported) {
      console.log("Notifications not supported in this environment.");
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        await retrieveToken();
      }
    } catch (err) {
      console.error('An error occurred while requesting permission. ', err);
      setError(err as Error);
    }
  }, [isNotificationSupported, retrieveToken]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNotificationPermission(Notification.permission);
      retrieveToken();
    }
  }, [retrieveToken]);

  useEffect(() => {
    if (isNotificationSupported && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const messaging = getMessaging(firebaseApp);
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received.', payload);
        const notification = new Notification(payload.notification?.title || 'New Message', {
          body: payload.notification?.body,
          icon: payload.notification?.image || '/icons/icon-192x192.png'
        });
      });
      return () => {
        unsubscribe();
      };
    }
  }, [isNotificationSupported, firebaseApp]);

  return { fcmToken, notificationPermission, requestPermission, isNotificationSupported, error };
}
