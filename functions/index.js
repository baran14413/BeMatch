/**
 * BeMatch Firebase Cloud Functions
 *
 * Triggers FCM push notifications when:
 * 1. A new notification document is created in users/{uid}/notifications
 * 2. A new message is created in chats/{chatId}/messages (for offline users)
 */

const functions = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

/**
 * Trigger: New notification document created
 * Sends FCM push to the user's device
 */
exports.sendPushOnNotification = functions.firestore
    .document('users/{uid}/notifications/{notifId}')
    .onCreate(async (snap, context) => {
        const uid = context.params.uid;
        const data = snap.data();
        if (!data) return null;

        // Skip if already processed (avoid double sends)
        if (data.fcmSent) return null;

        // Get the user's FCM token from their profile
        const userDoc = await db.doc(`users/${uid}`).get();
        if (!userDoc.exists) return null;

        const userData = userDoc.data();
        const fcmToken = userData?.fcmToken;
        if (!fcmToken) return null;

        // Build FCM message
        const title = data.title || 'BeMatch';
        const body = data.body || '';
        const type = data.type || 'app';
        const link = data.link || '/';

        const message = {
            token: fcmToken,
            data: {
                title,
                body,
                type,
                link,
            },
            android: {
                priority: type === 'message' ? 'high' : 'normal',
                notification: {
                    channelId: type === 'message' ? 'bematch_messages' : 'bematch_app',
                    icon: 'ic_stat_notify',
                    color: '#E63946',
                    sound: 'default',
                },
            },
            apns: {
                payload: {
                    aps: {
                        alert: { title, body },
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };

        try {
            await messaging.send(message);
            // Mark as sent to avoid duplicates
            await snap.ref.update({ fcmSent: true });
        } catch (err) {
            console.error('[FCM] Send error:', err.code, err.message);

            // Token expired/invalid — clean it up
            if (err.code === 'messaging/registration-token-not-registered') {
                await db.doc(`users/${uid}`).update({ fcmToken: null });
            }
        }
        return null;
    });

/**
 * Trigger: New message in chat
 * Sends FCM push to the RECIPIENT if they have a token
 */
exports.sendPushOnMessage = functions.firestore
    .document('chats/{chatId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        if (!data) return null;

        // Skip system messages
        if (data.senderId === 'system') return null;

        const chatId = context.params.chatId;

        // Get chat participants
        const chatDoc = await db.doc(`chats/${chatId}`).get();
        if (!chatDoc.exists) return null;

        const chat = chatDoc.data();
        const participants = chat?.participants || [];
        const senderId = data.senderId;

        // The recipient is whoever is NOT the sender
        const recipientId = participants.find(p => p !== senderId);
        if (!recipientId) return null;

        // Get recipient's profile for FCM token and notification settings
        const recipientDoc = await db.doc(`users/${recipientId}`).get();
        if (!recipientDoc.exists) return null;

        const recipient = recipientDoc.data();
        const fcmToken = recipient?.fcmToken;
        if (!fcmToken) return null;

        // Respect user's notification settings
        const notifSettings = recipient?.notificationSettings;
        if (notifSettings && notifSettings.message === false) return null;

        // Get sender's name
        const senderDoc = await db.doc(`users/${senderId}`).get();
        const senderName = senderDoc.exists
            ? (senderDoc.data()?.firstName || 'Biri')
            : 'Biri';

        // Determine message preview
        let preview = '';
        if (data.type === 'text') {
            preview = data.content || '';
        } else if (data.type === 'voice') {
            preview = '🎤 Sesli mesaj';
        } else if (data.type === 'image') {
            preview = '📷 Fotoğraf';
        } else {
            preview = 'Yeni mesaj';
        }

        const link = `/chat/${chatId}`;

        const message = {
            token: fcmToken,
            data: {
                title: senderName,
                body: preview,
                type: 'message',
                link,
                chatId,
                senderId,
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'bematch_messages',
                    icon: 'ic_stat_notify',
                    color: '#E63946',
                    sound: 'default',
                    tag: `chat_${chatId}`,
                },
            },
            apns: {
                payload: {
                    aps: {
                        alert: { title: senderName, body: preview },
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };

        try {
            await messaging.send(message);
        } catch (err) {
            console.error('[FCM] Message send error:', err.code, err.message);
            if (err.code === 'messaging/registration-token-not-registered') {
                await db.doc(`users/${recipientId}`).update({ fcmToken: null });
            }
        }
        return null;
    });

