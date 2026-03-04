import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Activity, Map, Users, Star,
    ShieldAlert, Image, Ban,
    CreditCard, Package, Ticket,
    Sliders, Lock, TrendingUp, Zap,
    Send, Megaphone, Bot,
    Globe, Wrench, ShieldCheck,
    LogOut, Flame
} from 'lucide-react';
import './Admin.css';

const navGroups = [
    {
        title: '📊 ANALİZ VE İZLEME',
        allowedRoles: ['admin'],
        items: [
            { name: 'Ana Dashboard', path: '/admin/dashboard', icon: Activity },
            { name: 'Canlı Etkileşim Haritası', path: '/admin/map', icon: Map },
        ],
    },
    {
        title: '👥 KULLANICI YÖNETİMİ',
        allowedRoles: ['admin', 'mod_users'],
        items: [
            { name: 'Kullanıcılar', path: '/admin/users', icon: Users },
            { name: 'Bot Kullanıcılar', path: '/admin/bots', icon: Bot },
            { name: 'Premium (Gold) Üyeler', path: '/admin/premium-users', icon: Star },
        ],
    },
    {
        title: '🚨 MODERASYON VE GÜVENLİK',
        allowedRoles: ['admin', 'moderator', 'mod_reports'],
        items: [
            { name: 'Gelen Raporlar', path: '/admin/reports', icon: ShieldAlert },
            { name: 'Medya Onay Havuzu', path: '/admin/media-approvals', icon: Image },
            { name: 'Ban Merkezi', path: '/admin/ban-center', icon: Ban },
        ],
    },
    {
        title: '💰 FİNANS VE ABONELİKLER',
        allowedRoles: ['admin', 'mod_finance'],
        items: [
            { name: 'İşlem Geçmişi', path: '/admin/transactions', icon: CreditCard },
            { name: 'Abonelik Paketleri', path: '/admin/subscription-plans', icon: Package },
            { name: 'Promosyon Kodları', path: '/admin/promo-codes', icon: Ticket },
        ],
    },
    {
        title: '⚙️ ALGORİTMA KONTROLÜ',
        allowedRoles: ['admin', 'mod_config'],
        items: [
            { name: 'Eşleşme Ayarları', path: '/admin/match-settings', icon: Sliders },
            { name: 'Kullanıcı Limitleri', path: '/admin/user-limits', icon: Lock },
            { name: 'Popülerlik (ELO)', path: '/admin/elo-management', icon: TrendingUp },
            { name: 'Özellik Aç/Kapat', path: '/admin/config', icon: Zap },
        ],
    },
    {
        title: '📢 PAZARLAMA VE İLETİŞİM',
        allowedRoles: ['admin', 'mod_marketing'],
        items: [
            { name: 'Push Bildirim Merkezi', path: '/admin/marketing', icon: Send },
            { name: 'Duyurular (Pop-up)', path: '/admin/announcements', icon: Megaphone },
            { name: 'Otomatik Mesajlar', path: '/admin/auto-messages', icon: Bot },
        ],
    },
    {
        title: '🛠️ TEKNİK VE SİSTEM',
        allowedRoles: ['admin', 'mod_config'],
        items: [
            { name: 'Dinamik Dil Yönetimi', path: '/admin/translations', icon: Globe },
            { name: 'Bakım Modu', path: '/admin/maintenance', icon: Wrench },
            { name: 'Sistem Logları', path: '/admin/logs', icon: ShieldCheck },
        ],
    },
];

import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { userProfile } = useAuth();

    const handleExit = () => {
        navigate('/home');
    };

    return (
        <div className="admin-wrapper">
            <div className="admin-ambient-glow" />

            {/* Sidebar Navigation */}
            <aside className="admin-sidebar">
                <div className="admin-logo-area">
                    <Flame className="w-6 h-6 text-red-500" color="#ef4444" />
                    <h1>BeMatch <span>GOD</span></h1>
                </div>

                <nav className="admin-nav">
                    {navGroups.filter(group => group.allowedRoles.includes(userProfile?.role || 'user')).map((group, i) => (
                        <div key={i} className="admin-nav-group">
                            <h3 className="admin-nav-title">{group.title}</h3>
                            {group.items.map((item) => {
                                // Determine exact match for Dashboard, prefix match for others
                                const isActive = item.path === '/admin'
                                    ? location.pathname === '/admin' || location.pathname === '/admin/'
                                    : location.pathname.startsWith(item.path);

                                return (
                                    <NavLink
                                        key={item.name}
                                        to={item.path}
                                        className={`admin-nav-item ${isActive ? 'active' : ''}`}
                                    >
                                        <item.icon size={18} />
                                        <span>{item.name}</span>
                                    </NavLink>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
                    <div className="admin-user-puck">
                        <div className="admin-avatar-mini">{userProfile?.firstName?.[0]?.toUpperCase() || 'A'}</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{userProfile?.firstName || 'Admin'}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--god-text-dim)', textTransform: 'uppercase' }}>
                                {userProfile?.role === 'admin' ? 'SUPER_ADMIN' :
                                    userProfile?.role === 'mod_reports' ? 'REPORT_MOD' :
                                        userProfile?.role === 'mod_users' ? 'USER_MOD' :
                                            userProfile?.role === 'mod_finance' ? 'FINANCE_MOD' :
                                                userProfile?.role === 'mod_marketing' ? 'MARKETING_MOD' :
                                                    userProfile?.role === 'mod_config' ? 'SYSTEM_MOD' : 'MODERATOR'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleExit}
                        className="admin-btn-surface tooltip-trigger"
                        style={{ padding: '8px', borderRadius: '8px' }}
                        title="Exit God Mode"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>

            {/* Main Content Viewport */}
            <div className="admin-content">
                <header className="admin-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0, color: 'var(--god-text-muted)' }}>
                            Yönetim Paneli
                        </h2>
                    </div>

                    <div className="admin-servers-badge">
                        <div className="admin-pulse-dot" />
                        TÜM SİSTEMLER AKTİF
                    </div>
                </header>

                <main className="admin-viewport">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
