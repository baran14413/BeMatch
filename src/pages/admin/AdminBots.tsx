import { useState, useEffect } from 'react';
import { Bot, MapPin, Trash2, Plus, Users, Filter, Loader, Search, RefreshCw, CheckCircle2, X } from 'lucide-react';
import { collection, onSnapshot, query, where, deleteDoc, doc, limit, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { generateBots, TURKEY_CITIES } from '../../utils/botGenerator';
import { toast } from 'react-hot-toast';
import '../../components/Admin.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
    <div className="admin-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', backgroundColor: color, filter: 'blur(40px)', opacity: 0.15, borderRadius: '50%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', position: 'relative', zIndex: 2 }}>
            <div>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--god-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>{title}</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--god-text)', margin: 0 }}>{value}</p>
            </div>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', color: color }}>
                <Icon size={20} />
            </div>
        </div>
    </div>
);

export default function AdminBots() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [bots, setBots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState('all');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deleting, setDeleting] = useState(false);
    const [showGenModal, setShowGenModal] = useState(false);

    // Custom Generation State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [genOptions, setGenOptions] = useState<any>({
        count: 10,
        city: 'İstanbul',
        gender: 'random'
    });

    useEffect(() => {
        const q = query(
            collection(db, 'users'),
            where('isBot', '==', true),
            limit(2000)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const loadedBots: any[] = [];
            snapshot.forEach((doc) => {
                loadedBots.push({ id: doc.id, ...doc.data() });
            });
            // Firestore updates can trigger this, so we reset selection if count changes significantly
            setBots(loadedBots);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredBots = bots.filter(bot => {
        const query = searchTerm.toLowerCase();
        const cityMatch = bot.locationCity?.toLowerCase().includes(query);
        const nameMatch = bot.firstName?.toLowerCase().includes(query);
        const matchesSearch = cityMatch || nameMatch;
        const matchesGender = genderFilter === 'all' || bot.gender === genderFilter;
        return matchesSearch && matchesGender;
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredBots.map(b => b.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(item => item !== id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`${selectedIds.length} botu silmek istediğinize emin misiniz?`)) return;

        setDeleting(true);
        try {
            const chunks = [];
            for (let i = 0; i < selectedIds.length; i += 500) {
                chunks.push(selectedIds.slice(i, i + 500));
            }

            for (const chunk of chunks) {
                const batch = writeBatch(db);
                chunk.forEach(id => {
                    batch.delete(doc(db, 'users', id));
                });
                await batch.commit();
            }

            toast.success(`${selectedIds.length} bot başarıyla silindi.`);
            setSelectedIds([]);
        } catch (error) {
            console.error(error);
            toast.error('Silme işlemi sırasında bir hata oluştu.');
        } finally {
            setDeleting(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGenerate = async (e: any) => {
        e.preventDefault();
        setGenerating(true);
        setProgress({ current: 0, total: genOptions.count });

        try {
            await generateBots(genOptions, (current, total) => {
                setProgress({ current, total });
            });
            toast.success(`${genOptions.count} bot başarıyla oluşturuldu!`);
            setShowGenModal(false);
        } catch (error) {
            console.error(error);
            toast.error('Bot oluşturulurken bir hata oluştu.');
        } finally {
            setGenerating(false);
            setProgress({ current: 0, total: 0 });
        }
    };

    const handleDeleteBot = async (id: string) => {
        if (!window.confirm('Bu botu silmek istediğinize emin misiniz?')) return;
        try {
            await deleteDoc(doc(db, 'users', id));
            toast.success('Bot silindi');
            setSelectedIds(prev => prev.filter(item => item !== id));
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error('Silme başarısız');
        }
    };

    return (
        <div className="admin-viewport">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title"><Bot size={32} /> Bot Yönetimi</h1>
                    <p className="admin-page-subtitle">Sistemdeki botları şehirlere göre yönetin ve yeni botlar üretin.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {selectedIds.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'slideIn 0.3s ease' }}>
                            <span style={{ color: 'var(--god-text-muted)', fontSize: '0.85rem' }}>{selectedIds.length} seçildi</span>
                            <button
                                className="admin-btn admin-btn-danger"
                                style={{ boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)' }}
                                onClick={handleBulkDelete}
                                disabled={deleting}
                            >
                                {deleting ? <RefreshCw size={18} className="spin" /> : <Trash2 size={18} />}
                                Seçilenleri Sil
                            </button>
                        </div>
                    )}
                    <button
                        className="admin-btn admin-btn-primary"
                        onClick={() => setShowGenModal(true)}
                        disabled={generating}
                    >
                        <Plus size={18} />
                        Yeni Bot Üret
                    </button>
                </div>
            </div>

            {/* BOT GENERATION MODAL */}
            {showGenModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="admin-card" style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative' }}>
                        <button
                            onClick={() => !generating && setShowGenModal(false)}
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--god-text-muted)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '8px' }}>🤖 Bot Üretim Merkezi</h2>
                        <p style={{ color: 'var(--god-text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>İstediğiniz kriterlere göre yeni bot kullanıcılar oluşturun.</p>

                        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>ADET</label>
                                <input
                                    type="number"
                                    className="admin-input"
                                    style={{ width: '100%' }}
                                    min="1"
                                    max="500"
                                    value={genOptions.count}
                                    onChange={(e) => setGenOptions({ ...genOptions, count: parseInt(e.target.value) })}
                                    disabled={generating}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>ŞEHİR</label>
                                <select
                                    className="admin-input"
                                    style={{ width: '100%' }}
                                    value={genOptions.city}
                                    onChange={(e) => setGenOptions({ ...genOptions, city: e.target.value })}
                                    disabled={generating}
                                >
                                    {TURKEY_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>CİNSİYET</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                    {['random', 'male', 'female'].map(g => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setGenOptions({ ...genOptions, gender: g })}
                                            className="admin-btn"
                                            style={{
                                                background: genOptions.gender === g ? 'var(--god-blue)' : 'rgba(255,255,255,0.05)',
                                                border: genOptions.gender === g ? '1px solid var(--god-blue)' : '1px solid var(--god-border)',
                                                color: 'white',
                                                textTransform: 'capitalize'
                                            }}
                                            disabled={generating}
                                        >
                                            {g === 'random' ? 'Karışık' : (g === 'male' ? 'Erkek' : 'Kadın')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {generating && (
                                <div style={{ marginTop: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                                        <span>Üretiliyor...</span>
                                        <span>{progress.current} / {progress.total}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(progress.current / progress.total) * 100}%`, height: '100%', backgroundColor: 'var(--god-blue)', transition: 'width 0.3s ease' }} />
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                                style={{ width: '100%', height: '48px', marginTop: '10px' }}
                                disabled={generating}
                            >
                                {generating ? <RefreshCw className="spin" size={20} /> : <Plus size={20} />}
                                {generating ? 'Botlar Oluşturuluyor...' : 'Üretime Başla'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <StatCard title="Toplam Bot" value={bots.length} icon={Bot} color="var(--god-blue)" />
                <StatCard title="Kadın Bot" value={bots.filter(b => b.gender === 'female').length} icon={Users} color="#ec4899" />
                <StatCard title="Erkek Bot" value={bots.filter(b => b.gender === 'male').length} icon={Users} color="var(--god-green)" />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--god-text-dim)' }} />
                    <input
                        type="text"
                        className="admin-input"
                        style={{ paddingLeft: '48px', width: '100%', height: '48px' }}
                        placeholder="İsim veya şehir ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--god-border)', height: '48px' }}>
                    <Filter size={16} style={{ color: 'var(--god-text-dim)' }} />
                    <select
                        className="admin-input"
                        style={{ border: 'none', background: 'transparent', padding: '0', height: '100%', cursor: 'pointer', fontSize: '0.85rem' }}
                        value={genderFilter}
                        onChange={(e) => setGenderFilter(e.target.value)}
                    >
                        <option value="all" style={{ background: '#09090b' }}>Tüm Cinsiyetler</option>
                        <option value="male" style={{ background: '#09090b' }}>Erkek</option>
                        <option value="female" style={{ background: '#09090b' }}>Kadın</option>
                    </select>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px', paddingLeft: '24px' }}>
                                    <input
                                        type="checkbox"
                                        checked={filteredBots.length > 0 && selectedIds.length === filteredBots.length}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                    />
                                </th>
                                <th>Bot</th>
                                <th>Şehir</th>
                                <th>Cinsiyet</th>
                                <th>Durum</th>
                                <th>Oluşturma</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                                        <Loader className="spin" /> Yükleniyor...
                                    </td>
                                </tr>
                            ) : filteredBots.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--god-text-muted)' }}>Bot bulunamadı.</td>
                                </tr>
                            ) : filteredBots.map((bot) => (
                                <tr key={bot.id} className={selectedIds.includes(bot.id) ? 'selected-row' : ''}>
                                    <td style={{ paddingLeft: '24px' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(bot.id)}
                                            onChange={(e) => handleSelectOne(bot.id, e.target.checked)}
                                        />
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ position: 'relative' }}>
                                                <img src={bot.photos?.[0]} alt="" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', backgroundColor: 'var(--god-green)', borderRadius: '50%', border: '2px solid var(--god-bg)' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{bot.firstName}</span>
                                                {bot.isPremium && <span style={{ fontSize: '0.7rem', color: 'var(--god-gold)', fontWeight: 'bold' }}>PREMIUM 👑</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="admin-badge admin-badge-neutral" style={{ padding: '6px 12px' }}>
                                            <MapPin size={12} /> {bot.locationCity}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`admin-badge ${bot.gender === 'female' ? 'admin-badge-purple' : 'admin-badge-success'}`} style={{ minWidth: '70px', justifyContent: 'center' }}>
                                            {bot.gender === 'female' ? 'Kadın' : 'Erkek'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--god-green)', fontSize: '0.75rem', fontWeight: '800' }}>
                                            <CheckCircle2 size={12} /> AKTİF
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--god-text-dim)', fontSize: '0.8rem', fontWeight: '500' }}>
                                        {new Date(bot.createdAt?.seconds * 1000).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td>
                                        <button
                                            className="admin-btn admin-btn-danger"
                                            style={{ padding: '8px', opacity: selectedIds.includes(bot.id) ? 1 : 0.6 }}
                                            onClick={() => handleDeleteBot(bot.id)}
                                            title="Botu Sil"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
