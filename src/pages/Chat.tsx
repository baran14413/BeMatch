import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronLeft, Send, Image, X,
    MoreHorizontal, Pencil, Trash2, CheckCheck,
    Reply, Mic, MoreVertical, Ban, Flag, BadgeCheck
} from 'lucide-react'
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore'
import ProfileDetail from '../components/ProfileDetail'
import { ref as rtdbRef, onValue } from 'firebase/database'
import { db, rtdb } from '../firebase'
import { useAuth } from '../context/AuthContext'
import VoiceRecorder from '../components/chat/VoiceRecorder'
import VoiceMessage from '../components/chat/VoiceMessage'
import { sendNotification } from '../utils/notifications'
import { useTranslation } from 'react-i18next'
import './Chat.css'

type MessageType = 'text' | 'image' | 'voice'

interface Message {
    id: string
    type: MessageType
    content: string
    senderId: string
    fromMe: boolean
    time: string
    status: 'sent' | 'read'
    replyTo?: string
    reaction?: string
    audioDuration?: number
    imageUrl?: string
    createdAt: number
    isEdited?: boolean
}

interface ChatUser {
    id: string
    name: string
    photo: string
    online: boolean
    lastSeen?: number | null
    isSystem?: boolean
    isDeleted?: boolean
}

const MAX_PREVIEW_LENGTH = 120

export default function Chat() {
    const { t, i18n } = useTranslation()
    const { id: chatId } = useParams()
    const navigate = useNavigate()
    const { user: currentUser, userProfile } = useAuth()

    const [chatTarget, setChatTarget] = useState<ChatUser | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputText, setInputText] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [replyingTo, setReplyingTo] = useState<Message | null>(null)
    const [menuMessageId, setMenuMessageId] = useState<string | null>(null)
    const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set())
    const [viewingImage, setViewingImage] = useState<string | null>(null)

    // Voice recording State
    const [isRecording, setIsRecording] = useState(false)

    // Image
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [caption, setCaption] = useState('')

    // Typing Status
    const [isTargetTyping, setIsTargetTyping] = useState(false)
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Header Menu & Block/Report
    const [showHeaderMenu, setShowHeaderMenu] = useState(false)
    const [isBlocked, setIsBlocked] = useState(false)
    const [blockedByMe, setBlockedByMe] = useState(false)
    const [toastMsg, setToastMsg] = useState<string | null>(null)
    const [showProfile, setShowProfile] = useState(false)
    const [fullTargetProfile, setFullTargetProfile] = useState<any>(null)

    // Clear toast message automatically
    useEffect(() => {
        if (toastMsg) {
            const timer = setTimeout(() => setToastMsg(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [toastMsg])

    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = useCallback(() => {
        requestAnimationFrame(() => {
            const container = messagesContainerRef.current
            if (container) {
                container.scrollTop = container.scrollHeight
            }
        })
    }, [])

    const now = () => {
        const d = new Date()
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} `
    }

    const formatLastSeen = (timestamp?: number | string | null | { toDate?: () => Date }) => {
        if (!timestamp) return t('chat.offline');

        // Güvenli Date oluşturma
        let date: Date;
        if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
        } else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
            date = new Date(timestamp);
        } else {
            return t('chat.offline');
        }

        if (isNaN(date.getTime())) return t('chat.offline');

        const today = new Date();
        const isToday = date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear();

        const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (isToday) {
            return `${t('chat.last_seen_today')} ${timeString}`;
        } else if (isYesterday) {
            return `${t('chat.last_seen_yesterday')} ${timeString}`;
        } else if (diffDays < 7 && diffDays >= 0) {
            const loc = i18n.language === 'en' ? 'en-US' : (i18n.language === 'de' ? 'de-DE' : 'tr-TR')
            const dayName = new Intl.DateTimeFormat(loc, { weekday: 'long' }).format(date);
            const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            return `${t('chat.last_seen')} ${capitalizedDay} ${timeString}`;
        } else {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            return `${t('chat.last_seen')} ${day}.${month}.${date.getFullYear()} ${timeString}`;
        }
    }

    useEffect(() => {
        if (!chatId || !currentUser) return

        let unsubTarget: (() => void) | null = null;
        let initialTargetLoad = true;

        const unsubChat = onSnapshot(doc(db, 'chats', chatId), async (chatSnap) => {
            if (chatSnap.exists()) {
                const data = chatSnap.data()
                const targetId = data.participants.find((pid: string) => pid !== currentUser.uid)

                if (targetId && data.typing) {
                    setIsTargetTyping(!!data.typing[targetId])
                } else {
                    setIsTargetTyping(false)
                }

                // Check block status
                const blockers = data.blockedBy || []
                setIsBlocked(blockers.length > 0)
                setBlockedByMe(blockers.includes(currentUser.uid))

                if (targetId && initialTargetLoad) {
                    initialTargetLoad = false

                    if (targetId === 'system') {
                        setChatTarget({
                            id: 'system',
                            name: t('chat.support'),
                            photo: 'https://ui-avatars.com/api/?name=BeMatch&background=0284c7&color=fff&bold=true',
                            online: true,
                            lastSeen: null,
                            isSystem: true
                        })
                    } else {
                        // Listen to Firestore for static profile info and fallback online status
                        unsubTarget = onSnapshot(doc(db, 'users', targetId), (userSnap) => {
                            if (userSnap.exists()) {
                                const td = userSnap.data()

                                // TTL Fallback logic
                                const now = Date.now();
                                const lastActiveTime = td.lastActive || td.lastSeen || now;
                                const isFirestoreOnline = td.isOnline && (now - lastActiveTime < 180000); // 3m TTL

                                setChatTarget(prev => ({
                                    id: userSnap.id,
                                    name: td.deletedAt ? t('chat.disabled') : (td.firstName || t('chat.unnamed')),
                                    photo: td.deletedAt ? '' : (td.photos?.[0] || ''),
                                    online: prev?.online || isFirestoreOnline, // OR with RTDB status
                                    lastSeen: prev?.lastSeen || lastActiveTime,
                                    isDeleted: !!td.deletedAt
                                }))
                                // Save full profile for ProfileDetail modal
                                let age = 0
                                if (td.birthDate) {
                                    const parts = td.birthDate.split('/')
                                    if (parts.length === 3) {
                                        age = new Date().getFullYear() - parseInt(parts[2])
                                    }
                                }
                                setFullTargetProfile({
                                    id: userSnap.id,
                                    name: td.firstName || 'İsimsiz',
                                    age: age || null,
                                    bio: td.bio || '',
                                    photos: td.photos || [],
                                    interests: td.interests || [],
                                    job: td.job || '',
                                    school: td.school || '',
                                    lookingFor: td.lookingFor || '',
                                    distance: td.locationCity || ''
                                })
                            }
                        })

                        // Listen to RTDB for reliable presence info
                        const rtdbUnsubTarget = onValue(rtdbRef(rtdb, '/status/' + targetId), (snap) => {
                            if (snap.exists()) {
                                const status = snap.val()

                                const now = Date.now();
                                const lastActiveTime = status.lastSeen || now;
                                const isRtdbOnline = status.isOnline && (now - lastActiveTime < 180000); // 3m TTL

                                setChatTarget(prev => {
                                    if (!prev) return prev
                                    return {
                                        ...prev,
                                        online: prev.online || isRtdbOnline,
                                        lastSeen: Math.max(prev.lastSeen || 0, lastActiveTime)
                                    }
                                })
                            }
                        })

                        // Cleanup function needs to handle both unsubs
                        const origUnsubTarget = unsubTarget
                        unsubTarget = () => {
                            origUnsubTarget?.()
                            rtdbUnsubTarget()
                        }

                        // Set ourselves as online immediately when entering a chat just in case
                        try {
                            updateDoc(doc(db, 'users', currentUser.uid), { isOnline: true })
                        } catch (e) { }
                    }
                }
            }
        })

        // Listen to messages
        // Removed strict orderBy to ensure messages without createdAt (legacy) still show up
        const q = query(collection(db, `chats/${chatId}/messages`))
        const unsubMsgs = onSnapshot(q, (snap) => {
            const fetchedMsgs: Message[] = []
            const unreadIds: string[] = []

            snap.forEach(docMsg => {
                const d = docMsg.data()
                let timeStr = ''
                const ts = d.createdAt || d.timestamp || 0
                if (ts) {
                    const date = new Date(ts)
                    timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
                }
                fetchedMsgs.push({
                    id: docMsg.id,
                    type: d.type || 'text',
                    content: d.content || d.text || '',
                    senderId: d.senderId,
                    fromMe: d.senderId === currentUser.uid,
                    time: timeStr,
                    status: d.status || 'sent',
                    replyTo: d.replyTo,
                    reaction: d.reaction,
                    audioDuration: d.audioDuration,
                    imageUrl: d.imageUrl,
                    createdAt: ts,
                    isEdited: d.isEdited || false
                })

                if (d.senderId !== currentUser.uid && d.status !== 'read') {
                    unreadIds.push(docMsg.id)
                }
            })

            // Sort in-memory
            fetchedMsgs.sort((a, b) => a.createdAt - b.createdAt)

            setMessages(fetchedMsgs)

            // Asynchronously update all unread incoming messages strictly to 'read'
            unreadIds.forEach(msgId => {
                updateDoc(doc(db, `chats/${chatId}/messages`, msgId), {
                    status: 'read'
                }).catch(err => console.error("Message read update failed:", err))
            })

            // Every time a new message comes in while we're staring at the chat, reset unread.
            try {
                updateDoc(doc(db, 'chats', chatId), { [`unreadCount_${currentUser.uid}`]: 0 })
            } catch (e) { }
        })

        return () => {
            unsubChat()
            unsubMsgs()
            if (unsubTarget) unsubTarget()
            // Reset typing status on unmount
            try {
                updateDoc(doc(db, 'chats', chatId), { [`typing.${currentUser.uid}`]: false })
            } catch (e) { }
        }
    }, [chatId, currentUser])

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom()
        }
    }, [messages, scrollToBottom])

    const sendMessage = async () => {
        if (chatTarget?.isSystem) {
            setToastMsg(t('chat.err_support'))
            return
        }
        if (isBlocked) {
            setToastMsg(t('chat.err_blocked'))
            return
        }

        if (editingId !== null) {
            try {
                await updateDoc(doc(db, `chats/${chatId}/messages`, editingId), {
                    content: inputText.trim(),
                    isEdited: true
                })
            } catch (err) {
                console.error("Mesaj düzenlenemedi:", err)
            }
            setEditingId(null)
            setInputText('')
            return
        }

        if (!inputText.trim() || !chatId || !currentUser || !chatTarget?.id) return

        try {
            const nowTime = new Date().getTime()
            await addDoc(collection(db, `chats/${chatId}/messages`), {
                type: 'text',
                content: inputText.trim(),
                senderId: currentUser.uid,
                createdAt: nowTime,
                replyTo: replyingTo?.id || null,
                status: 'sent'
            })
            await updateDoc(doc(db, 'chats', chatId), {
                lastMessage: inputText.trim(),
                updatedAt: nowTime,
                [`unreadCount_${chatTarget.id}`]: increment(1)
            })
            await updateDoc(doc(db, 'users', chatTarget.id), { eloScore: increment(1) }).catch(() => { })

            sendNotification({
                userId: chatTarget.id,
                type: 'message',
                title: userProfile?.firstName || t('chat.unnamed'),
                body: inputText.trim(),
                link: `/chat/${chatId}`,
                avatar: userProfile?.photos?.[0] || ''
            })
        } catch (err) {
            console.error("Mesaj gönderilemedi:", err)
        }

        setInputText('')
        setReplyingTo(null)
    }

    const sendImage = async () => {
        if (chatTarget?.isSystem) {
            setToastMsg(t('chat.err_support'))
            return
        }
        if (isBlocked) {
            setToastMsg(t('chat.err_blocked'))
            return
        }
        if (!imagePreview || !chatId || !currentUser || !chatTarget?.id) return
        const newMsg: Message = {
            id: Date.now().toString(),
            type: 'image',
            content: caption,
            senderId: currentUser?.uid || '',
            fromMe: true,
            time: now(),
            status: 'sent',
            imageUrl: imagePreview,
            createdAt: new Date().getTime(),
        }
        setMessages(prev => [...prev, newMsg])
        // In real app, upload carefully image to Storage and get URL, then use addDoc
        try {
            const nowTime = new Date().getTime()
            addDoc(collection(db, `chats/${chatId}/messages`), {
                type: 'image',
                content: caption,
                imageUrl: imagePreview,
                senderId: currentUser.uid,
                createdAt: nowTime,
                status: 'sent'
            })
            updateDoc(doc(db, 'chats', chatId), {
                lastMessage: t('chat.photo'),
                updatedAt: nowTime,
                [`unreadCount_${chatTarget.id}`]: increment(1)
            })

            sendNotification({
                userId: chatTarget.id,
                type: 'message',
                title: userProfile?.firstName || t('chat.unnamed'),
                body: t('chat.photo_sent'),
                link: `/chat/${chatId}`,
                avatar: userProfile?.photos?.[0] || ''
            })
            await updateDoc(doc(db, 'users', chatTarget.id), { eloScore: increment(1) }).catch(() => { })
        } catch (e) {
            console.error(e)
        }

        setImagePreview(null)
        setCaption('')
    }

    const handleImagePick = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                const reader = new FileReader()
                reader.onload = () => setImagePreview(reader.result as string)
                reader.readAsDataURL(file)
            }
        }
        input.click()
    }

    const handleBlockToggle = async () => {
        if (!chatId || !currentUser || !chatTarget?.id) return
        try {
            const chatRef = doc(db, 'chats', chatId)
            if (blockedByMe) {
                await updateDoc(chatRef, { blockedBy: arrayRemove(currentUser.uid) })
                setToastMsg(t('chat.unblocked'))
            } else {
                await updateDoc(chatRef, { blockedBy: arrayUnion(currentUser.uid) })
                await updateDoc(doc(db, 'users', chatTarget.id), { eloScore: increment(-20) }).catch(() => { })
                setShowHeaderMenu(false)
                setToastMsg(t('chat.blocked_user'))
            }
        } catch (err) {
            console.error("Engel işlemi başarısız:", err)
        }
    }

    const handleSendVoice = async (url: string, duration: number) => {
        if (chatTarget?.isSystem) {
            setToastMsg(t('chat.err_support'))
            return
        }
        if (isBlocked) {
            setToastMsg(t('chat.err_blocked'))
            return
        }
        if (!chatId || !currentUser || !chatTarget?.id) return

        try {
            const nowTime = new Date().getTime()
            await addDoc(collection(db, `chats/${chatId}/messages`), {
                type: 'voice',
                content: url, // Uploaded Storage URL
                audioDuration: duration,
                senderId: currentUser.uid,
                createdAt: nowTime,
                status: 'sent'
            })
            await updateDoc(doc(db, 'chats', chatId), {
                lastMessage: t('chat.voice'),
                updatedAt: nowTime,
                [`unreadCount_${chatTarget.id}`]: increment(1)
            })

            sendNotification({
                userId: chatTarget.id,
                type: 'message',
                title: userProfile?.firstName || t('chat.unnamed'),
                body: t('chat.voice_sent'),
                link: `/chat/${chatId}`,
                avatar: userProfile?.photos?.[0] || ''
            })
            await updateDoc(doc(db, 'users', chatTarget.id), { eloScore: increment(1) }).catch(() => { })
        } catch (err) {
            console.error("Sesli mesaj gönderilemedi:", err)
        }
        setIsRecording(false)
    }

    // Menu actions
    const editMessage = (msg: Message) => {
        setInputText(msg.content)
        setEditingId(msg.id)
        setMenuMessageId(null)
        inputRef.current?.focus()
    }

    const replyToMessage = (msg: Message) => {
        setReplyingTo(msg)
        setMenuMessageId(null)
        inputRef.current?.focus()
    }

    const reactToMessage = async (msgId: string, emoji: string) => {
        setMenuMessageId(null)
        try {
            const m = messages.find(ms => ms.id === msgId)
            const newReaction = m?.reaction === emoji ? null : emoji
            await updateDoc(doc(db, `chats/${chatId}/messages`, msgId), {
                reaction: newReaction
            })
        } catch (err) {
            console.error(err)
        }
    }

    const toggleExpand = (msgId: string) => {
        setExpandedMessages(prev => {
            const next = new Set(prev)
            if (next.has(msgId)) next.delete(msgId)
            else next.add(msgId)
            return next
        })
    }

    const getReplyContent = (replyId: string) => {
        const msg = messages.find(m => m.id === replyId)
        if (!msg) return ''
        if (msg.type === 'voice') return t('chat.voice')
        if (msg.type === 'image') return t('chat.photo')
        return msg.content.length > 50 ? msg.content.slice(0, 50) + '...' : msg.content
    }

    const renderMessageContent = (content: string) => {
        // Regex to match [Link Text](/path) or [Link Text](https://url.com)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
        const parts = []
        let lastIdx = 0
        let match

        while ((match = linkRegex.exec(content)) !== null) {
            if (match.index > lastIdx) {
                parts.push(<span key={lastIdx}>{content.slice(lastIdx, match.index)}</span>)
            }
            const text = match[1]
            const url = match[2]

            if (url.startsWith('/')) {
                // Internal router link
                parts.push(
                    <Link key={match.index} to={url} className="msg-link">
                        {text}
                    </Link>
                )
            } else {
                // External link
                parts.push(
                    <a key={match.index} href={url} target="_blank" rel="noopener noreferrer" className="msg-link">
                        {text}
                    </a>
                )
            }
            lastIdx = match.index + match[0].length
        }

        if (lastIdx < content.length) {
            parts.push(<span key={lastIdx}>{content.slice(lastIdx)}</span>)
        }

        return <p className="msg-text">{parts}</p>
    }

    return (
        <div className="chat-container">
            {/* Chat Header */}
            <div className="chat-header">
                <button className="chat-back" onClick={() => navigate('/messages')}>
                    <ChevronLeft size={24} />
                </button>
                {chatTarget && (
                    <>
                        <img
                            src={chatTarget.photo || `https://ui-avatars.com/api/?name=X&background=0f172a&color=fff&bold=true`}
                            alt={chatTarget.name}
                            className="chat-avatar"
                            style={{ cursor: chatTarget.isSystem || chatTarget.isDeleted ? 'default' : 'pointer' }}
                            onClick={() => {
                                if (!chatTarget.isSystem && !chatTarget.isDeleted && fullTargetProfile) {
                                    setShowProfile(true)
                                    // Increment profileViews for the viewed user
                                    try {
                                        updateDoc(doc(db, 'users', chatTarget.id), {
                                            profileViews: increment(1)
                                        }).catch(() => { })
                                    } catch (_) { }
                                }
                            }}
                        />
                        <div className="chat-user-info">
                            <span className="chat-user-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {chatTarget.name}
                                {chatTarget.isSystem && <BadgeCheck size={16} color="#0EA5E9" />}
                            </span>
                            {isTargetTyping ? (
                                <span className="chat-user-status" style={{ color: 'var(--primary)', fontStyle: 'italic', fontWeight: '500' }}>{t('chat.typing')}</span>
                            ) : (
                                <span className={`chat-user-status ${chatTarget.online ? 'online' : 'offline'}`}>
                                    {chatTarget.online ? (
                                        <>
                                            <span className="status-dot green"></span>
                                            {t('chat.online_status')}
                                        </>
                                    ) : (
                                        <>
                                            <span className="status-dot red"></span>
                                            <span style={{ color: 'var(--danger, #ef4444)' }}>{t('chat.offline')}</span>
                                            <span style={{ opacity: 0.7, marginLeft: '6px' }}>{chatTarget.lastSeen ? `• ${formatLastSeen(chatTarget.lastSeen)}` : ''}</span>
                                        </>
                                    )}
                                </span>
                            )}
                        </div>
                    </>
                )}

                {!chatTarget?.isSystem && (
                    <div style={{ position: 'relative', marginLeft: 'auto' }}>
                        <button className="chat-back" onClick={() => setShowHeaderMenu(!showHeaderMenu)}>
                            <MoreVertical size={22} />
                        </button>
                        <AnimatePresence>
                            {showHeaderMenu && (
                                <motion.div
                                    className="header-menu-dropdown"
                                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    style={{
                                        position: 'absolute', right: 0, top: '100%',
                                        background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                                        borderRadius: '12px', padding: '6px 0', minWidth: '160px',
                                        zIndex: 100, boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                                    }}
                                >
                                    <button className="msg-menu-item" onClick={() => { setShowHeaderMenu(false); handleBlockToggle(); }} style={{ color: blockedByMe ? 'var(--text-primary)' : 'var(--danger)' }}>
                                        <Ban size={16} /> {blockedByMe ? t('chat.unblock_btn') : t('chat.block_btn')}
                                    </button>
                                    <button className="msg-menu-item" onClick={() => { setShowHeaderMenu(false); navigate(`/report/${chatId}`); }}>
                                        <Flag size={16} /> {t('chat.report_btn')}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div className="chat-messages" ref={messagesContainerRef} onClick={() => setMenuMessageId(null)}>
                {messages.map(msg => {
                    const isLong = msg.type === 'text' && msg.content.length > MAX_PREVIEW_LENGTH
                    const isExpanded = expandedMessages.has(msg.id)
                    const displayContent = isLong && !isExpanded
                        ? msg.content.slice(0, MAX_PREVIEW_LENGTH) + '...'
                        : msg.content

                    return (
                        <motion.div
                            key={msg.id}
                            className={`chat-msg ${msg.fromMe ? 'me' : 'other'}`}
                            initial={false}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Reply Preview */}
                            {msg.replyTo && (
                                <div className="msg-reply-preview">
                                    <div className="reply-bar" />
                                    <span>{getReplyContent(msg.replyTo)}</span>
                                </div>
                            )}

                            {/* Message Content */}
                            {msg.type === 'text' && (
                                <div className="msg-bubble">
                                    {msg.isEdited && (
                                        <div className="msg-edited-label">{t('chat.edited')}</div>
                                    )}
                                    {renderMessageContent(displayContent)}
                                    {isLong && (
                                        <button className="msg-read-more" onClick={() => toggleExpand(msg.id)}>
                                            {isExpanded ? t('chat.show_less') : t('chat.read_more')}
                                        </button>
                                    )}
                                </div>
                            )}

                            {msg.type === 'image' && (
                                <div className="msg-image-wrapper" onClick={() => setViewingImage(msg.imageUrl || null)}>
                                    <img src={msg.imageUrl} alt="" className="msg-image" />
                                </div>
                            )}

                            {msg.type === 'voice' && (
                                <VoiceMessage
                                    url={msg.content}
                                    duration={msg.audioDuration || 0}
                                    isMe={msg.fromMe}
                                />
                            )}

                            {/* Meta Row */}
                            <div className="msg-meta">
                                <span className="msg-time">{msg.time}</span>
                                {msg.fromMe && (
                                    <span className={`msg-status ${msg.status}`}>
                                        <CheckCheck size={16} strokeWidth={2.5} />
                                    </span>
                                )}
                            </div>

                            {/* Reaction */}
                            {msg.reaction && (
                                <span className="msg-reaction">{msg.reaction}</span>
                            )}

                            {/* Three Dot Menu */}
                            {!chatTarget?.isSystem && (
                                <button
                                    className="msg-more-btn"
                                    onClick={(e) => { e.stopPropagation(); setMenuMessageId(menuMessageId === msg.id ? null : msg.id) }}
                                >
                                    <MoreHorizontal size={14} />
                                </button>
                            )}

                            <AnimatePresence>
                                {menuMessageId === msg.id && (
                                    <motion.div
                                        className={`msg-menu ${msg.fromMe ? 'me' : 'other'}`}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.15 }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Edit only for own text messages */}
                                        {msg.fromMe && msg.type === 'text' && (
                                            <button className="msg-menu-item" onClick={() => editMessage(msg)}>
                                                <Pencil size={14} /> {t('chat.edit')}
                                            </button>
                                        )}
                                        {msg.fromMe && (
                                            <button className="msg-menu-item" onClick={async () => {
                                                setMenuMessageId(null)
                                                try {
                                                    await deleteDoc(doc(db, `chats/${chatId}/messages`, msg.id))
                                                } catch (err) { console.error(err) }
                                            }}>
                                                <Trash2 size={14} /> {t('chat.delete')}
                                            </button>
                                        )}
                                        <button className="msg-menu-item" onClick={() => replyToMessage(msg)}>
                                            <Reply size={14} /> {t('chat.reply')}
                                        </button>
                                        <div className="msg-menu-reactions">
                                            {['❤️', '😂', '😮', '😢', '👍', '🔥'].map(emoji => (
                                                <button
                                                    key={emoji}
                                                    className={`reaction-btn ${msg.reaction === emoji ? 'active' : ''}`}
                                                    onClick={() => reactToMessage(msg.id, emoji)}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )
                })}
            </div>

            {/* Image Lightbox */}
            <AnimatePresence>
                {
                    viewingImage && (
                        <motion.div
                            className="image-lightbox"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewingImage(null)}
                        >
                            <button className="lightbox-close" onClick={() => setViewingImage(null)}>
                                <X size={24} />
                            </button>
                            <motion.img
                                src={viewingImage}
                                alt=""
                                className="lightbox-img"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.8 }}
                                onClick={e => e.stopPropagation()}
                            />
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Simplified Image Sender */}
            <AnimatePresence>
                {
                    imagePreview && (
                        <motion.div className="image-preview-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="image-editor-header">
                                <button className="editor-close" onClick={() => { setImagePreview(null); setCaption(''); }}>
                                    <X size={20} />
                                </button>
                                <span className="editor-title">{t('chat.send_photo')}</span>
                                <div style={{ width: 40 }} />
                            </div>

                            <div className="image-editor-canvas" style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                        borderRadius: 12,
                                    }}
                                />
                            </div>

                            <div className="image-editor-send" style={{ display: 'flex', gap: 10, padding: 15 }}>
                                <input
                                    className="editor-caption-input"
                                    placeholder={t('chat.add_caption')}
                                    value={caption}
                                    onChange={e => setCaption(e.target.value)}
                                    autoFocus
                                    style={{ flex: 1, padding: '10px 15px', borderRadius: 20, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
                                />
                                <button className="editor-send-btn" onClick={sendImage} style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-gradient)', border: 'none', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Send size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Reply / Edit Bar */}
            <AnimatePresence>
                {
                    (replyingTo || editingId !== null) && (
                        <motion.div
                            className="reply-bar-container"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                        >
                            <div className="reply-bar-inner">
                                <div className="reply-bar-accent" />
                                <div className="reply-bar-text">
                                    <span className="reply-label">{editingId !== null ? t('chat.editing') : t('chat.replying')}</span>
                                    <span className="reply-content">
                                        {editingId !== null
                                            ? messages.find(m => m.id === editingId)?.content.slice(0, 50)
                                            : replyingTo?.type === 'voice'
                                                ? t('chat.voice')
                                                : replyingTo?.type === 'image'
                                                    ? t('chat.photo')
                                                    : replyingTo?.content.slice(0, 50)
                                        }
                                    </span>
                                </div>
                                <button className="reply-close" onClick={() => { setReplyingTo(null); setEditingId(null); setInputText('') }}>
                                    <X size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Input Area / Blocked Notice */}
            {chatTarget?.isSystem ? (
                <div className="chat-input-area" style={{ justifyContent: 'center', background: 'var(--bg-secondary)', padding: '20px' }}>
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <BadgeCheck size={32} color="#0EA5E9" />
                        <p style={{ margin: 0, fontWeight: 500 }}>{t('chat.info_only')}</p>
                    </div>
                </div>
            ) : chatTarget?.isDeleted ? (
                <div className="chat-input-area" style={{ justifyContent: 'center', background: 'var(--bg-secondary)', padding: '20px' }}>
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <X size={32} style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
                        <p style={{ margin: 0, fontWeight: 500 }}>{t('chat.acc_disabled')}</p>
                    </div>
                </div>
            ) : isBlocked ? (
                <div className="chat-input-area" style={{ justifyContent: 'center', background: 'var(--bg-secondary)', padding: '20px' }}>
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <Ban size={32} style={{ margin: '0 auto 8px', color: 'var(--danger)', opacity: 0.8 }} />
                        <p style={{ margin: 0, marginBottom: blockedByMe ? '12px' : '0' }}>
                            {blockedByMe ? t('chat.you_blocked') : t('chat.blocked_you')}
                        </p>
                        {blockedByMe && (
                            <button
                                onClick={handleBlockToggle}
                                style={{ background: 'var(--primary)', border: 'none', padding: '8px 16px', borderRadius: '20px', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                            >
                                {t('chat.unblock_btn')}
                            </button>
                        )}
                    </div>
                </div>
            ) : imagePreview ? (
                <div className="chat-input-area">
                    {isRecording ? (
                        <VoiceRecorder
                            onSend={handleSendVoice}
                            onCancel={() => setIsRecording(false)}
                        />
                    ) : (
                        <>
                            <button className="chat-action-btn" onClick={handleImagePick}>
                                <Image size={20} />
                            </button>
                            <div className="chat-input-wrapper">
                                <span className={`char-counter ${inputText.length >= 500 ? 'max' : ''}`}>
                                    {inputText.length}/500
                                </span>
                                <input
                                    ref={inputRef}
                                    className="chat-input"
                                    placeholder={t('chat.type_msg')}
                                    value={inputText}
                                    maxLength={500}
                                    onChange={e => {
                                        setInputText(e.target.value)
                                        // Handle typing status
                                        if (chatId && currentUser) {
                                            try {
                                                updateDoc(doc(db, 'chats', chatId), { [`typing.${currentUser.uid}`]: true })
                                                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                                                typingTimeoutRef.current = setTimeout(() => {
                                                    updateDoc(doc(db, 'chats', chatId), { [`typing.${currentUser.uid}`]: false })
                                                }, 2000)
                                            } catch (e) { }
                                        }
                                    }}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                />
                            </div>
                            {inputText.trim() ? (
                                <button className="chat-send-btn" onClick={sendMessage}>
                                    <Send size={18} />
                                </button>
                            ) : (
                                <button className="chat-action-btn" onClick={() => setIsRecording(true)}>
                                    <Mic size={20} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="chat-input-area">
                    {isRecording ? (
                        <VoiceRecorder
                            onSend={handleSendVoice}
                            onCancel={() => setIsRecording(false)}
                        />
                    ) : (
                        <>
                            <button className="chat-action-btn" onClick={handleImagePick}>
                                <Image size={20} />
                            </button>
                            <div className="chat-input-wrapper">
                                <span className={`char-counter ${inputText.length >= 500 ? 'max' : ''}`}>
                                    {inputText.length}/500
                                </span>
                                <input
                                    ref={inputRef}
                                    className="chat-input"
                                    placeholder={t('chat.type_msg')}
                                    value={inputText}
                                    maxLength={500}
                                    onChange={e => {
                                        setInputText(e.target.value)
                                        // Handle typing status
                                        if (chatId && currentUser) {
                                            try {
                                                updateDoc(doc(db, 'chats', chatId), { [`typing.${currentUser.uid}`]: true })
                                                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                                                typingTimeoutRef.current = setTimeout(() => {
                                                    updateDoc(doc(db, 'chats', chatId), { [`typing.${currentUser.uid}`]: false })
                                                }, 2000)
                                            } catch (e) { }
                                        }
                                    }}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                />
                            </div>
                            {inputText.trim() ? (
                                <button className="chat-send-btn" onClick={sendMessage}>
                                    <Send size={18} />
                                </button>
                            ) : (
                                <button className="chat-action-btn" onClick={() => setIsRecording(true)}>
                                    <Mic size={20} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
            {/* Profile Detail Modal */}
            <AnimatePresence>
                {showProfile && fullTargetProfile && (
                    <ProfileDetail
                        user={fullTargetProfile}
                        photoIndex={0}
                        onClose={() => setShowProfile(false)}
                    />
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {toastMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        style={{
                            position: 'fixed',
                            top: '80px',
                            left: '50%',
                            background: 'rgba(0,0,0,0.85)',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '24px',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            zIndex: 9999,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {toastMsg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    )
}
