import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Target, Zap, ShieldCheck, Clock, Sliders, Save, RefreshCw } from 'lucide-react';
import '../../components/Admin.css';

interface MatchSettings {
    weights: {
        interests: number;
        distance: number;
        photoVerified: number;
        activityLevel: number;
    };
    limits: {
        dailySuperLikes: number;
        dailyBoosts: number;
        matchExpiryDays: number;
    };
    safety: {
        requirePhotoForMatch: boolean;
        hideAfterReports: number;
        autoBanThreshold: number;
    };
}

const DEFAULT_SETTINGS: MatchSettings = {
    weights: {
        interests: 40,
        distance: 30,
        photoVerified: 20,
        activityLevel: 10
    },
    limits: {
        dailySuperLikes: 5,
        dailyBoosts: 1,
        matchExpiryDays: 30
    },
    safety: {
        requirePhotoForMatch: false,
        hideAfterReports: 5,
        autoBanThreshold: 10
    }
};

export default function AdminMatchSettings() {
    const [settings, setSettings] = useState<MatchSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'admin_settings', 'match_config'), (snapshot) => {
            if (snapshot.exists()) {
                setSettings(snapshot.data() as MatchSettings);
            }
            setLoading(false);
        }, (err) => {
            console.error("Settings load error:", err);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        const tid = toast.loading('Ayarlar kaydediliyor...');
        try {
            await setDoc(doc(db, 'admin_settings', 'match_config'), settings);
            toast.success('Eşleşme ayarları güncellendi!', { id: tid });
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
                <p>Ayarlar yükleniyor...</p>
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
                    <h1 className="admin-page-title">Eşleşme & Algoritma Ayarları</h1>
                    <p className="admin-page-subtitle">Platformun eşleştirme motorunu ve kullanıcı etkileşim limitlerini burandan yönetin.</p>
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

                {/* Algorithm Weights */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <Target size={24} color="var(--god-gold)" />
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Eşleşme Ağırlıkları (%)</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--god-text)' }}>Ortak İlgi Alanları</label>
                                <span style={{ color: 'var(--god-gold)', fontWeight: 'bold' }}>%{settings.weights.interests}</span>
                            </div>
                            <input
                                type="range" min="0" max="100"
                                value={settings.weights.interests}
                                onChange={e => setSettings({ ...settings, weights: { ...settings.weights, interests: parseInt(e.target.value) } })}
                                className="admin-range" style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--god-text)' }}>Mesafe Yakınlığı</label>
                                <span style={{ color: 'var(--god-gold)', fontWeight: 'bold' }}>%{settings.weights.distance}</span>
                            </div>
                            <input
                                type="range" min="0" max="100"
                                value={settings.weights.distance}
                                onChange={e => setSettings({ ...settings, weights: { ...settings.weights, distance: parseInt(e.target.value) } })}
                                className="admin-range" style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--god-text)' }}>Fotoğraf Onayı (Mavi Tik)</label>
                                <span style={{ color: 'var(--god-gold)', fontWeight: 'bold' }}>%{settings.weights.photoVerified}</span>
                            </div>
                            <input
                                type="range" min="0" max="100"
                                value={settings.weights.photoVerified}
                                onChange={e => setSettings({ ...settings, weights: { ...settings.weights, photoVerified: parseInt(e.target.value) } })}
                                className="admin-range" style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ padding: '12px', background: 'rgba(250, 204, 21, 0.05)', borderRadius: '12px', border: '1px dashed var(--god-gold-dim)' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--god-text-muted)', textAlign: 'center' }}>
                                Not: Bu ağırlıklar "Sana Uygun Kişiler" algoritmasında öncelik sırasını belirler. Toplamın 100 olması önerilir.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Interaction Limits */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <Zap size={24} color="var(--god-blue)" />
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Etkileşim Limitleri</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="admin-field">
                            <label>Günlük Süper Beğeni (Standart)</label>
                            <input
                                type="number" className="admin-input" style={{ width: '100%' }}
                                value={settings.limits.dailySuperLikes}
                                onChange={e => setSettings({ ...settings, limits: { ...settings.limits, dailySuperLikes: parseInt(e.target.value) } })}
                            />
                        </div>
                        <div className="admin-field">
                            <label>Haftalık Ücretsiz Boost</label>
                            <input
                                type="number" className="admin-input" style={{ width: '100%' }}
                                value={settings.limits.dailyBoosts}
                                onChange={e => setSettings({ ...settings, limits: { ...settings.limits, dailyBoosts: parseInt(e.target.value) } })}
                            />
                        </div>
                        <div className="admin-field">
                            <label>Eşleşme Zaman Aşımı (Gün)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Clock size={20} color="var(--god-text-muted)" />
                                <input
                                    type="number" className="admin-input" style={{ flex: 1 }}
                                    value={settings.limits.matchExpiryDays}
                                    onChange={e => setSettings({ ...settings, limits: { ...settings.limits, matchExpiryDays: parseInt(e.target.value) } })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Safety & Quality */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <ShieldCheck size={24} color="var(--god-green)" />
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Güvenlik & Kalite Filtreleri</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Eşleşme İçin Fotoğraf Şartı</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--god-text-muted)' }}>Profil fotoğrafı olmayanalr eşleşme listesine giremez.</div>
                            </div>
                            <div
                                onClick={() => setSettings({ ...settings, safety: { ...settings.safety, requirePhotoForMatch: !settings.safety.requirePhotoForMatch } })}
                                style={{
                                    width: '44px', height: '24px', borderRadius: '12px',
                                    background: settings.safety.requirePhotoForMatch ? 'var(--god-green)' : 'var(--god-surface-hover)',
                                    position: 'relative', cursor: 'pointer', transition: '0.3s'
                                }}
                            >
                                <div style={{
                                    width: '20px', height: '20px', borderRadius: '10px', background: '#fff',
                                    position: 'absolute', top: '2px', left: settings.safety.requirePhotoForMatch ? '22px' : '2px',
                                    transition: '0.3s'
                                }} />
                            </div>
                        </div>

                        <div className="admin-field">
                            <label>Gizleme Eşiği (Rapor Sayısı)</label>
                            <input
                                type="number" className="admin-input" style={{ width: '100%' }}
                                value={settings.safety.hideAfterReports}
                                onChange={e => setSettings({ ...settings, safety: { ...settings.safety, hideAfterReports: parseInt(e.target.value) } })}
                            />
                            <p style={{ fontSize: '0.7rem', color: 'var(--god-text-dim)', marginTop: '4px' }}>Bir profil X kez raporlanırsa incelemeye kadar havuzdan gizlenir.</p>
                        </div>
                    </div>
                </div>

                {/* Advanced Config Placeholder */}
                <div className="admin-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px dashed var(--god-border)' }}>
                    <Sliders size={48} color="var(--god-border)" style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <h3 style={{ margin: 0, color: 'var(--god-text-muted)' }}>Gelişmiş Parametreler</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--god-text-dim)', textAlign: 'center' }}>ML tabanlı eşleşme optimizasyonu v2.4 aktif durumda çalışmaktadır.</p>
                </div>

            </div>
        </motion.div>
    );
}
