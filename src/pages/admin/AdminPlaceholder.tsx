import { motion } from 'framer-motion';
import { Hammer, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../components/Admin.css';

export default function AdminPlaceholder() {
    const navigate = useNavigate();
    const location = useLocation();

    // Map path to a module name roughly
    const pathName = location.pathname.split('/').pop() || 'Bu Modül';
    const readableName = pathName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="admin-card"
                style={{ padding: '64px', maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}
            >
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Hammer size={40} color="var(--god-text-muted)" />
                </div>

                <h1 style={{ fontSize: '2rem', margin: 0, color: 'var(--god-text)' }}>{readableName}</h1>

                <p style={{ color: 'var(--god-text-muted)', fontSize: '1.1rem', lineHeight: '1.6', margin: 0 }}>
                    Bu modül şu anda yapım aşamasında veya geliştirilmesi planlanıyor. Tanrı Modu yetkilerine yakında eklenecek.
                </p>

                <button
                    className="admin-btn admin-btn-surface"
                    style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={16} /> Geri Dön
                </button>
            </motion.div>
        </div>
    );
}
