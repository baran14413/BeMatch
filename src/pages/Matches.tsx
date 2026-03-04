import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Briefcase, GraduationCap, ChevronDown, MessageCircle, X } from 'lucide-react'
import { collection, getDocs, doc, getDoc, addDoc, query, where } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import { useToast } from '../context/ToastContext' // Added this import
import { useTranslation } from 'react-i18next'
import './Matches.css'

interface MatchedUser {
    id: string
    name: string
    age: number
    photo: string
    bio: string
    distance: string
    interests: string[]
    job?: string
    school?: string
    matchedAt: string
    isDeleted?: boolean
}

export default function Matches() {
    const { t } = useTranslation()
    const { user } = useAuth()
    const navigate = useNavigate()
    const { showToast } = useToast() // Added this instantiation
    const [selectedUser, setSelectedUser] = useState<MatchedUser | null>(null)
    const [mutualMatches, setMutualMatches] = useState<MatchedUser[]>([])
    const [likesYou, setLikesYou] = useState<MatchedUser[]>([])
    const [activeTab, setActiveTab] = useState<'likesYou' | 'mutual'>('likesYou')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchMatches = async () => {
            if (!user) return
            setLoading(true)
            try {
                // Current user ref
                const userDoc = await getDoc(doc(db, 'users', user.uid))
                const userData = userDoc.data()
                if (!userData) return

                const likedList: string[] = userData.likedUsers || []

                // Instead of checking our own likedBy list (which target users can't write due to permissions)
                // We fetch all users and check their likedUsers arrays.
                const usersSnap = await getDocs(collection(db, 'users'))
                const mutualData: MatchedUser[] = []
                const likesYouData: MatchedUser[] = []

                usersSnap.forEach(snapDoc => {
                    const data = snapDoc.data()

                    const isLikedByMe = likedList.includes(snapDoc.id)
                    const likesMe = (data.likedUsers || []).includes(user.uid)
                    const superLikesMe = (data.superLikedUsers || []).includes(user.uid)

                    // Target user format
                    if ((isLikedByMe && likesMe) || (likesMe && !isLikedByMe)) {
                        let age = 0
                        if (data.birthDate) {
                            const parts = data.birthDate.split('/')
                            if (parts.length === 3) {
                                age = new Date().getFullYear() - parseInt(parts[2])
                            }
                        }

                        const isDeleted = !!data.deletedAt

                        let matchDesc = t('matches.liked_you')
                        if (isLikedByMe && likesMe) {
                            matchDesc = t('matches.mutual')
                        } else if (superLikesMe) {
                            matchDesc = t('matches.super_like')
                        }

                        const userItem = {
                            id: snapDoc.id,
                            name: isDeleted ? t('matches.disabled') : (data.firstName || t('matches.unnamed')),
                            age: age || 25,
                            photo: isDeleted ? '' : (data.photos && data.photos.length > 0 ? data.photos[0] : ''),
                            bio: data.bio || (data.gender === 'male' ? t('matches.male') : data.gender === 'female' ? t('matches.female') : ''),
                            distance: data.locationCity || t('matches.nearby'),
                            interests: data.interests || [],
                            job: data.job,
                            school: data.school,
                            matchedAt: matchDesc,
                            isDeleted
                        }

                        if (isLikedByMe && likesMe) {
                            mutualData.push(userItem)
                        } else if (likesMe && !isLikedByMe) {
                            likesYouData.push(userItem)
                        }
                    }
                })

                setMutualMatches(mutualData)
                setLikesYou(likesYouData)
            } catch (err) {
                console.error('Match error', err)
            } finally {
                setLoading(false)
            }
        }
        fetchMatches()
    }, [user])

    const currentDisplayList = activeTab === 'mutual' ? mutualMatches : likesYou

    return (
        <div className="matches-container">
            {/* Header */}
            <div className="matches-header">
                <h1 className="matches-title">{t('matches.title')}</h1>

                {/* Tabs */}
                <div className="matches-tabs">
                    <button
                        className={`match-tab ${activeTab === 'likesYou' ? 'active' : ''}`}
                        onClick={() => setActiveTab('likesYou')}
                    >
                        {t('matches.tab_likes')}
                    </button>
                    <button
                        className={`match-tab ${activeTab === 'mutual' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mutual')}
                    >
                        {t('matches.tab_mutual')}
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    {t('matches.loading')}
                </div>
            ) : currentDisplayList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    {activeTab === 'likesYou'
                        ? t('matches.empty_likes')
                        : t('matches.empty_mutual')}
                </div>
            ) : (
                /* Grid */
                <div className="matches-grid">
                    {currentDisplayList.map((matchedUser, index) => (
                        <motion.div
                            key={matchedUser.id}
                            className={`match-card ${matchedUser.isDeleted ? 'deactivated' : ''}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            onClick={() => {
                                if (matchedUser.isDeleted) {
                                    showToast({
                                        title: t('matches.err_title'),
                                        message: t('matches.err_disabled'),
                                        type: 'error'
                                    })
                                } else {
                                    setSelectedUser(matchedUser)
                                }
                            }}
                            style={{ opacity: matchedUser.isDeleted ? 0.5 : 1 }}
                        >
                            {matchedUser.photo ? (
                                <img src={matchedUser.photo} alt={matchedUser.name} className="match-photo" />
                            ) : (
                                <div className="match-photo" style={{ background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {matchedUser.isDeleted ? <X size={40} color="var(--text-muted)" /> : <span style={{ fontSize: 40 }}>{matchedUser.name[0]}</span>}
                                </div>
                            )}
                            <div className="match-gradient" />
                            <div className="match-info">
                                <span className="match-name">{matchedUser.name}{!matchedUser.isDeleted && `, ${matchedUser.age} `}</span>
                                <span className="match-time">{matchedUser.matchedAt}</span>
                            </div>
                            {!matchedUser.isDeleted && <div className="match-online-dot" />}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Bottom Nav */}
            <BottomNav active="matches" />

            {/* Profile Detail Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <motion.div
                        className="match-detail-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedUser(null)}
                    >
                        <motion.div
                            className="match-detail"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="match-detail-header">
                                <img src={selectedUser.photo} alt={selectedUser.name} className="match-detail-image" />
                                <div className="match-detail-gradient" />
                                <button className="match-detail-close" onClick={() => setSelectedUser(null)}>
                                    <ChevronDown size={20} />
                                </button>
                            </div>

                            <div className="match-detail-body">
                                <div className="match-detail-name-row">
                                    <div>
                                        <span className="match-detail-name">{selectedUser.name}</span>
                                        <span className="match-detail-age">, {selectedUser.age}</span>
                                    </div>
                                    <span className="match-detail-time">{selectedUser.matchedAt}</span>
                                </div>

                                <div className="match-detail-meta">
                                    {selectedUser.job && (
                                        <div className="match-detail-meta-item">
                                            <Briefcase size={14} /> {selectedUser.job}
                                        </div>
                                    )}
                                    {selectedUser.school && (
                                        <div className="match-detail-meta-item">
                                            <GraduationCap size={14} /> {selectedUser.school}
                                        </div>
                                    )}
                                    <div className="match-detail-meta-item">
                                        <MapPin size={14} /> {selectedUser.distance} {t('matches.away')}
                                    </div>
                                </div>

                                <div className="match-detail-section">
                                    <h3>{t('matches.about')}</h3>
                                    <p className="match-detail-bio">{selectedUser.bio}</p>
                                </div>

                                <div className="match-detail-section">
                                    <h3>{t('matches.interests')}</h3>
                                    <div className="match-detail-interests">
                                        {selectedUser.interests.map(interest => (
                                            <span key={interest} className="match-detail-interest">
                                                {t(`interests.${interest}`, { defaultValue: interest })}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="match-detail-actions">
                                    <button className="match-action-btn message" onClick={async () => {
                                        if (!user) return
                                        try {
                                            // Check if a chat already exists between these two users
                                            const chatsRef = collection(db, 'chats')
                                            const q = query(chatsRef, where('participants', 'array-contains', user.uid))
                                            const snap = await getDocs(q)
                                            let existingChatId = null

                                            snap.forEach(doc => {
                                                const data = doc.data()
                                                if (data.participants && data.participants.includes(selectedUser.id)) {
                                                    existingChatId = doc.id
                                                }
                                            })

                                            if (existingChatId) {
                                                navigate(`/chat/${existingChatId}`)
                                            } else {
                                                // Create new chat room
                                                const newChatRef = await addDoc(chatsRef, {
                                                    participants: [user.uid, selectedUser.id],
                                                    createdAt: new Date().getTime(),
                                                    lastMessage: '',
                                                    updatedAt: new Date().getTime()
                                                })
                                                navigate(`/chat/${newChatRef.id}`)
                                            }
                                        } catch (error) {
                                            console.error("Chat başlatılamadı:", error)
                                        }
                                    }}>
                                        <MessageCircle size={20} />
                                        <span>{t('matches.send_msg')}</span>
                                    </button>
                                    <button className="match-action-btn unmatch" onClick={() => setSelectedUser(null)}>
                                        <X size={20} />
                                        <span>{t('matches.unmatch')}</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
