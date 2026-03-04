import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldCheck, Calendar, Database, Fingerprint, RefreshCw } from 'lucide-react';
import '../../components/Admin.css';

interface AuditLog {
    id: string;
    adminEmail: string;
    adminUid: string;
    action: string;
    targetId: string;
    details: string;
    ip: string;
    timestamp: { toDate?: () => Date } | number | null;
}

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'audit_logs'),
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
            setLogs(loaded);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const formatTime = (ts: { toDate?: () => Date } | number | null) => {
        if (!ts) return '';
        let d: Date;
        if (typeof ts === 'number') {
            d = new Date(ts);
        } else if (ts && typeof ts.toDate === 'function') {
            d = ts.toDate();
        } else {
            d = new Date(ts as unknown as string);
        }
        // Format: YYYY-MM-DD HH:mm:ss
        return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    };

    if (loading) {
        return (
            <div className="admin-loading-container">
                <RefreshCw className="spin" size={32} color="var(--god-green)" />
                <p>Güvenlik logları yükleniyor...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <ShieldCheck size={32} color="var(--god-green)" />
                        Sistem Logları (Audit)
                    </h1>
                    <p className="admin-page-subtitle">WORM Storage (Write Once, Read Many). Bu kayıtlar hiçbir hesap tarafından silinemez veya değiştirilemez.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="admin-btn admin-btn-surface">
                        Dışa Aktar (CSV)
                    </button>
                </div>
            </div>

            <div className="admin-card" style={{ padding: '24px' }}>

                {/* WORM Notice & Filters */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--god-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem', color: 'var(--god-gold)', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <Database size={16} />
                        <span style={{ fontWeight: 'bold' }}>SOC2 Uyumluluğu Aktif:</span> Log kalıcılığı minimum 10 yıl olarak ayarlandı.
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={16} color="var(--god-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input type="date" className="admin-input" style={{ paddingLeft: '36px' }} />
                        </div>
                    </div>
                </div>

                {/* Audit Data Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ fontFamily: 'monospace' }}>
                        <thead>
                            <tr>
                                <th>Zaman Damgası (UTC)</th>
                                <th>Admin İzi</th>
                                <th>İşlem</th>
                                <th>Hedef (Entity)</th>
                                <th>Detaylar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td style={{ color: 'var(--god-text-dim)', fontSize: '0.75rem' }}>{formatTime(log.timestamp)}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--god-text)' }}>
                                            <Fingerprint size={14} color="var(--god-purple)" />
                                            {log.adminEmail}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--god-text-dim)', marginTop: '4px' }}>ID: {log.adminUid.substring(0, 8)}...</div>
                                    </td>
                                    <td>
                                        <span className="admin-badge admin-badge-neutral" style={{ color: 'var(--god-blue)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--god-text-muted)' }}>{log.targetId}</td>
                                    <td style={{ fontSize: '0.875rem' }}>{log.details}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--god-text-muted)' }}>
                                        Henüz kaydedilmiş bir log bulunmuyor.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
