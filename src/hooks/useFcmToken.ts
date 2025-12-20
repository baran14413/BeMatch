'use client';
import { useState, useEffect, useCallback } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { isSupported } from 'firebase/messaging/sw';
import { useFirebase } from '@/firebase';

export function useFcmToken() {
  const { firebaseApp, user } = useFirebase();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [isNotificationSupported, setIsNotificationSupported] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const retrieveToken = useCallback(async () => {
    try {
      const supported = await isSupported();
      setIsNotificationSupported(supported);

      if (supported && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        // Set current permission status
        setNotificationPermission(Notification.permission);
        
        if (Notification.permission === 'granted') {
          const messaging = getMessaging(firebaseApp);
          const currentToken = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          });
          if (currentToken) {
            setFcmToken(currentToken);
            // Here you would typically save the token to your backend/Firestore
            // associated with the user.
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
        await retrieveToken(); // Re-retrieve token after getting permission
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
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from service worker:', event.data);
      });
    }
  }, [isNotificationSupported]);

  return { fcmToken, notificationPermission, requestPermission, isNotificationSupported, error };
}
