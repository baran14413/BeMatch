import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { motion } from 'framer-motion'
import { ChevronLeft, Zap, Star, Crown, Check, Loader } from 'lucide-react'
import { purchaseProduct } from '../utils/billing'
import './Premium.css'

const ICONS: Record<string, any> = {
    Zap: Zap,
    Star: Star,
    Crown: Crown
}

const DEFAULT_PACKAGES = [
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

export default function Premium() {
    const navigate = useNavigate()
    const [packages, setPackages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const q = query(collection(db, 'subscription_plans'), orderBy('order', 'asc'))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded: any[] = []
            snapshot.forEach(doc => {
                loaded.push({ id: doc.id, ...doc.data() })
            })
            // If DB is empty, use defaults
            setPackages(loaded.length > 0 ? loaded : DEFAULT_PACKAGES)
            setLoading(false)
        }, (err) => {
            console.error("Satın alma paketleri yüklenemedi:", err)
            // Even on error, show defaults so user isn't stuck
            setPackages(DEFAULT_PACKAGES)
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    const handlePurchase = async (basePlanId: string) => {
        // bematch_gold_sub is the subscription product ID in Play Console
        // basePlanId is one of: gold-weekly, gold-monthly, gold-yearly
        const success = await purchaseProduct('bematch_gold_sub', basePlanId)
        if (success) {
            alert('Satın alma başarılı! BeMatch Gold aktif edildi. 🎉')
            navigate(-1)
        }
    }

    // Packages array removed (dynamically fetched)

    return (
        <div className="premium-container" style={{ background: '#0f0f0f', minHeight: '100vh', color: 'white', paddingBottom: '40px' }}>
            {/* Header */}
            <header className="premium-header" style={{ padding: '20px', display: 'flex', alignItems: 'center', background: 'transparent', borderBottom: 'none' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                >
                    <ChevronLeft size={24} />
                </button>
            </header>

            {/* Content */}
            <div className="premium-content" style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <motion.div
                    className="premium-intro"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ textAlign: 'center', marginBottom: '20px' }}
                >
                    <Crown size={56} color="#facc15" style={{ margin: '0 auto 10px auto' }} />
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #facc15, #ca8a04)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        BeMatch Gold
                    </h1>
                    <p style={{ color: '#9ca3af', fontSize: '0.95rem', marginTop: '8px' }}>Eşleşme şansını maksimuma çıkar!</p>
                </motion.div>

                <div className="packages-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '400px' }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                            <Loader className="spin" size={32} style={{ marginBottom: '16px', margin: '0 auto' }} />
                            <p>Paketler yükleniyor...</p>
                        </div>
                    ) : packages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                            Şu anda satın alınabilir bir paket bulunmuyor.
                        </div>
                    ) : packages.map((pkg, idx) => {
                        const IconComponent = ICONS[pkg.icon] || Star;
                        return (
                            <motion.div
                                key={pkg.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.15, duration: 0.5 }}
                                style={{
                                    position: 'relative',
                                    background: pkg.popular ? 'linear-gradient(145deg, #2a1111, #1a0808)' : '#171717',
                                    border: `1px solid ${pkg.popular ? '#facc15' : pkg.bestDeal ? '#b91c1c' : '#3f3f46'}`,
                                    borderRadius: '24px',
                                    padding: '24px',
                                    overflow: 'hidden',
                                    boxShadow: pkg.popular ? '0 10px 30px rgba(250, 204, 21, 0.1)' : 'none'
                                }}
                            >
                                {pkg.popular && (
                                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: '#facc15', color: '#000', padding: '4px 16px', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        En Popüler
                                    </div>
                                )}
                                {pkg.bestDeal && (
                                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: '#dc2626', color: '#fff', padding: '4px 16px', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        En İyi Fırsat
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', marginTop: (pkg.popular || pkg.bestDeal) ? '12px' : '0' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '16px', background: `${pkg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <IconComponent size={28} color={pkg.color} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{pkg.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: pkg.color }}>{pkg.price}₺</span>
                                            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>/{pkg.period}</span>
                                        </div>
                                    </div>
                                </div>

                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {pkg.features && Array.isArray(pkg.features) && pkg.features.map((feature: string, i: number) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: '#d1d5db', lineHeight: 1.4 }}>
                                            <Check size={18} color={pkg.color} style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handlePurchase(pkg.id)}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '16px',
                                        background: pkg.popular ? 'linear-gradient(135deg, #facc15, #ca8a04)' : pkg.bestDeal ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : '#27272a',
                                        color: pkg.popular ? '#000' : '#fff',
                                        border: 'none',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        boxShadow: pkg.popular ? '0 4px 14px rgba(250, 204, 21, 0.3)' : pkg.bestDeal ? '0 4px 14px rgba(239, 68, 68, 0.3)' : 'none'
                                    }}
                                >
                                    Seç ve Devam Et
                                </button>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
