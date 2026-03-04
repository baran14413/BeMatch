import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getCountFromServer, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Send, BarChart2, Bell, Loader, CheckCircle, AlertTriangle, ChevronRight, ChevronLeft, MapPin, Users as UsersIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import '../../components/Admin.css';

interface AudienceFilters {
    city: string;
    gender: string;
    membership: string;
    activity: string;
}

export default function AdminMarketing() {
    const [step, setStep] = useState(1);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [targetLink, setTargetLink] = useState('/');

    // Filters
    const [filters, setFilters] = useState<AudienceFilters>({
        city: '',
        gender: 'all',
        membership: 'all',
        activity: 'any'
    });

    const [audienceCount, setAudienceCount] = useState<number | null>(null);
    const [isCounting, setIsCounting] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendProgress, setSendProgress] = useState(0);

    // Dynamic Audience Counting
    useEffect(() => {
        const countAudience = async () => {
            setIsCounting(true);
            try {
                const constraints = [];
                if (filters.city) constraints.push(where('locationCity', '==', filters.city));
                if (filters.gender !== 'all') constraints.push(where('gender', '==', filters.gender));
                if (filters.membership === 'free') constraints.push(where('isPremium', '==', false));
                if (filters.membership === 'premium') constraints.push(where('isPremium', '==', true));

                // Note: Complex activity filters (like last 24h) usually require composite indexes.
                // For now, we handle basic filters to avoid index errors for the user.

                const q = query(collection(db, 'users'), ...constraints);
                const snapshot = await getCountFromServer(q);
                setAudienceCount(snapshot.data().count);
            } catch (err) {
                console.error("Audience count error:", err);
                setAudienceCount(0);
            } finally {
                setIsCounting(false);
            }
        };

        const timeout = setTimeout(countAudience, 500); // Debounce
        return () => clearTimeout(timeout);
    }, [filters]);

    const handleSendBroadcast = async () => {
        if (!title || !body) {
            toast.error("Lütfen başlık ve mesaj içeriğini doldurun.");
            return;
        }

        setIsSending(true);
        setSendProgress(0);
        const tid = toast.loading('Hedef kitle taranıyor...');

        try {
            // 1. Fetch targeted users
            const constraints = [];
            if (filters.city) constraints.push(where('locationCity', '==', filters.city));
            if (filters.gender !== 'all') constraints.push(where('gender', '==', filters.gender));
            if (filters.membership === 'free') constraints.push(where('isPremium', '==', false));
            if (filters.membership === 'premium') constraints.push(where('isPremium', '==', true));

            const q = query(collection(db, 'users'), ...constraints);
            const snapshot = await getDocs(q);
            const userIds = snapshot.docs.map(d => d.id);

            if (userIds.length === 0) {
                toast.error("Bu kriterlere uygun kullanıcı bulunamadı.", { id: tid });
                setIsSending(false);
                return;
            }

            toast.loading(`${userIds.length} kullanıcıya gönderim başlatılıyor...`, { id: tid });

            // 2. Batch Notification Fan-out (Max 500 per batch)
            const BATCH_SIZE = 400; // Safer side
            for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
                const batch = writeBatch(db);
                const chunk = userIds.slice(i, i + BATCH_SIZE);

                chunk.forEach(uid => {
                    const notifRef = doc(collection(db, `users/${uid}/notifications`));
                    batch.set(notifRef, {
                        title: title,
                        body: body,
                        link: targetLink,
                        type: 'marketing',
                        read: false,
                        createdAt: serverTimestamp(),
                        icon: 'marketing'
                    });
                });

                await batch.commit();
                setSendProgress(Math.round(((i + chunk.length) / userIds.length) * 100));
            }

            // 3. Log the history
            await addDoc(collection(db, 'admin_settings/marketing_history/broadcasts'), {
                title,
                body,
                filters,
                audienceSize: userIds.length,
                sentAt: serverTimestamp()
            });

            toast.success(`${userIds.length} kullanıcıya bildirim başarıyla gönderildi!`, { id: tid });
            setStep(1);
            setTitle('');
            setBody('');
        } catch (err) {
            console.error("Broadcast error:", err);
            toast.error("Gönderim sırasında bir hata oluştu.", { id: tid });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Pazarlama ve Bildirim Merkezi</h1>
                    <p className="admin-page-subtitle">Seçili kitlenize anlık Push Bildirimleri (FCM & In-app) gönderin.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px', alignItems: 'flex-start' }}>
                {/* Left Column: Wizard Steps */}
                <div>
                    {/* Step Indicators */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', padding: '0 20px' }}>
                        {[1, 2, 3].map((num) => (
                            <div key={num} style={{ display: 'flex', alignItems: 'center', flex: num < 3 ? 1 : 'none' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    opacity: step >= num ? 1 : 0.3,
                                    color: step === num ? 'var(--god-blue)' : 'inherit'
                                }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%',
                                        background: step >= num ? 'var(--god-blue)' : 'var(--god-surface-hover)',
                                        color: step >= num ? '#fff' : 'inherit',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                                        boxShadow: step === num ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none'
                                    }}>
                                        {num}
                                    </div>
                                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                        {num === 1 ? 'Hedef Seç' : num === 2 ? 'İçerik Yaz' : 'Onayla'}
                                    </span>
                                </div>
                                {num < 3 && <div style={{ flex: 1, height: '2px', background: 'var(--god-border)', margin: '0 20px', opacity: step > num ? 1 : 0.3 }} />}
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="admin-card" style={{ padding: '32px' }}>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}><Target size={22} color="var(--god-blue)" /> Kime Gönderilecek?</h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="admin-field">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={14} /> Şehir / Bölge</label>
                                            <input
                                                type="text" className="admin-input" placeholder="Örn: Aydın, İstanbul, İzmir..."
                                                style={{ width: '100%' }}
                                                value={filters.city}
                                                onChange={e => setFilters({ ...filters, city: e.target.value })}
                                            />
                                            <p className="admin-help-text">Boş bırakırsanız tüm şehirlere gider.</p>
                                        </div>
                                        <div className="admin-field">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><UsersIcon size={14} /> Cinsiyet Hedefi</label>
                                            <select
                                                className="admin-input" style={{ width: '100%' }}
                                                value={filters.gender}
                                                onChange={e => setFilters({ ...filters, gender: e.target.value })}
                                            >
                                                <option value="all">Fark Etmez (Herkes)</option>
                                                <option value="female">Sadece Kadınlar</option>
                                                <option value="male">Sadece Erkekler</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="admin-field">
                                        <label>Üyelik Seviyesi</label>
                                        <select
                                            className="admin-input" style={{ width: '100%' }}
                                            value={filters.membership}
                                            onChange={e => setFilters({ ...filters, membership: e.target.value })}
                                        >
                                            <option value="all">Tüm Kullanıcılar (Ücretsiz + Premium)</option>
                                            <option value="free">Sadece Ücretsiz Kullanıcılar</option>
                                            <option value="premium">Sadece Premium Üyeler</option>
                                        </select>
                                    </div>

                                    <div className="admin-field">
                                        <label>Aktiflik Durumu</label>
                                        <select
                                            className="admin-input" style={{ width: '100%' }}
                                            value={filters.activity}
                                            onChange={e => setFilters({ ...filters, activity: e.target.value })}
                                        >
                                            <option value="any">Fark etmez (Tüm kayıtlılar)</option>
                                            <option value="active_24h">Son 24 saatte aktif olanlar</option>
                                            <option value="inactive_week">Son 1 Haftadır girmeyenler</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button className="admin-btn admin-btn-primary" style={{ padding: '12px 24px' }} onClick={() => setStep(2)}>
                                        İçerik Hazırla <ChevronRight size={18} style={{ marginLeft: '8px' }} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="admin-card" style={{ padding: '32px' }}>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}><Bell size={22} color="var(--god-blue)" /> Bildirimi Tasarla</h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div className="admin-field">
                                        <label>Bildirim Başlığı</label>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            placeholder="Örn: Aydın'da yeni eşleşmelerin seni bekliyor! 🌴"
                                            style={{ width: '100%', fontSize: '1.1rem' }}
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>

                                    <div className="admin-field">
                                        <label>Bildirim Metni (Açıklama)</label>
                                        <textarea
                                            className="admin-input"
                                            rows={3}
                                            placeholder="Bugün uygulamada çok kişi var, fırsatı kaçırma..."
                                            style={{ width: '100%', resize: 'none' }}
                                            value={body}
                                            onChange={(e) => setBody(e.target.value)}
                                        />
                                    </div>

                                    <div className="admin-field">
                                        <label>Tıklandığında Nereye Gitsin?</label>
                                        <select
                                            className="admin-input" style={{ width: '100%' }}
                                            value={targetLink}
                                            onChange={e => setTargetLink(e.target.value)}
                                        >
                                            <option value="/">Ana Sayfaya (Eşleşme Ekranı)</option>
                                            <option value="/matches">Matches / Sohbetlerim</option>
                                            <option value="/premium">Premium Satın Alma Sayfası</option>
                                            <option value="/profile">Profil Düzenleme</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
                                    <button className="admin-btn admin-btn-surface" onClick={() => setStep(1)}>
                                        <ChevronLeft size={18} /> Geri
                                    </button>
                                    <button className="admin-btn admin-btn-primary" onClick={() => setStep(3)}>
                                        Onayla & Gönder <ChevronRight size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="admin-card" style={{ padding: '32px' }}>
                                {isSending ? (
                                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                        <Loader className="spin" size={48} color="var(--god-blue)" style={{ margin: '0 auto 24px auto' }} />
                                        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Bildirimler Gönderiliyor...</h2>
                                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', maxWidth: '300px', margin: '0 auto 16px auto', overflow: 'hidden' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${sendProgress}%` }}
                                                style={{ height: '100%', background: 'var(--god-blue)' }}
                                            />
                                        </div>
                                        <p style={{ color: 'var(--god-text-muted)' }}>%{sendProgress} tamamlandı</p>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                        <Send size={48} color="var(--god-blue)" style={{ margin: '0 auto 24px auto' }} />
                                        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Son Onay: {audienceCount} Kişiye Gönderilecek</h2>
                                        <p style={{ color: 'var(--god-text-muted)', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px auto', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                            Bu işlem geri alınamaz. Seçtiğiniz kriterlerdeki tüm kullanıcıların telefonuna anlık bildirim düşecektir.
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <button
                                                className="admin-btn admin-btn-danger"
                                                style={{ padding: '16px 48px', fontSize: '1.1rem', fontWeight: 'bold' }}
                                                onClick={handleSendBroadcast}
                                            >
                                                BİLDİRİMİ ŞİMDİ YAYINLA
                                            </button>
                                            <button className="admin-btn admin-btn-surface" onClick={() => setStep(2)}>İptal Et / Geri Dön</button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Column: Preview & Estimation */}
                <div>
                    <div className="admin-card" style={{ padding: '24px', position: 'sticky', top: '104px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--god-border)' }}>
                            <Bell size={20} color="var(--god-blue)" />
                            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Telefon Önizlemesi</h2>
                        </div>

                        <div style={{
                            background: '#000',
                            borderRadius: '32px',
                            border: '10px solid #1a1a1a',
                            padding: '16px',
                            minHeight: '220px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            position: 'relative'
                        }}>
                            {/* Fake Camera Cutout */}
                            <div style={{ width: '60px', height: '18px', background: '#1a1a1a', borderRadius: '10px', margin: '0 auto 10px auto' }} />

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={title + body}
                                    initial={{ opacity: 0, scale: 0.9, y: -20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    style={{
                                        background: 'rgba(255,255,255,0.12)',
                                        backdropFilter: 'blur(15px)',
                                        borderRadius: '20px',
                                        padding: '16px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <div style={{ width: '22px', height: '22px', background: 'var(--god-primary-gradient)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>BM</div>
                                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', letterSpacing: '0.5px' }}>BEMATCH</span>
                                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>az önce</span>
                                    </div>
                                    <div style={{ fontWeight: '800', fontSize: '0.9rem', marginBottom: '4px', color: '#fff' }}>
                                        {title || "Bildirim Başlığı..."}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', lineHeight: '1.4' }}>
                                        {body || "Kullanıcının karşılayacağı mesaj içeriği bu alanda yer alacak."}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="admin-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <BarChart2 size={24} color="var(--god-gold)" />
                            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Tahmini Erişim</h2>
                        </div>

                        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--god-border)', textAlign: 'center' }}>
                            {isCounting ? (
                                <Loader className="spin" style={{ margin: '20px auto' }} />
                            ) : (
                                <>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--god-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                                        Filtrelenen Kitle
                                    </div>
                                    <div style={{ fontSize: '3.5rem', fontWeight: '900', color: audienceCount === 0 ? 'var(--god-red)' : 'var(--god-green)', lineHeight: 1 }}>
                                        {audienceCount?.toLocaleString() || 0}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--god-text-dim)', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                        {audienceCount === 0 ? (
                                            <><AlertTriangle size={14} /> Kriterlere göre kimse bulunamadı</>
                                        ) : (
                                            <><CheckCircle size={14} /> Aktif ve Ulaşılabilir Cihaz</>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Recent History Shortcut */}
                        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--god-border)' }}>
                            <h3 style={{ fontSize: '0.8rem', color: 'var(--god-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Son Gönderimler</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ fontSize: '0.75rem', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', color: 'var(--god-text-muted)' }}>
                                    Henüz geçmiş gönderim bulunmuyor.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
