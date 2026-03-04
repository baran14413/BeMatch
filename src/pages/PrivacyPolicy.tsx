import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import './Profile.css'

export default function PrivacyPolicy() {
    const navigate = useNavigate()
    const { t } = useTranslation()

    return (
        <div className="profile-page" style={{ backgroundColor: '#0f172a', color: '#f8fafc', paddingBottom: '40px' }}>
            <div className="profile-header-clean" style={{ padding: '20px' }}>
                <button onClick={() => navigate(-1)} className="profile-back-btn" style={{ position: 'static' }}>
                    <ChevronLeft size={24} />
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '10px' }}>{t('privacy_page.title')}</h1>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="profile-content"
                style={{ padding: '0 20px', maxWidth: 800, margin: '0 auto' }}
            >
                <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', color: 'var(--primary)' }}>
                        <ShieldCheck size={28} />
                        <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{t('privacy_page.last_updated')}</span>
                    </div>

                    <div style={{ color: '#94a3b8', lineHeight: '1.7', fontSize: '0.95rem' }}>
                        <section style={{ marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
                                {t('privacy_page.s1_title')}
                            </h2>
                            <p style={{ marginBottom: '10px' }}>{t('privacy_page.s1_p1')}</p>
                            <p>{t('privacy_page.s1_p2')}</p>
                        </section>

                        <section style={{ marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
                                {t('privacy_page.s2_title')}
                            </h2>
                            <p style={{ marginBottom: '10px' }}>{t('privacy_page.s2_p')}</p>
                            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <li dangerouslySetInnerHTML={{ __html: t('privacy_page.s2_li1') }}></li>
                                <li dangerouslySetInnerHTML={{ __html: t('privacy_page.s2_li2') }}></li>
                                <li dangerouslySetInnerHTML={{ __html: t('privacy_page.s2_li3') }}></li>
                                <li dangerouslySetInnerHTML={{ __html: t('privacy_page.s2_li4') }}></li>
                                <li dangerouslySetInnerHTML={{ __html: t('privacy_page.s2_li5') }}></li>
                            </ul>
                        </section>

                        <section style={{ marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
                                {t('privacy_page.s3_title')}
                            </h2>
                            <p style={{ marginBottom: '10px' }}>{t('privacy_page.s3_p')}</p>
                            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <li>{t('privacy_page.s3_li1')}</li>
                                <li>{t('privacy_page.s3_li2')}</li>
                                <li>{t('privacy_page.s3_li3')}</li>
                                <li>{t('privacy_page.s3_li4')}</li>
                                <li>{t('privacy_page.s3_li5')}</li>
                            </ul>
                        </section>

                        <section style={{ marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
                                {t('privacy_page.s4_title')}
                            </h2>
                            <p style={{ marginBottom: '10px' }}>{t('privacy_page.s4_p')}</p>
                            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <li dangerouslySetInnerHTML={{ __html: t('privacy_page.s4_li1') }}></li>
                                <li dangerouslySetInnerHTML={{ __html: t('privacy_page.s4_li2') }}></li>
                                <li dangerouslySetInnerHTML={{ __html: t('privacy_page.s4_li3') }}></li>
                            </ul>
                        </section>

                        <section style={{ marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
                                {t('privacy_page.s5_title')}
                            </h2>
                            <p>{t('privacy_page.s5_p')}</p>
                        </section>

                        <section style={{ marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
                                {t('privacy_page.s6_title')}
                            </h2>
                            <p style={{ marginBottom: '10px' }}>{t('privacy_page.s6_p')}</p>
                            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <li>{t('privacy_page.s6_li1')}</li>
                                <li>{t('privacy_page.s6_li2')}</li>
                                <li>{t('privacy_page.s6_li3')}</li>
                                <li dangerouslySetInnerHTML={{ __html: t('privacy_page.s6_li4') }}></li>
                            </ul>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
                                {t('privacy_page.s7_title')}
                            </h2>
                            <p style={{ marginBottom: '10px' }}>{t('privacy_page.s7_p')}</p>
                            <div style={{ padding: '15px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'inline-block' }}>
                                <strong style={{ color: '#fff' }}>E-posta:</strong> privacy@bematch.app<br />
                                <strong style={{ color: '#fff' }}>Adres:</strong> BeMatch Teknoloji A.Ş., İstanbul / Türkiye
                            </div>
                        </section>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
