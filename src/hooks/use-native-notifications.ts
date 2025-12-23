'use client';

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from '@capacitor/push-notifications';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from './use-toast';

export function useNativeNotifications() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [hasPermission, setHasPermission] = useState(false);
  const isCapacitor = Capacitor.isNativePlatform();

  const checkPermissions = useCallback(async () => {
    if (!isCapacitor) return;
    const { receive } = await PushNotifications.checkPermissions();
    setHasPermission(receive === 'granted');
  }, [isCapacitor]);

  const registerPush = useCallback(async () => {
    if (!isCapacitor || !user || !firestore) return;

    // Register with Apple / Google to receive a device token
    await PushNotifications.register();

    // Get the FCM token (or APNS token on iOS)
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token:', token.value);
      // Save the token to the user's Firestore document
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, { fcmToken: token.value }, { merge: true });
      } catch (error) {
        console.error('Error saving FCM token to Firestore:', error);
      }
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration:', error);
    });

    // --- Listeners for incoming notifications ---

    // Fired when a notification is received while the app is in the foreground
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push received in foreground:', notification);
        toast({
          title: notification.title || 'New Notification',
          description: notification.body || '',
        });
      }
    );

    // Fired when the user taps on a notification
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        console.log('Push action performed:', notification);
        // Here you can add logic to navigate to a specific screen
        // e.g., router.push(notification.notification.data.url)
      }
    );
  }, [isCapacitor, user, firestore, toast]);

  useEffect(() => {
    if (isCapacitor) {
      checkPermissions();
      registerPush();

      return () => {
        PushNotifications.removeAllListeners();
      };
    }
  }, [isCapacitor, checkPermissions, registerPush]);

  const requestPermission = useCallback(async () => {
    if (!isCapacitor) {
      console.warn('Not a native platform. Cannot request push permissions.');
      return;
    }
    try {
      const { receive } = await PushNotifications.requestPermissions();
      if (receive === 'granted') {
        setHasPermission(true);
        await registerPush();
      } else {
        setHasPermission(false);
      }
    } catch (error) {
      console.error('Error requesting push permissions:', error);
    }
  }, [isCapacitor, registerPush]);

  return { hasPermission, requestPermission, isNative: isCapacitor };
}
