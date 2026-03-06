import { useEffect, useState } from 'react'
import { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } from '@capacitor-community/admob'
import { Crown, Sparkles, ShieldCheck } from 'lucide-react'
import './AdCard.css'

interface AdCardProps {
    // onSwipe?: (direction: 'left' | 'right' | 'up') => void
}

export default function AdCard({ }: AdCardProps) {
    // const { t } = useTranslation()
    const [adLoaded, setAdLoaded] = useState(false)

    useEffect(() => {
        const initializeBanner = async () => {
            try {
                // In a real app, use your AdMob Banner ID here
                // Production AdMob ID: ca-app-pub-5523567140729033/2245716196
                const adId = 'ca-app-pub-5523567140729033/2245716196'

                await AdMob.showBanner({
                    adId: adId,
                    adSize: BannerAdSize.MEDIUM_RECTANGLE,
                    position: BannerAdPosition.CENTER,
                    margin: 0,
                    isTesting: false
                })

                AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
                    setAdLoaded(true)
                })
            } catch (e) {
                console.error('AdMob Banner error:', e)
            }
        }

        initializeBanner()

        return () => {
            AdMob.removeBanner().catch(() => { })
        }
    }, [])

    return (
        <div className="ad-card">
            <div className="ad-card-inner">
                <div className="ad-card-badge">
                    <ShieldCheck size={14} />
                    <span>SPONSORLU</span>
                </div>

                <div className="ad-card-content">
                    {!adLoaded && (
                        <div className="ad-card-placeholder">
                            <Crown size={48} className="ad-placeholder-icon" />
                            <h3>BeMatch Ayrıcalıkları</h3>
                            <p>Sınırsız beğeni ve daha fazlası için Gold'a geçin.</p>
                            <button className="ad-cta">Hemen Yükselt</button>
                        </div>
                    )}
                    {/* The actual Banner will be rendered over this by AdMob plugin (native) */}
                </div>

                <div className="ad-card-footer">
                    <div className="ad-footer-text">
                        <Sparkles size={16} color="#fbbf24" />
                        <span>Reklamsız deneyim için Gold Paketleri inceleyin</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
