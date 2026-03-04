import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    Search, CreditCard, Loader, RefreshCw, CheckCircle, XCircle, Clock
} from 'lucide-react';
import '../../components/Admin.css';

interface Transaction {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    amount: number;
    currency: string;
    planId: string;
    status: 'success' | 'pending' | 'failed' | 'refunded';
    createdAt: number;
    receiptUrl?: string;
}

export default function AdminTransactions() {
    const [searchTerm, setSearchTerm] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        const q = query(
            collection(db, 'transactions'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded: Transaction[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                loaded.push({
                    id: doc.id,
                    userId: data.userId || '',
                    userName: data.userName || 'Bilinmiyor',
                    userEmail: data.userEmail || '',
                    amount: data.amount || 0,
                    currency: data.currency || 'TRY',
                    planId: data.planId || 'Bilinmiyor',
                    status: data.status || 'pending',
                    createdAt: data.createdAt || Date.now(),
                    receiptUrl: data.receiptUrl,
                });
            });
            setTransactions(loaded);
            setLoading(false);
        }, (err) => {
            console.error("İşlemler okunamadı:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const generateMockTransactions = async () => {
        setGenerating(true);
        const tid = toast.loading('Örnek finans verileri oluşturuluyor...');

        const mockData = [
            {
                userId: 'mock_user_1', userName: 'Ahmet Yılmaz', userEmail: 'ahmet@example.com',
                amount: 149.90, currency: 'TRY', planId: 'Haftalık Premium', status: 'success',
                createdAt: Date.now() - 1000 * 60 * 30 // 30 mins ago
            },
            {
                userId: 'mock_user_2', userName: 'Ayşe Kaya', userEmail: 'ayse.k@example.com',
                amount: 349.90, currency: 'TRY', planId: 'Aylık Premium', status: 'success',
                createdAt: Date.now() - 1000 * 60 * 60 * 2 // 2 hours ago
            },
            {
                userId: 'mock_user_3', userName: 'Caner Demir', userEmail: 'caner_d@example.com',
                amount: 899.90, currency: 'TRY', planId: 'Yıllık Premium', status: 'refunded',
                createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2 // 2 days ago
            },
            {
                userId: 'mock_user_4', userName: 'Zeynep Çelik', userEmail: 'zeynep.c@example.com',
                amount: 149.90, currency: 'TRY', planId: 'Haftalık Premium', status: 'failed',
                createdAt: Date.now() - 1000 * 60 * 60 * 5 // 5 hours ago
            },
            {
                userId: 'mock_user_5', userName: 'Burak Ozturk', userEmail: 'burakozturk@test.com',
                amount: 349.90, currency: 'TRY', planId: 'Aylık Premium', status: 'success',
                createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5 // 5 days ago
            }
        ];

        try {
            for (const mock of mockData) {
                await addDoc(collection(db, 'transactions'), mock);
            }
            toast.success('Test verileri başarıyla Firestore\'a eklendi.', { id: tid });
        } catch (err) {
            toast.error('Test verisi eklenirken hata: ' + (err as Error).message, { id: tid });
        } finally {
            setGenerating(false);
        }
    };

    const formatDateLocal = (timestamp: number) => {
        if (!timestamp) return 'Bilinmiyor';
        const date = new Date(timestamp);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredTransactions = transactions.filter(t =>
        t.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalRevenue = transactions
        .filter(t => t.status === 'success')
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <div>
            <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={24} color="#10b981" /> İşlem Geçmişi (Finans)
                    </h1>
                    <p className="admin-page-subtitle">Platform üzerindeki tüm satın alım ve abonelik işlemleri.</p>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--god-text-muted)', marginBottom: '4px' }}>Toplam Başarılı Gelir</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                        ₺{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            <div className="admin-card" style={{ padding: '24px' }}>
                {/* Gösterge Paneli / Test Butonu */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
                        <Search size={18} color="var(--god-text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            className="admin-input"
                            placeholder="İşlem No (ID), İsim veya Email ile ara..."
                            style={{ width: '100%', paddingLeft: '48px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        className="admin-btn-surface tooltip-trigger"
                        style={{ padding: '0 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', border: '1px dashed #3b82f6' }}
                        onClick={generateMockTransactions}
                        disabled={generating}
                        title="Tabloyu doldurmak için 5 adet rastgele finans işlemi üretir."
                    >
                        <RefreshCw size={16} className={generating ? 'spin' : ''} />
                        {generating ? 'Üretiliyor...' : 'Test Verisi Üret'}
                    </button>
                </div>

                {/* Data Grid */}
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--god-text-muted)' }}>
                        <Loader className="spin" size={32} style={{ marginBottom: '16px' }} />
                        <p>İşlemler yükleniyor...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--god-text-muted)' }}>
                        <CreditCard size={48} color="var(--god-border)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Henüz kayıtlı bir işlem yok.</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>Yapay verilerle tabloyu test etmek için sağ üstteki "Test Verisi Üret" butonunu kullanabilirsiniz.</p>
                    </div>
                ) : (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', minWidth: '220px' }}>KULLANICI BİLGİSİ</th>
                                    <th style={{ textAlign: 'left', minWidth: '180px' }}>PAKET DETAYI</th>
                                    <th style={{ textAlign: 'left', minWidth: '150px' }}>TUTAR</th>
                                    <th style={{ textAlign: 'left', minWidth: '160px' }}>İŞLEM BİLGİSİ</th>
                                    <th style={{ textAlign: 'right', minWidth: '120px' }}>DURUM</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((t, i) => (
                                    <motion.tr
                                        key={t.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--god-text)' }}>
                                                    {t.userName}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--god-text-muted)' }}>{t.userEmail}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '600', color: 'var(--god-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {t.planId.includes('Haftalık') ? '🎫' : t.planId.includes('Aylık') ? '💎' : t.planId.includes('Yıllık') ? '👑' : '📦'} {t.planId}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: t.status === 'success' ? '#10b981' : 'var(--god-text)' }}>
                                                ₺{t.amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--god-text-muted)', fontFamily: 'monospace' }}>
                                                    TXN: {t.id.substring(0, 12)}...
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--god-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} /> {formatDateLocal(t.createdAt)}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {t.status === 'success' ? (
                                                <span className="admin-badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', width: 'fit-content' }}>
                                                    <CheckCircle size={12} /> BAŞARILI
                                                </span>
                                            ) : t.status === 'refunded' ? (
                                                <span className="admin-badge" style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', border: '1px solid rgba(234,179,8,0.3)', width: 'fit-content' }}>
                                                    İADE EDİLDİ
                                                </span>
                                            ) : t.status === 'failed' ? (
                                                <span className="admin-badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', width: 'fit-content' }}>
                                                    <XCircle size={12} /> BAŞARISIZ
                                                </span>
                                            ) : (
                                                <span className="admin-badge admin-badge-neutral" style={{ width: 'fit-content' }}>
                                                    BEKLİYOR
                                                </span>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
