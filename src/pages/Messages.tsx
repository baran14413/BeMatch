import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, Trash2, Pin, X, Check, BadgeCheck } from 'lucide-react'
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, writeBatch, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import BottomNav from '../components/BottomNav'
import { useTranslation } from 'react-i18next'
import './Messages.css'

interface Conversation {
    id: string
    name: string
    photo: string
    lastMessage: string
    time: string
    unread: number
    online: boolean
    pinned: boolean
    updatedAt: number
    isSystem?: boolean
    isDeleted?: boolean
}

export default function Messages() {
    const { t } = useTranslation()
    const { user } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)
    const [selectMode, setSelectMode] = useState(false)
    const [selected, setSelected] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!user) return

        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', user.uid)
        )

        const unsubscribe = onSnapshot(q, async (snap) => {
            const convos: Conversation[] = []

            for (const document of snap.docs) {
                const data = document.data()
                const otherUserId = data.participants.find((id: string) => id !== user.uid)

                // Track our unread messages
                const myUnreadCount = data[`unreadCount_${user.uid}`] || 0

                if (otherUserId) {
                    let fTime = ''
                    if (data.updatedAt) {
                        const d = new Date(data.updatedAt)
                        fTime = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} `
                    }

                    if (otherUserId === 'system') {
                        convos.push({
                            id: document.id,
                            name: t('msg.support'),
                            photo: 'https://ui-avatars.com/api/?name=BeMatch&background=0284c7&color=fff&bold=true',
                            lastMessage: data.lastMessage || t('msg.sys_notif'),
                            time: fTime,
                            unread: myUnreadCount,
                            online: true,
                            pinned: Array.isArray(data.pinnedBy) && data.pinnedBy.includes(user.uid),
                            updatedAt: data.updatedAt || 0,
                            isSystem: true
                        })
                        continue
                    }

                    try {
                        const otherUserDoc = await getDoc(doc(db, 'users', otherUserId))
                        const otherUserData = otherUserDoc.data()

                        if (otherUserData) {
                            const isDeleted = !!otherUserData.deletedAt
                            convos.push({
                                id: document.id,
                                name: isDeleted ? t('msg.disabled') : (otherUserData.firstName || t('msg.unnamed')),
                                photo: isDeleted ? '' : (otherUserData.photos?.[0] || ''),
                                lastMessage: data.lastMessage || t('msg.start_chat'),
                                time: fTime,
                                unread: myUnreadCount,
                                online: false, // RTDB logic isn't heavily needed here yet
                                pinned: Array.isArray(data.pinnedBy) && data.pinnedBy.includes(user.uid),
                                updatedAt: data.updatedAt || 0,
                                isDeleted
                            })
                        }
                    } catch (err) {
                        console.error("Kullanıcı detayı alınamadı", err)
                    }
                }
            }

            // Sort conversations
            convos.sort((a, b) => {
                // Pinned ones first
                if (a.pinned && !b.pinned) return -1
                if (!a.pinned && b.pinned) return 1
                // Then sort by newest
                return b.updatedAt - a.updatedAt
            })
            setConversations(convos)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [user])

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleDelete = async () => {
        if (!user) return
        if (!window.confirm(t('msg.delete_confirm'))) return

        try {
            for (const chatId of Array.from(selected)) {
                // 1. Fetch all our messages from this chat
                const msgsRef = collection(db, `chats/${chatId}/messages`)
                const qMsgs = query(msgsRef, where('senderId', '==', user.uid))
                const querySnapshot = await getDocs(qMsgs)

                // 2. Batch delete them
                if (!querySnapshot.empty) {
                    const batch = writeBatch(db)
                    querySnapshot.forEach(docSnap => {
                        batch.delete(docSnap.ref)
                    })
                    await batch.commit()
                }

                // 3. Clear our unread count to 0 just in case
                try {
                    await updateDoc(doc(db, 'chats', chatId), { [`unreadCount_${user.uid}`]: 0 })
                } catch (e) { }
            }
            showToast({
                title: t('msg.success'),
                message: t('msg.delete_success'),
                type: 'success'
            })
        } catch (err) {
            console.error("Mesajlar silinemedi:", err)
            showToast({
                title: t('msg.error'),
                message: t('msg.delete_error'),
                type: 'error'
            })
        }

        setSelected(new Set())
        setSelectMode(false)
    }

    const handlePin = async () => {
        if (!user) return

        try {
            // Check if ALL selected are already pinned or not.
            // If they are all pinned, unpin them. Else, pin them all.
            const selectedConvos = conversations.filter(c => selected.has(c.id))
            const allPinned = selectedConvos.every(c => c.pinned)

            for (const chatId of Array.from(selected)) {
                const targetDoc = doc(db, 'chats', chatId)
                if (allPinned) {
                    await updateDoc(targetDoc, { pinnedBy: arrayRemove(user.uid) })
                } else {
                    await updateDoc(targetDoc, { pinnedBy: arrayUnion(user.uid) })
                }
            }
        } catch (err) {
            console.error("Sabitleme başarısız:", err)
        }

        setSelected(new Set())
        setSelectMode(false)
    }

    const exitSelectMode = () => {
        setSelectMode(false)
        setSelected(new Set())
    }

    return (
        <div className="messages-container">
            {/* Header */}
            <div className="messages-header">
                {selectMode ? (
                    <>
                        <button className="msg-header-btn" onClick={exitSelectMode}>
                            <X size={20} />
                        </button>
                        <span className="msg-selected-count">{selected.size} {t('msg.selected')}</span>
                        <div className="msg-header-actions">
                            <button
                                className="msg-header-btn pin-btn"
                                onClick={handlePin}
                                disabled={selected.size === 0}
                            >
                                <Pin size={18} />
                            </button>
                            <button
                                className="msg-header-btn delete-btn"
                                onClick={handleDelete}
                                disabled={selected.size === 0}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="messages-title">{t('msg.title')}</h1>
                        <button className="msg-header-btn edit-btn" onClick={() => setSelectMode(true)}>
                            <Pencil size={18} />
                        </button>
                    </>
                )}
            </div>

            {/* Conversation List */}
            <div className="conversation-list">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>{t('msg.loading')}</div>
                ) : conversations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>{t('msg.empty')}</div>
                ) : (
                    <AnimatePresence>
                        {conversations.map((c, index) => (
                            <motion.div
                                key={c.id}
                                className={`conversation-item ${c.unread ? 'unread' : ''} ${selected.has(c.id) ? 'selected' : ''} ${c.pinned ? 'pinned' : ''} ${c.isDeleted ? 'deactivated' : ''}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, padding: 0 }}
                                transition={{ delay: index * 0.03, duration: 0.25 }}
                                whileTap={selectMode ? {} : { scale: 0.98 }}
                                onClick={() => {
                                    if (selectMode) toggleSelect(c.id)
                                    else if (c.isDeleted) showToast({ title: t('msg.acc_disabled_title'), message: t('msg.acc_disabled_desc'), type: 'error' })
                                    else navigate(`/chat/${c.id}`)
                                }}
                            >
                                {selectMode && (
                                    <div className={`select-checkbox ${selected.has(c.id) ? 'checked' : ''}`}>
                                        <Check size={14} />
                                    </div>
                                )}

                                <div className="conv-avatar-wrapper">
                                    {c.photo ? (
                                        <img src={c.photo} alt={c.name} className="conv-avatar" loading="lazy" />
                                    ) : (
                                        <div className="conv-avatar" style={{ background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                            {c.isDeleted ? <X size={20} /> : <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{c.name[0]}</span>}
                                        </div>
                                    )}
                                    {c.online && !c.isDeleted && <span className="conv-online-dot" />}
                                </div>

                                <div className="conv-content">
                                    <div className="conv-top-row">
                                        <span className={`conv-name ${c.unread > 0 ? 'unread-bold' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: c.isDeleted ? 0.6 : 1 }}>
                                            {c.name}
                                            {c.isSystem && <BadgeCheck size={14} color="#0EA5E9" />}
                                        </span>
                                        <span className="conv-time">{c.time}</span>
                                    </div>
                                    <div className="conv-bottom-row">
                                        <span className={`conv-last-msg ${c.unread > 0 ? 'unread-bold' : ''}`} style={{ opacity: c.isDeleted ? 0.5 : 1 }}>
                                            {c.isDeleted ? t('msg.acc_frozen') : c.lastMessage}
                                        </span>
                                        {c.unread > 0 && <span className="conv-unread">{c.unread}</span>}
                                    </div>
                                </div>

                                {c.pinned && !selectMode && <Pin size={12} className="conv-pin-icon" />}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            <BottomNav active="messages" />
        </div>
    )
}
