'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function EmailVerificationBanner() {
    const { user } = useUser();
    const auth = useAuth();
    const { toast } = useToast();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);

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

    return (
        <div className="bg-yellow-400 dark:bg-yellow-600 text-black p-3 text-center text-sm flex items-center justify-center gap-4">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">
                {t('chat.toasts.verifyEmailPrompt')}
            </span>
            <Button
                onClick={handleSendVerification}
                disabled={isLoading}
                variant="secondary"
                size="sm"
                className="h-auto py-1 px-3 bg-black/10 hover:bg-black/20"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    t('chat.toasts.resendEmailButton')
                )}
            </Button>
        </div>
    );
}
