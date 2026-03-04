import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminModal from '../../components/AdminModal';
import type { ModalType } from '../../components/AdminModal';
import {
    Search, Star, MapPin, Clock, Loader, Eye, ZapOff
} from 'lucide-react';
import '../../components/Admin.css';

function formatDistanceToNowLocal(timestamp: number) {
    if (!timestamp) return 'Bilinmiyor';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} saat önce`;
    const days = Math.floor(hours / 24);
    return `${days} gün önce`;
}

interface AdminPremiumUser {
    id: string;
    firstName: string;
    age: number;
    locationCity: string;
    gender: string;
    lastActive: number;
    isPremium: boolean;
    premiumPlan: string;
    email: string;
    photoURL?: string;
    ip?: string;
    lastActiveString?: string;
}

export default function AdminPremiumUsers() {
    const navigate = useNavigate();
    const { impersonate } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<AdminPremiumUser[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: ModalType;
        iconType: 'danger' | 'warning' | 'info' | 'success';
        actionId: string;
        actionTarget: string;
        suggestedResponses?: string[];
    }>({
        isOpen: false, title: '', message: '', type: 'confirm', iconType: 'warning', actionId: '', actionTarget: '', suggestedResponses: []
    });

    const closeAdminModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    useEffect(() => {
        // Query only users with isPremium == true
        const q = query(collection(db, 'users'), where('isPremium', '==', true));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedUsers: AdminPremiumUser[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();

                loadedUsers.push({
                    id: doc.id,
                    firstName: data.firstName || 'İsimsiz',
                    age: data.age || 0,
                    locationCity: data.locationCity || 'Bilinmiyor',
                    gender: data.gender || '',
                    lastActive: data.lastActive || Date.now(),
                    isPremium: data.isPremium || false,
                    premiumPlan: data.premiumPlan || 'Premium',
                    email: data.email || 'Bilinmiyor',
                    photoURL: data.photos && data.photos.length > 0 ? data.photos[0] : undefined,
                    ip: data.ip || 'Bilinmiyor',
                    lastActiveString: formatDistanceToNowLocal(data.lastActive || Date.now())
                });
            });

            // Sort by last active manually since we used 'where' on isPremium
            loadedUsers.sort((a, b) => b.lastActive - a.lastActive);

            setUsers(loadedUsers);
            setLoading(false);
        }, (err) => {
            console.error("Premium kullanıcılar getirilemedi:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const executeRevokePremium = async (userId: string) => {
        closeAdminModal();
        const tid = toast.loading('Premium üyelik iptal ediliyor...');
        try {
            await updateDoc(doc(db, 'users', userId), {
                isPremium: false,
                premiumPlan: 'İptal Edildi',
                subscription: {
                    status: 'expired',
                    planId: 'none',
                    expiryDate: Date.now()
                }
            });
            toast.success('Kullanıcının premium üyeliği iptal edildi.', { id: tid });
        } catch {
            toast.error('İşlem sırasında hata oluştu.', { id: tid });
        }
    };

    const handleRevokePremium = (userId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Premium Üyeliği İptal Et',
            message: 'Bu kullanıcının Premium ayrıcalıklarını kaldırmak ve normal üyeye düşürmek istediğinize emin misiniz?',
            type: 'confirm', iconType: 'danger', actionId: 'revokePremium', actionTarget: userId
        });
    };

    const executeChangePackage = async (userId: string, planSelection: string) => {
        closeAdminModal();
        if (!planSelection.trim()) { toast.error("Paket seçimi iptal edildi."); return; }

        let finalPlanId = planSelection;
        const match = planSelection.match(/\(([^)]+)\)/);
        if (match && match[1]) {
            finalPlanId = match[1];
        }

        const tid = toast.loading('Paket güncelleniyor...');
        try {
            const days = finalPlanId.includes('weekly') ? 7 : finalPlanId.includes('monthly') ? 30 : 365;
            const expiryDate = Date.now() + (days * 24 * 60 * 60 * 1000);

            await updateDoc(doc(db, 'users', userId), {
                premiumPlan: finalPlanId,
                isPremium: true,
                subscription: {
                    planId: finalPlanId,
                    planName: finalPlanId.includes('weekly') ? 'Haftalık' : finalPlanId.includes('monthly') ? 'Aylık' : 'Yıllık',
                    status: 'active',
                    expiryDate: expiryDate,
                    period: finalPlanId.includes('weekly') ? 'haftalık' : finalPlanId.includes('monthly') ? 'aylık' : 'yıllık'
                }
            });
            toast.success(`Paket başarıyla ${finalPlanId} olarak değiştirildi!`, { id: tid });
        } catch {
            toast.error("Paket güncellenirken hata oluştu.", { id: tid });
        }
    };

    const handleChangePackage = (userId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Premium Paketini Değiştir',
            message: 'Kullanıcının mevcut Premium paketini değiştirmek için yeni bir paket seçin:',
            type: 'prompt', iconType: 'success', actionId: 'changePackage', actionTarget: userId,
            suggestedResponses: [
                "Haftalık (gold-weekly)",
                "Aylık (gold-monthly)",
                "Yıllık (gold-yearly)"
            ]
        });
    };

    const handleAccessAccount = (userId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Hesaba Eriş (Onay)',
            message: 'Bu kullanıcının hesabına giriş yapmak üzeresiniz. İşlemleriniz loglanacaktır. Onaylıyor musunuz?',
            type: 'confirm', iconType: 'warning', actionId: 'impersonate', actionTarget: userId
        });
    };

    const executeAccessAccount = async (userId: string) => {
        closeAdminModal();
        const tid = toast.loading('Kullanıcı hesabına giriş yapılıyor...');
        try {
            if (impersonate) {
                await impersonate(userId);
                toast.success('Hesaba erişim sağlandı.', { id: tid });
                navigate('/home');
            } else {
                toast.error('İşlem desteklenmiyor!', { id: tid });
            }
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(`Erişim reddedildi: ${err.message}`, { id: tid });
        }
    };

    const handleModalConfirm = (inputValue?: string) => {
        if (modalConfig.actionId === 'revokePremium') executeRevokePremium(modalConfig.actionTarget);
        else if (modalConfig.actionId === 'changePackage') executeChangePackage(modalConfig.actionTarget, inputValue || '');
        else if (modalConfig.actionId === 'impersonate') executeAccessAccount(modalConfig.actionTarget);
    };

    const filteredUsers = users.filter(u =>
        u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Star size={24} color="#eab308" /> Premium (Gold) Üyeler
                    </h1>
                    <p className="admin-page-subtitle">Sistemdeki ayrıcalıklı hesaba sahip tüm kullanıcıları buradan yönetin.</p>
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
                            placeholder="İsim, Email veya UUID ile ara..."
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
                        <p>Premium üyeler getiriliyor...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--god-text-muted)' }}>
                        <p>Henüz aktif bir Premium üye bulunmuyor.</p>
                    </div>
                ) : (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', minWidth: '240px' }}>VIP KULLANICI</th>
                                    <th style={{ textAlign: 'left', minWidth: '150px' }}>KONUM & AKTİVİTE</th>
                                    <th style={{ textAlign: 'left', minWidth: '160px' }}>GÜNCEL PAKET</th>
                                    <th style={{ textAlign: 'right', whiteSpace: 'nowrap', minWidth: '120px' }}>İŞLEMLER</th>
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
                                                    <img src={user.photoURL} alt="Avatar" className="admin-avatar-mini" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #eab308' }} />
                                                ) : (
                                                    <div className="admin-avatar-mini" style={{ width: '44px', height: '44px', fontSize: '1.2rem', borderColor: '#eab308', color: '#eab308' }}>{user.firstName[0]?.toUpperCase() || '?'}</div>
                                                )}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1rem', color: '#eab308' }}>
                                                        {user.firstName}, {user.age}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--god-text-muted)', fontFamily: 'monospace' }}>{user.email || user.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--god-text-muted)', fontSize: '0.75rem' }}>
                                                <MapPin size={14} /> {user.locationCity}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--god-text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                                                <Clock size={14} /> Son görülme: {user.lastActiveString}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="admin-badge admin-badge-gold">
                                                <Star size={12} />
                                                {user.premiumPlan === 'gold-weekly' || user.premiumPlan === 'weekly' ? 'Haftalık Premium' :
                                                    user.premiumPlan === 'gold-monthly' || user.premiumPlan === 'monthly' ? 'Aylık Premium' :
                                                        user.premiumPlan === 'gold-yearly' || user.premiumPlan === 'yearly' ? 'Yıllık Premium' : user.premiumPlan}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                                                {/* Premium İptal */}
                                                <button
                                                    className="admin-btn-danger tooltip-trigger"
                                                    style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--god-red)' }}
                                                    title="Premium'u İptal Et (Normal Üye Yap)"
                                                    onClick={() => handleRevokePremium(user.id)}
                                                >
                                                    <ZapOff size={16} />
                                                </button>

                                                {/* Paket Değiştir */}
                                                <button
                                                    className="admin-btn-surface tooltip-trigger"
                                                    style={{ padding: '8px', borderRadius: '8px', color: '#eab308' }}
                                                    title="Paketi Değiştir/Yenile"
                                                    onClick={() => handleChangePackage(user.id)}
                                                >
                                                    <Star size={16} />
                                                </button>

                                                {/* Hesaba Eriş */}
                                                <button
                                                    className="admin-btn-surface tooltip-trigger"
                                                    style={{ padding: '8px', borderRadius: '8px', color: 'var(--god-brand)' }}
                                                    title="Hesaba Eriş / Denetle"
                                                    onClick={() => handleAccessAccount(user.id)}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
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
                suggestedResponses={modalConfig.suggestedResponses}
            />
        </div>
    );
}
