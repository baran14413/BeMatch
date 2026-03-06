import { motion } from 'framer-motion'
import { ChevronDown, Briefcase, GraduationCap, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'


export interface ProfileUser {
    id: string | number;
    name?: string;
    firstName?: string;
    photos?: string[];
    photo?: string;
    age?: number;
    job?: string;
    school?: string;
    distance?: string;
    bio?: string;
    interests?: string[];
    lookingFor?: string;
}

interface ProfileDetailProps {
    user: ProfileUser | null
    photoIndex: number
    onClose: () => void
}

export default function ProfileDetail({ user, photoIndex, onClose }: ProfileDetailProps) {
    const { t } = useTranslation()
    // Determine which photo to show. Fallback to a placeholder if none.
    const displayPhoto = user?.photos?.[photoIndex] || user?.photo || 'https://ui-avatars.com/api/?name=User&background=random'

    return (
        <motion.div
            className="profile-detail-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="profile-detail"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="detail-header">
                    {user?.photos && user.photos.length > 0 ? (
                        <img src={displayPhoto} alt={user?.name || user?.firstName} className="detail-image" />
                    ) : (
                        <div className="card-image-placeholder">
                            {user?.name?.[0]?.toUpperCase() || user?.firstName?.[0]?.toUpperCase() || '?'}
                        </div>
                    )}
                    <div className="detail-gradient" />
                    <button className="detail-close" onClick={onClose}>
                        <ChevronDown size={28} />
                    </button>
                </div>

                <div className="detail-body">
                    <div className="detail-name-age">
                        <span className="detail-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {user?.name || user?.firstName || t('detail.unnamed')}
                        </span>
                        {user?.age && <span className="detail-age">{user.age}</span>}
                    </div>

                    <div className="detail-meta">
                        {user?.job && (
                            <div className="detail-meta-item">
                                <Briefcase size={14} /> {user.job}
                            </div>
                        )}
                        {user?.school && (
                            <div className="detail-meta-item">
                                <GraduationCap size={14} /> {user.school}
                            </div>
                        )}
                        {user?.distance && (
                            <div className="detail-meta-item">
                                <MapPin size={14} /> {user.distance}
                            </div>
                        )}
                    </div>

                    <div className="detail-section">
                        <h3>{t('detail.about')}</h3>
                        <p className="detail-bio">{user?.bio || t('detail.no_bio')}</p>
                    </div>

                    {user?.interests && user.interests.length > 0 && (
                        <div className="detail-section">
                            <h3>{t('detail.interests')}</h3>
                            <div className="pd-interests-list">
                                {user.interests.map((interest: string, i: number) => (
                                    <span key={i} className="pd-interest">
                                        {t(`interests.${interest}`, { defaultValue: interest })}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {user?.lookingFor && (
                        <div className="detail-section">
                            <h3>{t('detail.looking_for')}</h3>
                            <div className="detail-looking">
                                💕 {user.lookingFor === 'both' ? t('detail.everyone') : user.lookingFor}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}
