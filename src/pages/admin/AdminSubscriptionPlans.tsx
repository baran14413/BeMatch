import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Plus, Zap, Star, Crown, Check, Loader, LayoutTemplate } from 'lucide-react';
import '../../components/Admin.css';
import AdminModal from '../../components/AdminModal';

export interface SubscriptionPlan {
    id: string; // The plan ID, e.g., gold-weekly
    name: string;
    price: string;
    period: string;
    color: string;
    icon: string; // 'Zap', 'Star', 'Crown', etc.
    features: string[];
    popular: boolean;
    bestDeal: boolean;
    order: number;
    limits?: {
        dailySuperLikes: number | 'unlimited';
        dailyBoosts: number | 'unlimited';
        rewind: number | 'unlimited';
        hideAds: boolean;
        seeWhoLikedYou: boolean;
        incognitoMode: boolean;
    };
}

const ICONS: Record<string, React.ReactNode> = {
    Zap: <Zap size={24} />,
    Star: <Star size={24} />,
    Crown: <Crown size={24} />
};

const DEFAULT_PACKAGES: SubscriptionPlan[] = [
    {
        id: 'gold-weekly', name: 'Haftalık', price: '100', period: 'haftalık',
        color: '#ef4444', icon: 'Zap', popular: false, bestDeal: false, order: 1,
        features: ['Reklamsız Deneyim', 'Günde 5 Süper Beğeni', 'Günde 3 Profil Öne Çıkarma (Boost)', 'Günde 5 Geri Alma (Rewind)', 'Seni Kimlerin Beğendiğini Görme'],
        limits: { dailySuperLikes: 5, dailyBoosts: 3, rewind: 5, hideAds: true, seeWhoLikedYou: true, incognitoMode: false }
    },
    {
        id: 'gold-monthly', name: 'Aylık', price: '250', period: 'aylık',
        color: '#facc15', icon: 'Star', popular: true, bestDeal: false, order: 2,
        features: ['Reklamsız Deneyim', 'Gizli Mod (Gelişmiş Profil Kontrolü)', 'Günde 10 Süper Beğeni', 'Günde 10 Profil Öne Çıkarma (Boost)', 'Sınırsız Geri Alma', 'Seni Kimlerin Beğendiğini Görme'],
        limits: { dailySuperLikes: 10, dailyBoosts: 10, rewind: 'unlimited', hideAds: true, seeWhoLikedYou: true, incognitoMode: true }
    },
    {
        id: 'gold-yearly', name: 'Yıllık', price: '500', period: 'yıllık',
        color: '#b91c1c', icon: 'Crown', popular: false, bestDeal: true, order: 3,
        features: ['Tüm BeMatch Gold avantajlarına sınırsız erişim!'],
        limits: { dailySuperLikes: 'unlimited', dailyBoosts: 'unlimited', rewind: 'unlimited', hideAds: true, seeWhoLikedYou: true, incognitoMode: true }
    }
];

export default function AdminSubscriptionPlans() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

    const [deleteModal, setDeleteModal] = useState({ isOpen: false, targetId: '' });

    // Dinleme işlemi (onSnapshot)
    useEffect(() => {
        const q = query(collection(db, 'subscription_plans'), orderBy('order', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded: SubscriptionPlan[] = [];
            snapshot.forEach((doc) => {
                loaded.push({ id: doc.id, ...doc.data() } as SubscriptionPlan);
            });
            // If DB is empty, we'll show UI to seed them, but for the list we use an empty array
            // or we could show defaults here too. Let's show empty so the seed block appears.
            setPlans(loaded);
            setLoading(false);
        }, (err) => {
            console.error("Paketler getirilemedi:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const seedDefaultPlans = async () => {
        console.log("Seed işlemi başlatıldı...");
        const tid = toast.loading('Varsayılan paketler yükleniyor...');
        try {
            const defaultPlans: SubscriptionPlan[] = [
                {
                    id: 'gold-weekly', name: 'Haftalık', price: '100', period: 'haftalık',
                    color: '#ef4444', icon: 'Zap', popular: false, bestDeal: false, order: 1,
                    features: ['Reklamsız Deneyim', 'Günde 5 Süper Beğeni', 'Günde 3 Profil Öne Çıkarma (Boost)', 'Günde 5 Geri Alma (Rewind)', 'Seni Kimlerin Beğendiğini Görme']
                },
                {
                    id: 'gold-monthly', name: 'Aylık', price: '250', period: 'aylık',
                    color: '#facc15', icon: 'Star', popular: true, bestDeal: false, order: 2,
                    features: ['Reklamsız Deneyim', 'Gizli Mod (Gelişmiş Profil Kontrolü)', 'Günde 10 Süper Beğeni', 'Günde 10 Profil Öne Çıkarma (Boost)', 'Sınırsız Geri Alma', 'Seni Kimlerin Beğendiğini Görme']
                },
                {
                    id: 'gold-yearly', name: 'Yıllık', price: '500', period: 'yıllık',
                    color: '#b91c1c', icon: 'Crown', popular: false, bestDeal: true, order: 3,
                    features: ['Tüm BeMatch Gold avantajlarına sınırsız erişim!']
                }
            ];

            for (const plan of defaultPlans) {
                await setDoc(doc(db, 'subscription_plans', plan.id), plan);
            }
            toast.success('Varsayılan paketler başarıyla eklendi!', { id: tid });
        } catch (error) {
            console.error("Seed hatası:", error);
            toast.error('Hata: ' + (error as Error).message, { id: tid });
        }
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPlan) return;
        const tid = toast.loading('Paket kaydediliyor...');
        try {
            // Document reference
            await setDoc(doc(db, 'subscription_plans', editingPlan.id), editingPlan);
            toast.success('Paket başarıyla kaydedildi!', { id: tid });
            setIsEditModalOpen(false);
        } catch {
            toast.error('Kaydedilirken hata oluştu.', { id: tid });
        }
    };

    const confirmDelete = async () => {
        const tid = toast.loading('Paket siliniyor...');
        try {
            await deleteDoc(doc(db, 'subscription_plans', deleteModal.targetId));
            toast.success('Paket silindi!', { id: tid });
            setDeleteModal({ isOpen: false, targetId: '' });
        } catch {
            toast.error('Silinirken hata oluştu.', { id: tid });
        }
    };

    const openEditNew = () => {
        setEditingPlan({
            id: `plan-${Date.now()}`,
            name: '', price: '', period: 'aylık',
            color: '#3b82f6', icon: 'Star',
            popular: false, bestDeal: false, order: plans.length + 1,
            features: ['Özellik 1'],
            limits: {
                dailySuperLikes: 5,
                dailyBoosts: 1,
                rewind: 0,
                hideAds: true,
                seeWhoLikedYou: true,
                incognitoMode: false
            }
        });
        setIsEditModalOpen(true);
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LayoutTemplate size={24} color="#a855f7" /> Abonelik Paketleri
                    </h1>
                    <p className="admin-page-subtitle">Uygulamadaki satılık VIP/Premium paketleri yönetin. Değişiklikler anında canlıya yansır.</p>
                </div>

                <button
                    className="admin-btn-primary"
                    style={{ background: '#a855f7', padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={openEditNew}
                >
                    <Plus size={18} /> Yeni Paket Üret
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--god-text-muted)' }}>
                    <Loader className="spin" size={36} style={{ marginBottom: '16px' }} />
                    <p>Paketler yükleniyor...</p>
                </div>
            ) : plans.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="admin-card" style={{ padding: '20px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid #a855f7', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <LayoutTemplate color="#a855f7" />
                            <span style={{ color: '#fff', fontSize: '0.9rem' }}>Veritabanında hiç paket yok. <b>Yedek paketler</b> gösteriliyor. Bunları düzenlemek için önce veritabanına kaydetmelisiniz.</span>
                        </div>
                        <button className="admin-btn" style={{ background: '#a855f7', border: 'none', padding: '8px 16px' }} onClick={seedDefaultPlans}>Hemen Kaydet</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', padding: '0 20px', opacity: 0.7 }}>
                        {DEFAULT_PACKAGES.map((pkg) => (
                            <div key={pkg.id} style={{ position: 'relative', background: 'var(--god-surface-2)', border: '1px solid var(--god-border)', borderRadius: '24px', padding: '24px', filter: 'grayscale(0.5)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${pkg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pkg.color }}>
                                        {ICONS[pkg.icon] || <Star size={20} />}
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{pkg.name}</h3>
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: pkg.color, marginBottom: '16px' }}>{pkg.price}₺ <span style={{ fontSize: '0.8rem', color: 'var(--god-text-muted)' }}>/{pkg.period}</span></div>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {pkg.features.map((f, i) => <li key={i} style={{ fontSize: '0.85rem', color: 'var(--god-text-muted)', marginBottom: '4px' }}>• {f}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', padding: '0 20px' }}>
                    {plans.map((pkg: SubscriptionPlan) => (
                        <motion.div
                            key={pkg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            style={{
                                position: 'relative',
                                background: pkg.popular ? 'linear-gradient(145deg, #2a1111, #1a0808)' : 'var(--god-surface-2)',
                                border: `1px solid ${pkg.popular ? '#facc15' : pkg.bestDeal ? '#dc2626' : 'var(--god-border)'}`,
                                borderRadius: '24px',
                                padding: '24px',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Tags */}
                            {pkg.popular && (
                                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: '#facc15', color: '#000', padding: '4px 16px', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                                    EN POPÜLER
                                </div>
                            )}
                            {pkg.bestDeal && (
                                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: '#dc2626', color: '#fff', padding: '4px 16px', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                                    EN İYİ FIRSAT
                                </div>
                            )}

                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: (pkg.popular || pkg.bestDeal) ? '12px' : '0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '16px', background: `${pkg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pkg.color }}>
                                        {ICONS[pkg.icon] || <Star size={24} />}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{pkg.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: pkg.color }}>{pkg.price}₺</span>
                                            <span style={{ color: 'var(--god-text-muted)', fontSize: '0.85rem' }}>/{pkg.period}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => { setEditingPlan({ ...pkg }); setIsEditModalOpen(true); }}
                                        className="admin-btn-surface" style={{ padding: '6px', borderRadius: '8px', color: '#60a5fa' }} title="Düzenle">
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteModal({ isOpen: true, targetId: pkg.id })}
                                        className="admin-btn-surface" style={{ padding: '6px', borderRadius: '8px', color: '#ef4444' }} title="Sil">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Features */}
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {pkg.features && Array.isArray(pkg.features) && pkg.features.map((feature: string, i: number) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: 'var(--god-text-muted)', lineHeight: 1.4 }}>
                                        <Check size={18} color={pkg.color} style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <div style={{ fontSize: '0.75rem', color: 'var(--god-text-muted)', borderTop: '1px solid var(--god-border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Sıra: {pkg.order}</span>
                                <span style={{ fontFamily: 'monospace' }}>ID: {pkg.id}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Custom Edit Modal Overlay */}
            <AnimatePresence>
                {isEditModalOpen && editingPlan && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            style={{ background: 'var(--god-surface)', border: '1px solid var(--god-border)', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '24px', borderBottom: '1px solid var(--god-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}> Paketi Düzenle</h2>
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--god-text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                                </div>

                                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--god-text-muted)', marginBottom: '8px' }}>Paket ID (Örn: gold-aylik)</label>
                                            <input required type="text" className="admin-input" style={{ width: '100%' }} value={editingPlan.id} onChange={e => setEditingPlan({ ...editingPlan, id: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--god-text-muted)', marginBottom: '8px' }}>Panel Sırası</label>
                                            <input required type="number" className="admin-input" style={{ width: '100%' }} value={editingPlan.order} onChange={e => setEditingPlan({ ...editingPlan, order: Number(e.target.value) })} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--god-text-muted)', marginBottom: '8px' }}>Adı (Aylık vs)</label>
                                            <input required type="text" className="admin-input" style={{ width: '100%' }} value={editingPlan.name} onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--god-text-muted)', marginBottom: '8px' }}>Fiyat (₺)</label>
                                            <input required type="text" className="admin-input" style={{ width: '100%' }} value={editingPlan.price} onChange={e => setEditingPlan({ ...editingPlan, price: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--god-text-muted)', marginBottom: '8px' }}>Periyot</label>
                                            <input required type="text" className="admin-input" style={{ width: '100%' }} value={editingPlan.period} onChange={e => setEditingPlan({ ...editingPlan, period: e.target.value })} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--god-text-muted)', marginBottom: '8px' }}>Tema Rengi (HEX Code)</label>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <input type="color" value={editingPlan.color} onChange={e => setEditingPlan({ ...editingPlan, color: e.target.value })} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                                                <input required type="text" className="admin-input" style={{ flex: 1 }} value={editingPlan.color} onChange={e => setEditingPlan({ ...editingPlan, color: e.target.value })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--god-text-muted)', marginBottom: '8px' }}>İkon</label>
                                            <select className="admin-input" style={{ width: '100%' }} value={editingPlan.icon} onChange={e => setEditingPlan({ ...editingPlan, icon: e.target.value })}>
                                                <option value="Zap">Zap (Şimşek)</option>
                                                <option value="Star">Star (Yıldız)</option>
                                                <option value="Crown">Crown (Taç)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--god-border)' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--god-text-muted)', marginBottom: '12px', fontWeight: 'bold' }}>Özel Etiketler</label>
                                        <div style={{ display: 'flex', gap: '24px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={editingPlan.popular} onChange={e => setEditingPlan({ ...editingPlan, popular: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: '#facc15' }} />
                                                <span style={{ color: '#facc15', fontSize: '0.9rem', fontWeight: 'bold' }}>"En Popüler" Yap</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={editingPlan.bestDeal} onChange={e => setEditingPlan({ ...editingPlan, bestDeal: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: '#dc2626' }} />
                                                <span style={{ color: '#dc2626', fontSize: '0.9rem', fontWeight: 'bold' }}>"En İyi Fırsat" Yap</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--god-border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--god-gold)', fontWeight: 'bold' }}>Premium Limitleri (Sayı veya "unlimited")</label>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--god-text-muted)', marginBottom: '4px' }}>Günlük Super Like</label>
                                                <input
                                                    type="text" className="admin-input" style={{ width: '100%' }}
                                                    value={editingPlan.limits?.dailySuperLikes ?? 5}
                                                    onChange={e => {
                                                        const val = e.target.value === 'unlimited' ? 'unlimited' : Number(e.target.value);
                                                        setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits!, dailySuperLikes: isNaN(val as number) && val !== 'unlimited' ? 0 : val } })
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--god-text-muted)', marginBottom: '4px' }}>Günlük Boost</label>
                                                <input
                                                    type="text" className="admin-input" style={{ width: '100%' }}
                                                    value={editingPlan.limits?.dailyBoosts ?? 1}
                                                    onChange={e => {
                                                        const val = e.target.value === 'unlimited' ? 'unlimited' : Number(e.target.value);
                                                        setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits!, dailyBoosts: isNaN(val as number) && val !== 'unlimited' ? 0 : val } })
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--god-text-muted)', marginBottom: '4px' }}>Günlük Rewind (Geri Alma)</label>
                                                <input
                                                    type="text" className="admin-input" style={{ width: '100%' }}
                                                    value={editingPlan.limits?.rewind ?? 0}
                                                    onChange={e => {
                                                        const val = e.target.value === 'unlimited' ? 'unlimited' : Number(e.target.value);
                                                        setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits!, rewind: isNaN(val as number) && val !== 'unlimited' ? 0 : val } })
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={editingPlan.limits?.hideAds ?? false} onChange={e => setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits!, hideAds: e.target.checked } })} />
                                                <span style={{ fontSize: '0.85rem' }}>Reklamları Gizle</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={editingPlan.limits?.seeWhoLikedYou ?? false} onChange={e => setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits!, seeWhoLikedYou: e.target.checked } })} />
                                                <span style={{ fontSize: '0.85rem' }}>Beğenenleri Gör</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={editingPlan.limits?.incognitoMode ?? false} onChange={e => setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits!, incognitoMode: e.target.checked } })} />
                                                <span style={{ fontSize: '0.85rem' }}>Gizli Mod</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--god-text-muted)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>Paket Özellikleri (Her satıra bir özellik)</span>
                                        </label>
                                        <textarea
                                            className="admin-input"
                                            style={{ width: '100%', minHeight: '120px', resize: 'vertical', lineHeight: '1.5' }}
                                            value={editingPlan.features.join('\n')}
                                            onChange={e => {
                                                const lines = e.target.value.split('\n');
                                                setEditingPlan({ ...editingPlan, features: lines });
                                            }}
                                            placeholder="Örn: Günde 5 Süper Beğeni"
                                        />
                                    </div>
                                </div>

                                <div style={{ padding: '24px', borderTop: '1px solid var(--god-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button type="button" className="admin-btn-surface" onClick={() => setIsEditModalOpen(false)}>İptal</button>
                                    <button type="submit" className="admin-btn-primary" style={{ background: '#a855f7', padding: '10px 24px', borderRadius: '12px' }}>Kaydet ve Yayınla</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Standard Delete Confirm Modal */}
            <AdminModal
                isOpen={deleteModal.isOpen}
                onCancel={() => setDeleteModal({ isOpen: false, targetId: '' })}
                title="Paketi Sil"
                message="Bu abonelik paketini silmek kalıcı bir işlemdir. Yeni kullanıcılar artık bu paketi Satın Al ekranında göremeyecek. Emin misiniz?"
                type="confirm"
                iconType="danger"
                onConfirm={confirmDelete}
            />
        </div>
    );
}
