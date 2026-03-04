import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    type User
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, onSnapshot, collection, writeBatch, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { ref as rtdbRef, onValue, onDisconnect, set as rtdbSet } from 'firebase/database'
import { auth, db, storage, rtdb } from '../firebase'
import i18n from '../i18n'

/* ── Types ── */
interface UserProfile {
    uid: string
    firstName: string
    lastName: string
    email: string
    birthDate: string
    gender: string
    lookingFor: string
    interests: string[]
    photos: string[]
    locationCity: string
    locationCoords: { lat: number; lng: number } | null
    countryCode?: string
    likedUsers?: string[]
    passedUsers?: string[]
    maxDistance: number
    createdAt: number
    isOnline?: boolean
    lastSeen?: number
    bio?: string
    job?: string
    school?: string
    profileViews?: number
    minAge?: number
    maxAge?: number
    notificationSettings?: {
        match: boolean
        message: boolean
        like: boolean
        app: boolean
    }
    privacySettings?: {
        showProfile: boolean
        showOnline: boolean
        showRead: boolean
        showDistance: boolean
    }
    role?: 'user' | 'admin' | 'moderator' | 'mod_reports' | 'mod_users' | 'mod_finance' | 'mod_marketing' | 'mod_config'
    deletedAt?: number
    deleteReason?: string
    isDeleted?: boolean
    bannedAt?: number
    banReason?: string
    ip?: string
    pendingPhotos?: string[]
}

interface AuthContextType {
    user: User | null
    userProfile: UserProfile | null
    loading: boolean
    login: (email: string, password: string) => Promise<boolean>
    register: (email: string, password: string, profile: Omit<UserProfile, 'uid' | 'createdAt'>) => Promise<void>
    logout: () => Promise<void>
    impersonate?: (userId: string) => Promise<void>
    stopImpersonating?: () => void
    isImpersonating?: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

/* ── Provider ── */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [actualUser, setActualUser] = useState<User | null>(null)
    const [actualUserProfile, setActualUserProfile] = useState<UserProfile | null>(null)

    // Impersonation state
    const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null)
    const [impersonatedProfile, setImpersonatedProfile] = useState<UserProfile | null>(null)

    const [loading, setLoading] = useState(true)

    // Listen to auth state
    useEffect(() => {
        let visibilityListener: () => void
        let unloadListener: () => void
        let profileUnsub: () => void
        let notifsUnsub: () => void = () => { }

        const unsub = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
            setActualUser(firebaseUser)

            // Clean up previous listeners if they exist
            if (visibilityListener) document.removeEventListener('visibilitychange', visibilityListener)
            if (unloadListener) window.removeEventListener('beforeunload', unloadListener)
            if (profileUnsub) profileUnsub()
            notifsUnsub()

            if (firebaseUser) {
                // Listen to profile from Firestore realtime
                profileUnsub = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data() as UserProfile;
                        if (data.isDeleted) {
                            // Admin soft-deleted the profile
                            console.warn("Profil pasife çekilmiş, oturum kapatılıyor.");
                            signOut(auth).catch(() => { });
                        } else {
                            setActualUserProfile(data)
                        }
                    } else {
                        // Admin hard-deleted the profile
                        console.warn("Profil veritabanından tamamen silinmiş, oturum kapatılıyor.");
                        signOut(auth).catch(() => { });
                    }
                    setLoading(false)
                }, (error) => {
                    console.error('Profile snapshot error:', error)
                    setLoading(false)
                })

                // Request Native Browser or Device Notification Permission
                if (Capacitor.isNativePlatform()) {
                    LocalNotifications.requestPermissions().catch(console.error)
                } else if ('Notification' in window && Notification.permission === 'default') {
                    Notification.requestPermission()
                }

                // Listen to notifications
                notifsUnsub = onSnapshot(collection(db, `users/${firebaseUser.uid}/notifications`), (snap) => {
                    snap.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            const data = change.doc.data()
                            if (!data.read) {
                                if (Capacitor.isNativePlatform()) {
                                    LocalNotifications.checkPermissions().then((perm) => {
                                        if (perm.display === 'granted') {
                                            LocalNotifications.schedule({
                                                notifications: [{
                                                    title: data.title || 'BeMatch',
                                                    body: data.body || 'Yeni bildiriminiz var.',
                                                    id: Math.floor(Math.random() * 1000000), // Secure 32-bit int, prevents Java crash
                                                    extra: { link: data.link }
                                                }]
                                            })
                                        }
                                    }).catch(console.error)
                                } else if ('Notification' in window && Notification.permission === 'granted') {
                                    const notif = new Notification(data.title || 'BeMatch', {
                                        body: data.body || 'Yeni bildiriminiz var.',
                                        icon: data.avatar || '/vite.svg'
                                    })
                                    notif.onclick = () => {
                                        window.focus()
                                        if (data.link) {
                                            window.location.href = data.link
                                        }
                                    }
                                }
                                // Mark natively consumed
                                updateDoc(doc(db, `users/${firebaseUser.uid}/notifications`, change.doc.id), {
                                    read: true
                                }).catch(() => { })
                            }
                        }
                    })
                })

                // Mark as online immediately in Firestore (for immediate UI updates)
                // We use setDoc with merge:true because the document might not exist yet during registration
                await setDoc(doc(db, 'users', firebaseUser.uid), {
                    isOnline: true,
                    lastSeen: Date.now()
                }, { merge: true }).catch((err) => {
                    if (err.code !== 'permission-denied') {
                        console.error('Initial online status update failed:', err)
                    }
                })

                // Setup Realtime Database Presence tracking (Highly Reliable)
                // Listen to Realtime Database for online status presence
                const userStatusRTDBRef = rtdbRef(rtdb, `/status/${firebaseUser.uid}`)
                const rtdbUnsub = onValue(rtdbRef(rtdb, '.info/connected'), (snap) => {
                    if (snap.val() === false) {
                        return
                    }

                    // When connection is established:
                    // 1. Setup onDisconnect hook (runs ON SERVER when connection closes, so it's 100% reliable)
                    onDisconnect(userStatusRTDBRef).set({
                        isOnline: false,
                        lastSeen: serverTimestamp()
                    }).then(() => {
                        // 2. Set ourselves as online in RTDB
                        rtdbSet(userStatusRTDBRef, {
                            isOnline: true,
                            lastSeen: serverTimestamp()
                        })
                    })
                })

                // We also keep a simple visibility listener to update Firestore for immediate responsiveness
                // when they background the app, but RTDB handles the hard crashes/closes.
                visibilityListener = () => {
                    if (document.visibilityState === 'hidden') {
                        // Immediately mark offline in both stores when app is backgrounded/hidden
                        const offlineTime = Date.now();
                        updateDoc(doc(db, 'users', firebaseUser.uid), {
                            isOnline: false,
                            lastSeen: offlineTime,
                            lastActive: offlineTime
                        }).catch(() => { })
                        rtdbSet(userStatusRTDBRef, { isOnline: false, lastSeen: serverTimestamp() })
                    } else {
                        // Immediately mark online when app is focused/visible
                        const onlineTime = Date.now();
                        updateDoc(doc(db, 'users', firebaseUser.uid), {
                            isOnline: true,
                            lastSeen: onlineTime,
                            lastActive: onlineTime
                        }).catch(() => { })
                        rtdbSet(userStatusRTDBRef, { isOnline: true, lastSeen: serverTimestamp() })
                    }
                }

                document.addEventListener('visibilitychange', visibilityListener)

                // Add pagehide listener for immediate offline status when tab is closed or navigated away
                const pageHideListener = () => {
                    rtdbSet(userStatusRTDBRef, { isOnline: false, lastSeen: serverTimestamp() })
                }
                window.addEventListener('pagehide', pageHideListener)

                // We need to clean up the RTDB listener on unmount/auth change
                unloadListener = () => {
                    // Cleanup function for our hook array
                    rtdbUnsub()
                    window.removeEventListener('pagehide', pageHideListener)
                }
            } else {
                setActualUserProfile(null)
                setLoading(false)
            }
        })

        return () => {
            unsub()
            if (visibilityListener) document.removeEventListener('visibilitychange', visibilityListener)
            if (unloadListener) window.removeEventListener('beforeunload', unloadListener)
            if (profileUnsub) profileUnsub()
            if (notifsUnsub) notifsUnsub()
        }
    }, [])

    // Login
    const login = async (email: string, password: string): Promise<boolean> => {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        const userDocRef = doc(db, 'users', cred.user.uid)
        const userDoc = await getDoc(userDocRef)
        const data = userDoc.data()

        if (!data) {
            // User exists in Auth but not in Firestore, treat as corrupted/deleted
            await signOut(auth)
            throw new Error("Hesabınız sistemden kalıcı olarak silinmiştir.")
        }

        if (data.isDeleted) {
            // User is banned/deleted by Admin
            await auth.signOut()
            throw new Error("Hesabınız yönetim tarafından kalıcı olarak silinmiş ve platformdan uzaklaştırılmıştır.")
        }

        return true
    }

    // Register — uploads photos to Storage, saves URLs to Firestore
    const register = async (email: string, password: string, profile: Omit<UserProfile, 'uid' | 'createdAt' | 'email' | 'ip'>) => {
        let uid: string

        // Try creating user — if already exists (partial failure), sign in instead
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password)
            uid = cred.user.uid
        } catch (err: any) {
            if (err?.code === 'auth/email-already-in-use') {
                // If account exists, try to sign in to see if we can complete registration
                try {
                    const cred = await signInWithEmailAndPassword(auth, email, password)
                    uid = cred.user.uid
                    // Check if profile already exists
                    const existing = await getDoc(doc(db, 'users', uid))
                    if (existing.exists()) {
                        setActualUserProfile(existing.data() as UserProfile)
                        return // Already fully registered
                    }
                } catch (innerErr: any) {
                    // If sign-in fails (e.g. wrong password), throw the original "email-already-in-use"
                    // so the UI can show the correct message.
                    throw err
                }
            } else {
                throw err
            }
        }

        // Upload photos to Firebase Storage (with fallback)
        const photoURLs: string[] = []
        for (let i = 0; i < profile.photos.length; i++) {
            const photoData = profile.photos[i]
            if (photoData.startsWith('data:')) {
                try {
                    const res = await fetch(photoData)
                    const blob = await res.blob()
                    const fileRef = ref(storage, `users/${uid}/photos/photo_${i}.jpg`)
                    await uploadBytes(fileRef, blob)
                    const url = await getDownloadURL(fileRef)
                    photoURLs.push(url)
                } catch (storageErr) {
                    console.warn(`Photo ${i} upload failed, saving as base64:`, storageErr)
                    photoURLs.push(photoData) // Fallback to base64
                }
            } else {
                photoURLs.push(photoData)
            }
        }

        // Fetch IP
        let ip = 'Bilinmiyor';
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            if (ipData && ipData.ip) ip = ipData.ip;
        } catch (e) {
            console.warn("IP alınamadı:", e);
        }

        const fullProfile: UserProfile = {
            ...profile,
            photos: [], // Start with empty photos
            pendingPhotos: photoURLs, // Save to pending
            uid,
            email, // Track email in Firestore too
            ip, // Track IP
            createdAt: Date.now(),
            role: 'user'
        }
        // Save to Firestore
        await setDoc(doc(db, 'users', uid), fullProfile)

        // Give the user a welcome chat from 'system' (Optional: we can just let triggerAutoMessages handle it, but it's good to have the chat created immediately)
        const batch = writeBatch(db)
        const chatId = [uid, 'system'].sort().join('_')
        const chatRef = doc(db, 'chats', chatId)

        batch.set(chatRef, {
            participants: [uid, 'system'],
            lastMessage: i18n.t('system_msg.last_msg'),
            lastMessageTime: Date.now(),
            [`unreadCount_${uid}`]: 0,
            [`unreadCount_system`]: 0
        })

        await batch.commit()

        // Trigger dynamic WELCOME messages from admin panel
        try {
            const { triggerAutoMessages } = await import('../utils/autoMessages')
            await triggerAutoMessages('WELCOME', uid)
        } catch (err) {
            console.error("Otomatik karşılama mesajları tetiklenemedi:", err)
        }

        setActualUserProfile(fullProfile)
    }

    // Logout
    const logout = async () => {
        if (actualUser) {
            try {
                await updateDoc(doc(db, 'users', actualUser.uid), {
                    isOnline: false,
                    lastSeen: Date.now()
                })
            } catch (err) {
                console.error("Failed to update status on logout:", err)
            }
        }
        await signOut(auth)
        setActualUserProfile(null)
        setImpersonatedUserId(null)
        setImpersonatedProfile(null)
    }

    // Impersonation feature allowing admins to view the app as another user
    const impersonate = async (userId: string) => {
        setLoading(true)
        try {
            const snap = await getDoc(doc(db, 'users', userId))
            if (snap.exists()) {
                setImpersonatedProfile(snap.data() as UserProfile)
                setImpersonatedUserId(userId)
            }
        } catch (err) {
            console.error("Impersonation failed:", err)
        }
        setLoading(false)
    }

    const stopImpersonating = () => {
        setImpersonatedUserId(null)
        setImpersonatedProfile(null)
    }

    // Resolve the exposed active session (spoofed if impersonating)
    const contextUser = impersonatedUserId && actualUser
        ? Object.assign({}, actualUser, { uid: impersonatedUserId }) as unknown as User
        : actualUser

    const contextProfile = impersonatedUserId ? impersonatedProfile : actualUserProfile

    const value: AuthContextType = {
        user: contextUser,
        userProfile: contextProfile,
        loading,
        login,
        register,
        logout,
        impersonate,
        stopImpersonating,
        isImpersonating: !!impersonatedUserId
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

/* ── Hook ── */
export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
