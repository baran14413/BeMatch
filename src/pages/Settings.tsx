import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft, Camera, MapPin, User,
    Bell, BellOff, Eye, EyeOff, Lock, Shield, Globe,
    Trash2, LogOut, Crown, ChevronRight, Heart,
    Calendar, MessageCircle, Sparkles,
    Mail, Key, Pause,
    ChevronLeft, Zap, Ruler, Loader, Navigation,
    SlidersHorizontal, Search, Image as ImageIcon, Hash, X,
    Settings as SettingsIcon, Smartphone, Languages, HardDrive,
    XCircle
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { doc, updateDoc, collection, addDoc, serverTimestamp, setDoc, increment } from 'firebase/firestore'
import { db } from '../firebase'
import { updateEmail, updatePassword, sendEmailVerification } from 'firebase/auth'
import { AlertCircle } from 'lucide-react'
import './Settings.css'

/* ── Reusable Components ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
            <div className="toggle-knob" />
        </button>
    )
}

function RangeSlider({ value, onChange, min, max, unit, label }: {
    value: number | [number, number]; onChange: (v: number | [number, number]) => void;
    min: number; max: number; unit?: string; label: string
}) {
    const isRange = Array.isArray(value)
    return (
        <div className="range-slider-wrap">
            <div className="range-header">
                <span className="range-label">{label}</span>
                <span className="range-value">
                    {isRange ? `${value[0]} - ${value[1]}` : value}{unit || ''}
                </span>
            </div>
            {isRange ? (
                <div className="dual-range">
                    <input type="range" min={min} max={max} value={value[0]}
                        onChange={e => onChange([parseInt(e.target.value), value[1]])} className="range-input" />
                    <input type="range" min={min} max={max} value={value[1]}
                        onChange={e => onChange([value[0], parseInt(e.target.value)])} className="range-input" />
                </div>
            ) : (
                <input type="range" min={min} max={max} value={value as number}
                    onChange={e => onChange(parseInt(e.target.value))} className="range-input" />
            )}
        </div>
    )
}

/* ── Category Definitions ── */
type CategoryId = 'profile' | 'gallery' | 'interests' | 'discovery' | 'notifications' | 'privacy' | 'premium' | 'wallet' | 'system' | 'account'

interface Category {
    id: CategoryId
    label: string
    icon: React.ReactNode
    desc: string
    color: string
}

/* ── Main Component ── */
export default function Settings() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const { logout, userProfile, user } = useAuth()
    const { showToast } = useToast()
    const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null)

    const categories: Category[] = [
        { id: 'profile', label: t('settings.cat_profile'), icon: <User size={20} />, desc: t('settings.cat_profile_desc'), color: '#3b82f6' },
        { id: 'gallery', label: t('settings.cat_gallery'), icon: <ImageIcon size={20} />, desc: t('settings.cat_gallery_desc'), color: '#8b5cf6' },
        { id: 'interests', label: t('settings.cat_interests'), icon: <Hash size={20} />, desc: t('settings.cat_interests_desc'), color: '#ec4899' },
        { id: 'discovery', label: t('settings.cat_discovery'), icon: <Search size={20} />, desc: t('settings.cat_discovery_desc'), color: '#f59e0b' },
        { id: 'notifications', label: t('settings.cat_notif'), icon: <Bell size={20} />, desc: t('settings.cat_notif_desc'), color: '#10b981' },
        { id: 'privacy', label: t('settings.cat_privacy'), icon: <Shield size={20} />, desc: t('settings.cat_privacy_desc'), color: '#6366f1' },
        { id: 'premium', label: t('settings.cat_premium'), icon: <Crown size={20} />, desc: t('settings.cat_premium_desc'), color: '#f7b731' },
        { id: 'wallet', label: 'Cüzdanım', icon: <Smartphone size={20} />, desc: 'Paketlerini ve ödemelerini yönet', color: '#fbbf24' },
        { id: 'system', label: t('settings.cat_system'), icon: <SettingsIcon size={20} />, desc: t('settings.cat_system_desc'), color: '#94a3b8' },
        { id: 'account', label: t('settings.cat_account'), icon: <Lock size={20} />, desc: t('settings.cat_account_desc'), color: '#ef4444' },
    ]
    const [isSavingBio, setIsSavingBio] = useState(false)
    const [bioSaveSuccess, setBioSaveSuccess] = useState(false)
    const [isSavingPhoto, setIsSavingPhoto] = useState(false)
    const [isProcessingPhoto, setIsProcessingPhoto] = useState(false)
    const [photoSaveSuccess, setPhotoSaveSuccess] = useState(false)
    const [isSavingInterests, setIsSavingInterests] = useState(false)
    const [interestsSaveSuccess, setInterestsSaveSuccess] = useState(false)
    const [isSavingDiscovery, setIsSavingDiscovery] = useState(false)
    const [discoverySaveSuccess, setDiscoverySaveSuccess] = useState(false)
    const [isSavingNotifications, setIsSavingNotifications] = useState(false)
    const [notificationsSaveSuccess, setNotificationsSaveSuccess] = useState(false)

    // Subscription Cancellation
    const [isCancelling, setIsCancelling] = useState(false);

    const handleCancelSubscription = async () => {
        if (!userProfile?.uid) return;
        if (!window.confirm('Aboneliğinizi iptal etmek istediğinize emin misiniz? Premium özelliklerinizi hemen kaybedeceksiniz.')) return;

        setIsCancelling(true);
        try {
            const uid = userProfile.uid;

            // 1. Update Profile (Both top-level and subscription object)
            await updateDoc(doc(db, 'users', uid), {
                isPremium: false,
                'subscription.status': 'expired',
                'subscription.cancelledAt': Date.now()
            });

            // 2. Notification
            await addDoc(collection(db, `users/${uid}/notifications`), {
                title: 'Abonelik İptal Edildi ⚠️',
                body: 'Premium aboneliğiniz isteğiniz üzerine iptal edildi. Tekrar görüşmek üzere!',
                type: 'subscription_cancelled',
                read: false,
                createdAt: serverTimestamp()
            });

            // 3. System Message
            const sysChatId = `system_${uid}`;
            const cancelMsg = "Premium aboneliğiniz iptal edildi. BeMatch Gold ayrıcalıklarını kaybettiğiniz için üzgünüz. 👋";

            // Try to update last message in chat header
            await updateDoc(doc(db, 'chats', sysChatId), {
                updatedAt: Date.now(),
                lastMessage: cancelMsg,
                [`unreadCount_${uid}`]: increment(1)
            }).catch(async () => {
                // If chat doesn't exist, create it
                await setDoc(doc(db, 'chats', sysChatId), {
                    participants: ['system', uid],
                    updatedAt: Date.now(),
                    lastMessage: cancelMsg,
                    [`unreadCount_${uid}`]: 1
                }, { merge: true });
            });

            // Add the actual message
            await addDoc(collection(db, `chats/${sysChatId}/messages`), {
                type: 'text',
                content: cancelMsg,
                senderId: 'system',
                createdAt: Date.now(),
                status: 'sent'
            });

            showToast({ title: 'Başarılı', message: 'Aboneliğiniz başarıyla iptal edildi.', type: 'success' });
        } catch (err) {
            console.error("Cancel sub error:", err);
            showToast({ title: 'Hata', message: 'İptal işlemi sırasında bir hata oluştu.', type: 'error' });
        } finally {
            setIsCancelling(false);
        }
    };

    // States — initialized from real profile data
    const [name] = useState(userProfile?.firstName || '')
    const [bio, setBio] = useState(userProfile?.bio || '')

    // Convert DD/MM/YYYY to YYYY-MM-DD for date input
    const convertBirthDate = () => {
        const parts = userProfile?.birthDate?.split('/')
        if (!parts || parts.length < 3) return ''
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }
    const [birthDate] = useState(convertBirthDate())

    // Photos from profile, prioritized by pendingPhotos. padded to 6 slots
    const profilePhotos = userProfile?.pendingPhotos && userProfile.pendingPhotos.length > 0
        ? userProfile.pendingPhotos
        : (userProfile?.photos || [])

    const [photos, setPhotos] = useState<(string | null)[]>([
        ...profilePhotos,
        ...Array(Math.max(0, 6 - profilePhotos.length)).fill(null)
    ])
    const isPending = userProfile?.pendingPhotos && userProfile.pendingPhotos.length > 0
    const [viewingPhoto, setViewingPhoto] = useState<number | null>(null)

    const allInterestsCols = [
        { id: '💻 Teknoloji', color: '#3b82f6' }, { id: '☕ Kahve', color: '#8b5cf6' },
        { id: '✈️ Seyahat', color: '#06b6d4' }, { id: '🎵 Müzik', color: '#ec4899' },
        { id: '📸 Fotoğraf', color: '#f59e0b' }, { id: '🎮 Oyun', color: '#10b981' },
        { id: '📚 Kitap', color: '#f43f5e' }, { id: '🎬 Film', color: '#6366f1' },
        { id: '⚽ Spor', color: '#14b8a6' }, { id: '🧘 Yoga', color: '#d946ef' },
        { id: '🍳 Yemek', color: '#f97316' }, { id: '🎨 Sanat', color: '#8b5cf6' },
        { id: '💃 Dans', color: '#ec4899' }, { id: '🐾 Hayvanlar', color: '#10b981' },
        { id: '🏋️ Fitness', color: '#ef4444' }, { id: '🎸 Enstrüman', color: '#f59e0b' },
        { id: '🌿 Doğa', color: '#84cc16' }
    ]
    const [selectedInterests, setSelectedInterests] = useState(userProfile?.interests || [])

    const [distance, setDistance] = useState(userProfile?.maxDistance || 25)
    const [location, setLocation] = useState(userProfile?.locationCity || '')
    const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(userProfile?.locationCoords || null)

    const [ageRange, setAgeRange] = useState<[number, number]>([userProfile?.minAge || 18, userProfile?.maxAge || 65])
    const [genderPref, setGenderPref] = useState<'women' | 'men' | 'everyone'>(
        userProfile?.lookingFor === 'female' ? 'women' : userProfile?.lookingFor === 'male' ? 'men' : 'everyone'
    )
    const [globalMode, setGlobalMode] = useState(false)

    const [notifMatch, setNotifMatch] = useState(userProfile?.notificationSettings?.match ?? true)
    const [notifMessage, setNotifMessage] = useState(userProfile?.notificationSettings?.message ?? true)
    const [notifLike, setNotifLike] = useState(userProfile?.notificationSettings?.like ?? true)
    const [notifApp, setNotifApp] = useState(userProfile?.notificationSettings?.app ?? false)
    const [notifPermission, setNotifPermission] = useState<'granted' | 'denied' | 'default'>('default')

    // On mount, check actual permission natively or from web
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            LocalNotifications.checkPermissions().then((res) => {
                setNotifPermission(res.display === 'granted' ? 'granted' : res.display === 'denied' ? 'denied' : 'default')
            })
        } else if ('Notification' in window) {
            setNotifPermission(Notification.permission as NotificationPermission)
        }
    }, [])

    const [accountModal, setAccountModal] = useState<'email' | 'password' | 'delete' | 'cache' | null>(null)
    const [accountInput1, setAccountInput1] = useState('')
    const [accountInput2, setAccountInput2] = useState('')
    const [accountError, setAccountError] = useState('')
    const [isProcessingAccount, setIsProcessingAccount] = useState(false)
    const [verificationLoading, setVerificationLoading] = useState(false)
    const [deleteReason, setDeleteReason] = useState('')

    const [showProfile, setShowProfile] = useState(userProfile?.privacySettings?.showProfile ?? true)
    const [showOnline, setShowOnline] = useState(userProfile?.privacySettings?.showOnline ?? true)
    const [showRead, setShowRead] = useState(userProfile?.privacySettings?.showRead ?? true)
    const [showDistance, setShowDistance] = useState(userProfile?.privacySettings?.showDistance ?? true)
    const [isSavingPrivacy, setIsSavingPrivacy] = useState(false)
    const [privacySaveSuccess, setPrivacySaveSuccess] = useState(false)

    // System States (UI Only for now)
    // removed unused language state

    const toggleInterest = (interest: string) => {
        setSelectedInterests(prev =>
            prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
        )
    }

    const handleSaveBio = async () => {
        if (!user) return
        setIsSavingBio(true)
        setBioSaveSuccess(false)
        try {
            await updateDoc(doc(db, 'users', user.uid), { bio })
            setBioSaveSuccess(true)
            setTimeout(() => setBioSaveSuccess(false), 3000)
        } catch (err) {
            console.error('Biyografi güncellenemedi:', err)
        } finally {
            setIsSavingBio(false)
        }
    }

    const handleSaveInterests = async () => {
        if (!user) return
        setIsSavingInterests(true)
        setInterestsSaveSuccess(false)
        try {
            await updateDoc(doc(db, 'users', user.uid), { interests: selectedInterests })
            setInterestsSaveSuccess(true)
            setTimeout(() => setInterestsSaveSuccess(false), 3000)
        } catch (err) {
            console.error('İlgi alanları güncellenemedi:', err)
        } finally {
            setIsSavingInterests(false)
        }
    }

    const handleSaveDiscovery = async () => {
        if (!user) return
        setIsSavingDiscovery(true)
        setDiscoverySaveSuccess(false)
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                maxDistance: distance,
                lookingFor: genderPref === 'women' ? 'female' : genderPref === 'men' ? 'male' : 'both',
                minAge: ageRange[0],
                maxAge: ageRange[1],
                locationCity: location,
                ...(locationCoords ? { locationCoords } : {})
            })
            setDiscoverySaveSuccess(true)
            setTimeout(() => setDiscoverySaveSuccess(false), 3000)
        } catch (err) {
            console.error('Keşif tercihleri güncellenemedi:', err)
        } finally {
            setIsSavingDiscovery(false)
        }
    }

    const handleSaveNotifications = async () => {
        if (!user) return
        setIsSavingNotifications(true)
        setNotificationsSaveSuccess(false)
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                notificationSettings: {
                    match: notifMatch,
                    message: notifMessage,
                    like: notifLike,
                    app: notifApp
                }
            })
            setNotificationsSaveSuccess(true)
            setTimeout(() => setNotificationsSaveSuccess(false), 3000)
        } catch (err) {
            console.error('Bildirim tercihleri güncellenemedi:', err)
        } finally {
            setIsSavingNotifications(false)
        }
    }

    const requestNotificationPermission = async () => {
        if (Capacitor.isNativePlatform()) {
            const permission = await LocalNotifications.requestPermissions()
            setNotifPermission(permission.display === 'granted' ? 'granted' : permission.display === 'denied' ? 'default' : 'default')
        } else if ('Notification' in window) {
            const permission = await Notification.requestPermission()
            setNotifPermission(permission as NotificationPermission)
        }
    }

    const handleSavePrivacy = async () => {
        if (!user) return
        setIsSavingPrivacy(true)
        setPrivacySaveSuccess(false)
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                privacySettings: {
                    showProfile,
                    showOnline,
                    showRead,
                    showDistance
                }
            })
            setPrivacySaveSuccess(true)
            setTimeout(() => setPrivacySaveSuccess(false), 3000)
        } catch (err) {
            console.error('Gizlilik tercihleri güncellenemedi:', err)
        } finally {
            setIsSavingPrivacy(false)
        }
    }

    const openAccountModal = (type: 'email' | 'password' | 'delete' | 'cache') => {
        setAccountError('')
        setAccountInput1('')
        setAccountInput2('')
        setAccountModal(type)
    }

    const handleAccountAction = async () => {
        if (!user) return
        setIsProcessingAccount(true)
        setAccountError('')
        try {
            if (accountModal === 'email') {
                if (!accountInput1) throw new Error("E-posta boş olamaz")
                await updateEmail(user, accountInput1)

            } else if (accountModal === 'password') {
                if (accountInput1.length < 6) throw new Error("Şifre en az 6 karakter olmalı")
                if (accountInput1 !== accountInput2) throw new Error("Şifreler eşleşmiyor")
                await updatePassword(user, accountInput1)

            } else if (accountModal === 'delete') {
                if (!deleteReason) throw new Error("Lütfen bir neden seçin")
                // Soft delete implementation: mark account as deleted instead of fully removing from Firebase
                const deleteDate = Date.now()
                await updateDoc(doc(db, 'users', user.uid), {
                    deletedAt: deleteDate,
                    deleteReason: deleteReason,
                    isOnline: false
                })
                await logout()
                navigate('/login')
                return
            } else if (accountModal === 'cache') {
                // Keep language preference
                const currentLang = localStorage.getItem('i18nextLng');

                localStorage.clear();
                sessionStorage.clear();

                if (currentLang) localStorage.setItem('i18nextLng', currentLang);

                // Clear Browser Cache API
                if ('caches' in window) {
                    try {
                        const cacheNames = await caches.keys();
                        await Promise.all(cacheNames.map(name => caches.delete(name)));
                    } catch (e) {
                        console.warn("Browser caches cleared with warnings", e);
                    }
                }

                showToast({ title: t('settings.success'), message: t('settings.clear_success'), type: 'success' })
                setTimeout(() => window.location.reload(), 1500)
                setAccountModal(null)
                return
            }
            setAccountModal(null)
        } catch (err: unknown) {
            const error = err as { code?: string; message?: string };
            if (error.code === 'auth/requires-recent-login') {
                setAccountError('Güvenlik nedeniyle lütfen çıkış yapıp tekrar giriş yaptıktan sonra deneyin.')
            } else {
                setAccountError(error.message || 'Bir hata oluştu.')
            }
        } finally {
            setIsProcessingAccount(false)
        }
    }

    const handleFreezeAccount = async () => {
        if (!user) return
        if (window.confirm('Hesabınızı dondurmak istediğinize emin misiniz? Dondurduğunuzda kimse sizi göremez. Tekrar giriş yapana kadar gizli kalırsınız.')) {
            await updateDoc(doc(db, 'users', user.uid), { isFrozen: true, isOnline: false })
            await logout()
            navigate('/login')
        }
    }

    const handleSendVerification = async () => {
        if (!user) return
        setVerificationLoading(true)
        try {
            await sendEmailVerification(user)
            showToast({
                title: 'Doğrulama Gönderildi',
                message: 'Lütfen spam (gereksiz) kutunuzu da kontrol edin.',
                type: 'success'
            })
        } catch (err: unknown) {
            const error = err as { code?: string; message?: string };
            if (error.code === 'auth/too-many-requests') {
                showToast({
                    title: 'Çok Fazla Deneme',
                    message: 'Zaten bir e-posta gönderildi. Lütfen biraz bekleyip tekrar deneyin.',
                    type: 'error'
                })
            } else {
                showToast({
                    title: 'Hata',
                    message: 'Bir hata oluştu: ' + error.message,
                    type: 'error'
                })
            }
        } finally {
            setVerificationLoading(false)
        }
    }

    const realPhotos = photos.filter(Boolean) as string[]

    const compressImage = (file: File, maxSize: number = 800, quality: number = 0.6): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    let { width, height } = img

                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = (height / width) * maxSize
                            width = maxSize
                        } else {
                            width = (width / height) * maxSize
                            height = maxSize
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')!
                    ctx.drawImage(img, 0, 0, width, height)
                    resolve(canvas.toDataURL('image/jpeg', quality))
                }
                img.src = e.target?.result as string
            }
            reader.readAsDataURL(file)
        })
    }

    const handleSavePhotos = async () => {
        if (!user) return
        setIsSavingPhoto(true)
        setPhotoSaveSuccess(false)
        try {
            const validPhotos = photos.filter(Boolean) as string[]
            // Save to pending photos area for review
            await updateDoc(doc(db, 'users', user.uid), { pendingPhotos: validPhotos })
            setPhotoSaveSuccess(true)
            setTimeout(() => setPhotoSaveSuccess(false), 3000)
        } catch (err) {
            console.error('Fotoğraflar kaydedilemedi:', err)
        } finally {
            setIsSavingPhoto(false)
        }
    }

    const handlePhotoUpload = (index: number) => {
        if (isProcessingPhoto || isSavingPhoto) return
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
                setIsProcessingPhoto(true) // Early UI feedback during compression
                try {
                    const compressed = await compressImage(file)
                    const newPhotos = [...photos]
                    newPhotos[index] = compressed
                    setPhotos(newPhotos)
                } finally {
                    setIsProcessingPhoto(false)
                }
            }
        }
        input.click()
    }

    const removePhoto = (index: number) => {
        if (isProcessingPhoto || isSavingPhoto) return
        const newPhotos = [...photos]
        newPhotos[index] = null
        setPhotos(newPhotos)
    }

    /* ── Sub-page renderer ── */
    const renderSubPage = () => {
        switch (activeCategory) {
            case 'profile':
                return (
                    <div className="settings-sub-content">
                        <div className="setting-field">
                            <label>{t('settings.name')}</label>
                            <input type="text" value={name} disabled className="setting-input disabled" />
                        </div>
                        <div className="setting-field">
                            <label>{t('settings.bio')}</label>
                            <textarea value={bio} onChange={e => setBio(e.target.value)} className="setting-textarea" rows={3} maxLength={300} />
                            <span className="char-count">{bio.length}/300</span>
                        </div>
                        <button
                            className="setting-update-btn profile-save-btn"
                            onClick={handleSaveBio}
                            disabled={isSavingBio || bio === userProfile?.bio}
                            style={{ alignSelf: 'flex-start', padding: '8px 24px', borderRadius: 20, background: bioSaveSuccess ? 'var(--success)' : 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s', marginTop: -10, marginBottom: 15 }}
                        >
                            {isSavingBio ? t('settings.saving') : bioSaveSuccess ? t('settings.saved') : t('settings.save')}
                        </button>
                        <div className="setting-field">
                            <label><Calendar size={14} /> {t('settings.birthdate')}</label>
                            <input type="date" value={birthDate} disabled className="setting-input disabled" />
                        </div>
                    </div>
                )

            case 'gallery': {
                const hasPhotoChanges = JSON.stringify(realPhotos) !== JSON.stringify(profilePhotos)
                return (
                    <div className="settings-sub-content">
                        <p className="sub-page-desc">{t('settings.gallery_desc')}</p>

                        {isPending && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '10px' }}>
                                    <AlertCircle size={20} />
                                    <span style={{ fontWeight: '600' }}>Fotoğraflarınız Onay Bekliyor</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                                    Resimlerinizi sadece siz görebilirsiniz, kartlarda görünmüyor. Onaylandıktan sonra görünecektir.
                                </p>
                            </div>
                        )}

                        <div className="settings-photo-grid">
                            {photos.map((photo, i) => (
                                <div key={i} className={`settings-photo-slot ${photo ? 'filled' : ''} ${isProcessingPhoto ? 'disabled' : ''}`}>
                                    {photo ? (
                                        <>
                                            <img src={photo} alt={`${t('settings.cat_gallery')} ${i + 1}`}
                                                onClick={() => !isProcessingPhoto && !isSavingPhoto && setViewingPhoto(i)}
                                                style={{ cursor: isProcessingPhoto || isSavingPhoto ? 'default' : 'pointer', opacity: isProcessingPhoto ? 0.7 : 1 }}
                                            />
                                            <button className="photo-remove-btn" onClick={() => removePhoto(i)} disabled={isProcessingPhoto || isSavingPhoto}>
                                                <Trash2 size={12} />
                                            </button>
                                            <span className="photo-num">{i + 1}</span>
                                        </>
                                    ) : (
                                        <div className="photo-add" onClick={() => handlePhotoUpload(i)} style={{ cursor: isProcessingPhoto || isSavingPhoto ? 'default' : 'pointer', opacity: isProcessingPhoto ? 0.7 : 1 }}>
                                            {isProcessingPhoto ? <Loader size={20} className="spin" /> : <Camera size={20} />}
                                            <span>{isProcessingPhoto ? t('settings.wait') : t('settings.add')}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: 24 }}>
                            <button
                                className="setting-update-btn profile-save-btn"
                                onClick={handleSavePhotos}
                                disabled={isSavingPhoto || (!hasPhotoChanges && !photoSaveSuccess)}
                                style={{ alignSelf: 'flex-start', padding: '8px 24px', borderRadius: 20, background: photoSaveSuccess ? 'var(--success)' : 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s', opacity: (hasPhotoChanges || isSavingPhoto || photoSaveSuccess) ? 1 : 0.5 }}
                            >
                                {isSavingPhoto ? t('settings.saving') : photoSaveSuccess ? t('settings.saved') : t('settings.save_gallery')}
                            </button>
                        </div>

                        {/* Photo Lightbox */}
                        <AnimatePresence>
                            {viewingPhoto !== null && (
                                <motion.div className="photo-lightbox"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    onClick={() => setViewingPhoto(null)}>
                                    <button className="lightbox-close" onClick={() => setViewingPhoto(null)}><X size={24} /></button>
                                    <div className="lightbox-counter">{viewingPhoto + 1} / {realPhotos.length}</div>
                                    {viewingPhoto > 0 && (
                                        <button className="lightbox-nav prev" onClick={e => { e.stopPropagation(); setViewingPhoto(viewingPhoto - 1) }}>
                                            <ChevronLeft size={28} />
                                        </button>
                                    )}
                                    <motion.img key={viewingPhoto} src={realPhotos[viewingPhoto]} alt=""
                                        className="lightbox-photo"
                                        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        onClick={e => e.stopPropagation()} />
                                    {viewingPhoto < realPhotos.length - 1 && (
                                        <button className="lightbox-nav next" onClick={e => { e.stopPropagation(); setViewingPhoto(viewingPhoto + 1) }}>
                                            <ChevronRight size={28} />
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )
            }

            case 'interests': {
                const intListA = [...(userProfile?.interests || [])].sort().join(',')
                const intListB = [...selectedInterests].sort().join(',')
                const hasIntChanges = intListA !== intListB
                return (
                    <div className="settings-sub-content">
                        <p className="sub-page-desc">{t('settings.interests_desc').replace('{count}', selectedInterests.length.toString())}</p>
                        <div className="interests-grid">
                            {allInterestsCols.map((item, i) => (
                                <button key={i}
                                    className={`interest-tag ${selectedInterests.includes(item.id) ? 'active' : ''}`}
                                    onClick={() => toggleInterest(item.id)}
                                    style={{ '--tag-color': item.color } as React.CSSProperties}
                                >
                                    <span>{item.id.split(' ')[0]} {t(`interests.${item.id.split(' ')[1].toLowerCase()}`)}</span>
                                </button>
                            ))}
                        </div>

                        {/* Interests Save Button */}
                        <div style={{ marginTop: 20 }}>
                            <button
                                className="setting-update-btn profile-save-btn"
                                onClick={handleSaveInterests}
                                disabled={isSavingInterests || (!hasIntChanges && !interestsSaveSuccess)}
                                style={{ alignSelf: 'flex-start', padding: '8px 24px', borderRadius: 20, background: interestsSaveSuccess ? 'var(--success)' : 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s', opacity: (hasIntChanges || isSavingInterests || interestsSaveSuccess) ? 1 : 0.5 }}
                            >
                                {isSavingInterests ? t('settings.saving') : interestsSaveSuccess ? t('settings.saved') : t('settings.save_interests')}
                            </button>
                        </div>
                    </div>
                )
            }

            case 'discovery': {
                const origLookingFor = userProfile?.lookingFor === 'female' ? 'women' : userProfile?.lookingFor === 'male' ? 'men' : 'everyone'
                const hasDiscoveryChanges = distance !== (userProfile?.maxDistance || 25) || genderPref !== origLookingFor || ageRange[0] !== (userProfile?.minAge || 18) || ageRange[1] !== (userProfile?.maxAge || 65) || location !== (userProfile?.locationCity || '')

                const handleGetLocation = async () => {
                    setLocationStatus('loading')
                    setLocation('Konum alınıyor...')

                    const reverseGeocode = async (lat: number, lng: number) => {
                        try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=tr`, {
                                headers: { 'User-Agent': 'BeMatch/1.0' }
                            })
                            const data = await res.json()
                            const city = data.address?.city || data.address?.town || data.address?.province || data.address?.state || ''
                            const country = data.address?.country || ''
                            if (city && country) return `${city}/${country}`
                            return city || country || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                        } catch {
                            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                        }
                    }

                    const tryGPS = () => new Promise<void>((resolve, reject) => {
                        if (!navigator.geolocation) { reject('no-geo'); return }
                        navigator.geolocation.getCurrentPosition(
                            async (pos) => {
                                const { latitude, longitude } = pos.coords
                                setLocationCoords({ lat: latitude, lng: longitude })
                                const name = await reverseGeocode(latitude, longitude)
                                setLocation(name)
                                setLocationStatus('success')
                                resolve()
                            },
                            () => reject('denied'),
                            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
                        )
                    })

                    const tryIP = async () => {
                        try {
                            const res = await fetch('https://ipapi.co/json/')
                            const data = await res.json()
                            if (data.latitude && data.longitude) {
                                setLocationCoords({ lat: data.latitude, lng: data.longitude })
                                const city = data.city || ''
                                const country = data.country_name || ''
                                setLocation(city && country ? `${city}/${country}` : city || country)
                                setLocationStatus('success')
                            } else {
                                throw new Error('no-ip-data')
                            }
                        } catch {
                            setLocationStatus('error')
                            setLocation('')
                        }
                    }

                    try {
                        await tryGPS()
                    } catch {
                        await tryIP()
                    }
                }

                return (
                    <div className="settings-sub-content">
                        <div className="setting-field">
                            <label>{t('settings.location')}</label>
                            <button
                                onClick={handleGetLocation}
                                disabled={locationStatus === 'loading'}
                                className="setting-input"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    cursor: locationStatus === 'loading' ? 'default' : 'pointer',
                                    background: locationStatus === 'error' ? 'rgba(230, 57, 70, 0.1)' : 'var(--surface)',
                                    color: locationStatus === 'error' ? 'var(--primary)' : 'var(--text)',
                                    textAlign: 'left',
                                    padding: '12px 16px'
                                }}
                            >
                                <span style={{ opacity: (!location && locationStatus !== 'loading') ? 0.5 : 1 }}>
                                    {locationStatus === 'loading' ? t('settings.loc_fetching') : location || t('settings.loc_auto')}
                                </span>
                                {locationStatus === 'loading' ? <Loader size={18} className="spin" /> : <Navigation size={18} color={locationStatus === 'success' ? '#10b981' : undefined} />}
                            </button>
                        </div>

                        <div className="setting-field">
                            <label>{t('settings.looking_for')}</label>
                            <div className="gender-options">
                                <button className={`gender-opt ${genderPref === 'women' ? 'active' : ''}`} onClick={() => setGenderPref('women')}>{t('settings.women')}</button>
                                <button className={`gender-opt ${genderPref === 'men' ? 'active' : ''}`} onClick={() => setGenderPref('men')}>{t('settings.men')}</button>
                                <button className={`gender-opt ${genderPref === 'everyone' ? 'active' : ''}`} onClick={() => setGenderPref('everyone')}>{t('settings.everyone')}</button>
                            </div>
                        </div>

                        <RangeSlider label={t('settings.max_dist')} value={distance} onChange={v => setDistance(v as number)} min={1} max={100} unit=" km" />
                        <RangeSlider label={t('settings.age_range')} value={ageRange} onChange={v => setAgeRange(v as [number, number])} min={18} max={65} />

                        <div className="setting-row" style={{ borderBottom: 'none', paddingBottom: 4 }}>
                            <div className="setting-row-left">
                                <Globe size={18} />
                                <span className="setting-name">{t('settings.global_mode')}</span>
                            </div>
                            <Toggle checked={globalMode} onChange={setGlobalMode} />
                        </div>

                        {/* Discovery Save Button */}
                        <div style={{ marginTop: 20 }}>
                            <button
                                className="setting-update-btn profile-save-btn"
                                onClick={handleSaveDiscovery}
                                disabled={isSavingDiscovery || (!hasDiscoveryChanges && !discoverySaveSuccess)}
                                style={{ alignSelf: 'flex-start', padding: '8px 24px', borderRadius: 20, background: discoverySaveSuccess ? 'var(--success)' : 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s', opacity: (hasDiscoveryChanges || isSavingDiscovery || discoverySaveSuccess) ? 1 : 0.5 }}
                            >
                                {isSavingDiscovery ? t('settings.saving') : discoverySaveSuccess ? t('settings.saved') : t('settings.save_discovery')}
                            </button>
                        </div>
                    </div>
                )
            }

            case 'notifications': {
                const origMatch = userProfile?.notificationSettings?.match ?? true
                const origMessage = userProfile?.notificationSettings?.message ?? true
                const origLike = userProfile?.notificationSettings?.like ?? true
                const origApp = userProfile?.notificationSettings?.app ?? false
                const hasNotificationChanges = notifMatch !== origMatch || notifMessage !== origMessage || notifLike !== origLike || notifApp !== origApp

                return (
                    <div className="settings-sub-content">
                        <div className="setting-row">
                            <div className="setting-row-left"><Heart size={18} /><span className="setting-name">{t('settings.new_match')}</span></div>
                            <Toggle checked={notifMatch} onChange={setNotifMatch} />
                        </div>
                        <div className="setting-row">
                            <div className="setting-row-left"><MessageCircle size={18} /><span className="setting-name">{t('settings.new_msg')}</span></div>
                            <Toggle checked={notifMessage} onChange={setNotifMessage} />
                        </div>
                        <div className="setting-row">
                            <div className="setting-row-left"><Sparkles size={18} /><span className="setting-name">{t('settings.likes')}</span></div>
                            <Toggle checked={notifLike} onChange={setNotifLike} />
                        </div>
                        <div className="setting-row" style={{ borderBottom: 'none' }}>
                            <div className="setting-row-left">
                                <BellOff size={18} />
                                <div>
                                    <span className="setting-name">{t('settings.app_notif')}</span>
                                    <span className="setting-sub">{t('settings.app_notif_sub')}</span>
                                </div>
                            </div>
                            <Toggle checked={notifApp} onChange={setNotifApp} />
                        </div>

                        {/* Notifications Save Button */}
                        <div style={{ marginTop: 20 }}>
                            <button
                                className="setting-update-btn profile-save-btn"
                                onClick={handleSaveNotifications}
                                disabled={isSavingNotifications || (!hasNotificationChanges && !notificationsSaveSuccess)}
                                style={{ alignSelf: 'flex-start', padding: '8px 24px', borderRadius: 20, background: notificationsSaveSuccess ? 'var(--success)' : 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s', opacity: (hasNotificationChanges || isSavingNotifications || notificationsSaveSuccess) ? 1 : 0.5 }}
                            >
                                {isSavingNotifications ? t('settings.saving') : notificationsSaveSuccess ? t('settings.saved') : t('settings.save_notif')}
                            </button>
                        </div>

                        {/* Browser Permission Panel */}
                        {notifPermission !== 'granted' && (
                            <div style={{ marginTop: 24, padding: 16, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <BellOff size={24} color="#ef4444" />
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text)' }}>{t('settings.browser_notif_off')}</h4>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('settings.browser_notif_desc')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={requestNotificationPermission}
                                    style={{ width: '100%', padding: '10px', borderRadius: 8, background: '#ef4444', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    {t('settings.allow_notif')}
                                </button>
                            </div>
                        )}
                    </div>
                )
            }

            case 'privacy': {
                const origShowProfile = userProfile?.privacySettings?.showProfile ?? true
                const origShowOnline = userProfile?.privacySettings?.showOnline ?? true
                const origShowRead = userProfile?.privacySettings?.showRead ?? true
                const origShowDistance = userProfile?.privacySettings?.showDistance ?? true
                const hasPrivacyChanges = showProfile !== origShowProfile || showOnline !== origShowOnline || showRead !== origShowRead || showDistance !== origShowDistance

                return (
                    <div className="settings-sub-content">
                        <div className="setting-row">
                            <div className="setting-row-left">
                                <Eye size={18} />
                                <div>
                                    <span className="setting-name">{t('settings.show_profile')}</span>
                                    <span className="setting-sub">{t('settings.show_profile_sub')}</span>
                                </div>
                            </div>
                            <Toggle checked={showProfile} onChange={setShowProfile} />
                        </div>
                        <div className="setting-row">
                            <div className="setting-row-left">
                                <Smartphone size={18} />
                                <div>
                                    <span className="setting-name">{t('settings.online_status')}</span>
                                    <span className="setting-sub">{t('settings.online_status_sub')}</span>
                                </div>
                            </div>
                            <Toggle checked={showOnline} onChange={setShowOnline} />
                        </div>
                        <div className="setting-row">
                            <div className="setting-row-left"><EyeOff size={18} /><span className="setting-name">{t('settings.read_receipt')}</span></div>
                            <Toggle checked={showRead} onChange={setShowRead} />
                        </div>
                        <div className="setting-row" style={{ borderBottom: 'none' }}>
                            <div className="setting-row-left"><MapPin size={18} /><span className="setting-name">{t('settings.dist_info')}</span></div>
                            <Toggle checked={showDistance} onChange={setShowDistance} />
                        </div>

                        {/* Privacy Save Button */}
                        <div style={{ marginTop: 20 }}>
                            <button
                                className="setting-update-btn profile-save-btn"
                                onClick={handleSavePrivacy}
                                disabled={isSavingPrivacy || (!hasPrivacyChanges && !privacySaveSuccess)}
                                style={{ alignSelf: 'flex-start', padding: '8px 24px', borderRadius: 20, background: privacySaveSuccess ? 'var(--success)' : 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s', opacity: (hasPrivacyChanges || isSavingPrivacy || privacySaveSuccess) ? 1 : 0.5 }}
                            >
                                {isSavingPrivacy ? t('settings.saving') : privacySaveSuccess ? t('settings.saved') : t('settings.save_privacy')}
                            </button>
                        </div>
                    </div>
                )
            }

            case 'premium':
                return (
                    <div className="settings-sub-content">
                        <div className="premium-hero">
                            <div className="premium-hero-icon"><Crown size={36} /></div>
                            <h3>BeMatch Gold</h3>
                            <p>{t('settings.premium_desc')}</p>
                        </div>
                        <div className="premium-features-list">
                            <div className="pf-item"><Sparkles size={16} /> {t('settings.pf_likes')}</div>
                            <div className="pf-item"><Eye size={16} /> {t('settings.pf_see')}</div>
                            <div className="pf-item"><SlidersHorizontal size={16} /> {t('settings.pf_filter')}</div>
                            <div className="pf-item"><Ruler size={16} /> {t('settings.pf_boost')}</div>
                            <div className="pf-item"><Shield size={16} /> {t('settings.pf_adfree')}</div>
                            <div className="pf-item"><Zap size={16} /> {t('settings.pf_undo')}</div>
                        </div>
                        <button className="settings-premium-btn" onClick={() => navigate('/premium')}><Crown size={16} /> {t('settings.upgrade')}</button>
                    </div>
                )

            case 'wallet': {
                const sub = userProfile?.subscription;
                const isActive = sub?.status === 'active';
                const expiryDate = sub?.expiryDate ? new Date(sub.expiryDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

                return (
                    <div className="settings-sub-content">
                        <div className="wallet-card" style={{
                            background: isActive ? 'linear-gradient(135deg, #fbbf24, #d97706)' : '#27272a',
                            padding: '24px',
                            borderRadius: '20px',
                            color: isActive ? '#000' : '#fff',
                            marginBottom: '24px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {isActive && <Crown size={64} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1, transform: 'rotate(-15deg)' }} />}
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 8px 0' }}>{isActive ? sub?.planName : 'Paket Yok'}</h2>
                            <p style={{ opacity: 0.8, fontSize: '0.9rem', margin: 0 }}>{isActive ? 'Aboneliğiniz Aktif' : 'Şu an aktif bir paketiniz bulunmuyor'}</p>

                            {isActive && expiryDate && (
                                <div style={{ marginTop: '24px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ opacity: 0.7 }}>Yenilenme / Bitiş</span>
                                        <span style={{ fontWeight: '700' }}>{expiryDate}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!isActive && (
                            <div className="wallet-offer" style={{ padding: '20px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '16px', border: '1px dashed #fbbf24', marginBottom: '24px' }}>
                                <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#fbbf24', fontWeight: '600' }}>Hemen Gold'a Geç!</p>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.4 }}>
                                    Eşleşme şansını 10 kata kadar artırmak ve seni kimlerin beğendiğini görmek için bir paket seç.
                                </p>
                                <button
                                    onClick={() => navigate('/premium')}
                                    style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '12px', background: '#fbbf24', color: '#000', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    Paketleri İncele
                                </button>
                            </div>
                        )}

                        <div className="transaction-history">
                            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: '#fff' }}>Hızlı Sayılar</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ background: '#171717', padding: '16px', borderRadius: '16px' }}>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Süper Beğeni</span>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>{isActive ? 'Sınırsız' : '5 Adet'}</span>
                                </div>
                                <div style={{ background: '#171717', padding: '16px', borderRadius: '16px' }}>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Boost</span>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>{isActive ? 'Sınırsız' : '0 Adet'}</span>
                                </div>
                            </div>
                        </div>

                        {isActive && (
                            <button
                                onClick={handleCancelSubscription}
                                disabled={isCancelling}
                                style={{
                                    width: '100%',
                                    marginTop: '32px',
                                    padding: '14px',
                                    borderRadius: '16px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isCancelling ? <Loader className="spin" size={18} /> : <XCircle size={18} />}
                                Üyeliği İptal Et
                            </button>
                        )}
                    </div>
                )
            }

            case 'system':
                return (
                    <div className="settings-sub-content">
                        <div className="setting-row">
                            <div className="setting-row-left">
                                <Languages size={18} />
                                <div>
                                    <span className="setting-name">{t('settings.app_lang')}</span>
                                    <span className="setting-sub">{i18n.language?.split('-')[0] === 'tr' ? 'Türkçe' : i18n.language?.split('-')[0] === 'de' ? 'Deutsch' : 'English'}</span>
                                </div>
                            </div>
                            <div className="language-selector">
                                <select
                                    value={i18n.language?.split('-')[0] || 'tr'}
                                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        color: '#fff',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    <option value="tr" style={{ background: '#1e293b', color: '#fff' }}>🇹🇷 Türkçe</option>
                                    <option value="en" style={{ background: '#1e293b', color: '#fff' }}>🇬🇧 English</option>
                                    <option value="de" style={{ background: '#1e293b', color: '#fff' }}>🇩🇪 Deutsch</option>
                                </select>
                            </div>
                        </div>

                        <div className="setting-row" style={{ borderBottom: 'none' }}>
                            <div className="setting-row-left">
                                <HardDrive size={18} />
                                <div>
                                    <span className="setting-name">{t('settings.storage')}</span>
                                    <span className="setting-sub">{t('settings.storage_sub')}</span>
                                </div>
                            </div>
                            <button
                                className="clear-cache-btn"
                                onClick={() => openAccountModal('cache')}
                                style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                            >
                                {t('settings.clear')}
                            </button>
                        </div>
                    </div>
                )

            case 'account':
                return (
                    <div className="settings-sub-content">
                        {user && !user.emailVerified && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '10px' }}>
                                    <AlertCircle size={20} />
                                    <span style={{ fontWeight: '600' }}>{t('settings.verify_email')}</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '15px' }}>
                                    {t('settings.verify_desc')}
                                </p>
                                <button
                                    onClick={handleSendVerification}
                                    disabled={verificationLoading}
                                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', width: '100%' }}
                                >
                                    {verificationLoading ? t('settings.sending') : t('settings.send_verify')}
                                </button>
                            </div>
                        )}

                        <button className="setting-row clickable" onClick={() => openAccountModal('email')}>
                            <div className="setting-row-left">
                                <Mail size={18} />
                                <div>
                                    <span className="setting-name">{t('settings.change_email')}</span>
                                    <span className="setting-sub">{user?.email || t('settings.not_specified')}</span>
                                </div>
                            </div>
                            <ChevronRight size={18} className="row-arrow" />
                        </button>
                        <button className="setting-row clickable" onClick={() => openAccountModal('password')}>
                            <div className="setting-row-left"><Key size={18} /><span className="setting-name">{t('settings.change_pwd')}</span></div>
                            <ChevronRight size={18} className="row-arrow" />
                        </button>
                        <div className="account-danger" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button className="danger-btn" onClick={handleFreezeAccount} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                                <Pause size={18} /> {t('settings.freeze_acc')}
                            </button>
                            <button className="danger-btn delete" onClick={() => openAccountModal('delete')} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                                <Trash2 size={18} /> {t('settings.delete_acc')}
                            </button>
                        </div>

                        <button className="logout-btn" onClick={async () => { await logout(); navigate('/login') }} style={{ marginTop: '20px', width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <LogOut size={18} /> {t('settings.logout')}
                        </button>
                    </div>
                )

            default:
                return null
        }
    }

    const activeCat = categories.find(c => c.id === activeCategory)

    return (
        <div className="settings-page">
            {/* Header */}
            <div className="settings-header">
                <button className="settings-back" onClick={() => activeCategory ? setActiveCategory(null) : navigate('/profile')}>
                    <ArrowLeft size={22} />
                </button>
                <h1 className="settings-title">{activeCategory ? activeCat?.label : 'Ayarlar'}</h1>
                <div style={{ width: 40 }} />
            </div>

            {/* Content — Category List or Sub Page */}
            <AnimatePresence mode="wait">
                {!activeCategory ? (
                    <motion.div className="settings-scroll" key="categories"
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}>
                        <div className="category-list">
                            {categories.map((cat, i) => (
                                <motion.button key={cat.id} className="category-item"
                                    initial={{ y: 15, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => {
                                        if (cat.id === 'premium') {
                                            navigate('/premium')
                                        } else {
                                            setActiveCategory(cat.id)
                                        }
                                    }}>
                                    <div className="category-icon" style={{ color: cat.color, background: `${cat.color}20` }}>
                                        {cat.icon}
                                    </div>
                                    <div className="category-info">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="category-name">{cat.label}</span>
                                            {cat.id === 'account' && user && !user.emailVerified && (
                                                <AlertCircle size={16} color="#ef4444" />
                                            )}
                                            {cat.id === 'gallery' && isPending && (
                                                <AlertCircle size={16} color="#ef4444" />
                                            )}
                                        </div>
                                        <span className="category-desc">{cat.desc}</span>
                                    </div>
                                    <ChevronRight className="category-arrow" size={20} />
                                </motion.button>
                            ))}
                        </div>

                        <p className="settings-version">BeMatch v1.0.0</p>
                        <div style={{ height: 20 }} />
                    </motion.div>
                ) : (
                    <motion.div className="settings-scroll" key={activeCategory}
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}>
                        {renderSubPage()}
                        <div style={{ height: 40 }} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Account Settings Modals */}
            <AnimatePresence>
                {accountModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setAccountModal(null)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {accountModal === 'delete' ? <Trash2 color="#ef4444" /> : accountModal === 'cache' ? <HardDrive color="#ef4444" /> : <Lock color="var(--primary)" />}
                                {accountModal === 'email' ? t('settings.new_email') :
                                    accountModal === 'password' ? t('settings.change_pwd') :
                                        accountModal === 'cache' ? t('settings.clear_confirm') :
                                            t('settings.del_modal_title')}
                            </h3>

                            {accountError && (
                                <div style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px' }}>
                                    {accountError}
                                </div>
                            )}

                            {accountModal === 'email' && (
                                <input type="email" value={accountInput1} onChange={e => setAccountInput1(e.target.value)} placeholder={t('settings.new_email')} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginBottom: '15px' }} />
                            )}

                            {accountModal === 'password' && (
                                <>
                                    <input type="password" value={accountInput1} onChange={e => setAccountInput1(e.target.value)} placeholder={t('settings.new_pwd')} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginBottom: '10px' }} />
                                    <input type="password" value={accountInput2} onChange={e => setAccountInput2(e.target.value)} placeholder={t('settings.new_pwd_confirm')} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginBottom: '15px' }} />
                                </>
                            )}

                            {accountModal === 'delete' && (
                                <>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
                                        {t('settings.del_warn')}
                                    </p>
                                    <label style={{ color: '#fff', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>{t('settings.leave_reason')}</label>
                                    <select
                                        value={deleteReason}
                                        onChange={e => setDeleteReason(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginBottom: '20px' }}
                                    >
                                        <option value="" style={{ background: '#1e293b', color: '#fff' }}>{t('settings.reason_select')}</option>
                                        <option value="not_useful" style={{ background: '#1e293b', color: '#fff' }}>{t('settings.reason_no_match')}</option>
                                        <option value="met_someone" style={{ background: '#1e293b', color: '#fff' }}>{t('settings.reason_met')}</option>
                                        <option value="too_many_bugs" style={{ background: '#1e293b', color: '#fff' }}>{t('settings.reason_bugs')}</option>
                                        <option value="privacy" style={{ background: '#1e293b', color: '#fff' }}>{t('settings.reason_privacy')}</option>
                                        <option value="other" style={{ background: '#1e293b', color: '#fff' }}>{t('settings.reason_other')}</option>
                                    </select>
                                </>
                            )}

                            {accountModal === 'cache' && (
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
                                    Bu işlem cihazınızdaki tüm geçici dosyaları, uygulama verilerini ve gereksiz önbelleği temizleyecektir. İşlemden sonra uygulamanın daha performanslı çalışması beklenir. <br /><br /><strong>Uygulama yeniden başlatılacaktır. Onaylıyor musunuz?</strong>
                                </p>
                            )}

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setAccountModal(null)} disabled={isProcessingAccount} style={{ padding: '10px 16px', borderRadius: '8px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>{t('settings.cancel')}</button>
                                <button onClick={handleAccountAction} disabled={isProcessingAccount} style={{ padding: '10px 20px', borderRadius: '8px', background: accountModal === 'delete' ? '#ef4444' : 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    {isProcessingAccount && <Loader size={16} className="spin" />}
                                    {t('settings.confirm')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
