import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './context/AuthContext'
import { collection, onSnapshot, doc } from 'firebase/firestore'
import { db } from './firebase'
import { addDynamicResources } from './i18n'

// Lazy loaded components
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Home = lazy(() => import('./pages/Home'))
const Matches = lazy(() => import('./pages/Matches'))
const Messages = lazy(() => import('./pages/Messages'))
const Chat = lazy(() => import('./pages/Chat'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const Report = lazy(() => import('./pages/Report'))
const Premium = lazy(() => import('./pages/Premium'))
const MaintenanceScreen = lazy(() => import('./pages/MaintenanceScreen'))

// Admin System
const AdminRoute = lazy(() => import('./components/AdminRoute'))
const AdminLayout = lazy(() => import('./components/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminPremiumUsers = lazy(() => import('./pages/admin/AdminPremiumUsers'))
const AdminTransactions = lazy(() => import('./pages/admin/AdminTransactions'))
const AdminReports = lazy(() => import('./pages/admin/AdminReports'))
const AdminConfig = lazy(() => import('./pages/admin/AdminConfig'))
const AdminMarketing = lazy(() => import('./pages/admin/AdminMarketing'))
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs'))
const AdminMedia = lazy(() => import('./pages/admin/AdminMedia'))
const AdminBanCenter = lazy(() => import('./pages/admin/AdminBanCenter'))
const AdminSubscriptionPlans = lazy(() => import('./pages/admin/AdminSubscriptionPlans'))
const AdminMatchSettings = lazy(() => import('./pages/admin/AdminMatchSettings'))
const AdminUserLimits = lazy(() => import('./pages/admin/AdminUserLimits'))
const AdminEloManagement = lazy(() => import('./pages/admin/AdminEloManagement'))
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'))
const AdminAutoMessages = lazy(() => import('./pages/admin/AdminAutoMessages'))
const AdminTranslations = lazy(() => import('./pages/admin/AdminTranslations'))
const AdminMaintenance = lazy(() => import('./pages/admin/AdminMaintenance'))
const AdminPlaceholder = lazy(() => import('./pages/admin/AdminPlaceholder'))
const AdminMap = lazy(() => import('./pages/admin/AdminMap'))


function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
      Yükleniyor...
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isImpersonating, stopImpersonating } = useAuth()
  if (loading) return <LoadingScreen />

  if (!user) return <Navigate to="/login" replace />

  return (
    <>
      {isImpersonating && (
        <div style={{
          position: 'fixed', top: '15px', marginTop: 'env(safe-area-inset-top, 0px)', left: '16px', transform: 'none',
          backgroundColor: 'rgba(239, 68, 68, 0.95)', color: 'white', zIndex: 999999,
          padding: '6px 16px', textAlign: 'center', fontWeight: '600',
          borderRadius: '50px', backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.5)',
          display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem',
          width: 'max-content', maxWidth: '90vw'
        }}>
          <span style={{ fontSize: '1rem' }}>⚠️</span> {window.innerWidth > 600 ? 'Başka bir kullanıcının hesabındasınız.' : 'Hesap İnceleme Modu'}
          <button
            onClick={() => { if (stopImpersonating) stopImpersonating(); window.location.href = '/admin/users'; }}
            style={{
              padding: '4px 10px', backgroundColor: '#000', borderRadius: '20px',
              color: 'white', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '0.7rem', whiteSpace: 'nowrap', fontWeight: 'bold'
            }}
          >
            Çıkış Yap
          </button>
        </div>
      )}
      {children}
    </>
  )
}

function App() {
  const { userProfile } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    // Check maintenance mode
    const unsubMaint = onSnapshot(doc(db, 'admin_settings', 'system_config'), (snapshot) => {
      if (snapshot.exists()) {
        const flags = snapshot.data().flags || [];
        const maintFlag = flags.find((f: any) => f.id === 'flag_maint');
        setIsMaintenance(!!maintFlag?.enabled);
      }
    }, (err) => {
      console.warn("Bakım modu kontrolü yapılamadı:", err);
    });

    return () => unsubMaint();
  }, []);

  useEffect(() => {
    // Load dynamic translations from Firestore
    const unsub = onSnapshot(collection(db, 'i18n'), (snapshot) => {
      snapshot.docs.forEach(doc => {
        addDynamicResources(doc.id, doc.data());
      });
    }, (err) => {
      console.warn("Dinamik çeviriler yüklenemedi, yerel dosyalar kullanılacak:", err);
    });
    return () => unsub();
  }, []);

  return (
    <div className="h-full w-full pt-[env(safe-area-inset-top)]">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#111827', color: '#fff', border: '1px solid #374151' },
          success: { iconTheme: { primary: '#10b981', secondary: '#111827' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#111827' } },
        }}
      />
      <div className="app-background" />
      <Suspense fallback={<LoadingScreen />}>
        {isMaintenance && userProfile?.role !== 'admin' ? (
          <Routes>
            <Route path="*" element={<MaintenanceScreen />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/report/:id" element={<ProtectedRoute><Report /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />

            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />

            {/* God Mode Admin Area */}
            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="config" element={<AdminConfig />} />
                <Route path="marketing" element={<AdminMarketing />} />
                <Route path="logs" element={<AdminAuditLogs />} />
                <Route path="map" element={<AdminMap />} />

                {/* Placeholder Routes */}
                <Route path="premium-users" element={<AdminPremiumUsers />} />
                <Route path="media-approvals" element={<AdminMedia />} />
                <Route path="ban-center" element={<AdminBanCenter />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="subscription-plans" element={<AdminSubscriptionPlans />} />
                <Route path="promo-codes" element={<AdminPlaceholder />} />
                <Route path="match-settings" element={<AdminMatchSettings />} />
                <Route path="user-limits" element={<AdminUserLimits />} />
                <Route path="elo-management" element={<AdminEloManagement />} />
                <Route path="announcements" element={<AdminAnnouncements />} />
                <Route path="auto-messages" element={<AdminAutoMessages />} />
                <Route path="translations" element={<AdminTranslations />} />
                <Route path="maintenance" element={<AdminMaintenance />} />
              </Route>
            </Route>
          </Routes>
        )}
      </Suspense>
    </div>
  )
}

export default App

