import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    Megaphone,
    Plus,
    Trash2,
    Edit2,
    CheckCircle,
    XCircle,
    Clock,
    Save,
    X,
    RefreshCw,
    ExternalLink,
    Star,
    AlertTriangle,
    Info,
    Smartphone,
    Eye
} from 'lucide-react';
import '../../components/Admin.css';

interface Announcement {
    id: string;
    title: string;
    body: string;
    imageUrl?: string;
    type: 'info' | 'warning' | 'promo' | 'update';
    isActive: boolean;
    buttonText?: string;
    buttonLink?: string;
    createdAt: { seconds: number; nanoseconds: number } | null | undefined;
    priority: number;
}

export default function AdminAnnouncements() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [current, setCurrent] = useState<Partial<Announcement>>({
        title: '',
        body: '',
        type: 'info',
        isActive: true,
        priority: 0,
        buttonText: 'Hemen İncele',
        buttonLink: ''
    });

    useEffect(() => {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snapshot) => {
            const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
            setAnnouncements(loaded);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleSave = async () => {
        if (!current.title || !current.body) {
            toast.error("Başlık ve mesaj alanları zorunludur.");
            return;
        }

        const tid = toast.loading('Duyuru kaydediliyor...');
        try {
            const data = {
                ...current,
                updatedAt: serverTimestamp(),
                createdAt: current.id ? current.createdAt : serverTimestamp()
            };

            if (current.id) {
                await setDoc(doc(db, 'announcements', current.id), data);
                toast.success('Duyuru güncellendi', { id: tid });
            } else {
                const newRef = doc(collection(db, 'announcements'));
                await setDoc(newRef, data);
                toast.success('Yeni duyuru oluşturuldu', { id: tid });
            }
            setIsEditing(false);
            setCurrent({
                title: '',
                body: '',
                type: 'info',
                isActive: true,
                priority: 0,
                buttonText: 'Hemen İncele',
                buttonLink: ''
            });
        } catch (err) {
            console.error(err);
            toast.error('Kaydedilemedi', { id: tid });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) return;
        try {
            await deleteDoc(doc(db, 'announcements', id));
            toast.success("Duyuru silindi");
        } catch {
            toast.error("Silme hatası");
        }
    };

    const toggleStatus = async (ann: Announcement) => {
        try {
            await updateDoc(doc(db, 'announcements', ann.id), {
                isActive: !ann.isActive
            });
            toast.success(ann.isActive ? "Duyuru yayından kaldırıldı" : "Duyuru yayına alındı");
        } catch {
            toast.error("Durum güncellenemedi");
        }
    };

    const forceShow = () => {
        sessionStorage.removeItem('lastSeenAnnouncement');
        toast.success("Session temizlendi. Uygulama ana sayfasına gittiğinizde duyuru görünecektir.");
    };

    if (loading) {
        return (
            <div className="admin-loading-container">
                <RefreshCw className="spin" size={32} color="var(--god-blue)" />
                <p>Duyurular yükleniyor...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Duyurular ve Pop-up Yönetimi</h1>
                    <p className="admin-page-subtitle">Kullanıcılara gösterilecek global mesajları ve kampanya görsellerini yönetin.</p>
                </div>
                <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => {
                        setCurrent({ title: '', body: '', type: 'info', isActive: true, priority: 0, buttonText: 'Hemen İncele', buttonLink: '' });
                        setIsEditing(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={18} /> Yeni Duyuru Oluştur
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '1fr 400px' : '1fr', gap: '32px', alignItems: 'flex-start' }}>

                {/* Main List or Editor */}
                <div>
                    {!isEditing ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                            {announcements.map(ann => (
                                <motion.div
                                    key={ann.id}
                                    layout
                                    className="admin-card"
                                    style={{
                                        padding: '20px',
                                        border: ann.isActive ? '1px solid var(--god-green)' : '1px solid var(--god-border)',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div className={`admin-badge ${ann.type === 'warning' ? 'admin-badge-danger' : ann.type === 'promo' ? 'admin-badge-gold' : 'admin-badge-blue'}`}>
                                            {ann.type.toUpperCase()}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="admin-btn-surface" title="Test Et" onClick={() => forceShow()}>
                                                <Eye size={16} />
                                            </button>
                                            <button className="admin-btn-surface" title="Yayını Değiştir" onClick={() => toggleStatus(ann)}>
                                                {ann.isActive ? <XCircle size={16} color="var(--god-red)" /> : <CheckCircle size={16} color="var(--god-green)" />}
                                            </button>
                                            <button className="admin-btn-surface" onClick={() => { setCurrent(ann); setIsEditing(true); }}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="admin-btn-surface" onClick={() => handleDelete(ann.id)}>
                                                <Trash2 size={16} color="var(--god-red)" />
                                            </button>
                                        </div>
                                    </div>

                                    {ann.imageUrl && (
                                        <div style={{ width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', background: '#000' }}>
                                            <img src={ann.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                                        </div>
                                    )}

                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>{ann.title}</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--god-text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
                                        {ann.body}
                                    </p>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--god-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--god-text-dim)' }}>
                                            <Clock size={12} /> {ann.createdAt?.seconds ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : 'Bugün'}
                                        </div>
                                        <div>
                                            {ann.isActive ? (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--god-green)', fontWeight: 'bold' }}>● YAYINDA</span>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--god-text-dim)' }}>TASLAK</span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {announcements.length === 0 && (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0', color: 'var(--god-text-muted)' }}>
                                    <Megaphone size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                                    <p>Henüz duyuru oluşturulmadı.</p>
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
                                <h2 style={{ margin: 0 }}>Duyuru Editörü</h2>
                                <button className="admin-btn-surface" onClick={() => setIsEditing(false)}><X size={20} /></button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="admin-field" style={{ gridColumn: 'span 2' }}>
                                    <label>Duyuru Başlığı</label>
                                    <input
                                        type="text" className="admin-input" style={{ width: '100%' }}
                                        value={current.title}
                                        onChange={e => setCurrent({ ...current, title: e.target.value })}
                                        placeholder="Örn: Yeni Yıl Kampanyası!"
                                    />
                                </div>

                                <div className="admin-field" style={{ gridColumn: 'span 2' }}>
                                    <label>Duyuru İçeriği</label>
                                    <textarea
                                        className="admin-input" style={{ width: '100%', resize: 'none' }}
                                        rows={4}
                                        value={current.body}
                                        onChange={e => setCurrent({ ...current, body: e.target.value })}
                                        placeholder="Kullanıcılara gösterilecek ana mesaj..."
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Duyuru Tipi</label>
                                    <select
                                        className="admin-input" style={{ width: '100%' }}
                                        value={current.type}
                                        onChange={e => setCurrent({ ...current, type: e.target.value as Announcement['type'] })}
                                    >
                                        <option value="info">Bilgilendirme (Mavi)</option>
                                        <option value="promo">Kampanya (Altın)</option>
                                        <option value="warning">Uyarı (Kırmızı)</option>
                                        <option value="update">Güncelleme (Mor)</option>
                                    </select>
                                </div>

                                <div className="admin-field">
                                    <label>Görsel URL (Opsiyonel)</label>
                                    <input
                                        type="text" className="admin-input" style={{ width: '100%' }}
                                        value={current.imageUrl || ''}
                                        onChange={e => setCurrent({ ...current, imageUrl: e.target.value })}
                                        placeholder="https://gorsel-linki.com/img.jpg"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Buton Metni</label>
                                    <input
                                        type="text" className="admin-input" style={{ width: '100%' }}
                                        value={current.buttonText}
                                        onChange={e => setCurrent({ ...current, buttonText: e.target.value })}
                                        placeholder="Hemen İncele"
                                    />
                                </div>

                                <div className="admin-field">
                                    <label>Buton Linki (Opsiyonel)</label>
                                    <input
                                        type="text" className="admin-input" style={{ width: '100%' }}
                                        value={current.buttonLink}
                                        onChange={e => setCurrent({ ...current, buttonLink: e.target.value })}
                                        placeholder="/premium veya https://..."
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                <button className="admin-btn-surface" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>Vazgeç</button>
                                <button className="admin-btn admin-btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                                    <Save size={18} style={{ marginRight: '8px' }} /> Duyuruyu Kaydet
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Right Column: Device Preview (Only when editing) */}
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ position: 'sticky', top: '104px' }}
                    >
                        <div className="admin-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--god-border)' }}>
                                <Smartphone size={20} color="var(--god-blue)" />
                                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Pop-up Önizlemesi</h2>
                            </div>

                            <div style={{
                                width: '100%',
                                background: '#000',
                                borderRadius: '40px',
                                border: '12px solid #1a1a1a',
                                padding: '16px',
                                minHeight: '550px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                backgroundSize: 'cover'
                            }}>
                                {/* Fake Notch */}
                                <div style={{ position: 'absolute', top: 0, width: '120px', height: '24px', background: '#1a1a1a', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', zIndex: 10 }} />

                                {/* Modal Content Preview */}
                                <div style={{
                                    width: '100%',
                                    backgroundColor: '#1E1E1E',
                                    borderRadius: '24px',
                                    overflow: 'hidden',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    {current.imageUrl ? (
                                        <div style={{ width: '100%', height: '180px', position: 'relative' }}>
                                            <img src={current.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 60%, #1E1E1E)' }} />
                                        </div>
                                    ) : (
                                        <div style={{ height: '32px' }} />
                                    )}

                                    <div style={{ padding: '20px', textAlign: 'center' }}>
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                            padding: '4px 10px', borderRadius: '20px',
                                            background: current.type === 'promo' ? 'rgba(255, 215, 0, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                            color: current.type === 'promo' ? '#ffd700' : '#3b82f6',
                                            fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '12px'
                                        }}>
                                            {current.type === 'promo' && <Star size={10} fill="currentColor" />}
                                            {current.type === 'warning' && <AlertTriangle size={10} />}
                                            {current.type === 'update' && <RefreshCw size={10} />}
                                            {current.type === 'info' && <Info size={10} />}
                                            {current.type?.toUpperCase()}
                                        </div>
                                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#fff' }}>{current.title || "Duyuru Başlığı..."}</h3>
                                        <p style={{ fontSize: '0.85rem', color: '#999', lineHeight: '1.4', marginBottom: '20px' }}>{current.body || "Mesaj içeriği burada görünecek."}</p>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{
                                                padding: '12px', background: 'var(--primary-gradient)', color: '#fff',
                                                borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                            }}>
                                                {current.buttonText || 'Hemen İncele'}
                                                {current.buttonLink && <ExternalLink size={14} />}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#555' }}>Kapat</div>
                                        </div>
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
