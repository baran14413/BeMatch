import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ShieldAlert, Eye, CheckCircle, X, Image as ImageIcon, Loader, Trash2
} from 'lucide-react';
import '../../components/Admin.css';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, setDoc, increment, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-hot-toast';
import AdminModal, { type ModalType } from '../../components/AdminModal';

interface ReportData {
    id: string;
    reporterId: string;
    reporterName: string;
    reporterPhoto: string;
    reportedId: string;
    reportedName: string;
    reportedPhoto: string;
    chatId: string | null;
    reason: string;
    reasonText: string;
    description: string;
    screenshotUrls: string[];
    createdAt: number;
    status: 'pending' | 'reviewed' | 'resolved';
}

function formatReportDate(timestamp: number) {
    if (!timestamp) return 'Bilinmiyor';
    const d = new Date(timestamp);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminReports() {
    const [searchTerm, setSearchTerm] = useState('');
    const [reports, setReports] = useState<ReportData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: ModalType;
        iconType: 'danger' | 'warning' | 'info' | 'success';
        actionId: string;
        actionTarget: string;
        suggestedResponses?: string[];
    }>({
        isOpen: false, title: '', message: '', type: 'confirm', iconType: 'warning', actionId: '', actionTarget: '', suggestedResponses: []
    });

    const closeAdminModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    useEffect(() => {
        const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedReports: ReportData[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                loadedReports.push({
                    id: doc.id,
                    reporterId: data.reporterId || '',
                    reporterName: data.reporterName || 'Bilinmiyor',
                    reporterPhoto: data.reporterPhoto || '',
                    reportedId: data.reportedId || '',
                    reportedName: data.reportedName || 'Bilinmiyor',
                    reportedPhoto: data.reportedPhoto || '',
                    chatId: data.chatId || null,
                    reason: data.reason || '',
                    reasonText: data.reasonText || 'Bilinmeyen Neden',
                    description: data.description || '',
                    screenshotUrls: data.screenshotUrls || [],
                    createdAt: data.createdAt || 0,
                    status: data.status || 'pending'
                });
            });
            setReports(loadedReports);
            setLoading(false);
        }, (error) => {
            console.error("Reports fetch error:", error);
            toast.error("Raporlar yüklenemedi.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredReports = reports.filter(r =>
        r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reportedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reasonText.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Context Actions
    const handleUpdateStatus = async (reportId: string, newStatus: 'pending' | 'reviewed' | 'resolved') => {
        try {
            await updateDoc(doc(db, 'reports', reportId), { status: newStatus });
            toast.success("Rapor durumu güncellendi.");
            if (selectedReport?.id === reportId) {
                setSelectedReport(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } catch (error) {
            console.error("Durum güncellenemedi:", error);
            toast.error("İşlem başarısız.");
        }
    };

    const handleDeleteReport = async (reportId: string) => {
        setModalConfig({
            isOpen: true,
            title: 'Raporu Sil',
            message: 'Bu raporu sistemden kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
            type: 'confirm',
            iconType: 'danger',
            actionId: 'delete_report',
            actionTarget: reportId
        });
    };

    const handleWarnUser = (userId: string, targetName: string) => {
        setModalConfig({
            isOpen: true,
            title: `${targetName} Adlı Kullanıcıyı Uyar`,
            message: 'Kullanıcıya gönderilecek sistem uyarısını yazın. Bu mesaj kullanıcıya anında iletilecektir.',
            type: 'prompt',
            iconType: 'warning',
            actionId: 'warn_user',
            actionTarget: userId,
            suggestedResponses: [
                "Topluluk kurallarımıza uymayan mesajlar tespit edildi. Lütfen üslubunuza dikkat edin.",
                "Profil fotoğrafınız yönergelerimize uygun değil. Lütfen güncelleyin.",
                "Spam veya rahatsız edici davranışlar nedeniyle şikayet edildiniz.",
                "Bu son uyarıdır. İhlalin devamı halinde hesabınız kapatılacaktır."
            ]
        });
    };

    const handleBanUser = (userId: string, targetName: string) => {
        setModalConfig({
            isOpen: true,
            title: `Kullanıcıyı Yasakla`,
            message: `${targetName} adlı kullanıcının hesabını kalıcı olarak silmek ve platformdan engellemek istediğinize emin misiniz?`,
            type: 'confirm',
            iconType: 'danger',
            actionId: 'ban_user',
            actionTarget: userId
        });
    };

    const handleModalConfirm = async (inputValue?: string) => {
        const { actionId, actionTarget } = modalConfig;
        closeAdminModal();
        const loadingToast = toast.loading("İşlem yapılıyor...");

        try {
            if (actionId === 'delete_report') {
                await deleteDoc(doc(db, 'reports', actionTarget));
                if (selectedReport?.id === actionTarget) setSelectedReport(null);
                toast.success("Rapor başarıyla silindi.", { id: loadingToast });
            }

            else if (actionId === 'warn_user') {
                if (!inputValue || inputValue.trim() === '') {
                    toast.error("Uyarı mesajı boş olamaz.", { id: loadingToast });
                    return;
                }
                const sysChatId = `system_${actionTarget}`;
                const chatRef = doc(db, 'chats', sysChatId);
                const nowTime = new Date().getTime();

                await setDoc(chatRef, {
                    participants: ['system', actionTarget],
                    updatedAt: nowTime,
                    lastMessage: `[SİSTEM UYARISI]: ${inputValue}`,
                    [`unreadCount_${actionTarget}`]: increment(1)
                }, { merge: true });

                await addDoc(collection(db, `chats/${sysChatId}/messages`), {
                    type: 'text',
                    content: `[SİSTEM UYARISI]: ${inputValue}\n\nLütfen topluluk kurallarımızı dikkate alınız.`,
                    senderId: 'system',
                    createdAt: nowTime,
                    status: 'sent'
                });

                await updateDoc(doc(db, 'users', actionTarget), { eloScore: increment(-10) }).catch(() => { });

                toast.success(`Sistem uyarısı gönderildi ve puanı düşürüldü.`, { id: loadingToast });
            }

            else if (actionId === 'ban_user') {
                const userRef = doc(db, 'users', actionTarget);
                await updateDoc(userRef, {
                    isBanned: true,
                    isDeleted: true,
                    status: 'Banned',
                    deletedAt: new Date().getTime()
                });
                toast.success(`Kullanıcı başarıyla yasaklandı.`, { id: loadingToast });

                // Also resolve the report if viewing it
                if (selectedReport) {
                    await updateDoc(doc(db, 'reports', selectedReport.id), { status: 'resolved' });
                    setSelectedReport(prev => prev ? { ...prev, status: 'resolved' } : null);
                }
            }

        } catch (error) {
            console.error("God Mode Action Failed:", error);
            toast.error("İşlem gerçekleştirilemedi.", { id: loadingToast });
        }
    };

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Raporlar</h1>
                    <p className="admin-page-subtitle">Kullanıcı şikayetleri ve ihlal bildirimleri yönetimi.</p>
                </div>
            </div>

            <div className="admin-card" style={{ padding: '24px' }}>
                {/* Search Bar */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} color="var(--god-text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            className="admin-input"
                            placeholder="Rapor ID, Raporlayan veya Raporlanan ara..."
                            style={{ width: '100%', paddingLeft: '48px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Data Grid */}
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Raporlanan Kullanıcı</th>
                                <th>Şikayet Eden</th>
                                <th>Neden</th>
                                <th>Tarih</th>
                                <th>Durum</th>
                                <th style={{ textAlign: 'right' }}>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                                        <Loader className="spin" size={24} style={{ margin: '0 auto', color: 'var(--god-primary)' }} />
                                    </td>
                                </tr>
                            ) : filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--god-text-muted)' }}>
                                        Hiç rapor bulunamadı. Temiz bir sistem! ✨
                                    </td>
                                </tr>
                            ) : filteredReports.map((report, i) => (
                                <motion.tr
                                    key={report.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {report.reportedPhoto ? (
                                                <img src={report.reportedPhoto} alt="" className="admin-avatar-mini" style={{ objectFit: 'cover' }} />
                                            ) : (
                                                <div className="admin-avatar-mini" style={{ background: 'var(--god-red)' }}>{report.reportedName?.[0]}</div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{report.reportedName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--god-text-muted)', fontFamily: 'monospace' }}>{report.reportedId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {report.reporterPhoto ? (
                                                <img src={report.reporterPhoto} alt="" className="admin-avatar-mini" style={{ objectFit: 'cover' }} />
                                            ) : (
                                                <div className="admin-avatar-mini">{report.reporterName?.[0]}</div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{report.reporterName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--god-text-muted)', fontFamily: 'monospace' }}>{report.reporterId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="admin-badge admin-badge-danger">{report.reasonText}</span>
                                    </td>
                                    <td style={{ color: 'var(--god-text-muted)', fontSize: '0.875rem' }}>
                                        {formatReportDate(report.createdAt)}
                                    </td>
                                    <td>
                                        {report.status === 'pending' && <span className="admin-badge admin-badge-purple">Beklemede</span>}
                                        {report.status === 'reviewed' && <span className="admin-badge admin-badge-neutral">İnceleniyor</span>}
                                        {report.status === 'resolved' && <span className="admin-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }}>Çözüldü</span>}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            className="admin-btn-surface tooltip-trigger"
                                            style={{ padding: '8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                            onClick={() => setSelectedReport(report)}
                                        >
                                            <Eye size={16} /> Detayları Gör
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal Overlay */}
            <AnimatePresence>
                {selectedReport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(8px)' }}
                        onClick={() => setSelectedReport(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="admin-card"
                            style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--god-text-muted)', cursor: 'pointer' }}
                                onClick={() => setSelectedReport(null)}
                            >
                                <X size={24} />
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', borderBottom: '1px solid var(--god-border)', paddingBottom: '24px' }}>
                                <ShieldAlert size={32} color="var(--god-red)" />
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        Rapor Detayı
                                        {selectedReport.status === 'pending' && <span className="admin-badge admin-badge-purple" style={{ fontSize: '0.8rem' }}>Beklemede</span>}
                                        {selectedReport.status === 'reviewed' && <span className="admin-badge admin-badge-neutral" style={{ fontSize: '0.8rem' }}>İnceleniyor</span>}
                                        {selectedReport.status === 'resolved' && <span className="admin-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)', fontSize: '0.8rem' }}>Çözüldü</span>}
                                    </h2>
                                    <div style={{ color: 'var(--god-text-dim)', fontSize: '0.875rem', marginTop: '4px', fontFamily: 'monospace' }}>#{selectedReport.id} | Tarih: {formatReportDate(selectedReport.createdAt)}</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--god-border)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--god-text-muted)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 'bold' }}>Raporlanan (Hedef)</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {selectedReport.reportedPhoto ? (
                                            <img src={selectedReport.reportedPhoto} alt="" className="admin-avatar-mini" style={{ objectFit: 'cover' }} />
                                        ) : (
                                            <div className="admin-avatar-mini" style={{ background: 'var(--god-red)' }}>{selectedReport.reportedName?.[0]}</div>
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedReport.reportedName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--god-text-dim)', fontFamily: 'monospace' }}>{selectedReport.reportedId}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                        <button
                                            className="admin-btn admin-btn-danger"
                                            style={{ flex: 1, padding: '8px' }}
                                            onClick={() => { setSelectedReport(null); handleBanUser(selectedReport.reportedId, selectedReport.reportedName); }}
                                        >
                                            Hesabı Banla
                                        </button>
                                        <button
                                            className="admin-btn admin-btn-surface"
                                            style={{ flex: 1, padding: '8px', color: 'var(--god-purple)', borderColor: 'var(--god-purple)' }}
                                            onClick={() => { setSelectedReport(null); handleWarnUser(selectedReport.reportedId, selectedReport.reportedName); }}
                                        >
                                            Uyarı Gönder
                                        </button>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--god-border)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--god-text-muted)', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 'bold' }}>Şikayet Eden</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {selectedReport.reporterPhoto ? (
                                            <img src={selectedReport.reporterPhoto} alt="" className="admin-avatar-mini" style={{ objectFit: 'cover' }} />
                                        ) : (
                                            <div className="admin-avatar-mini" style={{ background: 'var(--god-surface-hover)' }}>{selectedReport.reporterName?.[0]}</div>
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedReport.reporterName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--god-text-dim)', fontFamily: 'monospace' }}>{selectedReport.reporterId}</div>
                                        </div>
                                    </div>
                                    <button
                                        className="admin-btn admin-btn-surface"
                                        style={{ width: '100%', marginTop: '16px', padding: '8px' }}
                                        onClick={() => {
                                            const body = `Merhaba ${selectedReport.reporterName}, yaptığın şikayeti inceledik ve gerekli önlemleri aldık. Platformumuzu güvenli tutmamıza yardımcı olduğun için teşekkürler! \n\n- BeMatch Güvenlik Ekibi`;
                                            const a = document.createElement('a');
                                            a.href = `mailto:?subject=BeMatch Şikayet Geri Bildirimi&body=${encodeURIComponent(body)}`;
                                            a.click();
                                        }}
                                    >
                                        Yardımı İçin Teşekkür Et
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--god-text)' }}>Rapor Nedeni: <span style={{ color: 'var(--god-red)' }}>{selectedReport.reasonText}</span></h3>
                                <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '12px', border: '1px solid var(--god-border)', color: 'var(--god-text-muted)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                    {selectedReport.description || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Kullanıcı açıklama girmemiş.</span>}
                                </div>
                            </div>

                            <div style={{ marginBottom: '40px' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--god-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ImageIcon size={18} /> Kanıt / Teyit Ekran Görüntüleri
                                </h3>
                                {selectedReport.screenshotUrls && selectedReport.screenshotUrls.length > 0 ? (
                                    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                                        {selectedReport.screenshotUrls.map((proof: string, idx: number) => (
                                            <a href={proof} target="_blank" rel="noreferrer" key={idx}>
                                                <img src={proof} alt="Kanıt" style={{ width: '200px', height: '300px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--god-border)', cursor: 'zoom-in' }} />
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--god-text-dim)', color: 'var(--god-text-dim)' }}>
                                        Bu rapor için kullanıcı ekran görüntüsü eklememiş.
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--god-border)', paddingTop: '24px' }}>
                                <button className="admin-btn admin-btn-surface" style={{ color: 'var(--god-red)', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={() => { setSelectedReport(null); handleDeleteReport(selectedReport.id); }}><Trash2 size={16} /> Raporu Sil</button>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {selectedReport.status === 'pending' && (
                                        <button className="admin-btn admin-btn-surface" onClick={() => handleUpdateStatus(selectedReport.id, 'reviewed')}>
                                            İnceleniyor Olarak İşaretle
                                        </button>
                                    )}
                                    {selectedReport.status !== 'resolved' && (
                                        <button className="admin-btn" style={{ background: '#10b981', color: '#fff', border: 'none' }} onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}>
                                            <CheckCircle size={16} /> Çözüldü İşaretle
                                        </button>
                                    )}
                                    <button className="admin-btn admin-btn-surface" onClick={() => setSelectedReport(null)}>Kapat</button>
                                </div>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Modal for Confirmations / Prompts */}
            <AdminModal
                isOpen={modalConfig.isOpen}
                onCancel={closeAdminModal}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                iconType={modalConfig.iconType}
                onConfirm={handleModalConfirm}
                promptPlaceholder="Kullanıcıya gönderilecek uyarınızı buraya yazın..."
                suggestedResponses={modalConfig.suggestedResponses}
            />

        </div>
    );
}
