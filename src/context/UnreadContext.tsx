import React, { createContext, useContext, useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

interface UnreadContextType {
    totalUnread: number
}

const UnreadContext = createContext<UnreadContextType>({ totalUnread: 0 })

export const useUnread = () => useContext(UnreadContext)

export const UnreadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth()
    const [totalUnread, setTotalUnread] = useState(0)

    useEffect(() => {
        if (!user) {
            setTotalUnread(0)
            return
        }

        // Listen for all chats where the user is a participant
        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', user.uid)
        )

        const unsubscribe = onSnapshot(q, (snap) => {
            let sum = 0
            for (const doc of snap.docs) {
                const data = doc.data()
                // Each chat document will store unreadCount_[userId] = number
                const unreadKey = `unreadCount_${user.uid}`
                if (data[unreadKey] && typeof data[unreadKey] === 'number') {
                    sum += data[unreadKey]
                }
            }
            setTotalUnread(sum)
        })

        return () => unsubscribe()
    }, [user])

    return (
        <UnreadContext.Provider value={{ totalUnread }}>
            {children}
        </UnreadContext.Provider>
    )
}
