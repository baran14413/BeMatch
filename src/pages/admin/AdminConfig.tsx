import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Sliders, Zap, Loader, Save, RefreshCw, AlertCircle } from 'lucide-react';
import AdminModal from '../../components/AdminModal';
import '../../components/Admin.css';

interface SystemFlag {
    id: string;
    name: string;
    desc: string;
    enabled: boolean;
    category: string;
    danger?: boolean;
}

interface SystemConfig {
    flags: SystemFlag[];
    maxFreeSwipes: number;
    matchRadius: number;
    mlEndpoint: string;
}

const DEFAULT_FLAGS: SystemFlag[] = [
    { id: 'flag_rewind', name: 'Global Profil Geri Alma', desc: 'Kullanıcıların son kaydırmalarını geri almasını sağlar. Premium özellik.', enabled: true, category: 'Ana Uygulama' },
    { id: 'flag_video', name: 'Görüntülü Arama', desc: 'WebRTC tabanlı lokalize görüntülü buluşmayı etkinleştirir.', enabled: false, category: 'Beta Özellikler' },
    { id: 'flag_maint', name: 'Bakım Modu', desc: 'Sistemi bakım moduna alır. Adminler hariç tüm kullanıcıları kilitler.', enabled: false, category: 'Güvenlik', danger: true },
    { id: 'flag_ads', name: 'Reklam Gösterimi', desc: 'Ücretsiz kullanıcılar için uygulama içi reklamları aktif eder.', enabled: false, category: 'Gelir Modeli' },
];

export default function AdminConfig() {
    const [config, setConfig] = useState<SystemConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        flagId: string;
        targetValue: boolean;
        title: string;
        message: string;
    }>({
        isOpen: false, flagId: '', targetValue: false, title: '', message: ''
    });

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'admin_settings', 'system_config'), (snapshot) => {
            if (snapshot.exists()) {
                setConfig(snapshot.data() as SystemConfig);
            } else {
                // Initialize with defaults if it doesn't exist
                const initial: SystemConfig = {
                    flags: DEFAULT_FLAGS,
                    maxFreeSwipes: 50,
                    matchRadius: 150,
                    mlEndpoint: 'https://us-central1-bematch-ml.cloudfunctions.net/v2'
                };
                setConfig(initial);
                setDoc(doc(db, 'admin_settings', 'system_config'), initial).catch(console.error);
            }
            setLoading(false);
        }, (err) => {
            console.error("Config fetch error:", err);
            toast.error("Sistem ayarları yüklenemedi.");
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const handleToggleFlag = (id: string, currentStatus: boolean) => {
        const flag = config?.flags.find(f => f.id === id);
        if (!flag) return;

        // If it's a danger flag (like Maintenance), always show modal
        if (flag.danger || (!currentStatus && id === 'flag_maint')) {
            setModalConfig({
                isOpen: true,
                flagId: id,
                targetValue: !currentStatus,
                title: flag.name,
                message: !currentStatus
                    ? `DİKKAT: "${flag.name}" özelliğini aktif etmek üzeresiniz. Bu işlem platformun genel işleyişini veya kullanıcı erişimini kısıtlayabilir. Emin misiniz?`
                    : `"${flag.name}" özelliğini kapatmak üzeresiniz. Emin misiniz?`
            });
            return;
        }

        // Otherwise just toggle
        applyToggle(id, !currentStatus);
    };

    const applyToggle = async (id: string, value: boolean) => {
        if (!config) return;

        const newFlags = config.flags.map(f => f.id === id ? { ...f, enabled: value } : f);
        const newConfig = { ...config, flags: newFlags };

        setConfig(newConfig);

        try {
            await updateDoc(doc(db, 'admin_settings', 'system_config'), { flags: newFlags });
            toast.success('Ayarlar güncellendi');
        } catch (err) {
            toast.error('Güncelleme sırasında hata oluştu');
            console.error(err);
        }
    };

    const handleSaveGlobal = async () => {
        if (!config) return;
        setIsSaving(true);
        const tid = toast.loading('Sistem değişkenleri kaydediliyor...');
        try {
            await setDoc(doc(db, 'admin_settings', 'system_config'), config);
            toast.success('Tüm sistem ayarları başarıyla yayınlandı!', { id: tid });
        } catch {
            toast.error('Kaydetme başarısız oldu.', { id: tid });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--god-text-muted)' }}>
                <Loader className="spin" size={40} style={{ marginBottom: '20px' }} />
                <p>Konfigürasyon yükleniyor...</p>
            </div>
        );
    }

    if (!config) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Sistem Konfigüratörü <span className="admin-badge admin-badge-danger" style={{ fontSize: '0.75rem', position: 'relative', top: '-10px' }}>CANLI</span></h1>
                    <p className="admin-page-subtitle">Platformun teknik limitlerini ve özellik bayraklarını anlık olarak yönetin.</p>
                </div>
                <button
                    className="admin-btn admin-btn-primary"
                    onClick={handleSaveGlobal}
                    disabled={isSaving}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    {isSaving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
                    Değişiklikleri Yayınla
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>

                {/* Feature Flags Section */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <Zap size={24} color="var(--god-gold)" />
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Özellik Bayrakları (Feature Flags)</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {config.flags.map(flag => (
                            <div
                                key={flag.id}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px',
                                    background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
                                    border: flag.danger && flag.enabled ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--god-border)',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <div style={{ flex: 1, paddingRight: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 'bold', color: 'var(--god-text)' }}>{flag.name}</span>
                                        {flag.danger && <span className="admin-badge admin-badge-danger" style={{ fontSize: '0.65rem' }}>KRİTİK</span>}
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--god-text-muted)', lineHeight: '1.4' }}>{flag.desc}</p>
                                </div>

                                <div
                                    onClick={() => handleToggleFlag(flag.id, flag.enabled)}
                                    style={{
                                        width: '52px', height: '28px', borderRadius: '14px',
                                        background: flag.enabled ? (flag.danger ? '#ef4444' : '#10b981') : 'rgba(255,255,255,0.1)',
                                        position: 'relative', cursor: 'pointer', transition: 'all 0.3s',
                                        flexShrink: 0
                                    }}
                                >
                                    <motion.div
                                        animate={{ x: flag.enabled ? 26 : 2 }}
                                        style={{
                                            width: '24px', height: '24px', borderRadius: '50%', background: '#fff',
                                            position: 'absolute', top: '2px', left: 0,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Technical Variables Section */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <Sliders size={24} color="var(--god-blue)" />
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Algoritma ve Limitler</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {/* Daily Swipes */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Günlük Max Ücretsiz Kaydırma</label>
                                <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--god-blue)', padding: '4px 10px', borderRadius: '8px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                    {config.maxFreeSwipes}
                                </span>
                            </div>
                            <input
                                type="range" min="10" max="300" step="5"
                                value={config.maxFreeSwipes}
                                onChange={e => setConfig({ ...config, maxFreeSwipes: parseInt(e.target.value) })}
                                style={{ width: '100%', accentColor: 'var(--god-blue)', cursor: 'pointer' }}
                            />
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'var(--god-text-dim)' }}>Premium geçişini teşvik etmek için bu sınırı optimize edebilirsiniz.</p>
                        </div>

                        {/* Match Radius */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Varsayılan Keşif Yarıçapı (KM)</label>
                                <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--god-gold)', padding: '4px 10px', borderRadius: '8px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                    {config.matchRadius} km
                                </span>
                            </div>
                            <input
                                type="range" min="5" max="500" step="5"
                                value={config.matchRadius}
                                onChange={e => setConfig({ ...config, matchRadius: parseInt(e.target.value) })}
                                style={{ width: '100%', accentColor: 'var(--god-gold)', cursor: 'pointer' }}
                            />
                        </div>

                        {/* ML Endpoint Information */}
                        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--god-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <AlertCircle size={14} color="var(--god-blue)" />
                                <span style={{ fontSize: '0.7rem', color: 'var(--god-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ML Tavsiye Motoru Endpoint</span>
                            </div>
                            <div style={{ fontFamily: 'monospace', color: 'var(--god-text-muted)', fontSize: '0.8rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                                {config.mlEndpoint}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Danger Zone Modals */}
            <AdminModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                iconType="danger"
                onConfirm={() => {
                    applyToggle(modalConfig.flagId, modalConfig.targetValue);
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                }}
                onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </motion.div>
    );
}
