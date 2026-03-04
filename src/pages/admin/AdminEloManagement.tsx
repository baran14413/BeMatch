import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    Trophy,
    Settings2,
    Search,
    Award,
    ArrowUpRight,
    ArrowDownRight,
    Save,
    RefreshCw,
    Info
} from 'lucide-react';
import '../../components/Admin.css';

interface EloUser {
    id: string;
    firstName: string;
    eloScore: number;
    photos: string[];
    isPremium: boolean;
    gender: string;
}

interface EloConfig {
    baseScore: number;
    kFactor: number;
    likeGain: number;
    superLikeGain: number;
    dislikePenalty: number;
    reportPenalty: number;
}

const DEFAULT_CONFIG: EloConfig = {
    baseScore: 500,
    kFactor: 32,
    likeGain: 5,
    superLikeGain: 15,
    dislikePenalty: 2,
    reportPenalty: 50
};

export default function AdminEloManagement() {
    const [users, setUsers] = useState<EloUser[]>([]);
    const [config, setConfig] = useState<EloConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<EloUser | null>(null);
    const [newScore, setNewScore] = useState<number>(0);

    useEffect(() => {
        // Listen for top 50 users by ELO
        const q = query(collection(db, 'users'), orderBy('eloScore', 'desc'), limit(50));
        const unsubUsers = onSnapshot(q, (snapshot) => {
            const loaded: EloUser[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                loaded.push({
                    id: doc.id,
                    firstName: data.firstName || 'Bilinmiyor',
                    eloScore: data.eloScore || 500,
                    photos: data.photos || [],
                    isPremium: data.isPremium || false,
                    gender: data.gender || ''
                });
            });
            setUsers(loaded);
            setLoading(false);
        });

        // Listen for global config
        const unsubConfig = onSnapshot(doc(db, 'admin_settings', 'elo_config'), (snapshot) => {
            if (snapshot.exists()) {
                setConfig(snapshot.data() as EloConfig);
            }
        });

        return () => {
            unsubUsers();
            unsubConfig();
        };
    }, []);

    const handleSaveConfig = async () => {
        setIsSaving(true);
        const tid = toast.loading('Konfigürasyon kaydediliyor...');
        try {
            await setDoc(doc(db, 'admin_settings', 'elo_config'), config);
            toast.success('ELO kuralları güncellendi!', { id: tid });
        } catch (err) {
            console.error("Save error:", err);
            toast.error('Kaydedilirken bir hata oluştu.', { id: tid });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateUserElo = async () => {
        if (!editingUser) return;
        const tid = toast.loading('Kullanıcı ELO puanı güncelleniyor...');
        try {
            await updateDoc(doc(db, 'users', editingUser.id), {
                eloScore: newScore
            });
            toast.success('Puan güncellendi!', { id: tid });
            setEditingUser(null);
        } catch (err) {
            console.error("User Elo update error:", err);
            toast.error('Güncelleme başarısız.', { id: tid });
        }
    };

    const filteredUsers = users.filter(u =>
        u.firstName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--god-text-muted)' }}>
                <RefreshCw size={40} className="spin" style={{ marginBottom: '20px' }} />
                <p>Veriler yükleniyor...</p>
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
                    <h1 className="admin-page-title">Popülerlik (ELO) Yönetimi</h1>
                    <p className="admin-page-subtitle">Kullanıcı sıralama mantığını ve profil skorlarını buradan kontrol edin.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>

                {/* Global Config Card */}
                <div className="admin-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <Settings2 size={24} color="var(--god-blue)" />
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Skor Kuralları</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="admin-field">
                            <label>Yeni Kullanıcı Başlangıç Puanı</label>
                            <input
                                type="number" className="admin-input" style={{ width: '100%' }}
                                value={config.baseScore}
                                onChange={e => setConfig({ ...config, baseScore: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="admin-field">
                            <label>Beğeni Başına Kazanılan (Like Gain)</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="number" className="admin-input" style={{ flex: 1 }}
                                    value={config.likeGain}
                                    onChange={e => setConfig({ ...config, likeGain: parseInt(e.target.value) })}
                                />
                                <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--god-green)', padding: '0 12px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                                    <ArrowUpRight size={16} />
                                </div>
                            </div>
                        </div>
                        <div className="admin-field">
                            <label>Süper Beğeni Çarpanı</label>
                            <input
                                type="number" className="admin-input" style={{ width: '100%' }}
                                value={config.superLikeGain}
                                onChange={e => setConfig({ ...config, superLikeGain: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="admin-field">
                            <label>Raporlanma Cezası (Penalty)</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="number" className="admin-input" style={{ flex: 1 }}
                                    value={config.reportPenalty}
                                    onChange={e => setConfig({ ...config, reportPenalty: parseInt(e.target.value) })}
                                />
                                <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--god-red)', padding: '0 12px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                                    <ArrowDownRight size={16} />
                                </div>
                            </div>
                        </div>
                        <button
                            className="admin-btn admin-btn-primary"
                            onClick={handleSaveConfig}
                            disabled={isSaving}
                            style={{ marginTop: '12px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                        >
                            <Save size={18} />
                            Ayarları Güncelle
                        </button>
                    </div>
                </div>

                {/* Leaderboard Card */}
                <div className="admin-card" style={{ padding: '24px', gridRow: 'span 2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <TrendingUp size={24} color="var(--god-gold)" />
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Popülerlik Liderlik Tablosu</h2>
                        </div>
                        <div className="admin-badge admin-badge-gold">
                            <Award size={14} /> TOP 50
                        </div>
                    </div>

                    <div style={{ position: 'relative', marginBottom: '20px' }}>
                        <Search size={18} color="var(--god-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Liderlik tablosunda ara..."
                            className="admin-input"
                            style={{ width: '100%', paddingLeft: '40px' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
                        {filteredUsers.map((user, index) => (
                            <div
                                key={user.id}
                                className="admin-user-list-item"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px',
                                    background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--god-border)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ fontWeight: 'bold', width: '24px', color: index < 3 ? 'var(--god-gold)' : 'var(--god-text-muted)' }}>
                                        #{index + 1}
                                    </div>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: user.isPremium ? '2px solid var(--god-gold)' : '1px solid var(--god-border)' }}>
                                        <img
                                            src={user.photos[0] || 'https://via.placeholder.com/40'}
                                            alt={user.firstName}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{user.firstName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--god-text-muted)' }}>ID: {user.id.substring(0, 8)}...</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 'bold', color: 'var(--god-gold)' }}>{user.eloScore}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--god-text-dim)', textTransform: 'uppercase' }}>ELO PUANI</div>
                                    </div>
                                    <button
                                        className="admin-btn-surface"
                                        style={{ padding: '6px' }}
                                        onClick={() => {
                                            setEditingUser(user);
                                            setNewScore(user.eloScore);
                                        }}
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Score Stats Placeholder */}
                <div className="admin-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Trophy size={24} color="var(--god-gold)" />
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Analiz Paneli</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--god-text-muted)', textTransform: 'uppercase' }}>Ortalama ELO</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--god-blue)' }}>742</div>
                        </div>
                        <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--god-text-muted)', textTransform: 'uppercase' }}>En Yüksek</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--god-green)' }}>2480</div>
                        </div>
                    </div>
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <Info size={20} color="var(--god-blue)" style={{ flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--god-text-muted)' }}>
                            ELO puanı, bir kullanıcının platformdaki "görünürlük önceliğini" belirleyen en kritik değişkendir. Yüksek puanlı kullanıcılar daha fazla kart havuzunda en üstte yer alır.
                        </p>
                    </div>
                </div>

            </div>

            {/* Manual Edit Modal */}
            <AnimatePresence>
                {editingUser && (
                    <div className="admin-modal-overlay">
                        <motion.div
                            className="admin-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <RefreshCw size={24} color="var(--god-blue)" />
                                <h2 style={{ margin: 0 }}>Puan Güncelle: {editingUser.firstName}</h2>
                            </div>

                            <div className="admin-field">
                                <label>Yeni ELO Skoru</label>
                                <input
                                    type="number"
                                    className="admin-input"
                                    style={{ width: '100%', fontSize: '1.25rem' }}
                                    value={newScore}
                                    onChange={e => setNewScore(parseInt(e.target.value))}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                <button className="admin-btn-surface" style={{ flex: 1 }} onClick={() => setEditingUser(null)}>Vazgeç</button>
                                <button className="admin-btn admin-btn-primary" style={{ flex: 1 }} onClick={handleUpdateUserElo}>Güncellemeyi Onayla</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
