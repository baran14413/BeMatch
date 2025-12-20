'use client'; // This directive is for Next.js, but the code logic is for React Native

import { useState, useEffect, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import { useUser } from '@/firebase'; // Assuming this hook works in your RN setup

/**
 * A hook to manage native push notification permissions and FCM token.
 * This is for React Native and uses @react-native-firebase/messaging.
 *
 * @returns An object containing permission status, a request function, and the FCM token.
 */
export function useNativeNotifications() {
  const { user } = useUser();
  const [hasPermission, setHasPermission] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  /**
   * Checks the current notification permission status.
   */
  const checkPermission = useCallback(async () => {
    try {
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      setHasPermission(enabled);

      if (enabled) {
        getAndSaveToken();
      }
    } catch (error) {
      console.error('[useNativeNotifications] Error checking permission:', error);
      setHasPermission(false);
    }
  }, []);

  /**
   * Gets the FCM token and saves it to the user's Firestore document.
   */
  const getAndSaveToken = useCallback(async () => {
    if (!user) return;

    try {
      const token = await messaging().getToken();
      if (token) {
        setFcmToken(token);
        // Save the token to the user's profile in Firestore
        await firestore().collection('users').doc(user.uid).set(
          {
            fcmToken: token,
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.error('[useNativeNotifications] Error getting/saving FCM token:', error);
    }
  }, [user]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  /**
   * Requests notification permission from the user.
   * Handles Android 13+ specific permission requirements.
   */
  const requestPermission = useCallback(async () => {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const androidPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (androidPermission !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'You will not receive notifications unless you grant permission from your phone settings.'
          );
          setHasPermission(false);
          return;
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      setHasPermission(enabled);

      if (enabled) {
        getAndSaveToken();
      }
    } catch (error) {
      console.error('[useNativeNotifications] Error requesting permission:', error);
      Alert.alert('Error', 'Could not request notification permission.');
      setHasPermission(false);
    }
  }, [getAndSaveToken]);

  return { hasPermission, requestPermission, fcmToken };
}
