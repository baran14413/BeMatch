import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore, doc, updateDoc } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getDatabase } from 'firebase/database'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { Capacitor } from '@capacitor/core'

const firebaseConfig = {
    apiKey: "AIzaSyCtj9XvTW2aiumZhrR3OXQk3U3sh01ffRQ",
    authDomain: "bematch-f168d.firebaseapp.com",
    databaseURL: "https://bematch-f168d-default-rtdb.firebaseio.com",
    projectId: "bematch-f168d",
    storageBucket: "bematch-f168d.firebasestorage.app",
    messagingSenderId: "137528078260",
    appId: "1:137528078260:web:9bbd45115bd2aaf8200ce1",
    measurementId: "G-B9HD1ESD1H"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
// Set persistence to Local
setPersistence(auth, browserLocalPersistence).catch(console.error)

export const db = getFirestore(app)
export const storage = getStorage(app)
export const rtdb = getDatabase(app)

// ── Firebase Cloud Messaging (Web Push) ──────────────────────────────────────
// Only initialize messaging on web — Capacitor handles FCM natively on Android
let messaging: ReturnType<typeof getMessaging> | null = null

if (!Capacitor.isNativePlatform() && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
        messaging = getMessaging(app)
    } catch {
        // Messaging not supported in this environment
    }
}

/**
 * Register service worker and get FCM token, then save it to Firestore.
 * Call this after user logs in.
 */
export const initFCM = async (uid: string): Promise<void> => {
    try {
        // Android native — FCM handled by Capacitor Push Notifications plugin
        if (Capacitor.isNativePlatform()) {
            try {
                // Dynamic import — @capacitor/push-notifications types may not be installed
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                // @ts-ignore
                const cap = await import('@capacitor/push-notifications').catch(() => null) as any
                if (!cap) return
                const { PushNotifications } = cap
                await PushNotifications.requestPermissions()
                await PushNotifications.register()

                PushNotifications.addListener('registration', async (token: { value: string }) => {
                    await saveFcmToken(uid, token.value, 'android')
                })

                PushNotifications.addListener('pushNotificationReceived', (_notification: unknown) => {
                    // App is in foreground — Capacitor shows it; nothing extra needed
                })
            } catch (e) {
                console.warn('[FCM] Capacitor PushNotifications not available:', e)
            }
            return
        }

        // Web — use Firebase SDK messaging
        if (!messaging) return

        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        const currentToken = await getToken(messaging, {
            vapidKey: undefined, // Uses server key from google-services
            serviceWorkerRegistration: registration
        })

        if (currentToken) {
            await saveFcmToken(uid, currentToken, 'web')
        }

        // Handle foreground messages on web
        onMessage(messaging, (payload) => {
            const title = payload.notification?.title || 'BeMatch'
            const body = payload.notification?.body || ''
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, { body, icon: '/icons/icon-192.png' })
            }
        })
    } catch (err) {
        console.warn('[FCM] initFCM error:', err)
    }
}

const saveFcmToken = async (uid: string, token: string, platform: string): Promise<void> => {
    try {
        await updateDoc(doc(db, 'users', uid), {
            fcmToken: token,
            fcmPlatform: platform,
            fcmUpdatedAt: Date.now()
        })
    } catch (err) {
        console.warn('[FCM] saveFcmToken error:', err)
    }
}

export default app
