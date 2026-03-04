import { createContext, useContext, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastOptions {
    title: string
    message: string
    type?: ToastType
    duration?: number
}

interface ToastContextType {
    showToast: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<ToastOptions | null>(null)

    const showToast = (options: ToastOptions) => {
        setToast(options)
        setTimeout(() => {
            setToast((current) => (current === options ? null : current))
        }, options.duration || 5000)
    }

    const getIcon = (type: ToastType = 'info') => {
        switch (type) {
            case 'success': return <CheckCircle color="#10b981" size={24} />
            case 'error': return <AlertCircle color="#ef4444" size={24} />
            case 'info':
            default: return <Info color="#3b82f6" size={24} />
        }
    }

    const getBgColor = (type: ToastType = 'info') => {
        switch (type) {
            case 'success': return 'rgba(16, 185, 129, 0.15)'
            case 'error': return 'rgba(239, 68, 68, 0.15)'
            case 'info':
            default: return 'rgba(59, 130, 246, 0.15)'
        }
    }

    const getBorderColor = (type: ToastType = 'info') => {
        switch (type) {
            case 'success': return 'rgba(16, 185, 129, 0.3)'
            case 'error': return 'rgba(239, 68, 68, 0.3)'
            case 'info':
            default: return 'rgba(59, 130, 246, 0.3)'
        }
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        className="global-toast"
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        transition={{ type: 'spring', bounce: 0.4 }}
                        style={{ borderColor: getBorderColor(toast.type) }}
                    >
                        <div className="toast-icon" style={{ background: getBgColor(toast.type) }}>
                            {getIcon(toast.type)}
                        </div>
                        <div className="toast-content">
                            <h4 style={{ color: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#10b981' : '#3b82f6' }}>
                                {toast.title}
                            </h4>
                            <p>{toast.message}</p>
                        </div>
                        <button className="toast-close" onClick={() => setToast(null)}>
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within a ToastProvider')
    return context
}
