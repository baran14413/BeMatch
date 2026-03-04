import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useToast } from '../../context/ToastContext';
import '../../components/Admin.css';

interface PendingUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    pendingPhotos: string[];
}

export default function AdminMedia() {
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { showToast } = useToast();

    const fetchPendingMedia = async () => {
        setLoading(true);
        try {
            const usersRef = collection(db, 'users');
            // Optimally this would be a query, but Firestore array queries for specifically non-empty
            // arrays without a specific known value are tricky. Fetching all and filtering client side.
            // For a highly scaling app, we would keep a separate "pending_media_queue" collection.
            const snapshot = await getDocs(usersRef);
            const usersWithPending: PendingUser[] = [];

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (data.pendingPhotos && Array.isArray(data.pendingPhotos) && data.pendingPhotos.length > 0) {
                    usersWithPending.push({
                        id: docSnap.id,
                        firstName: data.firstName || 'İsimsiz',
                        lastName: data.lastName || '',
                        email: data.email || '',
                        pendingPhotos: data.pendingPhotos,
                    });
                }
            });

            setPendingUsers(usersWithPending);
        } catch (error) {
            console.error("Bekleyen medya çekilirken hata:", error);
            showToast({
                title: "Hata",
                message: "Medya listesi yüklenemedi.",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingMedia();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleApprove = async (userId: string, pendingPhotos: string[]) => {
        setProcessingId(userId);
        try {
            const userRef = doc(db, 'users', userId);
            // Move pendingPhotos to photos, and clear pendingPhotos
            await updateDoc(userRef, {
                photos: pendingPhotos,
                pendingPhotos: []
            });

            setPendingUsers(prev => prev.filter(u => u.id !== userId));
            showToast({
                title: "Başarılı",
                message: "Fotoğraflar onaylandı ve yayına alındı.",
                type: "success"
            });
        } catch (error) {
            console.error("Onaylama hatası:", error);
            showToast({
                title: "Hata",
                message: "Fotoğraflar onaylanamadı.",
                type: "error"
            });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (userId: string) => {
        setProcessingId(userId);
        try {
            const userRef = doc(db, 'users', userId);
            // Just clear pendingPhotos, leave actual photos alone (if they had old ones)
            await updateDoc(userRef, {
                pendingPhotos: []
            });

            setPendingUsers(prev => prev.filter(u => u.id !== userId));
            showToast({
                title: "Reddedildi",
                message: "Bekleyen fotoğraflar silindi.",
                type: "success"
            });
        } catch (error) {
            console.error("Reddetme hatası:", error);
            showToast({
                title: "Hata",
                message: "İşlem başarısız oldu.",
                type: "error"
            });
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="admin-reports-container">
            <div className="admin-page-header">
                <div>
                    <h2>Medya Onay Havuzu</h2>
                    <p style={{ color: 'var(--god-text-muted)' }}>Kullanıcıların yüklediği, onay bekleyen profil fotoğrafları.</p>
                </div>
                <button
                    onClick={fetchPendingMedia}
                    className="admin-btn-surface"
                    disabled={loading}
                >
                    {loading ? <Loader2 size={16} className="spin" /> : "Yenile"}
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center', opacity: 0.5 }}>
                    <Loader2 size={40} className="spin" color="var(--primary)" />
                </div>
            ) : pendingUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--god-surface-dim)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <ImageIcon size={48} color="var(--god-text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Onay Bekleyen Fotoğraf Yok</h3>
                    <p style={{ color: 'var(--god-text-muted)', fontSize: '0.9rem' }}>Harika! Tüm kullanıcı fotoğrafları incelenmiş.</p>
                </div>
            ) : (
                <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    <AnimatePresence>
                        {pendingUsers.map(user => (
                            <motion.div
                                key={user.id}
                                className="report-card"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                                style={{ background: 'var(--god-surface-dim)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                            >
                                <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--god-surface-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                        {user.firstName[0]?.toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {user.firstName} {user.lastName}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--god-text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {user.email}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '16px', flex: 1, background: 'rgba(0,0,0,0.3)' }}>
                                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                                        {user.pendingPhotos.map((photo, index) => (
                                            <div key={index} style={{ width: '120px', height: '160px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', background: 'var(--god-surface-medium)' }}>
                                                <img
                                                    src={photo}
                                                    alt={`Pending ${index + 1}`}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    loading="lazy"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', padding: '12px', gap: '12px', background: 'var(--god-surface-light)' }}>
                                    <button
                                        onClick={() => handleReject(user.id)}
                                        disabled={processingId === user.id}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: '600', cursor: processingId === user.id ? 'not-allowed' : 'pointer' }}
                                    >
                                        <X size={16} /> Reddet
                                    </button>
                                    <button
                                        onClick={() => handleApprove(user.id, user.pendingPhotos)}
                                        disabled={processingId === user.id}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', background: '#10b981', color: 'white', border: 'none', fontWeight: '600', cursor: processingId === user.id ? 'not-allowed' : 'pointer' }}
                                    >
                                        <Check size={16} /> Onayla
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
