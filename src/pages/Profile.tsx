import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Settings, MapPin,
    Heart, Eye, Star, Crown, Sparkles,
    Shield, Zap, X, ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import BottomNav from '../components/BottomNav'
import { useTranslation } from 'react-i18next'
import './Profile.css'

export default function Profile() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { userProfile, user } = useAuth()
    const [viewingPhoto, setViewingPhoto] = useState<number | null>(null)

    // Stats
    const [likesCount, setLikesCount] = useState(0)
    const [matchesCount, setMatchesCount] = useState(0)
    const [viewsCount, setViewsCount] = useState(0)

    const [realtimeRole, setRealtimeRole] = useState<string>(userProfile?.role || 'user')

    useEffect(() => {
        if (!user) return
        const uid = user.uid

        // 1. Listen for realtime role changes
        import('firebase/firestore').then(({ doc, onSnapshot }) => {
            const roleUnsub = onSnapshot(doc(db, 'users', uid), (docSnap) => {
                if (docSnap.exists()) {
                    setRealtimeRole(docSnap.data().role || 'user')
                }
            })
            // Realtime role listener cleanup handled internally or on unmount safely
            return () => roleUnsub()
        })

        const fetchStats = async () => {
            try {
                const myDocSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', uid)))
                const myData = myDocSnap.docs[0]?.data()
                const myLikedUsers = myData?.likedUsers || []

                const usersSnap = await getDocs(collection(db, 'users'))
                let pendingLikes = 0
                let mutualMatches = 0

                usersSnap.forEach(docSnap => {
                    if (docSnap.id === uid) return
                    const data = docSnap.data()

                    const likesMe = Array.isArray(data.likedUsers) && data.likedUsers.includes(uid)
                    const superLikesMe = Array.isArray(data.superLikedUsers) && data.superLikedUsers.includes(uid)
                    const isLikedByMe = myLikedUsers.includes(docSnap.id)

                    if ((likesMe || superLikesMe) && !isLikedByMe) {
                        pendingLikes++
                    } else if ((likesMe || superLikesMe) && isLikedByMe) {
                        mutualMatches++
                    }
                })

                setLikesCount(pendingLikes)
                setMatchesCount(mutualMatches)

                // 3. Views: use profileViews field from user doc
                if (myData) {
                    setViewsCount(myData.profileViews || 0)
                }
            } catch (err) {
                console.error('Stats fetch error:', err)
            }
        }

        fetchStats()
    }, [user])

    if (!userProfile) {
        return (
            <div className="profile-page">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: 'var(--text-muted)' }}>
                    {t('profile.loading')}
                </div>
                <BottomNav active="profile" />
            </div>
        )
    }

    // Calculate age from birthDate (DD/MM/YYYY)
    const calcAge = () => {
        const parts = userProfile.birthDate?.split('/')
        if (!parts || parts.length < 3) return ''
        const birthYear = parseInt(parts[2])
        const birthMonth = parseInt(parts[1])
        const birthDay = parseInt(parts[0])
        const today = new Date()
        let age = today.getFullYear() - birthYear
        if (today.getMonth() + 1 < birthMonth || (today.getMonth() + 1 === birthMonth && today.getDate() < birthDay)) {
            age--
        }
        return age
    }

    const age = calcAge()
    const pendingPhotos = userProfile.pendingPhotos || []
    const isPending = pendingPhotos.length > 0
    const photos = isPending ? pendingPhotos : (userProfile.photos || [])
    const interests = userProfile.interests || []

    // Profile completion
    const fields = [
        userProfile.firstName,
        userProfile.lastName,
        userProfile.birthDate,
        userProfile.gender,
        userProfile.lookingFor,
        interests.length > 0,
        photos.length > 0,
        userProfile.locationCity,
    ]
    const filledCount = fields.filter(Boolean).length
    const completionPercent = Math.round((filledCount / fields.length) * 100)

    return (
        <div className="profile-page">
            <div className="profile-scroll">

                {/* Clean Header — just avatar, name, meta */}
                <div className="profile-header-clean">
                    <div style={{ display: 'flex', position: 'absolute', top: '16px', right: '16px', gap: '10px' }}>
                        {realtimeRole === 'admin' && (
                            <button className="profile-settings-btn" style={{ position: 'relative', top: 0, right: 0, backgroundColor: '#ef4444' }} onClick={() => navigate('/admin')}>
                                <Shield size={20} color="#fff" />
                            </button>
                        )}
                        <button className="profile-settings-btn" style={{ position: 'relative', top: 0, right: 0 }} onClick={() => navigate('/settings')}>
                            <Settings size={20} />
                            {user && !user.emailVerified && (
                                <div style={{ position: 'absolute', top: -4, right: -4, background: '#1e293b', borderRadius: '50%' }}>
                                    <AlertCircle size={14} color="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                                </div>
                            )}
                        </button>
                    </div>

                    <motion.div
                        className="profile-avatar-ring"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        {photos.length > 0 ? (
                            <img src={photos[0]} alt={userProfile.firstName} className="profile-avatar" />
                        ) : (
                            <div className="profile-avatar profile-avatar-placeholder">
                                {userProfile.firstName?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}
                    </motion.div>

                    <motion.h1
                        className="profile-name"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                    >
                        {userProfile.firstName}{age ? `, ${age}` : ''}
                        {realtimeRole === 'admin' && (
                            <span style={{
                                fontSize: '0.6rem',
                                padding: '4px 8px',
                                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                                color: 'white',
                                borderRadius: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <Shield size={10} /> CEO
                            </span>
                        )}
                    </motion.h1>

                    <div className="profile-meta">
                        {userProfile.locationCity && <span><MapPin size={13} /> {userProfile.locationCity}</span>}
                        {userProfile.gender && (
                            <span>
                                {userProfile.gender === 'male' ? t('profile.male') : userProfile.gender === 'female' ? t('profile.female') : t('profile.other')}
                            </span>
                        )}
                    </div>

                    {userProfile.lookingFor && (
                        <p className="profile-bio">
                            {userProfile.lookingFor === 'female' ? t('profile.looking_f') :
                                userProfile.lookingFor === 'male' ? t('profile.looking_m') :
                                    userProfile.lookingFor === 'both' ? t('profile.looking_b') : ''}
                        </p>
                    )}

                    {/* Completion Bar */}
                    <div className="profile-completion">
                        <div className="completion-label">
                            <span>{t('profile.completion')}</span>
                            <span className="completion-pct">{completionPercent}%</span>
                        </div>
                        <div className="completion-track">
                            <motion.div
                                className="completion-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${completionPercent}%` }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <motion.div
                    className="profile-stats"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="stat-card">
                        <Heart size={18} className="stat-icon likes" />
                        <span className="stat-number">{likesCount}</span>
                        <span className="stat-label">{t('profile.likes')}</span>
                    </div>
                    <div className="stat-card">
                        <Star size={18} className="stat-icon matches" />
                        <span className="stat-number">{matchesCount}</span>
                        <span className="stat-label">{t('profile.matches')}</span>
                    </div>
                    <div className="stat-card">
                        <Eye size={18} className="stat-icon views" />
                        <span className="stat-number">{viewsCount}</span>
                        <span className="stat-label">{t('profile.views')}</span>
                    </div>
                </motion.div>

                {/* Premium Card — only show if NOT premium */}
                {!(userProfile?.subscription?.status === 'active' || userProfile?.isPremium) && (
                    <motion.div
                        className="premium-card"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="premium-glow" />
                        <div className="premium-content">
                            <div className="premium-badge">
                                <Crown size={20} />
                                <span>BeMatch Gold</span>
                            </div>
                            <p className="premium-desc">{t('profile.premium_desc')}</p>
                            <div className="premium-perks">
                                <span><Sparkles size={14} /> {t('profile.perk_likes')}</span>
                                <span><Eye size={14} /> {t('profile.perk_see')}</span>
                                <span><Zap size={14} /> {t('profile.perk_boost')}</span>
                                <span><Shield size={14} /> {t('profile.perk_adfree')}</span>
                            </div>
                            <button className="premium-btn" onClick={() => navigate('/premium')}>
                                <Crown size={16} />
                                {t('profile.upgrade_btn')}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Gold Member Badge — show if premium */}
                {(userProfile?.subscription?.status === 'active' || userProfile?.isPremium) && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            margin: '0 16px',
                            padding: '16px 20px',
                            background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 4px 20px rgba(251,191,36,0.3)'
                        }}
                    >
                        <Crown size={28} color="#000" />
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#000' }}>BeMatch Gold Üyesi 👑</div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.7)', marginTop: 2 }}>
                                {userProfile?.subscription?.planName || 'Premium'} · {userProfile?.subscription?.expiryDate
                                    ? new Date(userProfile.subscription.expiryDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) + ' tarihine kadar'
                                    : 'Aktif'}
                            </div>
                        </div>
                    </motion.div>
                )}


                {/* Photo Gallery — view only */}
                {photos.length > 0 && (
                    <motion.div
                        className="profile-section"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.35 }}
                    >
                        <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3>{t('profile.my_photos')}</h3>
                            {isPending && (
                                <span style={{
                                    fontSize: '0.75rem',
                                    color: '#f59e0b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                }}>
                                    <AlertCircle size={12} />
                                    Onay Bekliyor
                                </span>
                            )}
                        </div>
                        <div className="profile-gallery">
                            {photos.map((photo, i) => (
                                <motion.div
                                    key={i}
                                    className="gallery-item"
                                    onClick={() => setViewingPhoto(i)}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <img src={photo} alt={`${t('profile.photo_alt')} ${i + 1}`} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Interests */}
                {interests.length > 0 && (
                    <motion.div
                        className="profile-section"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="section-header">
                            <h3>{t('profile.my_interests')}</h3>
                        </div>
                        <div className="profile-interests">
                            {interests.map((interest, i) => (
                                <span key={i} className="interest-chip">{interest}</span>
                            ))}
                        </div>
                    </motion.div>
                )}

                <div style={{ height: 100 }} />
            </div>

            {/* Photo Lightbox with navigation */}
            <AnimatePresence>
                {viewingPhoto !== null && photos.length > 0 && (
                    <motion.div
                        className="photo-lightbox"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setViewingPhoto(null)}
                    >
                        <button className="lightbox-close-btn" onClick={() => setViewingPhoto(null)}>
                            <X size={24} />
                        </button>

                        <div className="lightbox-counter">
                            {viewingPhoto + 1} / {photos.length}
                        </div>

                        {viewingPhoto > 0 && (
                            <button className="lightbox-nav prev" onClick={e => { e.stopPropagation(); setViewingPhoto(viewingPhoto - 1) }}>
                                <ChevronLeft size={28} />
                            </button>
                        )}

                        <motion.img
                            key={viewingPhoto}
                            src={photos[viewingPhoto]}
                            alt=""
                            className="lightbox-photo"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={e => e.stopPropagation()}
                        />

                        {viewingPhoto < photos.length - 1 && (
                            <button className="lightbox-nav next" onClick={e => { e.stopPropagation(); setViewingPhoto(viewingPhoto + 1) }}>
                                <ChevronRight size={28} />
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <BottomNav active="profile" />
        </div>
    )
}

