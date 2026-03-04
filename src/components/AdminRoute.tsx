import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute() {
    const { userProfile, loading } = useAuth();

    if (loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--god-text-muted)' }}>Mekanın sahibi aranıyor...</div>;
    }

    const allowedRoles = ['admin', 'moderator', 'mod_reports', 'mod_users', 'mod_finance', 'mod_marketing', 'mod_config'];
    if (!userProfile || !allowedRoles.includes(userProfile.role || '')) {
        return <Navigate to="/home" replace />;
    }

    return <Outlet />;
}
