import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Info, AlertTriangle, Star, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AnnouncementPopup() {
    const [announcement, setAnnouncement] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch active announcements
        const q = query(
            collection(db, 'announcements'),
            where('isActive', '==', true)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                // Sort by priority and date on client side to avoid missing index errors
                const allActive = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
                allActive.sort((a, b) => {
                    if (b.priority !== a.priority) return (b.priority || 0) - (a.priority || 0);
                    return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
                });

                const data = allActive[0];

                // Check if user has already seen THIS specific announcement forever (localStorage vs sessionStorage)
                const seenId = localStorage.getItem('lastSeenAnnouncement');
                if (seenId !== data.id) {
                    setAnnouncement(data);
                    // Use a small delay to make it feel organic
                    setTimeout(() => setIsOpen(true), 1500);
                }
            } else {
                setAnnouncement(null);
                setIsOpen(false);
            }
        });

        return () => unsub();
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        if (announcement) {
            localStorage.setItem('lastSeenAnnouncement', announcement.id);
        }
    };

    if (!announcement) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        zIndex: 99999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(8px)'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        style={{
                            maxWidth: '450px',
                            width: '100%',
                            backgroundColor: '#1a1a1a',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                        }}
                    >
                        {/* Header Image or Icon */}
                        {announcement.imageUrl ? (
                            <div style={{ width: '100%', height: '200px', position: 'relative' }}>
                                <img
                                    src={announcement.imageUrl}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'linear-gradient(to bottom, transparent 50%, #1a1a1a)'
                                }} />
                                <button
                                    onClick={handleClose}
                                    style={{
                                        position: 'absolute', top: '12px', right: '12px',
                                        background: 'rgba(0,0,0,0.5)', color: '#fff',
                                        border: 'none', borderRadius: '50%', padding: '8px',
                                        cursor: 'pointer', backdropFilter: 'blur(4px)'
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        ) : (
                            <div style={{ padding: '24px 24px 0 24px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={handleClose}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)', color: '#999',
                                        border: 'none', borderRadius: '50%', padding: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        )}

                        <div style={{ padding: '24px', textAlign: 'center' }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                padding: '6px 12px', borderRadius: '20px',
                                background: announcement.type === 'promo' ? 'rgba(255, 215, 0, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                color: announcement.type === 'promo' ? '#ffd700' : '#3b82f6',
                                fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px',
                                marginBottom: '16px'
                            }}>
                                {announcement.type === 'promo' && <Star size={12} fill="currentColor" />}
                                {announcement.type === 'warning' && <AlertTriangle size={12} />}
                                {announcement.type === 'update' && <RefreshCw size={12} />}
                                {announcement.type === 'info' && <Info size={12} />}
                                {announcement.type.toUpperCase()}
                            </div>

                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', margin: '0 0 12px 0' }}>
                                {announcement.title}
                            </h2>
                            <p style={{ fontSize: '0.95rem', color: '#aaa', lineHeight: '1.6', margin: '0 0 24px 0' }}>
                                {announcement.body}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {announcement.buttonLink ? (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleClose();
                                            if (announcement.buttonLink.startsWith('http')) {
                                                window.open(announcement.buttonLink, '_blank');
                                            } else {
                                                navigate(announcement.buttonLink);
                                            }
                                        }}
                                        style={{
                                            padding: '16px', background: 'var(--primary-gradient)',
                                            color: '#fff', borderRadius: '16px', fontWeight: 'bold', border: 'none',
                                            textDecoration: 'none', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', gap: '8px', cursor: 'pointer',
                                            boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.4)'
                                        }}
                                    >
                                        {announcement.buttonText || 'Hemen İncele'}
                                        <ExternalLink size={18} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleClose}
                                        style={{
                                            padding: '16px', background: 'var(--primary-gradient)',
                                            color: '#fff', border: 'none', borderRadius: '16px',
                                            fontWeight: 'bold', cursor: 'pointer',
                                            boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.4)'
                                        }}
                                    >
                                        {announcement.buttonText || 'Tamam'}
                                    </button>
                                )}
                                <button
                                    onClick={handleClose}
                                    style={{
                                        padding: '12px', background: 'transparent',
                                        color: '#666', border: 'none', fontSize: '0.85rem'
                                    }}
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
