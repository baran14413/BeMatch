import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import {
    Wrench,
    Power,
    Clock,
    MessageSquare,
    Save,
    AlertTriangle,
    Eye
} from 'lucide-react';
import '../../components/Admin.css';

interface SystemFlag {
    id: string;
    enabled: boolean;
    [key: string]: unknown;
}

export default function AdminMaintenance() {
    const [isEnabled, setIsEnabled] = useState(false);
    const [maintenanceMsg, setMaintenanceMsg] = useState('BeMatch\'i sana daha iyi bir deneyim sunmak için güncelliyoruz. Çok yakında daha güçlü bir şekilde döneceğiz.');
    const [endTime, setEndTime] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'admin_settings', 'system_config'), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                const flags: SystemFlag[] = data.flags || [];
                const flag = flags.find((f: SystemFlag) => f.id === 'flag_maint');
                setIsEnabled(!!flag?.enabled);
                setMaintenanceMsg(data.maintenanceMsg || 'BeMatch\'i sana daha iyi bir deneyim sunmak için güncelliyoruz. Çok yakında daha güçlü bir şekilde döneceğiz.');
                setEndTime(data.maintenanceEndTime || '');
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const tid = toast.loading('Bakım ayarları güncelleniyor...');
        try {
            const configRef = doc(db, 'admin_settings', 'system_config');

            // Get current flags to update only the maintenance one
            const snapshot = await (await import('firebase/firestore')).getDoc(configRef);
            if (snapshot.exists()) {
                const flags = (snapshot.data().flags as SystemFlag[]).map((f: SystemFlag) =>
                    f.id === 'flag_maint' ? { ...f, enabled: isEnabled } : f
                );

                await updateDoc(configRef, {
                    flags,
                    maintenanceMsg,
                    maintenanceEndTime: endTime,
                    lastMaintenanceUpdate: Date.now()
                });

                // --- AUDIT LOG ---
                const { logAdminAction } = await import('../../utils/auditLogger');
                await logAdminAction('UPDATE_CONFIG', 'system_config', `Maintenance mode set to: ${isEnabled}`);

                toast.success('Ayarlar başarıyla kaydedildi!', { id: tid });
            }
        } catch (error) {
            console.error(error);
            toast.error('Ayarlar kaydedilirken bir hata oluştu.', { id: tid });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="admin-loading-container">
            <Wrench className="spin" size={32} color="var(--god-blue)" />
            <p>Yükleniyor...</p>
        </div>
    );

    return (
        <div style={{ padding: '20px' }}>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Bakım Modu Yönetimi</h1>
                    <p className="admin-page-subtitle">Sistemi bakıma alın veya bakım mesajlarını düzenleyin.</p>
                </div>
                <button
                    className="admin-btn admin-btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    <Save size={18} style={{ marginRight: '8px' }} />
                    Ayarları Kaydet
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '32px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Status Card */}
                    <div className="admin-card" style={{ padding: '24px', border: isEnabled ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--god-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: isEnabled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Power size={24} color={isEnabled ? '#ef4444' : '#10b981'} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Sistem Durumu</h3>
                                    <p style={{ margin: 0, color: isEnabled ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                        {isEnabled ? 'ŞU AN BAKIMDA' : 'SİSTEM AKTİF'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEnabled(!isEnabled)}
                                className={`admin-btn ${isEnabled ? 'admin-btn-primary' : 'admin-btn-surface'}`}
                                style={{ background: isEnabled ? '#ef4444' : '' }}
                            >
                                {isEnabled ? 'Bakımı Kapat' : 'Bakımı Aç'}
                            </button>
                        </div>
                        {isEnabled && (
                            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <AlertTriangle size={18} color="#ef4444" />
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#ef4444' }}>
                                    Bakım modu aktifken adminler HARİÇ tüm kullanıcılar uygulamadan kilitlenir.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Content Card */}
                    <div className="admin-card" style={{ padding: '24px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MessageSquare size={20} color="var(--god-blue)" /> Bakım Detayları
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label className="admin-label">Kullanıcılara Görünecek Mesaj</label>
                                <textarea
                                    className="admin-input"
                                    rows={4}
                                    style={{ width: '100%', resize: 'none' }}
                                    value={maintenanceMsg}
                                    onChange={e => setMaintenanceMsg(e.target.value)}
                                    placeholder="Bakım nedenini ve durumunu açıklayın..."
                                />
                            </div>

                            <div>
                                <label className="admin-label">Tahmini Bitiş (Opsiyonel)</label>
                                <div style={{ position: 'relative' }}>
                                    <Clock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--god-text-dim)' }} size={18} />
                                    <input
                                        type="text"
                                        className="admin-input"
                                        style={{ width: '100%', paddingLeft: '40px' }}
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                        placeholder="Örn: 2 saat içinde, Bugün 18:00 vb."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div style={{ position: 'sticky', top: '20px' }}>
                    <div style={{
                        background: '#020617',
                        borderRadius: '40px',
                        padding: '12px',
                        border: '8px solid #1e293b',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        aspectRatio: '9/19',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            width: '100%',
                            background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '24px',
                            color: 'white',
                            textAlign: 'center',
                            position: 'relative'
                        }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '18px',
                                background: 'rgba(59, 130, 246, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '20px'
                            }}>
                                <Wrench size={32} color="#3b82f6" />
                            </div>

                            <h4 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '12px', margin: 0 }}>
                                Kısa Bir Mola! 🛠️
                            </h4>

                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5', margin: '16px 0' }}>
                                {maintenanceMsg}
                            </p>

                            {endTime && (
                                <div style={{
                                    padding: '8px 16px',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    borderRadius: '50px',
                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginTop: '8px'
                                }}>
                                    <Clock size={14} color="#f59e0b" />
                                    <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '600' }}>{endTime}</span>
                                </div>
                            )}

                            <div style={{ position: 'absolute', bottom: '24px', opacity: 0.3, fontSize: '0.65rem' }}>
                                &copy; BeMatch Team
                            </div>

                            <div style={{
                                position: 'absolute',
                                top: '10px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(255,255,255,0.05)',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.6rem',
                                color: 'rgba(255,255,255,0.5)'
                            }}>
                                <Eye size={10} /> MOBİL ÖNİZLEME
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
