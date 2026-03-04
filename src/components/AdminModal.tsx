import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, X, Info } from 'lucide-react';
import './Admin.css';

export type ModalType = 'confirm' | 'prompt' | 'alert';

interface AdminModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: ModalType;
    iconType?: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
    promptPlaceholder?: string;
    suggestedResponses?: string[];
    onConfirm: (val?: string) => void;
    onCancel: () => void;
}

export default function AdminModal({
    isOpen,
    title,
    message,
    type = 'confirm',
    iconType = 'warning',
    confirmText = 'Onayla',
    cancelText = 'İptal',
    promptPlaceholder = 'Buraya yazın...',
    suggestedResponses,
    onConfirm,
    onCancel
}: AdminModalProps) {
    const [inputValue, setInputValue] = useState('');

    if (!isOpen) return null;

    const renderIcon = () => {
        switch (iconType) {
            case 'danger': return <div style={{ color: 'var(--god-red)', backgroundColor: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '50%' }}><AlertTriangle size={32} /></div>;
            case 'warning': return <div style={{ color: 'var(--god-accent)', backgroundColor: 'rgba(245,158,11,0.1)', padding: '12px', borderRadius: '50%' }}><AlertTriangle size={32} /></div>;
            case 'success': return <div style={{ color: 'var(--god-green)', backgroundColor: 'rgba(16,185,129,0.1)', padding: '12px', borderRadius: '50%' }}><CheckCircle size={32} /></div>;
            case 'info':
            default: return <div style={{ color: 'var(--god-brand)', backgroundColor: 'rgba(56,189,248,0.1)', padding: '12px', borderRadius: '50%' }}><Info size={32} /></div>;
        }
    };

    const handleConfirm = () => {
        if (type === 'prompt' && !inputValue.trim()) {
            return; // Don't allow empty prompt submits if required, though we can make it optional. For now, let's just pass it.
        }
        onConfirm(type === 'prompt' ? inputValue : undefined);
        setInputValue('');
    };

    const handleCancel = () => {
        onCancel();
        setInputValue('');
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)'
                }}
                onClick={handleCancel}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="admin-card"
                    style={{
                        width: '90%', maxWidth: '450px',
                        padding: '32px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        textAlign: 'center',
                        position: 'relative',
                        border: '1px solid var(--god-border)'
                    }}
                >
                    <button
                        onClick={handleCancel}
                        style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--god-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <X size={20} />
                    </button>

                    {renderIcon()}

                    <h2 style={{ margin: '20px 0 12px 0', fontSize: '1.4rem', color: 'var(--god-text)' }}>{title}</h2>
                    <p style={{ color: 'var(--god-text-muted)', marginBottom: '24px', lineHeight: '1.6', fontSize: '0.95rem' }}>{message}</p>

                    {type === 'prompt' && (
                        <div style={{ width: '100%', marginBottom: '24px' }}>
                            <input
                                type="text"
                                autoFocus
                                className="admin-input"
                                style={{ width: '100%', textAlign: 'center', marginBottom: suggestedResponses && suggestedResponses.length > 0 ? '16px' : '0' }}
                                placeholder={promptPlaceholder}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                            />
                            {suggestedResponses && suggestedResponses.length > 0 && (
                                <div style={{
                                    display: 'flex', flexDirection: 'column', gap: '8px',
                                    maxHeight: '150px', overflowY: 'auto',
                                    paddingRight: '4px', textAlign: 'left'
                                }}>
                                    {suggestedResponses.map((res, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInputValue(res)}
                                            style={{
                                                padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--god-border)',
                                                background: inputValue === res ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                                                color: inputValue === res ? '#fff' : 'var(--god-text-muted)',
                                                fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                                                display: 'block', width: '100%', textAlign: 'left',
                                                lineHeight: '1.4'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                            onMouseOut={(e) => e.currentTarget.style.background = inputValue === res ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'}
                                        >
                                            {res}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: type === 'prompt' ? 0 : '12px' }}>
                        {type !== 'alert' && (
                            <button
                                onClick={handleCancel}
                                style={{
                                    flex: 1, padding: '14px', borderRadius: '8px', fontWeight: 'bold',
                                    background: 'rgba(255, 255, 255, 0.05)', color: '#fff',
                                    border: '1px solid rgba(255, 255, 255, 0.15)', cursor: 'pointer',
                                    fontSize: '0.95rem'
                                }}
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            style={{
                                flex: 1, padding: '14px', borderRadius: '8px', fontWeight: 'bold',
                                background: iconType === 'danger' ? '#ef4444' : '#eab308',
                                color: iconType === 'danger' ? '#fff' : '#000',
                                border: 'none', cursor: 'pointer',
                                fontSize: '0.95rem'
                            }}
                        >
                            {confirmText}
                        </button>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
