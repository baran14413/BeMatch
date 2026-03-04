import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search, Star,
    MapPin, Clock, CheckCircle,
    Loader, Trash2, Eye, AlertTriangle, Shield
} from 'lucide-react';
import '../../components/Admin.css';
import {
    collection, onSnapshot, query, orderBy, limit, doc,
    updateDoc, setDoc, addDoc, increment, getDocs, where, deleteDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import AdminModal, { type ModalType } from '../../components/AdminModal';

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

interface AdminUser {
    id: string;
    firstName: string;
    age: number;
    locationCity: string;
    gender: string;
    status: 'Active' | 'Shadowbanned' | 'Timeout' | 'Banned';
    elo: number;
    reports: number;
    lastActive: number;
    isOnline: boolean;
    isPremium: boolean;
    premiumPlan: string;
    email: string;
    photoURL?: string;
    ip?: string;
    role: 'user' | 'moderator' | 'admin' | 'mod_reports' | 'mod_users' | 'mod_finance' | 'mod_marketing' | 'mod_config';
}

export default function AdminUsers() {
    const navigate = useNavigate();
    const { impersonate } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<AdminUser[]>([]);
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
        // Build a basic query to get recent users
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedUsers: AdminUser[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();

                // Fallback TTL (Time-to-Live): if DB says online but lastActive is too old (> 3 mins), treat as offline.
                const now = Date.now();
                const lastActiveTime = data.lastActive || now;
                const isActuallyOnline = data.isOnline && (now - lastActiveTime < 180000); // 3 minutes TTL

                loadedUsers.push({
                    id: doc.id,
                    firstName: data.firstName || 'İsimsiz',
                    age: data.age || 0,
                    locationCity: data.locationCity || 'Bilinmiyor',
                    gender: data.gender || '',
                    status: data.isBanned || data.isDeleted ? 'Banned' : data.isShadowbanned ? 'Shadowbanned' : 'Active',
                    elo: data.eloScore || 500,
                    reports: data.reportCount || 0,
                    lastActive: lastActiveTime,
                    isOnline: isActuallyOnline,
                    isPremium: data.isPremium || false,
                    premiumPlan: data.premiumPlan || 'Premium',
                    email: data.email || 'Bilinmiyor',
                    photoURL: data.photos && data.photos.length > 0 ? data.photos[0] : undefined,
                    ip: data.ip || 'Bilinmiyor',
                    role: data.role || 'user'
                });
            });
            setUsers(loadedUsers);
            setLoading(false);
        }, (err) => {
            console.error("Kullanıcılar getirilemedi:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const executeDelete = async (userId: string) => {
        closeAdminModal();
        const tid = toast.loading('Kullanıcı siliniyor...');
        try {
            // 1. Delete user's matches
            try {
                const matchQuery1 = query(collection(db, 'matches'), where('user1Id', '==', userId));
                const matchQuery2 = query(collection(db, 'matches'), where('user2Id', '==', userId));
                const [mq1Snap, mq2Snap] = await Promise.all([getDocs(matchQuery1), getDocs(matchQuery2)]);

                const deletePromises: Promise<void>[] = [];
                mq1Snap.forEach(snapDoc => deletePromises.push(deleteDoc(snapDoc.ref)));
                mq2Snap.forEach(snapDoc => deletePromises.push(deleteDoc(snapDoc.ref)));
                await Promise.all(deletePromises);
            } catch (e) {
                console.warn("Eşleşmeler silinemedi:", e);
            }

            // 2. Delete user's chats
            try {
                const chatQuery = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
                const chatSnap = await getDocs(chatQuery);
                const chatDeletePromises: Promise<void>[] = [];
                chatSnap.forEach(snapDoc => chatDeletePromises.push(deleteDoc(snapDoc.ref)));
                await Promise.all(chatDeletePromises);
            } catch (e) {
                console.warn("Sohbetler silinemedi:", e);
            }

            // 3. User doc
            let fullDeleteSuccess = false;
            try {
                await deleteDoc(doc(db, 'users', userId));
                fullDeleteSuccess = true;
            } catch {
                await updateDoc(doc(db, 'users', userId), {
                    isDeleted: true,
                    deletedAt: new Date().getTime(),
                    status: 'Banned'
                });
            }

            if (fullDeleteSuccess) {
                toast.success('Kullanıcı başarıyla SİLİNDİ.', { id: tid });
            } else {
                toast.success('Kullanıcı PASİFE ÇEKİLDİ (Tam yetki eksik)', { id: tid });
            }
        } catch {
            toast.error('İşlem sırasında hata oluştu.', { id: tid });
        }
    };

    const handleDeleteProfile = (userId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Kullanıcıyı Sil',
            message: 'Bu işlem kullanıcının tüm verilerini KALICI OLARAK silecektir. Geri alınamaz. Emin misiniz?',
            type: 'confirm', iconType: 'danger', actionId: 'delete', actionTarget: userId
        });
    };

    const executeAccessAccount = async (userId: string) => {
        closeAdminModal();
        const tid = toast.loading('Hesaba bağlanılıyor...');
        try {
            await impersonate!(userId);
            toast.success('Bağlantı başarılı. Yönlendiriliyorsunuz...', { id: tid });
            navigate('/home');
        } catch {
            toast.error('Giriş yapılamadı.', { id: tid });
        }
    };

    const handleAccessAccount = (userId: string) => {
        if (!impersonate) {
            toast.error("Hesaba erişim modülü şu an aktif değil.");
            return;
        }
        setModalConfig({
            isOpen: true,
            title: 'Hesaba Erişim (Impersonation)',
            message: `DİKKAT! Bu kullanıcının hesabına giriş yapmak üzeresiniz. Yapacağınız tüm eylemler bu kullanıcının profilinde işlenecektir.`,
            type: 'confirm', iconType: 'warning', actionId: 'impersonate', actionTarget: userId
        });
    };

    const executeWarnUser = async (userId: string, warningText: string) => {
        closeAdminModal();
        if (!warningText.trim()) { toast.error("Uyarı mesajı boş olamaz."); return; }

        const tid = toast.loading('Sistem uyarısı gönderiliyor...');
        try {
            const sysChatId = `system_${userId}`;
            const chatRef = doc(db, 'chats', sysChatId);
            const nowTime = new Date().getTime();

            await setDoc(chatRef, {
                participants: ['system', userId],
                updatedAt: nowTime,
                lastMessage: warningText,
                [`unreadCount_${userId}`]: increment(1)
            }, { merge: true });

            await addDoc(collection(db, `chats/${sysChatId}/messages`), {
                type: 'text',
                content: warningText,
                senderId: 'system',
                createdAt: nowTime,
                status: 'sent'
            });

            await updateDoc(doc(db, 'users', userId), { eloScore: increment(-10) }).catch(() => { });

            toast.success("Uyarı gönderildi! ELO puanı düşürüldü.", { id: tid });
        } catch {
            toast.error("Mesaj gönderilirken bir hata oluştu.", { id: tid });
        }
    };

    const handleWarnUser = (userId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Sistem Uyarısı Gönder',
            message: 'Bu kullanıcıya resmi sistem uyarısı göndermek üzeresiniz. Bu işlem aynı zamanda kullanıcının ELO puanını (-10) düşürecektir.',
            type: 'prompt', iconType: 'info', actionId: 'warn', actionTarget: userId,
            suggestedResponses: [
                "Topluluk kurallarımıza uymayan mesajlar tespit edildi. Lütfen üslubunuza dikkat edin.",
                "Profil fotoğrafınız yönergelerimize uygun değil. Lütfen güncelleyin.",
                "Spam veya rahatsız edici davranışlar nedeniyle şikayet edildiniz.",
                "Bu son uyarıdır. İhlalin devamı halinde hesabınız kapatılacaktır."
            ]
        });
    };

    const executeGivePremium = async (userId: string, planSelection: string) => {
        closeAdminModal();
        if (!planSelection.trim()) { toast.error("Paket seçimi iptal edildi."); return; }

        let finalPlanId = planSelection;
        const match = planSelection.match(/\(([^)]+)\)/);
        if (match && match[1]) {
            finalPlanId = match[1];
        }

        const tid = toast.loading('Kullanıcıya Premium tanımlanıyor...');
        try {
            // Calculate expiry (30 days default if not specified)
            const days = finalPlanId.includes('weekly') ? 7 : finalPlanId.includes('monthly') ? 30 : 365;
            const expiryDate = Date.now() + (days * 24 * 60 * 60 * 1000);

            // 1. Update User Document (Both legacy and new structure)
            await updateDoc(doc(db, 'users', userId), {
                isPremium: true,
                premiumPlan: finalPlanId,
                subscription: {
                    planId: finalPlanId,
                    planName: finalPlanId.includes('weekly') ? 'Haftalık' : finalPlanId.includes('monthly') ? 'Aylık' : 'Yıllık',
                    status: 'active',
                    expiryDate: expiryDate,
                    period: finalPlanId.includes('weekly') ? 'haftalık' : finalPlanId.includes('monthly') ? 'aylık' : 'yıllık'
                }
            });

            // 2. Send System Notification
            await addDoc(collection(db, `users/${userId}/notifications`), {
                title: 'Premium Aktif Edildi! 👑',
                body: 'Tebrikler! Premium üyeliğiniz yönetim tarafından aktif edildi. Tüm özelliklerin tadını çıkarın!',
                type: 'premium_activated',
                read: false,
                createdAt: serverTimestamp()
            });

            // 3. Send System Chat Message
            const sysChatId = `system_${userId}`;
            const welcomeMsg = "Tebrikler! Premium üyeliğiniz aktif edildi. BeMatch Gold ayrıcalıklı özelliklerin tadını çıkarın! 👑✨";

            await setDoc(doc(db, 'chats', sysChatId), {
                participants: ['system', userId],
                updatedAt: Date.now(),
                lastMessage: welcomeMsg,
                [`unreadCount_${userId}`]: increment(1)
            }, { merge: true });

            await addDoc(collection(db, `chats/${sysChatId}/messages`), {
                type: 'text',
                content: welcomeMsg,
                senderId: 'system',
                createdAt: Date.now(),
                status: 'sent'
            });

            toast.success(`${finalPlanId} paketi başarıyla tanımlandı!`, { id: tid });
        } catch (error) {
            console.error("Premium error:", error);
            toast.error("Premium tanımlanırken bir hata oluştu.", { id: tid });
        }
    };

    const handleGivePremium = (userId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Premium Paket Tanımla',
            message: 'Bu kullanıcıya anında Premium özellikler tanımlamak üzeresiniz. Lütfen listeden bir paket onaylayın:',
            type: 'prompt', iconType: 'success', actionId: 'givePremium', actionTarget: userId,
            suggestedResponses: [
                "Haftalık (gold-weekly)",
                "Aylık (gold-monthly)",
                "Yıllık (gold-yearly)"
            ]
        });
    };

    const executeAssignRole = async (userId: string, roleSelection: string) => {
        closeAdminModal();
        if (!roleSelection.trim()) { toast.error("Rol seçimi iptal edildi."); return; }

        let roleValue = 'user';
        if (roleSelection.includes('mod_reports')) roleValue = 'mod_reports';
        else if (roleSelection.includes('mod_users')) roleValue = 'mod_users';
        else if (roleSelection.includes('mod_finance')) roleValue = 'mod_finance';
        else if (roleSelection.includes('mod_marketing')) roleValue = 'mod_marketing';
        else if (roleSelection.includes('mod_config')) roleValue = 'mod_config';
        else if (roleSelection.includes('moderator')) roleValue = 'moderator'; // legacy support
        if (roleSelection.includes('admin')) roleValue = 'admin';

        const tid = toast.loading('Kullanıcı rolü güncelleniyor...');
        try {
            await updateDoc(doc(db, 'users', userId), { role: roleValue });
            toast.success(`Kullanıcı rolü başarıyla değiştirildi!`, { id: tid });
        } catch {
            toast.error("Rol atanırken bir hata oluştu.", { id: tid });
        }
    };

    const handleAssignRole = (userId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Kullanıcı Rolü Ata',
            message: 'Kullanıcının platformdaki yetki seviyesini belirleyin:',
            type: 'prompt', iconType: 'warning', actionId: 'assignRole', actionTarget: userId,
            suggestedResponses: [
                "Standart Kullanıcı (user)",
                "Güvenlik Moderatörü (mod_reports)",
                "Müşteri Temsilcisi (mod_users)",
                "Finans Uzmanı (mod_finance)",
                "Pazarlama Ekibi (mod_marketing)",
                "Sistem Mühendisi (mod_config)",
                "Yönetici (admin)"
            ]
        });
    };

    const executeBanUser = async (userId: string, banReasonData: string) => {
        closeAdminModal();
        if (!banReasonData.trim()) { toast.error("Ban sebebi girilmedi."); return; }

        let banType = 'Hesap Banı';
        let reason = banReasonData;
        const match = banReasonData.match(/^\[(Device|Account)\]/);
        let includeIp = false;

        if (match) {
            includeIp = match[1] === 'Device';
            reason = banReasonData.replace(/^\[.*?\]\s*/, '');
            banType = includeIp ? 'Cihaz ve Hesap Banı' : 'Hesap Banı';
        }

        const tid = toast.loading(`${banType} uygulanıyor...`);
        try {
            await updateDoc(doc(db, 'users', userId), {
                isBanned: true,
                status: 'Banned',
                banReason: reason,
                bannedAt: new Date().getTime(),
                bannedIp: includeIp
            });
            toast.success(`Kullanıcı başarıyla banlandı! Sebep: ${reason}`, { id: tid });
        } catch {
            toast.error("Ban atılırken bir hata oluştu.", { id: tid });
        }
    };

    const handleBanUser = (userId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Kullanıcıyı Banla',
            message: 'Bu kullanıcıyı sistemden uzaklaştırmak üzeresiniz. Lütfen ban türünü ve sebebini seçin veya yazın:',
            type: 'prompt', iconType: 'danger', actionId: 'ban', actionTarget: userId,
            suggestedResponses: [
                "[Account] Topluluk kuralları ihlali (Spam/Küfür)",
                "[Account] Sahte/Yanıltıcı profil",
                "[Device] Dolandırıcılık teşebbüsü (Kalıcı Cihaz Banı)",
                "[Device] Sürekli kural ihlali (Kalıcı Cihaz Banı)"
            ]
        });
    };

    const handleModalConfirm = (inputValue?: string) => {
        if (modalConfig.actionId === 'delete') executeDelete(modalConfig.actionTarget);
        else if (modalConfig.actionId === 'impersonate') executeAccessAccount(modalConfig.actionTarget);
        else if (modalConfig.actionId === 'warn') executeWarnUser(modalConfig.actionTarget, inputValue || '');
        else if (modalConfig.actionId === 'givePremium') executeGivePremium(modalConfig.actionTarget, inputValue || '');
        else if (modalConfig.actionId === 'assignRole') executeAssignRole(modalConfig.actionTarget, inputValue || '');
        else if (modalConfig.actionId === 'ban') executeBanUser(modalConfig.actionTarget, inputValue || '');
    };


    const filteredUsers = users.filter(u =>
        u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        // Çevrimiçi olanlar en üste
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        // İkisi de aynı durumdaysa son görülmeye göre (en yakın olan en üstte)
        return b.lastActive - a.lastActive;
    });

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Kullanıcılar</h1>
                    <p className="admin-page-subtitle">Platformdaki tüm kullanıcıların canlı yönetimi.</p>
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
                            placeholder="UUID, İsim ile ara..."
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
                        <p>Kullanıcılar yükleniyor...</p>
                    </div>
                ) : (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', minWidth: '240px' }}>KULLANICI</th>
                                    <th style={{ textAlign: 'left', minWidth: '150px' }}>KONUM</th>
                                    <th style={{ textAlign: 'left', minWidth: '150px' }}>SİSTEM BİLGİSİ</th>
                                    <th style={{ textAlign: 'left', minWidth: '120px' }}>SEVİYE</th>
                                    <th style={{ textAlign: 'left', minWidth: '120px' }}>DURUM</th>
                                    <th style={{ textAlign: 'left', minWidth: '140px' }}>ELO / ŞİKAYETLER</th>
                                    <th style={{ textAlign: 'right', whiteSpace: 'nowrap', minWidth: '120px' }}>GOD MODE İŞLEMLERİ</th>
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
                                                    <img src={user.photoURL} alt="Avatar" className="admin-avatar-mini" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--god-border)' }} />
                                                ) : (
                                                    <div className="admin-avatar-mini" style={{ width: '44px', height: '44px', fontSize: '1.2rem' }}>{user.firstName[0]?.toUpperCase() || '?'}</div>
                                                )}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1rem' }}>
                                                        {user.firstName}, {user.age}
                                                        {user.gender === 'male' && <span style={{ color: '#3b82f6', fontSize: '1.1rem' }}>♂️</span>}
                                                        {user.gender === 'female' && <span style={{ color: '#ec4899', fontSize: '1.1rem' }}>♀️</span>}
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
                                                <Clock size={14} /> {formatDistanceToNowLocal(user.lastActive)}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--god-text-muted)', fontFamily: 'monospace' }}>IP: </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--god-text)', fontFamily: 'monospace', marginBottom: '8px' }}>{user.ip || 'Bilinmiyor'}</div>
                                                <div style={{ display: 'flex' }}>
                                                    {user.role === 'admin' ? (
                                                        <span className="admin-badge" style={{ background: 'rgba(220,38,38,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}><Shield size={12} /> YÖNETİCİ</span>
                                                    ) : user.role === 'mod_reports' ? (
                                                        <span className="admin-badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}><Shield size={12} /> MOD (GÜVENLİK)</span>
                                                    ) : user.role === 'mod_users' ? (
                                                        <span className="admin-badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}><Shield size={12} /> MOD (MÜŞTERİ HİZ.)</span>
                                                    ) : user.role === 'mod_finance' ? (
                                                        <span className="admin-badge" style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)' }}><Shield size={12} /> MOD (FİNANS)</span>
                                                    ) : user.role === 'mod_marketing' ? (
                                                        <span className="admin-badge" style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}><Shield size={12} /> MOD (PAZARLAMA)</span>
                                                    ) : user.role === 'mod_config' ? (
                                                        <span className="admin-badge" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}><Shield size={12} /> MOD (SİSTEM)</span>
                                                    ) : user.role === 'moderator' ? (
                                                        <span className="admin-badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}><Shield size={12} /> MODERATÖR</span>
                                                    ) : (
                                                        <span className="admin-badge admin-badge-neutral">Kullanıcı</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {user.isPremium ?
                                                <span className="admin-badge admin-badge-gold">
                                                    <Star size={12} />
                                                    {user.premiumPlan === 'gold-weekly' || user.premiumPlan === 'weekly' ? 'Haftalık Premium' :
                                                        user.premiumPlan === 'gold-monthly' || user.premiumPlan === 'monthly' ? 'Aylık Premium' :
                                                            user.premiumPlan === 'gold-yearly' || user.premiumPlan === 'yearly' ? 'Yıllık Premium' : 'Premium'}
                                                </span> :
                                                <span className="admin-badge admin-badge-neutral">Ücretsiz</span>
                                            }
                                        </td>
                                        <td>
                                            {user.isOnline ? (
                                                <span className="admin-badge admin-badge-success"><CheckCircle size={12} /> Çevrim İçi</span>
                                            ) : (
                                                <span className="admin-badge admin-badge-neutral"><Clock size={12} /> Pasif</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--god-text-dim)' }}>ELO</span>
                                                    <span style={{ fontWeight: 'bold', fontSize: '1rem', color: user.elo > 500 ? 'var(--god-green)' : user.elo < 500 ? 'var(--god-red)' : 'var(--god-text)' }}>{user.elo}</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--god-text-dim)' }}>Rapor</span>
                                                    <span style={{ fontWeight: 'bold', fontSize: '1rem', color: user.reports > 3 ? 'var(--god-red)' : 'var(--god-text)' }}>{user.reports}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                                                {/* Sil */}
                                                <button
                                                    className="admin-btn-danger tooltip-trigger"
                                                    style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--god-red)' }}
                                                    title="Profili Sil"
                                                    onClick={() => handleDeleteProfile(user.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                {/* Yetki Ver / Rol Ata */}
                                                <button
                                                    className="admin-btn-surface tooltip-trigger"
                                                    style={{ padding: '8px', borderRadius: '8px', color: '#10b981' }}
                                                    title="Rol Ata (Yetkilendir)"
                                                    onClick={() => handleAssignRole(user.id)}
                                                >
                                                    <Shield size={16} />
                                                </button>

                                                {/* Premium Ver */}
                                                <button
                                                    className="admin-btn-surface tooltip-trigger"
                                                    style={{ padding: '8px', borderRadius: '8px', color: '#eab308' }}
                                                    title="Premium Paket Tanımla"
                                                    onClick={() => handleGivePremium(user.id)}
                                                >
                                                    <Star size={16} />
                                                </button>

                                                {/* Hesaba Eriş */}
                                                <button
                                                    className="admin-btn-surface tooltip-trigger"
                                                    style={{ padding: '8px', borderRadius: '8px', color: 'var(--god-brand)' }}
                                                    title="Hesaba Eriş / Kontrol Et"
                                                    onClick={() => handleAccessAccount(user.id)}
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {/* Uyarı Gönder */}
                                                <button
                                                    className="admin-btn-surface tooltip-trigger"
                                                    style={{ padding: '8px', borderRadius: '8px', color: 'var(--god-accent)' }}
                                                    title="Sistem Uyarısı Gönder"
                                                    onClick={() => handleWarnUser(user.id)}
                                                >
                                                    <AlertTriangle size={16} />
                                                </button>

                                                {/* Kullanıcıyı Banla */}
                                                <button
                                                    className="admin-btn-surface tooltip-trigger"
                                                    style={{ padding: '8px', borderRadius: '8px', color: '#f97316' }}
                                                    title="Kullanıcıyı/Cihazı Banla"
                                                    onClick={() => handleBanUser(user.id)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8" /><path d="m16 16 6-6" /><path d="m8 8 6-6" /><path d="m9 7 8 8" /><path d="m21 11-8-8" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--god-text-muted)' }}>
                                            Gösterilecek kullanıcı bulunamadı.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <AdminModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                iconType={modalConfig.iconType}
                promptPlaceholder="Gönderilecek mesaj..."
                suggestedResponses={modalConfig.suggestedResponses}
                onConfirm={handleModalConfirm}
                onCancel={closeAdminModal}
            />
        </div>
    );
}
