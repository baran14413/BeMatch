import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import AdminModal, { type ModalType } from '../../components/AdminModal';
import {
    Search, Ban, ShieldCheck, Clock, Loader, AlertTriangle, UserCheck
} from 'lucide-react';
import '../../components/Admin.css';

interface BannedUser {
    id: string;
    firstName: string;
    email: string;
    photoURL?: string;
    ip?: string;
    banReason: string;
    bannedAt: number;
    bannedIp: boolean;
    locationCity: string;
}

export default function AdminBanCenter() {
    const [searchTerm, setSearchTerm] = useState('');
    const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
    const [loading, setLoading] = useState(true);

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: ModalType;
        iconType: 'danger' | 'warning' | 'info' | 'success';
        actionId: string;
        actionTarget: string;
    }>({
        isOpen: false, title: '', message: '', type: 'confirm', iconType: 'warning', actionId: '', actionTarget: ''
    });

    const closeAdminModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    useEffect(() => {
        // isBanned == true olanları getir
        const q = query(collection(db, 'users'), where('isBanned', '==', true));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded: BannedUser[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                loaded.push({
                    id: doc.id,
                    firstName: data.firstName || 'İsimsiz',
                    email: data.email || 'Bilinmiyor',
                    photoURL: data.photos && data.photos.length > 0 ? data.photos[0] : undefined,
                    ip: data.ip || 'Bilinmiyor',
                    banReason: data.banReason || 'Belirtilmedi',
                    bannedAt: data.bannedAt || Date.now(),
                    bannedIp: data.bannedIp || false,
                    locationCity: data.locationCity || 'Bilinmiyor'
                });
            });

            loaded.sort((a, b) => b.bannedAt - a.bannedAt);
            setBannedUsers(loaded);
            setLoading(false);
        }, (err) => {
            console.error("Banlı kullanıcılar getirilemedi:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const executeUnbanUser = async (userId: string) => {
        closeAdminModal();
        const tid = toast.loading('Kullanıcının banı kaldırılıyor...');
        try {
            await updateDoc(doc(db, 'users', userId), {
                isBanned: false,
                status: 'Active',
                banReason: null,
                bannedAt: null,
                bannedIp: false
            });

            // --- AUDIT LOG ---
            const { logAdminAction } = await import('../../utils/auditLogger');
            await logAdminAction('UNBAN_USER', userId, 'Admin tarafından ban kaldırıldı');

            toast.success('Kullanıcının banı başarıyla kaldırıldı!', { id: tid });
        } catch {
            toast.error("İşlem sırasında bir hata oluştu.", { id: tid });
        }
    };

    const handleUnbanUser = (userId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Ban Yasağını Kaldır',
            message: 'Bu kullanıcının sistem erişim yasağını kaldırmak üzeresiniz. Tekrar uygulamayı kullanabilecek. Onaylıyor musunuz?',
            type: 'confirm', iconType: 'success', actionId: 'unban', actionTarget: userId
        });
    };

    const handleModalConfirm = () => {
        if (modalConfig.actionId === 'unban') executeUnbanUser(modalConfig.actionTarget);
    };

    const formatTimeLocal = (timestamp: number) => {
        if (!timestamp) return 'Bilinmiyor';
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Az önce';
        if (minutes < 60) return `${minutes} dk önce`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} saat önce`;
        const days = Math.floor(hours / 24);
        return `${days} gün önce`;
    };

    const filteredUsers = bannedUsers.filter(u =>
        u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.ip && u.ip.includes(searchTerm))
    );

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Ban size={24} color="#ef4444" /> Ban Merkezi (Kara Liste)
                    </h1>
                    <p className="admin-page-subtitle">Sistemden uzaklaştırılan kullanıcıların listesi ve yönetim alanı.</p>
                </div>
            </div>

            <div className="admin-card" style={{ padding: '24px' }}>
                {/* Search Bar */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} color="var(--god-text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            className="admin-input"
                            placeholder="İsim, Email veya IP Adresi ile ara..."
                            style={{ width: '100%', paddingLeft: '48px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Data Grid */}
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--god-text-muted)' }}>
                        <Loader className="spin" size={32} style={{ marginBottom: '16px' }} />
                        <p>Kara liste taranıyor...</p>
                    </div>
                ) : bannedUsers.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--god-text-muted)' }}>
                        <ShieldCheck size={48} color="#10b981" style={{ margin: '0 auto 16px', opacity: 0.8 }} />
                        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>Kara liste tertemiz!</p>
                        <p>Şu anda sistemden banlanmış hiçbir kullanıcı bulunmuyor.</p>
                    </div>
                ) : (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', minWidth: '240px' }}>KULLANICI BİLGİSİ</th>
                                    <th style={{ textAlign: 'left', minWidth: '200px' }}>BAN SEBEBİ</th>
                                    <th style={{ textAlign: 'left', minWidth: '150px' }}>BAN BİLGİLERİ</th>
                                    <th style={{ textAlign: 'right', whiteSpace: 'nowrap', minWidth: '120px' }}>İŞLEM</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user, i) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                {user.photoURL ? (
                                                    <img src={user.photoURL} alt="Avatar" className="admin-avatar-mini" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(239, 68, 68, 0.5)', filter: 'grayscale(1)' }} />
                                                ) : (
                                                    <div className="admin-avatar-mini" style={{ width: '44px', height: '44px', fontSize: '1.2rem', borderColor: '#ef4444', color: '#ef4444' }}>{user.firstName[0]?.toUpperCase() || '?'}</div>
                                                )}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1rem', color: '#ef4444' }}>
                                                        {user.firstName}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--god-text-muted)', fontFamily: 'monospace' }}>{user.email || user.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--god-text)' }}>
                                                <AlertTriangle size={16} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
                                                <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{user.banReason}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {user.bannedIp ? (
                                                    <span className="admin-badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', width: 'fit-content' }}>CİHAZ VE IP BANI</span>
                                                ) : (
                                                    <span className="admin-badge" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', width: 'fit-content' }}>STANDART HESAP BANI</span>
                                                )}

                                                <div style={{ fontSize: '0.75rem', color: 'var(--god-text-muted)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    IP: {user.ip || 'Bilinmiyor'}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--god-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} /> {formatTimeLocal(user.bannedAt)}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                className="admin-btn-surface tooltip-trigger"
                                                style={{ padding: '8px 16px', borderRadius: '8px', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}
                                                onClick={() => handleUnbanUser(user.id)}
                                            >
                                                <UserCheck size={16} /> Affet (Ban Kaldır)
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AdminModal
                isOpen={modalConfig.isOpen}
                onCancel={closeAdminModal}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                iconType={modalConfig.iconType}
                onConfirm={handleModalConfirm}
                suggestedResponses={[]}
            />
        </div>
    );
}
