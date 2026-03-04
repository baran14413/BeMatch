import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'

export type NotificationType = 'match' | 'message' | 'like' | 'app'

interface SendNotificationParams {
    userId: string
    type: NotificationType
    title: string
    body: string
    link?: string
    avatar?: string
}

export const sendNotification = async ({ userId, type, title, body, link, avatar }: SendNotificationParams) => {
    try {
        // First check user's notification settings
        const userDoc = await getDoc(doc(db, 'users', userId))
        const userData = userDoc.data()

        if (userData?.notificationSettings) {
            const settings = userData.notificationSettings
            // If the user has explicitly turned off this type of notification, abort.
            if (type === 'match' && settings.match === false) return
            if (type === 'message' && settings.message === false) return
            if (type === 'like' && settings.like === false) return
            if (type === 'app' && settings.app === false) return
        }

        const notificationsRef = collection(db, `users/${userId}/notifications`)
        await addDoc(notificationsRef, {
            type,
            title,
            body,
            link: link || '',
            avatar: avatar || '',
            timestamp: serverTimestamp(),
            read: false
        })
    } catch (err) {
        console.error('Failed to send notification:', err)
    }
}
