import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import {
    Search,
    Save,
    RefreshCw,
    Upload,
    Globe,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import '../../components/Admin.css';

// Import local translations for sync feature
import translationTR from '../../locales/tr/translation.json';
import translationEN from '../../locales/en/translation.json';
import translationDE from '../../locales/de/translation.json';

const LOCAL_RESOURCES: Record<string, unknown> = {
    tr: translationTR,
    en: translationEN,
    de: translationDE
};

export default function AdminTranslations() {
    const [activeLang, setActiveLang] = useState('tr');
    const [translations, setTranslations] = useState<Record<string, unknown>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modifiedKeys, setModifiedKeys] = useState<Set<string>>(new Set());

    useEffect(() => {
        setLoading(true);
        const unsub = onSnapshot(doc(db, 'i18n', activeLang), (docSnap) => {
            if (docSnap.exists()) {
                setTranslations(docSnap.data());
            } else {
                setTranslations({});
            }
            setLoading(false);
            setModifiedKeys(new Set());
        });
        return () => unsub();
    }, [activeLang]);

    const handleValueChange = (key: string, value: string) => {
        setTranslations((prev) => ({ ...prev, [key]: value }));
        setModifiedKeys((prev) => new Set(prev).add(key));
    };

    const saveTranslations = async () => {
        setSaving(true);
        const tid = toast.loading(`${activeLang.toUpperCase()} çevirileri kaydediliyor...`);
        try {
            await setDoc(doc(db, 'i18n', activeLang), translations);
            toast.success('Başarıyla kaydedildi!', { id: tid });
            setModifiedKeys(new Set());
        } catch (error) {
            console.error(error);
            toast.error('Kaydedilirken hata oluştu.', { id: tid });
        } finally {
            setSaving(false);
        }
    };

    const syncFromLocal = async () => {
        if (!window.confirm(`${activeLang.toUpperCase()} dilini yerel dosyalardan (JSON) Firestore'a aktarmak istediğinize emin misiniz? Bu işlem Firestore'daki mevcut verilerin üzerine yazacaktır.`)) return;

        setSaving(true);
        const tid = toast.loading('Yerel dosyalarla senkronize ediliyor...');
        try {
            // Flatten the local JSON structure for easy management
            const flatten = (obj: Record<string, unknown>, prefix = ''): Record<string, unknown> => {
                return Object.keys(obj).reduce((acc: Record<string, unknown>, k) => {
                    const pre = prefix.length ? prefix + '.' : '';
                    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
                        Object.assign(acc, flatten(obj[k] as Record<string, unknown>, pre + k));
                    } else {
                        acc[pre + k] = obj[k];
                    }
                    return acc;
                }, {});
            };

            // Check if the active language has local resources defined
            if (!LOCAL_RESOURCES[activeLang]) {
                throw new Error(`Local resources for language '${activeLang}' are not available.`);
            }

            const flattenedLocal = flatten(LOCAL_RESOURCES[activeLang] as Record<string, unknown>);
            await setDoc(doc(db, 'i18n', activeLang), flattenedLocal);
            toast.success('Senkronizasyon başarılı!', { id: tid });
        } catch (error) {
            console.error(error);
            toast.error('Senkronizasyon hatası.', { id: tid });
        } finally {
            setSaving(false);
        }
    };

    const filteredKeys = Object.keys(translations).filter(key =>
        key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        translations[key]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    ).sort();

    return (
        <div style={{ padding: '20px' }}>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Dinamik Dil Yönetimi</h1>
                    <p className="admin-page-subtitle">Uygulama metinlerini anlık olarak düzenleyin. Değişiklikler tüm kullanıcılara anında yansır.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="admin-btn admin-btn-secondary" onClick={syncFromLocal}>
                        <Upload size={18} style={{ marginRight: '8px' }} /> Yerelden Aktar
                    </button>
                    <button
                        className="admin-btn admin-btn-primary"
                        onClick={saveTranslations}
                        disabled={saving || modifiedKeys.size === 0}
                    >
                        <Save size={18} style={{ marginRight: '8px' }} />
                        {modifiedKeys.size > 0 ? `Değişiklikleri Kaydet (${modifiedKeys.size})` : 'Kaydet'}
                    </button>
                </div>
            </div>

            <div className="admin-card" style={{ marginBottom: '24px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['tr', 'en', 'de'].map(lang => (
                            <button
                                key={lang}
                                onClick={() => setActiveLang(lang)}
                                className={`admin-btn ${activeLang === lang ? 'admin-btn-primary' : 'admin-btn-surface'}`}
                                style={{ padding: '8px 16px', textTransform: 'uppercase', fontWeight: 'bold' }}
                            >
                                <Globe size={14} style={{ marginRight: '6px' }} /> {lang}
                            </button>
                        ))}
                    </div>

                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--god-text-dim)' }} size={18} />
                        <input
                            type="text"
                            className="admin-input"
                            style={{ width: '100%', paddingLeft: '40px' }}
                            placeholder="Anahtar veya metin ara..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="admin-loading-container">
                    <RefreshCw className="spin" size={32} color="var(--god-blue)" />
                    <p>Çeviriler yükleniyor...</p>
                </div>
            ) : (
                <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
                        <table className="admin-table">
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr>
                                    <th style={{ width: '30%' }}>Çeviri Anahtarı (Key)</th>
                                    <th>Değer (Translation)</th>
                                    <th style={{ width: '100px', textAlign: 'center' }}>Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredKeys.map(key => (
                                    <tr key={key} style={{ backgroundColor: modifiedKeys.has(key) ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--god-text-muted)', fontFamily: 'monospace' }}>
                                            {key}
                                        </td>
                                        <td>
                                            <textarea
                                                className="admin-input"
                                                style={{
                                                    width: '100%',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    padding: '8px',
                                                    resize: 'vertical',
                                                    minHeight: '40px'
                                                }}
                                                value={(translations[key] as string) || ''}
                                                onChange={e => handleValueChange(key, e.target.value)}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {modifiedKeys.has(key) ? (
                                                <AlertCircle size={16} color="var(--god-gold)" />
                                            ) : (
                                                <CheckCircle2 size={16} color="var(--god-dim)" />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredKeys.length === 0 && (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: 'var(--god-text-dim)' }}>
                                            <Search size={32} style={{ marginBottom: '12px', opacity: 0.2 }} />
                                            <p>Aramanızla eşleşen sonuç bulunamadı.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
