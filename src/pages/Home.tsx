import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { X, Heart, Star, RotateCcw, MapPin, ChevronUp, Crown } from 'lucide-react'
import { collection, getDocs, doc, updateDoc, arrayUnion, getDoc, increment, FieldValue } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import type { DemoUser } from '../data/demoUsers'
import BottomNav from '../components/BottomNav'
import ProfileDetail from '../components/ProfileDetail'
import { sendNotification } from '../utils/notifications'
import { useTranslation } from 'react-i18next'
import AnnouncementPopup from '../components/AnnouncementPopup'
import { useWallet } from '../hooks/useWallet'
import './Home.css'


export default function Home() {
    const { t } = useTranslation()
    const { user } = useAuth()
    const navigate = useNavigate()
    const { consumeFeature } = useWallet()
    const [users, setUsers] = useState<DemoUser[]>([])
    const [loading, setLoading] = useState(true)
    const [removedUsers, setRemovedUsers] = useState<DemoUser[]>([])
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
    const [showProfile, setShowProfile] = useState(false)
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null)
    const [showTutorial, setShowTutorial] = useState(() => {
        return localStorage.getItem('tutorialSeen') !== 'true'
    })
    const [tutorialStep, setTutorialStep] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [welcomeToast, setWelcomeToast] = useState(false)
    const location = useLocation()

    // Handle account restoration welcome message
    useEffect(() => {
        if (location.state?.restored) {
            setWelcomeToast(true)
            setTimeout(() => {
                setWelcomeToast(false)
            }, 5000)

            // Clear state so it doesn't show again on refresh
            window.history.replaceState({}, document.title)
        }
    }, [location])

    // Helper: Haversine distance calculation (in km)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    // Fetch real users from Firestore
    const fetchUsers = useCallback(async () => {
        if (!user) return
        setLoading(true)
        setIsRefreshing(true)
        try {
            // Get fresh current user context 
            const currentUserDoc = await getDoc(doc(db, 'users', user.uid))
            const currentUserData = currentUserDoc.data()
            if (!currentUserData) return

            const likedUsers: string[] = currentUserData.likedUsers || []
            const passedUsers: string[] = currentUserData.passedUsers || []
            const userLat = currentUserData.locationCoords?.lat
            const userLng = currentUserData.locationCoords?.lng

            // Get Current User's Age for filtering
            // let currentUserAge = 25
            // if (currentUserData.birthDate) {
            //     const parts = currentUserData.birthDate.split('/')
            //     if (parts.length === 3) {
            //         currentUserAge = new Date().getFullYear() - parseInt(parts[2])
            //     }
            // }
            // Get Current User's City for exact matching
            // const currentUserCity = currentUserData.locationCity || ''

            const snap = await getDocs(collection(db, 'users'))
            const firebaseUsers: (DemoUser & { _score: number })[] = []

            snap.forEach(document => {
                const data = document.data()
                const targetId = document.id

                // Exclude current user and already swiped users
                if (targetId === user.uid) return
                if (likedUsers.includes(targetId)) return
                if (passedUsers.includes(targetId)) return

                // Exclude bad data (allow if they at least have pending photos or real photos)
                if ((!data.photos || data.photos.length === 0) && (!data.pendingPhotos || data.pendingPhotos.length === 0)) return

                // 0. Incognito Mode Filter
                if (data.privacySettings?.incognitoMode === true) {
                    const hasLikedMe = (data.likedUsers || []).includes(user.uid) || (data.superLikedUsers || []).includes(user.uid)
                    if (!hasLikedMe) return // Hide user if they are in incognito and haven't liked current user
                }

                // 1. Same City Priority (No longer strictly filtered out, just sorted by distance later)
                // Filter removed to allow other cities when same city is depleted

                // 2. Age parsing
                let age = 0
                if (data.birthDate) {
                    const parts = data.birthDate.split('/')
                    if (parts.length === 3) {
                        age = new Date().getFullYear() - parseInt(parts[2])
                    }
                } else {
                    age = 25
                }
                // Removed age +/- 5 restriction to allow more users to show up

                // 3. Gender/Preference filter - Relaxed for testing
                if (currentUserData.lookingFor && currentUserData.lookingFor !== 'both') {
                    // Only filter if the user explicitly set a preference, but fallback gracefully
                    if (data.gender && currentUserData.lookingFor !== data.gender) {
                        // For MVP: if the db doesn't have enough users, don't filter strictly. 
                        // In a real app we would KEEP this return. Disabled to prevent empty deck.
                        // return 
                    }
                }

                // 4. Distance calculation (Display only, no strict filtering limit)
                let distObj = { formatted: data.locationCity || t('home.nearby'), val: 9999 }
                if (userLat && userLng && data.locationCoords?.lat && data.locationCoords?.lng) {
                    const distKm = calculateDistance(userLat, userLng, data.locationCoords.lat, data.locationCoords.lng)
                    distObj = { formatted: `${Math.round(distKm)} ${t('home.km_away')}`, val: distKm }
                }

                // 5. Scoring System (Basic distance sort, ignored interests to broaden pool)
                let score = 0
                score -= distObj.val * 0.1

                // Boost özelliği: süresi dolmamışsa profil sırasını en tepeye alıyoruz
                if (data.boostedUntil && data.boostedUntil > Date.now()) {
                    score += 10000
                }

                const targetInterests: string[] = data.interests || []

                firebaseUsers.push({
                    id: targetId, // Using Firebase ID directly as string via workaround below
                    name: data.firstName || 'İsimsiz',
                    age: age || 25,
                    bio: data.bio || (data.gender === 'male' ? t('home.male_icon') : data.gender === 'female' ? t('home.female_icon') : ''),
                    distance: distObj.formatted,
                    photos: data.photos,
                    countryCode: data.countryCode,
                    interests: targetInterests,
                    lookingFor: data.lookingFor === 'female' ? t('home.looking_f') :
                        data.lookingFor === 'male' ? t('home.looking_m') :
                            data.lookingFor === 'both' ? t('home.looking_b') : '',
                    job: data.job,
                    school: data.school,
                    _score: score
                })
            })

            // Sort by distance descending
            firebaseUsers.sort((a, b) => b._score - a._score)

            setUsers(firebaseUsers)
        } catch (err) {
            console.error('Kullanıcılar yüklenemedi:', err)
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }, [user, t])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const currentUser = users[users.length - 1]
    const viewedInSession = useRef<Set<string | number>>(new Set())

    const handleOpenProfile = () => {
        if (!currentUser || !user) return

        setShowProfile(true)

        const viewedId = String(currentUser.id)
        if (viewedInSession.current.has(viewedId) || viewedId === user.uid) return

        viewedInSession.current.add(viewedId)

        // Fire-and-forget: increment profileViews on the viewed user's doc
        try {
            updateDoc(doc(db, 'users', viewedId), {
                profileViews: increment(1)
            }).catch(err => { console.warn("Profile view inc failed:", err) })
        } catch (err) {
            console.warn("Profile view update failed:", err)
        }
    }

    const dismissTutorial = () => {
        if (tutorialStep < 2) {
            setTutorialStep(prev => prev + 1)
        } else {
            localStorage.setItem('tutorialSeen', 'true')
            setShowTutorial(false)
        }
    }

    const handleSwipe = useCallback(async (direction: 'left' | 'right' | 'up') => {
        if (!currentUser) return

        setSwipeDirection(direction)

        // 1. Check Wallet Balance & Consume
        if (direction === 'right' || direction === 'up') {
            const feature = direction === 'up' ? 'superLikes' : 'likes';
            const canConsume = await consumeFeature(feature);

            if (!canConsume) {
                // Return to original position (handled by framer usually, but here we prevent the record)
                setSwipeDirection(null);
                navigate('/premium');
                return;
            }
        }

        // 2. Save action to Firestore
        if (user) {
            try {
                const userRef = doc(db, 'users', user.uid)
                const targetDocId = String(currentUser.id)
                const targetRef = doc(db, 'users', targetDocId)

                if (direction === 'right' || direction === 'up') {
                    const updateData: { likedUsers: FieldValue; superLikedUsers?: FieldValue } = {
                        likedUsers: arrayUnion(currentUser.id)
                    }
                    if (direction === 'up') {
                        updateData.superLikedUsers = arrayUnion(currentUser.id)
                    }

                    // Update current user's lists and boost target user's ELO
                    await Promise.all([
                        updateDoc(userRef, updateData),
                        updateDoc(targetRef, { eloScore: increment(direction === 'up' ? 10 : 5) }).catch(() => { })
                    ])

                    // Notification Logic
                    const targetDoc = await getDoc(targetRef)
                    const targetData = targetDoc.data()

                    const currentUserDoc = await getDoc(userRef)
                    const currentUserData = currentUserDoc.data()

                    if (targetData && currentUserData) {
                        const hasTargetLikedUser = (targetData.likedUsers || []).includes(user.uid) || (targetData.superLikedUsers || []).includes(user.uid)

                        // Avatars for notif
                        const userAvatar = currentUserData.photos?.[0] || ''
                        const targetAvatar = targetData.photos?.[0] || ''

                        if (hasTargetLikedUser) {
                            // Mutual Match - send to both
                            sendNotification({
                                userId: targetDocId,
                                type: 'match',
                                title: t('home.notif_match'),
                                body: t('home.notif_match'),
                                link: '/matches',
                                avatar: userAvatar
                            })
                            sendNotification({
                                userId: user.uid,
                                type: 'match',
                                title: t('home.notif_match'),
                                body: t('home.notif_match'),
                                link: '/matches',
                                avatar: targetAvatar
                            })

                            // Trigger dynamic MATCH auto-messages from system to both users
                            const { triggerAutoMessages } = await import('../utils/autoMessages')
                            await triggerAutoMessages('MATCH', targetDocId)
                            await triggerAutoMessages('MATCH', user.uid)
                        } else {
                            // Just a like - send to target
                            const likeType = direction === 'up' ? t('home.notif_super') : t('home.notif_like')
                            sendNotification({
                                userId: targetDocId,
                                type: 'like',
                                title: likeType,
                                body: likeType,
                                link: '/matches'
                            })
                        }
                    }
                } else if (direction === 'left') {
                    // Update current user's passes and decrease target user's ELO slightly
                    await Promise.all([
                        updateDoc(userRef, {
                            passedUsers: arrayUnion(currentUser.id)
                        }),
                        updateDoc(targetRef, { eloScore: increment(-2) }).catch(() => { })
                    ])
                }
            } catch (err) {
                console.error('Swipe kaydedilemedi:', err)
            }
        }

        setTimeout(() => {
            setRemovedUsers(prev => [currentUser, ...prev])
            setUsers(prev => prev.slice(0, -1))
            setCurrentPhotoIndex(0)
            setSwipeDirection(null)
        }, 100) // Reduced delay for faster card transitions
    }, [currentUser, user, t, navigate])

    const handleRewind = async () => {
        if (removedUsers.length === 0) return

        // Wallet Check
        const canRewind = await consumeFeature('rewinds');
        if (!canRewind) {
            navigate('/premium');
            return;
        }

        const lastRemoved = removedUsers[0]

        setRemovedUsers(prev => prev.slice(1))
        setUsers(prev => [...prev, lastRemoved])
        setCurrentPhotoIndex(0)

        // Optionally remove from firebase logic here (not critical for MVP)
    }

    const resetDeck = async () => {
        if (!user) return
        setIsRefreshing(true)
        try {
            const userRef = doc(db, 'users', user.uid)
            // Only reset passed users, keep liked users so they don't show up again.
            await updateDoc(userRef, {
                passedUsers: []
            })
            await fetchUsers()
        } catch (err) {
            console.error('Deste sıfırlanırken hata:', err)
            setIsRefreshing(false)
        }
    }

    const nextPhoto = () => {
        if (currentUser) {
            if (currentPhotoIndex < currentUser.photos.length - 1) {
                setCurrentPhotoIndex(prev => prev + 1)
            } else {
                // Loop back to the first photo
                setCurrentPhotoIndex(0)
            }
        }
    }

    const prevPhoto = () => {
        if (currentUser && currentPhotoIndex > 0) {
            setCurrentPhotoIndex(prev => prev - 1)
        }
    }

    return (
        <div className="home-container">
            {/* Duyuru Pop-up Sistemi */}
            <AnnouncementPopup />

            {/* Header */}
            <div className="home-header">
                <div className="header-logo">BeMatch</div>
            </div>

            {/* Card Stack */}
            <div className="card-stack">
                {loading ? (
                    <motion.div
                        className="no-more-cards"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <h3>{t('home.loading')}</h3>
                        <p>{t('home.searching')}</p>
                    </motion.div>
                ) : users.length === 0 ? (
                    <motion.div
                        className="no-more-cards"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <h3>{t('home.thats_all')}</h3>
                        <p>{t('home.no_more')}</p>

                        <motion.button
                            className="reset-deck-btn"
                            onClick={resetDeck}
                            disabled={isRefreshing}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <RotateCcw size={16} />
                            {isRefreshing ? t('home.resetting') : t('home.reset_deck')}
                        </motion.button>

                    </motion.div>
                ) : (
                    <>
                        {users.length > 1 && (
                            <motion.div
                                className="swipe-card"
                                style={{ scale: 0.95, opacity: 0.6, zIndex: 0 }}
                            >
                                <div className="card-image-container">
                                    <img
                                        src={users[users.length - 2].photos[0]}
                                        alt=""
                                        className="card-image"
                                    />
                                    <div className="card-gradient" />
                                </div>
                            </motion.div>
                        )}

                        {/* Current card */}
                        <SwipeCard
                            key={currentUser.id}
                            user={currentUser}
                            photoIndex={currentPhotoIndex}
                            onSwipe={handleSwipe}
                            onNextPhoto={nextPhoto}
                            onPrevPhoto={prevPhoto}
                            onOpenProfile={handleOpenProfile}
                            swipeDirection={swipeDirection}
                        />
                    </>
                )}
            </div>

            {/* Action Buttons */}
            {users.length > 0 && (
                <div className="action-buttons">
                    <motion.button
                        className="action-btn small rewind"
                        onClick={handleRewind}
                        whileTap={{ scale: 0.85 }}
                        title="Geri Al"
                    >
                        <RotateCcw size={20} />
                    </motion.button>

                    <motion.button
                        className="action-btn large reject"
                        onClick={() => handleSwipe('left')}
                        whileTap={{ scale: 0.85 }}
                        title="Reddet"
                    >
                        <X size={28} />
                    </motion.button>

                    <motion.button
                        className="action-btn small superlike"
                        onClick={() => handleSwipe('up')}
                        whileTap={{ scale: 0.85 }}
                        title="Süper Beğen"
                    >
                        <Star size={20} />
                    </motion.button>

                    <motion.button
                        className="action-btn large like"
                        onClick={() => handleSwipe('right')}
                        whileTap={{ scale: 0.85 }}
                        title="Beğen"
                    >
                        <Heart size={28} />
                    </motion.button>
                </div>
            )}

            {/* Welcome Back Toast */}
            <AnimatePresence>
                {welcomeToast && (
                    <motion.div
                        className="welcome-toast"
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        transition={{ type: 'spring', bounce: 0.4 }}
                    >
                        <div className="toast-icon">🎉</div>
                        <div className="toast-content">
                            <h4>{t('home.welcome')}</h4>
                            <p>{t('home.welcome_sub')}</p>
                        </div>
                        <button className="toast-close" onClick={() => setWelcomeToast(false)}>
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <BottomNav active="home" />

            {/* Tutorial Overlay */}
            <AnimatePresence>
                {showTutorial && (
                    <motion.div
                        className="tutorial-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={dismissTutorial}
                    >
                        <div className="tutorial-content">
                            {tutorialStep === 0 && (
                                <motion.div
                                    className="tutorial-step"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="tutorial-hand">👉</div>
                                    <div className="tutorial-arrow right-arrow" />
                                    <p className="tutorial-text" dangerouslySetInnerHTML={{ __html: t('home.tut_right') }}></p>
                                    <span className="tutorial-hint">{t('home.tut_hint')}</span>
                                </motion.div>
                            )}
                            {tutorialStep === 1 && (
                                <motion.div
                                    className="tutorial-step"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="tutorial-hand left">👈</div>
                                    <div className="tutorial-arrow left-arrow" />
                                    <p className="tutorial-text" dangerouslySetInnerHTML={{ __html: t('home.tut_left') }}></p>
                                    <span className="tutorial-hint">{t('home.tut_hint')}</span>
                                </motion.div>
                            )}
                            {tutorialStep === 2 && (
                                <motion.div
                                    className="tutorial-step"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="tutorial-hand up">☝️</div>
                                    <div className="tutorial-arrow up-arrow" />
                                    <p className="tutorial-text" dangerouslySetInnerHTML={{ __html: t('home.tut_up') }}></p>
                                    <span className="tutorial-hint">{t('home.tut_start')}</span>
                                </motion.div>
                            )}
                        </div>
                        <div className="tutorial-dots">
                            {[0, 1, 2].map(i => (
                                <div key={i} className={`tutorial-dot ${i === tutorialStep ? 'active' : ''}`} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Profile Detail Modal */}
            <AnimatePresence>
                {showProfile && currentUser && (
                    <ProfileDetail
                        user={currentUser}
                        photoIndex={currentPhotoIndex}
                        onClose={() => setShowProfile(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

/* ============ SwipeCard Component ============ */
interface SwipeCardProps {
    user: DemoUser
    photoIndex: number
    onSwipe: (dir: 'left' | 'right' | 'up') => void
    onNextPhoto: () => void
    onPrevPhoto: () => void
    onOpenProfile: () => void
    swipeDirection: 'left' | 'right' | 'up' | null
}

function SwipeCard({ user, photoIndex, onSwipe, onNextPhoto, onPrevPhoto, onOpenProfile, swipeDirection }: SwipeCardProps) {
    const { t } = useTranslation()
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const rotate = useTransform(x, [-300, 0, 300], [-20, 0, 20])
    const likeOpacity = useTransform(x, [0, 100], [0, 1])
    const nopeOpacity = useTransform(x, [-100, 0], [1, 0])
    const superlikeOpacity = useTransform(y, [-100, 0], [1, 0])

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => {
        if (info.offset.y < -100) {
            onSwipe('up')
        } else if (info.offset.x > 100) {
            onSwipe('right')
        } else if (info.offset.x < -100) {
            onSwipe('left')
        }
    }

    return (
        <motion.div
            className="swipe-card"
            style={{ x, y, rotate, zIndex: 1 }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.9}
            onDragEnd={handleDragEnd}
            animate={
                swipeDirection === 'right'
                    ? { x: 500, opacity: 0, rotate: 20 }
                    : swipeDirection === 'left'
                        ? { x: -500, opacity: 0, rotate: -20 }
                        : swipeDirection === 'up'
                            ? { y: -600, opacity: 0, scale: 0.8 }
                            : { x: 0, y: 0, opacity: 1, rotate: 0 }
            }
            transition={{ duration: 0.3, ease: 'easeOut' }}
        >
            {/* Photo Dots */}
            <div className="photo-dots">
                {user.photos.map((_, i) => (
                    <div key={i} className={`photo-dot ${i === photoIndex ? 'active' : ''}`} />
                ))}
            </div>

            {/* Photo Navigation Areas */}
            <button className="photo-nav prev" onClick={(e) => { e.stopPropagation(); onPrevPhoto() }} />
            <button className="photo-nav next" onClick={(e) => { e.stopPropagation(); onNextPhoto() }} />

            {/* Image */}
            <div className="card-image-container">
                {user.photos && user.photos.length > 0 ? (
                    <img src={user.photos[photoIndex]} alt={user.name} className="card-image" />
                ) : (
                    <div className="card-image-placeholder">
                        {user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                )}
                <div className="card-gradient" />
                {user.countryCode && (
                    <div className="country-badge">
                        {user.countryCode}
                    </div>
                )}
            </div>

            {/* Like / Nope / Super Like Stamps */}
            <motion.div className="swipe-stamp like" style={{ opacity: likeOpacity }}>
                {t('home.like')}
            </motion.div>
            <motion.div className="swipe-stamp nope" style={{ opacity: nopeOpacity }}>
                {t('home.nope')}
            </motion.div>
            <motion.div className="swipe-stamp superlike" style={{ opacity: superlikeOpacity }}>
                {t('home.super')}
            </motion.div>

            {/* User Info */}
            <div className="card-info">
                <div className="user-name-age">
                    <span className="user-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {user.name}
                        {user.subscription?.status === 'active' && <Crown size={20} color="#facc15" fill="#facc15" strokeWidth={2.5} />}
                    </span>
                    <span className="user-age">{user.age > 0 ? user.age : ''}</span>
                </div>
                <div className="user-distance">
                    <MapPin size={12} /> {user.distance}
                </div>
                <div className="user-bio">{user.bio}</div>
                <div className="user-interests">
                    {user.interests.slice(0, 3).map(interest => (
                        <span key={interest} className="info-badge">
                            {t(`interests.${interest}`, { defaultValue: interest })}
                        </span>
                    ))}
                </div>
            </div>

            {/* Card Action Buttons */}
            <div className="card-action-buttons">
                <button className="card-action-btn profile-btn" onClick={(e) => { e.stopPropagation(); onOpenProfile() }}>
                    <ChevronUp size={20} />
                </button>
            </div>
        </motion.div>
    )
}


