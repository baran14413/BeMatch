import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    ShieldAlert,
    MessageSquare,
    Image as ImageIcon,
    UserPlus,
    Clock,
    Save,
    RefreshCw,
    AlertCircle,
    HandMetal
} from 'lucide-react';
import '../../components/Admin.css';

interface UserLimits {
    interaction: {
        dailyLikesStandard: number;
        dailyLikesPremium: number;
        maxBioLength: number;
        maxPhotos: number;
    };
    communication: {
        dailyMessagesNewUser: number;
        newUserThresholdDays: number;
        messageSpamIntervalMs: number;
    };
    security: {
        minAgeForRegistration: number;
        requireEmailVerification: boolean;
        maxAccountsPerIP: number;
        autoShadowBanReports: number;
    };
}

const DEFAULT_LIMITS: UserLimits = {
    interaction: {
        dailyLikesStandard: 50,
        dailyLikesPremium: 1000,
        maxBioLength: 500,
        maxPhotos: 6
    },
    communication: {
        dailyMessagesNewUser: 5,
        newUserThresholdDays: 7,
        messageSpamIntervalMs: 1000
    },
    security: {
        minAgeForRegistration: 18,
        requireEmailVerification: true,
        maxAccountsPerIP: 3,
        autoShadowBanReports: 15
    }
};

export default function AdminUserLimits() {
    const [limits, setLimits] = useState<UserLimits>(DEFAULT_LIMITS);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'admin_settings', 'user_limits'), (snapshot) => {
            if (snapshot.exists()) {
                setLimits(snapshot.data() as UserLimits);
            }
            setLoading(false);
        }, (err) => {
            console.error("Limits load error:", err);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        const tid = toast.loading('Limitler kaydediliyor...');
        try {
            await setDoc(doc(db, 'admin_settings', 'user_limits'), limits);
            toast.success('Kullanıcı limitleri güncellendi!', { id: tid });
        } catch (err) {
            console.error("Save error:", err);
            toast.error('Kaydedilirken bir hata oluştu.', { id: tid });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--god-text-muted)' }}>
                <RefreshCw size={40} className="spin" style={{ marginBottom: '20px' }} />
                <p>Limitler yükleniyor...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: '20px' }}
        >
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Kullanıcı & Platform Limitleri</h1>
                    <p className="admin-page-subtitle">Platformdaki etkileşim sınırlarını ve anti-spam kurallarını buradan yönetin.</p>
                </div>
                <button
                    className="admin-btn admin-btn-primary"
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Save size={18} />
                    {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>

                {/* Interaction & Profile */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <HandMetal size={24} color="var(--god-blue)" />
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Etkileşim & Profil</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="admin-field">
                            <label>Günlük Beğeni (Standart Kullanıcı)</label>
                            <input
                                type="number" className="admin-input" style={{ width: '100%' }}
                                value={limits.interaction.dailyLikesStandard}
                                onChange={e => setLimits({ ...limits, interaction: { ...limits.interaction, dailyLikesStandard: parseInt(e.target.value) } })}
                            />
                        </div>
                        <div className="admin-field">
                            <label>Profil Fotoğraf Limiti (Max)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <ImageIcon size={20} color="var(--god-text-muted)" />
                                <input
                                    type="number" className="admin-input" style={{ flex: 1 }}
                                    value={limits.interaction.maxPhotos}
                                    onChange={e => setLimits({ ...limits, interaction: { ...limits.interaction, maxPhotos: parseInt(e.target.value) } })}
                                />
                            </div>
                        </div>
                        <div className="admin-field">
                            <label>Hakkında (Bio) Karakter Limiti</label>
                            <input
                                type="number" className="admin-input" style={{ width: '100%' }}
                                value={limits.interaction.maxBioLength}
                                onChange={e => setLimits({ ...limits, interaction: { ...limits.interaction, maxBioLength: parseInt(e.target.value) } })}
                            />
                        </div>
                    </div>
                </div>

                {/* Communication & Messaging */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <MessageSquare size={24} color="var(--god-gold)" />
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>İletişim & Mesajlaşma</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="admin-field">
                            <label>Yeni Kullanıcı Günlük Mesaj Limiti</label>
                            <input
                                type="number" className="admin-input" style={{ width: '100%' }}
                                value={limits.communication.dailyMessagesNewUser}
                                onChange={e => setLimits({ ...limits, communication: { ...limits.communication, dailyMessagesNewUser: parseInt(e.target.value) } })}
                            />
                            <p style={{ fontSize: '0.7rem', color: 'var(--god-text-dim)', marginTop: '4px' }}>Yeni üye olan kullanıcıların eşleşmeden atabileceği max mesaj.</p>
                        </div>
                        <div className="admin-field">
                            <label>Yeni Kullanıcı Statüsü (Gün)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Clock size={20} color="var(--god-text-muted)" />
                                <input
                                    type="number" className="admin-input" style={{ flex: 1 }}
                                    value={limits.communication.newUserThresholdDays}
                                    onChange={e => setLimits({ ...limits, communication: { ...limits.communication, newUserThresholdDays: parseInt(e.target.value) } })}
                                />
                            </div>
                        </div>
                        <div className="admin-field">
                            <label>Mesaj Spam Gecikmesi (MS)</label>
                            <input
                                type="number" step="100" className="admin-input" style={{ width: '100%' }}
                                value={limits.communication.messageSpamIntervalMs}
                                onChange={e => setLimits({ ...limits, communication: { ...limits.communication, messageSpamIntervalMs: parseInt(e.target.value) } })}
                            />
                        </div>
                    </div>
                </div>

                {/* Security & Spam Protection */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <ShieldAlert size={24} color="var(--god-red)" />
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Güvenlik & Anti-Spam</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="admin-field">
                            <label>IP Başına Max Hesap Sayısı</label>
                            <input
                                type="number" className="admin-input" style={{ width: '100%' }}
                                value={limits.security.maxAccountsPerIP}
                                onChange={e => setLimits({ ...limits, security: { ...limits.security, maxAccountsPerIP: parseInt(e.target.value) } })}
                            />
                        </div>
                        <div className="admin-field">
                            <label>Otomatik Gizleme (Rapor Sayısı)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <AlertCircle size={20} color="var(--god-red)" />
                                <input
                                    type="number" className="admin-input" style={{ flex: 1 }}
                                    value={limits.security.autoShadowBanReports}
                                    onChange={e => setLimits({ ...limits, security: { ...limits.security, autoShadowBanReports: parseInt(e.target.value) } })}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>E-Posta Doğrulama Şartı</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--god-text-muted)' }}>Doğrulanmamış hesaplar eşleşme havuzuna giremez.</div>
                            </div>
                            <div
                                onClick={() => setLimits({ ...limits, security: { ...limits.security, requireEmailVerification: !limits.security.requireEmailVerification } })}
                                style={{
                                    width: '44px', height: '24px', borderRadius: '12px',
                                    background: limits.security.requireEmailVerification ? 'var(--god-green)' : 'var(--god-surface-hover)',
                                    position: 'relative', cursor: 'pointer', transition: '0.3s'
                                }}
                            >
                                <div style={{
                                    width: '20px', height: '20px', borderRadius: '10px', background: '#fff',
                                    position: 'absolute', top: '2px', left: limits.security.requireEmailVerification ? '22px' : '2px',
                                    transition: '0.3s'
                                }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registration Info */}
                <div className="admin-card" style={{ padding: '24px', background: 'var(--god-surface-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <UserPlus size={24} color="var(--god-green)" />
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Kayıt Kralları</h2>
                    </div>
                    <div className="admin-field">
                        <label>Minimum Yaş Sınırı</label>
                        <input
                            type="number" className="admin-input" style={{ width: '100%' }}
                            value={limits.security.minAgeForRegistration}
                            onChange={e => setLimits({ ...limits, security: { ...limits.security, minAgeForRegistration: parseInt(e.target.value) } })}
                        />
                        <p style={{ fontSize: '0.7rem', color: 'var(--god-text-dim)', marginTop: '8px' }}>
                            Yasal uyum ve topluluk güvenliği için belirlenen global yaş sınırı.
                        </p>
                    </div>
                </div>

            </div>
        </motion.div>
    );
}
