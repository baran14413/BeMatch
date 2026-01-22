'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, X } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useTwa } from '@/hooks/use-twa';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SwipeLimitPanelProps {
  onClose: () => void;
  limitExpiresAt: Date | undefined;
}

export default function SwipeLimitPanel({ onClose, limitExpiresAt }: SwipeLimitPanelProps) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [timeRemaining, setTimeRemaining] = useState('');
  const manageAccountUrl = "https://bematch.netlify.app/settings/subscriptions";

  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (!limitExpiresAt) {
        setTimeRemaining('...');
        return;
      }
      const now = new Date();
      if (now > limitExpiresAt) {
          setTimeRemaining(t('discover.limit.refreshed'));
          return;
      }
      const remaining = formatDistanceToNowStrict(limitExpiresAt, {
        locale: locale === 'tr' ? tr : enUS,
        addSuffix: true,
      });
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000); // Update every second

    return () => clearInterval(interval);
  }, [locale, limitExpiresAt, t]);
  
  const handleManageAccount = () => {
    try {
        const newWindow = window.open(manageAccountUrl, '_blank', 'noopener,noreferrer');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // If the popup was blocked, fall back to clipboard
            throw new Error('Pop-up blocked');
        }
    } catch (e) {
        navigator.clipboard.writeText(manageAccountUrl).then(() => {
            toast({
                title: "Link Kopyalandı",
                description: "Hesabınızı yönetmek için lütfen linki tarayıcınıza yapıştırın.",
            });
        }).catch(err => {
             toast({
                variant: 'destructive',
                title: "Hata",
                description: "Link kopyalanamadı. Lütfen tekrar deneyin.",
            });
        });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }}
        exit={{ y: "100%", opacity: 0 }}
        className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center text-white"
      >
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-6 right-4 text-white/70 hover:text-white">
          <X className="w-6 h-6" />
        </Button>
        <Timer className="w-20 h-20 text-primary mb-6" />
        <h1 className="text-4xl font-bold mb-2">{t('discover.limit.title')}</h1>
        <p className="font-bold text-xl mb-4">{t('discover.limit.usedSwipes')}: 10/10</p>

        <p className="text-white/80 text-lg mb-2">{t('discover.limit.panelDescription')}</p>
        <p className="text-primary font-bold text-xl mb-8">{timeRemaining}</p>
        
        <Card className="w-full max-w-sm bg-white/10 border-white/20 rounded-2xl relative overflow-hidden">
             <div 
                className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary via-yellow-400 to-orange-500 opacity-75 blur-lg animate-ping-slow"
                style={{ animationDuration: '6s' }}
            ></div>
            <CardContent className="p-6 relative">
                <h3 className="font-semibold text-lg">{t('discover.limit.manageAccountTitle')}</h3>
                <p className="text-white/70 mt-2 mb-4 text-sm">{t('discover.limit.manageAccountDescription')}</p>
                 <Button onClick={handleManageAccount} className={cn("w-full h-12 text-lg font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90")}>
                    {t('discover.limit.manageAccountButton')}
                 </Button>
            </CardContent>
        </Card>

      </motion.div>
    </motion.div>
  );
}
