import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { UnreadProvider } from './context/UnreadContext'
import { ToastProvider } from './context/ToastContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { requestAllPermissions } from './utils/permissions'
import './index.css'
import './App.css'
import './i18n';
import App from './App.tsx'

// Request all native permissions on app startup
requestAllPermissions()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <UnreadProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </UnreadProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
)
