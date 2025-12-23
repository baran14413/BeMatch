'use client';
import { useState, useEffect, useCallback } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { isSupported } from 'firebase/messaging/sw';
import { useFirebase } from '@/firebase';

export function useFcmToken() {
  const { firebaseApp } = useFirebase();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [isNotificationSupported, setIsNotificationSupported] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const retrieveToken = useCallback(async () => {
    try {
      const supported = await isSupported();
      setIsNotificationSupported(supported);

      if (supported && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        setNotificationPermission(Notification.permission);
        
        if (Notification.permission === 'granted') {
          const messaging = getMessaging(firebaseApp);
          
          // Explicitly register the service worker.
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          
          // Ensure the service worker is active before trying to get the token.
          await navigator.serviceWorker.ready;

          const currentToken = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
          });

          if (currentToken) {
            setFcmToken(currentToken);
            // TODO: Save this token to your backend/Firestore for the current user
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        }
      }
    } catch (err) {
      console.error('An error occurred while retrieving token. ', err);
      setError(err as Error);
    }
  }, [firebaseApp]);

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
    retrieveToken();
  }, [retrieveToken]);

  useEffect(() => {
    if (isNotificationSupported && 'serviceWorker' in navigator) {
      const messaging = getMessaging(firebaseApp);
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received.', payload);
        // You can use a library like 'react-hot-toast' or a custom component to show a foreground notification.
      });
      return () => {
        unsubscribe();
      };
    }
  }, [isNotificationSupported, firebaseApp]);

  return { fcmToken, notificationPermission, requestPermission, isNotificationSupported, error };
}
