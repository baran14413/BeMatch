import { useState, useEffect } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase'
import './Login.css'

export default function Login() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const { login, user, loading: authLoading } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Forgot Password states
    const [forgotPasswordModal, setForgotPasswordModal] = useState(false)
    const [resetEmail, setResetEmail] = useState('')
    const [resetMessage, setResetMessage] = useState('')
    const [resetError, setResetError] = useState('')
    const [resetLoading, setResetLoading] = useState(false)

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            navigate('/home', { replace: true })
        }
    }, [user, authLoading, navigate])

    if (!authLoading && user) {
        return <Navigate to="/home" replace />
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(email, password)
            navigate('/home')
        } catch (err: any) {
            const code = err?.code || ''
            if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') setError(t('login.errorGeneric'))
            else if (code === 'auth/wrong-password') setError(t('login.errorGeneric'))
            else if (code === 'auth/invalid-email') setError(t('login.errorGeneric'))
            else if (code === 'auth/too-many-requests') setError(t('login.errorGeneric'))
            else setError(t('login.errorGeneric'))
            console.error('Login error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async () => {
        if (!resetEmail) {
            setResetError(t('login.err_email_req'))
            return
        }
        setResetError('')
        setResetMessage('')
        setResetLoading(true)
        try {
            await sendPasswordResetEmail(auth, resetEmail)
            setResetMessage(t('login.reset_success'))
            setTimeout(() => {
                setForgotPasswordModal(false)
                setResetMessage('')
            }, 5000)
        } catch (err: any) {
            const code = err?.code || ''
            if (code === 'auth/user-not-found') setResetError(t('login.err_user_not_found'))
            else if (code === 'auth/invalid-email') setResetError(t('login.err_invalid_email'))
            else setResetError(t('login.err_reset_gen'))
        } finally {
            setResetLoading(false)
        }
    }

    return (
        <div className="login-container">
            {/* Language Switcher */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
                <select
                    value={i18n.language?.split('-')[0] || 'tr'}
                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '8px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', outline: 'none' }}
                >
                    <option value="tr">🇹🇷 TR</option>
                    <option value="en">🇬🇧 EN</option>
                    <option value="de">🇩🇪 DE</option>
                </select>
            </div>

            <motion.div
                className="login-card"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="login-logo">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        BeMatch
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        {t('login.title')}
                    </motion.p>
                </div>

                {error && (
                    <motion.div
                        className="auth-error"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {error}
                    </motion.div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <motion.div
                        className="input-group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <label>{t('login.emailLabel')}</label>
                        <div className="input-wrapper">
                            <input
                                type="email"
                                placeholder={t('login.emailPlaceholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        className="input-group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <label>{t('login.passwordLabel')}</label>
                        <div className="input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t('login.passwordPlaceholder')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        className="forgot-password"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <button type="button" onClick={() => setForgotPasswordModal(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}>
                            {t('login.forgot_pwd')}
                        </button>
                    </motion.div>

                    <motion.button
                        type="submit"
                        className="login-btn"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                    >
                        {loading ? '...' : t('login.button')}
                    </motion.button>
                </form>

                <motion.div
                    className="login-footer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.65 }}
                >
                    <p>
                        {t('login.noAccount')} <Link to="/register">{t('login.registerLink')}</Link>
                    </p>
                </motion.div>
            </motion.div>

            {/* Forgot Password Modal */}
            <AnimatePresence>
                {forgotPasswordModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => { setForgotPasswordModal(false); setResetError(''); setResetMessage(''); }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#fff', fontSize: '1.2rem' }}>{t('login.reset_title')}</h3>

                            {resetMessage ? (
                                <div style={{ padding: '15px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '15px', lineHeight: 1.5, borderLeft: '3px solid #10b981' }}>
                                    {resetMessage}
                                </div>
                            ) : (
                                <>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '15px' }}>
                                        {t('login.reset_desc')}
                                    </p>

                                    {resetError && (
                                        <div style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px' }}>
                                            {resetError}
                                        </div>
                                    )}

                                    <input
                                        type="email"
                                        value={resetEmail}
                                        onChange={e => setResetEmail(e.target.value)}
                                        placeholder={t('login.reset_email_plc')}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', marginBottom: '20px' }}
                                    />
                                </>
                            )}

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button onClick={() => { setForgotPasswordModal(false); setResetError(''); setResetMessage(''); }} disabled={resetLoading} style={{ padding: '10px 16px', borderRadius: '8px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>{t('login.cancel')}</button>
                                {!resetMessage && (
                                    <button onClick={handleResetPassword} disabled={resetLoading} style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        {resetLoading ? t('login.sending') : t('login.send')}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

