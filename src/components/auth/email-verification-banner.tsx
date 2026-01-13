'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { AnimatePresence, motion } from 'framer-motion';

export default function EmailVerificationBanner() {
    const { user } = useUser();
    const auth = useAuth();
    const { toast } = useToast();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const dismissed = localStorage.getItem('emailVerificationDismissed');
        if (dismissed !== 'true') {
            setIsVisible(true);
        }
    }, []);

    const handleSendVerification = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            await sendEmailVerification(user);
            toast({
                title: t('login.forgotPassword.successTitle'),
                description: t('login.forgotPassword.successDescription'),
            });
        } catch (error) {
            console.error("Error sending verification email:", error);
            toast({
                variant: 'destructive',
                title: t('common.error'),
                description: (error as Error).message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem('emailVerificationDismissed', 'true');
        setIsVisible(false);
    }

    if (!isVisible) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-yellow-400 dark:bg-yellow-600 text-black text-center text-sm overflow-hidden"
            >
                <div className="p-3 flex items-center justify-center gap-2 sm:gap-4 relative">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-center">
                        {t('chat.toasts.verifyEmailPrompt')}
                    </span>
                    <Button
                        onClick={handleSendVerification}
                        disabled={isLoading}
                        variant="secondary"
                        size="sm"
                        className="h-auto py-1 px-3 bg-black/10 hover:bg-black/20 flex-shrink-0"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            t('chat.toasts.resendEmailButton')
                        )}
                    </Button>
                     <Button
                        onClick={handleDismiss}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full hover:bg-black/20 absolute top-1/2 -translate-y-1/2 right-2"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
