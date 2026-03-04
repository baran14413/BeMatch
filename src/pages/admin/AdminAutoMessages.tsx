import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    MessageSquare,
    Plus,
    Trash2,
    Edit2,
    CheckCircle,
    XCircle,
    Clock,
    Save,
    X,
    RefreshCw,
    Zap,
    UserPlus,
    Heart,
    Moon,
    CreditCard,
    Smartphone,
    Send
} from 'lucide-react';
import '../../components/Admin.css';

interface AutoMessage {
    id: string;
    title: string;
    triggerType: 'WELCOME' | 'MATCH' | 'INACTIVITY' | 'PREMIUM_EXPIRED';
    body: string;
    isActive: boolean;
    delayMinutes: number;
    createdAt: { seconds: number; nanoseconds: number } | null | undefined;
}

const TRIGGER_TYPES = [
    { value: 'WELCOME', label: 'Yeni Kayıt (Hoşgeldin)', icon: UserPlus, color: '#3b82f6' },
    { value: 'MATCH', label: 'Yeni Eşleşme', icon: Heart, color: '#ef4444' },
    { value: 'INACTIVITY', label: 'İnaktivite (Dönüş Çağrısı)', icon: Moon, color: '#8b5cf6' },
    { value: 'PREMIUM_EXPIRED', label: 'Premium Bitiş Hatırlatıcı', icon: CreditCard, color: '#f59e0b' }
];

export default function AdminAutoMessages() {
    const [messages, setMessages] = useState<AutoMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [current, setCurrent] = useState<Partial<AutoMessage>>({
        title: '',
        body: '',
        triggerType: 'WELCOME',
        isActive: true,
        delayMinutes: 0
    });

    useEffect(() => {
        const q = query(collection(db, 'auto_messages'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snapshot) => {
            const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AutoMessage));
            setMessages(loaded);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleSave = async () => {
        if (!current.title || !current.body) {
            toast.error("Başlık ve mesaj içeriği zorunludur.");
            return;
        }

        const tid = toast.loading('Mesaj kaydediliyor...');
        try {
            const data = {
                ...current,
                updatedAt: serverTimestamp(),
                createdAt: current.id ? current.createdAt : serverTimestamp()
            };

            if (current.id) {
                await setDoc(doc(db, 'auto_messages', current.id), data);
                toast.success('Otomatik mesaj güncellendi', { id: tid });
            } else {
                const newRef = doc(collection(db, 'auto_messages'));
                await setDoc(newRef, data);
                toast.success('Yeni otomatik mesaj oluşturuldu', { id: tid });
            }
            setIsEditing(false);
            setCurrent({
                title: '',
                body: '',
                triggerType: 'WELCOME',
                isActive: true,
                delayMinutes: 0
            });
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(`Erişim reddedildi: ${err.message}`, { id: tid });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Bu otomatik mesajı silmek istediğinize emin misiniz?")) return;
        try {
            await deleteDoc(doc(db, 'auto_messages', id));
            toast.success("Mesaj silindi");
        } catch {
            toast.error("Silme hatası");
        }
    };

    const toggleStatus = async (msg: AutoMessage) => {
        try {
            await updateDoc(doc(db, 'auto_messages', msg.id), {
                isActive: !msg.isActive
            });
            toast.success(msg.isActive ? "Mesaj pasife alındı" : "Mesaj aktifleştirildi");
        } catch {
            toast.error("Durum güncellenemedi");
        }
    };

    if (loading) {
        return (
            <div className="admin-loading-container">
                <RefreshCw className="spin" size={32} color="var(--god-blue)" />
                <p>Otomatik mesajlar yükleniyor...</p>
            </div>
        );
    }

    const currentTrigger = TRIGGER_TYPES.find(t => t.value === current.triggerType) || TRIGGER_TYPES[0];

    return (
        <div style={{ padding: '20px' }}>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Otomatik Mesaj Yönetimi</h1>
                    <p className="admin-page-subtitle">Belirli olaylar gerçekleştiğinde kullanıcılara otomatik gönderilecek sistem mesajlarını yönetin.</p>
                </div>
                <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => {
                        setCurrent({ title: '', body: '', triggerType: 'WELCOME', isActive: true, delayMinutes: 0 });
                        setIsEditing(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={18} /> Yeni Otomatik Mesaj
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '1fr 400px' : '1fr', gap: '32px', alignItems: 'flex-start' }}>

                {/* Main List or Editor */}
                <div>
                    {!isEditing ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                            {messages.map(msg => {
                                const TriggerInfo = TRIGGER_TYPES.find(t => t.value === msg.triggerType) || TRIGGER_TYPES[0];
                                const Icon = TriggerInfo.icon;

                                return (
                                    <motion.div
                                        key={msg.id}
                                        layout
                                        className="admin-card"
                                        style={{
                                            padding: '24px',
                                            border: msg.isActive ? `1px solid ${TriggerInfo.color}44` : '1px solid var(--god-border)',
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '16px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '12px',
                                                    background: `${TriggerInfo.color}15`, color: TriggerInfo.color,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <Icon size={20} />
                                                </div>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{msg.title}</h3>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--god-text-dim)' }}>{TriggerInfo.label}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="admin-btn-surface" onClick={() => toggleStatus(msg)}>
                                                    {msg.isActive ? <XCircle size={16} color="var(--god-red)" /> : <CheckCircle size={16} color="var(--god-green)" />}
                                                </button>
                                                <button className="admin-btn-surface" onClick={() => { setCurrent(msg); setIsEditing(true); }}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="admin-btn-surface" onClick={() => handleDelete(msg.id)}>
                                                    <Trash2 size={16} color="var(--god-red)" />
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '16px', background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
                                            fontSize: '0.9rem', color: 'var(--god-text-muted)', lineHeight: '1.6'
                                        }}>
                                            <Zap size={14} style={{ marginRight: '8px', color: TriggerInfo.color, verticalAlign: 'middle' }} />
                                            {msg.body}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--god-border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--god-text-dim)' }}>
                                                    <Clock size={12} /> {msg.delayMinutes > 0 ? `${msg.delayMinutes} dk gecikme` : 'Anında'}
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold',
                                                background: msg.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                                                color: msg.isActive ? '#22c55e' : '#9ca3af'
                                            }}>
                                                {msg.isActive ? 'AKTİF' : 'PASİF'}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            {messages.length === 0 && (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0', color: 'var(--god-text-muted)' }}>
                                    <MessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                                    <p>Henüz otomatik mesaj tanımlanmadı.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="admin-card"
                            style={{ padding: '32px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <h2 style={{ margin: 0 }}>Otomatik Mesaj Editörü</h2>
                                <button className="admin-btn-surface" onClick={() => setIsEditing(false)}><X size={20} /></button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="admin-field" style={{ gridColumn: 'span 2' }}>
                                    <label>Mesaj Başlığı (Dahili kullanım için)</label>
                                    <input
                                        type="text" className="admin-input" style={{ width: '100%' }}
                                        value={current.title}
                                        onChange={e => setCurrent({ ...current, title: e.target.value })}
                                        placeholder="Örn: Hoşgeldin Mesajı (Erkek)"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Tetikleyici Olay</label>
                                    <select
                                        className="admin-input" style={{ width: '100%' }}
                                        value={current.triggerType}
                                        onChange={e => setCurrent({ ...current, triggerType: e.target.value as AutoMessage['triggerType'] })}
                                    >
                                        {TRIGGER_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="admin-field">
                                    <label>Gecikme (Dakika)</label>
                                    <input
                                        type="number" className="admin-input" style={{ width: '100%' }}
                                        value={current.delayMinutes}
                                        onChange={e => setCurrent({ ...current, delayMinutes: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>

                                <div className="admin-field" style={{ gridColumn: 'span 2' }}>
                                    <label>Mesaj İçeriği</label>
                                    <textarea
                                        className="admin-input" style={{ width: '100%', resize: 'none' }}
                                        rows={6}
                                        value={current.body}
                                        onChange={e => setCurrent({ ...current, body: e.target.value })}
                                        placeholder="Kullanıcıya gönderilecek mesaj..."
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                <button className="admin-btn-surface" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>Vazgeç</button>
                                <button className="admin-btn admin-btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                                    <Save size={18} style={{ marginRight: '8px' }} /> Mesajı Kaydet
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Right Column: Chat Preview (Only when editing) */}
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ position: 'sticky', top: '104px' }}
                    >
                        <div className="admin-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--god-border)' }}>
                                <Smartphone size={20} color="var(--god-blue)" />
                                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Sohbet Önizlemesi</h2>
                            </div>

                            <div style={{
                                width: '100%',
                                background: '#0F0F0F',
                                borderRadius: '40px',
                                border: '12px solid #1a1a1a',
                                padding: '16px',
                                minHeight: '550px',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* Fake Notch */}
                                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120px', height: '20px', background: '#1a1a1a', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', zIndex: 10 }} />

                                {/* Chat Header Preview */}
                                <div style={{
                                    padding: '24px 16px 12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', gap: '10px'
                                }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ fontSize: '10px', color: '#fff', fontWeight: 'bold' }}>S</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>Sistem Mesajı</div>
                                        <div style={{ fontSize: '0.6rem', color: '#22c55e' }}>Çevrimiçi</div>
                                    </div>
                                </div>

                                {/* Chat Body Preview */}
                                <div style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ alignSelf: 'center', padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '0.6rem', color: '#666' }}>BUGÜN</div>

                                    {/* System Message Bubble */}
                                    <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                                        <div style={{
                                            padding: '12px 16px', background: '#1e1e1e', borderRadius: '18px', borderBottomLeftRadius: '4px',
                                            color: '#fff', fontSize: '0.85rem', lineHeight: '1.4', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                        }}>
                                            {current.body || "Mesaj içeriği buraya gelecek..."}
                                            <div style={{ textAlign: 'right', fontSize: '0.6rem', color: '#555', marginTop: '4px' }}>12:45</div>
                                        </div>
                                    </div>

                                    {/* Prompt Info */}
                                    <div style={{ marginTop: 'auto', textAlign: 'center', padding: '12px', background: `${currentTrigger.color}10`, borderRadius: '12px', border: `1px dashed ${currentTrigger.color}33` }}>
                                        <currentTrigger.icon size={16} color={currentTrigger.color} style={{ marginBottom: '8px' }} />
                                        <div style={{ fontSize: '0.7rem', color: currentTrigger.color, fontWeight: 'bold' }}>{currentTrigger.label}</div>
                                        <div style={{ fontSize: '0.6rem', color: '#666', marginTop: '4px' }}>{(current.delayMinutes || 0) > 0 ? `${current.delayMinutes} dk sonra tetiklenecek` : 'Anında gönderilecek'}</div>
                                    </div>
                                </div>

                                {/* Chat Input Preview */}
                                <div style={{
                                    padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <div style={{ flex: 1, height: '36px', background: '#1e1e1e', borderRadius: '18px', padding: '0 16px', display: 'flex', alignItems: 'center', color: '#444', fontSize: '0.75rem' }}>Mesaj yaz...</div>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.2)' }}>
                                        <Send size={16} color="#fff" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
