import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

export type AutoMessageTrigger = 'WELCOME' | 'MATCH' | 'INACTIVITY' | 'PREMIUM_EXPIRED';

export const triggerAutoMessages = async (triggerType: AutoMessageTrigger, targetUserId: string, secondUserId?: string) => {
    try {
        const q = query(
            collection(db, 'auto_messages'),
            where('triggerType', '==', triggerType),
            where('isActive', '==', true)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return;

        for (const docSnap of snapshot.docs) {
            const autoMsg = docSnap.data();
            const delayMs = (autoMsg.delayMinutes || 0) * 60 * 1000;

            if (delayMs > 0) {
                // For client-side delays, this only works if the app stays open.
                // In a production app, this would be a Cloud Function.
                setTimeout(() => {
                    sendActualMessage(autoMsg.body, targetUserId, secondUserId);
                }, delayMs);
            } else {
                await sendActualMessage(autoMsg.body, targetUserId, secondUserId);
            }
        }
    } catch (error) {
        console.error(`Error triggering ${triggerType} auto messages:`, error);
    }
};

const sendActualMessage = async (content: string, targetUserId: string, secondUserId?: string) => {
    try {
        // If secondUserId is provided, it's a match-type message between two users.
        // If not, it's a system message to the targetUser.
        const senderId = secondUserId ? secondUserId : 'system';
        const receiverId = targetUserId;

        const chatId = [senderId, receiverId].sort().join('_');
        const now = Date.now();

        // 1. Add message document
        await addDoc(collection(db, `chats/${chatId}/messages`), {
            type: 'text',
            content: content,
            senderId: senderId,
            createdAt: now,
            status: 'sent'
        });

        // 2. Update/Create chat document
        await updateDoc(doc(db, 'chats', chatId), {
            lastMessage: content,
            lastMessageTime: now,
            [`unreadCount_${receiverId}`]: increment(1),
            updatedAt: now
        }).catch(async (err) => {
            // If chat doesn't exist, we might need to create it (especially for system messages)
            if (err.code === 'not-found') {
                const { setDoc } = await import('firebase/firestore');
                await setDoc(doc(db, 'chats', chatId), {
                    participants: [senderId, receiverId],
                    lastMessage: content,
                    lastMessageTime: now,
                    [`unreadCount_${receiverId}`]: 1,
                    [`unreadCount_${senderId}`]: 0,
                    updatedAt: now
                });
            }
        });
    } catch (error) {
        console.error("Error sending actual auto message:", error);
    }
};
