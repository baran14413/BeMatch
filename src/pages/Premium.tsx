import { motion } from 'framer-motion'
import { Crown, Zap, Target, Eye, X, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { grantSubscription } from '../utils/billing'
import toast from 'react-hot-toast'
import './Premium.css'

export default function Premium() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [isPurchasing, setIsPurchasing] = useState(false)

    const handlePurchase = async (tierId: string, days: number) => {
        if (!user) return;
        setIsPurchasing(true);
        const tid = toast.loading('İşlem yapılıyor...');
        try {
            // Mocking a purchase via unified payment flow
            const res = await grantSubscription(user.uid, tierId, days);
            if (res.success) {
                toast.success('BeMatch Gold aboneliğiniz aktifleşti!', { id: tid });
                setTimeout(() => navigate(-1), 1000);
            } else {
                toast.error('Ödeme işlemi başarısız: ' + res.error, { id: tid });
            }
        } catch (error) {
            toast.error('Beklenmeyen bir hata oluştu.', { id: tid });
        } finally {
            setIsPurchasing(false);
        }
    }

    return (
        <div className="premium-container">
            {/* Header / Hero Section */}
            <div className="premium-header">
                <button className="premium-back-btn" onClick={() => navigate(-1)}>
                    <X size={28} />
                </button>
                <div className="premium-title-wrapper">
                    <Crown size={48} className="premium-main-icon" />
                    <h1>BeMatch <span className="gold-text">Gold</span></h1>
                    <p>{t('premium.subtitle', { defaultValue: 'Eşleşme şansını 10\'a katla!' })}</p>
                </div>
            </div>

            {/* Plans */}
            <div className="plans-container">
                <motion.div
                    className="plan-card recommended plan-active"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="plan-badge">{t('premium.most_popular', { defaultValue: 'En Popüler' })}</div>
                    <div className="plan-duration">1 Ay</div>
                    <div className="plan-price">₺250.00 / ay</div>
                    <button
                        className="plan-select-btn"
                        disabled={isPurchasing}
                        onClick={() => handlePurchase('gold-monthly', 30)}
                    >
                        {isPurchasing ? <Loader className="spin" size={16} /> : t('premium.select', { defaultValue: 'Seç' })}
                    </button>
                </motion.div>

                <motion.div
                    className="plan-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="plan-duration">1 Hafta</div>
                    <div className="plan-price">₺100.00 / hafta</div>
                    <button
                        className="plan-select-btn"
                        disabled={isPurchasing}
                        onClick={() => handlePurchase('gold-weekly', 7)}
                    >
                        {isPurchasing ? <Loader className="spin" size={16} /> : t('premium.select', { defaultValue: 'Seç' })}
                    </button>
                </motion.div>

                <motion.div
                    className="plan-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="plan-duration">1 Yıl</div>
                    <div className="plan-price">₺500.00 / yıl</div>
                    <button
                        className="plan-select-btn"
                        disabled={isPurchasing}
                        onClick={() => handlePurchase('gold-yearly', 365)}
                    >
                        {isPurchasing ? <Loader className="spin" size={16} /> : t('premium.select', { defaultValue: 'Seç' })}
                    </button>
                </motion.div>
            </div>

            {/* Features List */}
            <div className="features-container">
                <h3 className="features-title">{t('premium.features_title', { defaultValue: 'Ayrıcalıklar' })}</h3>
                <div className="feature-item">
                    <div className="feature-icon"><Eye size={24} /></div>
                    <div className="feature-text">
                        <h4>{t('premium.see_likes', { defaultValue: 'Seni Beğenenleri Gör' })}</h4>
                        <p>{t('premium.see_likes_desc', { defaultValue: 'Eşleşmeden önce kimlerin seni beğendiğini anında gör.' })}</p>
                    </div>
                </div>
                <div className="feature-item">
                    <div className="feature-icon"><Zap size={24} /></div>
                    <div className="feature-text">
                        <h4>{t('premium.unlimited_likes', { defaultValue: 'Sınırsız Beğeni' })}</h4>
                        <p>{t('premium.unlimited_likes_desc', { defaultValue: 'İstediğin kadar kişiyi beğen, limiti kaldır.' })}</p>
                    </div>
                </div>
                <div className="feature-item">
                    <div className="feature-icon"><Target size={24} /></div>
                    <div className="feature-text">
                        <h4>{t('premium.advanced_filters', { defaultValue: 'Gelişmiş Filtreler' })}</h4>
                        <p>{t('premium.advanced_filters_desc', { defaultValue: 'İlgi alanları ve detaylara göre arama yap.' })}</p>
                    </div>
                </div>
            </div>

            <div style={{ height: '50px' }} />
        </div>
    )
}
