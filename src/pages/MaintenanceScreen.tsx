import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Clock, Megaphone, ShieldAlert } from 'lucide-react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';

interface SystemConfig {
    maintenanceMsg?: string;
    maintenanceEndTime?: string;
    flags?: { id: string; enabled: boolean }[];
    [key: string]: unknown;
}

export default function MaintenanceScreen() {
    const [config, setConfig] = React.useState<SystemConfig | null>(null);

    React.useEffect(() => {
        const unsub = onSnapshot(doc(db, 'admin_settings', 'system_config'), (snapshot) => {
            if (snapshot.exists()) setConfig(snapshot.data());
        });
        return () => unsub();
    }, []);

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
            color: 'white',
            textAlign: 'center',
            padding: '24px'
        }}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                    padding: '40px',
                    borderRadius: '32px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    maxWidth: '500px',
                    width: '100%'
                }}
            >
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '24px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    position: 'relative'
                }}>
                    <Wrench size={40} color="#3b82f6" />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        style={{ position: 'absolute', top: -10, right: -10 }}
                    >
                        <Clock size={24} color="#f59e0b" />
                    </motion.div>
                </div>

                <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '16px', letterSpacing: '-0.5px' }}>
                    Kısa Bir Mola! 🛠️
                </h1>

                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '32px' }}>
                    {config?.maintenanceMsg || 'BeMatch\'i sana daha iyi bir deneyim sunmak için güncelliyoruz. Çok yakında daha güçlü bir şekilde döneceğiz.'}
                </p>

                {config?.maintenanceEndTime && (
                    <div style={{
                        padding: '12px 24px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        borderRadius: '50px',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        marginBottom: '32px'
                    }}>
                        <Clock size={20} color="#f59e0b" />
                        <span style={{ fontSize: '1.1rem', color: '#f59e0b', fontWeight: 'bold' }}>Tahmini Bitiş: {config.maintenanceEndTime}</span>
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    textAlign: 'left'
                }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                        <ShieldAlert size={20} color="#3b82f6" style={{ marginTop: '2px' }} />
                        <div>
                            <span style={{ fontWeight: '600', display: 'block' }}>Sistem Güvenliği</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--god-text-dim)' }}>Tüm verilerin güvende, sadece altyapımızı iyileştiriyoruz.</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                        <Megaphone size={20} color="#f59e0b" style={{ marginTop: '2px' }} />
                        <div>
                            <span style={{ fontWeight: '600', display: 'block' }}>Duyurulardan Haberdar Ol</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--god-text-dim)' }}>Güncelleme bittiğinde uygulama otomatik olarak açılacaktır.</span>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '40px', fontSize: '0.8rem', color: 'var(--god-text-dim)' }}>
                    &copy; 2026 BeMatch Team - Sabrınız için teşekkürler.
                </div>
            </motion.div>
        </div>
    );
}
