'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, X, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { AnimatePresence, motion } from 'framer-motion';

export default function NotificationPermissionBanner() {
    const { t } = useLanguage();
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Run only on client
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
            const dismissed = localStorage.getItem('notificationBannerDismissed');
            // Show if permission is not granted and not dismissed
            if (Notification.permission !== 'granted' && dismissed !== 'true') {
                setIsVisible(true);
            }
        }
    }, []);

    const handleRequestPermission = async () => {
        setIsLoading(true);
        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result === 'granted' || result === 'denied') {
                handleDismiss(); // Hide banner after user makes a choice
            }
        } catch (error) {
            console.error("Error requesting notification permission:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDismiss = () => {
        localStorage.setItem('notificationBannerDismissed', 'true');
        setIsVisible(false);
    };

    if (!isVisible || typeof window === 'undefined' || !('Notification' in window)) {
        return null;
    }
    
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-secondary text-secondary-foreground text-center text-sm overflow-hidden"
            >
                <div className="p-3 flex items-center justify-center gap-2 sm:gap-4 relative">
                    {permission === 'denied' ? (
                       <BellOff className="w-5 h-5 flex-shrink-0 text-destructive" />
                    ) : (
                       <Bell className="w-5 h-5 flex-shrink-0 text-primary" />
                    )}
                    
                    <span className="font-medium text-center">
                        {permission === 'denied' 
                            ? "Bildirimler engellendi. Ayarlardan izin verebilirsiniz." 
                            : "Yeni eşleşmelerden ve mesajlardan anında haberdar olun!"
                        }
                    </span>
                    
                    {permission === 'default' && (
                        <Button
                            onClick={handleRequestPermission}
                            disabled={isLoading}
                            variant="default"
                            size="sm"
                            className="h-auto py-1 px-3 flex-shrink-0"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : "Bildirimlere İzin Ver"}
                        </Button>
                    )}

                    <Button
                        onClick={handleDismiss}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full hover:bg-black/10 dark:hover:bg-white/10 absolute top-1/2 -translate-y-1/2 right-2"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
