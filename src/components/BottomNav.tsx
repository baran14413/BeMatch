import { useNavigate } from 'react-router-dom'
import { Flame, MessageCircle, User, Heart } from 'lucide-react'
import { useUnread } from '../context/UnreadContext'
import { useTranslation } from 'react-i18next'

interface BottomNavProps {
    active: 'home' | 'matches' | 'messages' | 'profile'
}

export default function BottomNav({ active }: BottomNavProps) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { totalUnread } = useUnread()

    const navItems = [
        { id: 'home' as const, icon: Flame, label: t('nav.explore'), path: '/home' },
        { id: 'matches' as const, icon: Heart, label: t('nav.matches'), path: '/matches' },
        { id: 'messages' as const, icon: MessageCircle, label: t('nav.messages'), path: '/messages' },
        { id: 'profile' as const, icon: User, label: t('nav.profile'), path: '/profile' },
    ]

    return (
        <nav className="bottom-nav h-auto min-h-[70px] pb-[env(safe-area-inset-bottom)]">
            {navItems.map(item => (
                <button
                    key={item.id}
                    className={`nav-item ${active === item.id ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                    style={{ position: 'relative' }}
                >
                    <item.icon size={22} />
                    {item.id === 'messages' && totalUnread > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '4px',
                            right: 'calc(50% - 14px)',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            padding: '2px 5px',
                            borderRadius: '10px',
                            border: '2px solid var(--background)',
                            lineHeight: '1'
                        }}>
                            {totalUnread > 99 ? '99+' : totalUnread}
                        </span>
                    )}
                    <span className="nav-label">{item.label}</span>
                </button>
            ))}
        </nav>
    )
}
