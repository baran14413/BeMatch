import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ImagePlus, X, AlertTriangle } from 'lucide-react'
import { collection, doc, addDoc, setDoc, onSnapshot, increment, getDoc, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { useAuth } from '../context/AuthContext'
import './Report.css'

export default function Report() {
    const { id: chatId } = useParams()
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()

    const [targetName, setTargetName] = useState('Kullanıcı')
    const [targetId, setTargetId] = useState('')
    const [reason, setReason] = useState('')
    const [description, setDescription] = useState('')
    const [photos, setPhotos] = useState<File[]>([])
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [toastMsg, setToastMsg] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!chatId || !currentUser) return

        const unsubChat = onSnapshot(doc(db, 'chats', chatId), (chatSnap) => {
            if (chatSnap.exists()) {
                const data = chatSnap.data()
                const otherParticipantId = data.participants.find((pid: string) => pid !== currentUser.uid)
                if (otherParticipantId) {
                    setTargetId(otherParticipantId)
                    // fetch their name
                    onSnapshot(doc(db, 'users', otherParticipantId), (userSnap) => {
                        if (userSnap.exists()) {
                            setTargetName(userSnap.data().firstName || 'Kullanıcı')
                        }
                    })
                }
            }
        })
        return () => unsubChat()
    }, [chatId, currentUser])

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        const remainingSlots = 3 - photos.length
        const selectedFiles = files.slice(0, remainingSlots)

        const newPhotos = [...photos, ...selectedFiles]
        setPhotos(newPhotos)

        // Read previews
        selectedFiles.forEach(file => {
            const reader = new FileReader()
            reader.onload = () => {
                setPhotoPreviews(prev => [...prev, reader.result as string])
            }
            reader.readAsDataURL(file)
        })

        // reset input
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index))
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
    }

    const submitReport = async () => {
        if (!targetId || !currentUser) return
        if (!reason) {
            setToastMsg("Lütfen şikayet sebebini seçin.")
            return
        }

        setIsSubmitting(true)
        try {
            const photoUrls: string[] = []

            // Upload all photos
            for (let i = 0; i < photos.length; i++) {
                const file = photos[i]
                const sRef = storageRef(storage, `reports/${Date.now()}_${file.name}`)
                const snapshot = await uploadBytes(sRef, file)
                const url = await getDownloadURL(snapshot.ref)
                photoUrls.push(url)
            }

            // Fetch full context for admin panel
            const reporterDoc = await getDoc(doc(db, 'users', currentUser.uid))
            const reportedDoc = await getDoc(doc(db, 'users', targetId))

            const reporterData = reporterDoc.exists() ? reporterDoc.data() : null
            const reportedData = reportedDoc.exists() ? reportedDoc.data() : null

            const reasonObj = reportReasons.find(r => r.id === reason)
            const reasonText = reasonObj ? reasonObj.label : reason

            await addDoc(collection(db, 'reports'), {
                reporterId: currentUser.uid,
                reporterName: reporterData ? `${reporterData.firstName} ${reporterData.lastName || ''}`.trim() : 'Bilinmeyen',
                reporterPhoto: reporterData?.photos?.[0] || '',

                reportedId: targetId,
                reportedName: reportedData ? `${reportedData.firstName} ${reportedData.lastName || ''}`.trim() : 'Bilinmeyen',
                reportedPhoto: reportedData?.photos?.[0] || '',

                chatId: chatId || null,
                reason: reason,
                reasonText: reasonText,
                description,
                screenshotUrls: photoUrls,
                createdAt: new Date().getTime(),
                status: 'pending'
            })

            // Penalty for reported user: -50 ELO, +1 Report
            try {
                await updateDoc(doc(db, 'users', targetId), {
                    eloScore: increment(-50),
                    reportCount: increment(1)
                })
            } catch (ignore) { }

            // Send Automated System Messages
            const sendSystemMessage = async (userId: string, messageText: string) => {
                const sysChatId = `system_${userId}`
                const chatRef = doc(db, 'chats', sysChatId)
                const nowTime = new Date().getTime()

                await setDoc(chatRef, {
                    participants: ['system', userId],
                    updatedAt: nowTime,
                    lastMessage: messageText,
                    [`unreadCount_${userId}`]: increment(1)
                }, { merge: true })

                await addDoc(collection(db, `chats/${sysChatId}/messages`), {
                    type: 'text',
                    content: messageText,
                    senderId: 'system',
                    createdAt: nowTime,
                    status: 'sent'
                })
            }

            const reporterMsg = "Şikayet talebiniz alınmıştır. Bize yardımcı olduğunuz için teşekkürler."
            const reportedMsg = "Hesabınız şikayet edildi, lütfen topluluk kurallarımıza dikkat edin. 3 şikayetten sonra hesabınız askıya alınır."

            await sendSystemMessage(currentUser.uid, reporterMsg)
            await sendSystemMessage(targetId, reportedMsg)

            // Navigate back cleanly
            navigate(`/chat/${chatId}`, { replace: true })

            // Optional: Delay could be added for visual feedback if we kept user on page,
            // but returning them to chat immediately is better UX.
        } catch (err) {
            console.error("Şikayet gönderilemedi:", err)
            setToastMsg("Şikayet sırasında bir hata oluştu.")
            setIsSubmitting(false)
        }
    }

    const reportReasons = [
        { id: 'taciz', label: 'Taciz / Rahatsız Edici Davranış' },
        { id: 'kufur', label: 'Küfür / Hakaret' },
        { id: 'spam', label: 'Spam / Sahte Hesap' },
        { id: 'dolandiricilik', label: 'Dolandırıcılık' },
        { id: 'uygunsuz_icerik', label: 'Uygunsuz İçerik (Fotoğraf/Mesaj)' },
        { id: 'diger', label: 'Diğer' }
    ]

    return (
        <div className="report-container">
            <div className="report-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={28} />
                </button>
                <h2>Şikayet Et</h2>
                <div style={{ width: 28 }} />
            </div>

            <div className="report-content">
                <div className="report-warning">
                    <AlertTriangle size={20} className="warning-icon" />
                    <p>
                        <b>{targetName}</b> adlı kullanıcıyı incelenmesi için ekibimize bildiriyorsunuz. Asılsız şikayetler hesabınızın askıya alınmasına sebep olabilir.
                    </p>
                </div>

                <div className="report-section">
                    <h3>Şikayet Nedeni <span className="required">*</span></h3>
                    <div className="reason-grid">
                        {reportReasons.map(r => (
                            <button
                                key={r.id}
                                className={`reason-btn ${reason === r.id ? 'active' : ''}`}
                                onClick={() => setReason(r.id)}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="report-section">
                    <h3>Ekran Görüntüsü / Kanıt <span>(En fazla 3 adet)</span></h3>
                    <p className="section-hint">Görüşme geçmişini gösteren ekran görüntüleri şikayetinizi daha hızlı çözmemize yardımcı olur.</p>

                    <div className="photos-grid">
                        {photoPreviews.map((preview, idx) => (
                            <motion.div
                                key={idx}
                                className="photo-preview-item"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <img src={preview} alt="Ekran görüntüsü" />
                                <button className="remove-photo" onClick={() => removePhoto(idx)}>
                                    <X size={14} />
                                </button>
                            </motion.div>
                        ))}

                        {photos.length < 3 && (
                            <button className="add-photo-btn" onClick={() => fileInputRef.current?.click()}>
                                <ImagePlus size={24} />
                                <span>Görsel Ekle</span>
                            </button>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handlePhotoSelect}
                        />
                    </div>
                </div>

                <div className="report-section">
                    <h3>Ek Açıklama <span>(İsteğe bağlı)</span></h3>
                    <textarea
                        className="report-textarea"
                        placeholder="Durumu daha detaylı açıklamak ister misiniz?"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        maxLength={500}
                    />
                    <div className="char-count">{description.length}/500</div>
                </div>
            </div>

            <div className="report-footer">
                <button
                    className={`submit-report-btn ${reason && !isSubmitting ? 'active' : ''}`}
                    onClick={submitReport}
                    disabled={!reason || isSubmitting}
                >
                    {isSubmitting ? 'Gönderiliyor...' : 'Şikayeti Gönder'}
                </button>
            </div>

            {/* Toast Notification */}
            <AnimatePresence>
                {toastMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="report-toast"
                    >
                        {toastMsg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
