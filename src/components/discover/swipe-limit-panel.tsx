'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, X } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { endOfDay, formatDistanceToNowStrict } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useTwa } from '@/hooks/use-twa';

interface SwipeLimitPanelProps {
  onClose: () => void;
}

export default function SwipeLimitPanel({ onClose }: SwipeLimitPanelProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const isWebView = useTwa();
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const end = endOfDay(now);
      const remaining = formatDistanceToNowStrict(end, {
        unit: 'hour',
        locale: locale === 'tr' ? tr : enUS,
        addSuffix: true,
      });
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [locale]);
  
  const handleManageAccount = () => {
    if (isWebView) {
        window.open('https://bematch.app/settings/subscriptions', '_blank');
    } else {
        router.push('/settings/subscriptions');
    }
  }


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
        <h1 className="text-4xl font-bold mb-4">{t('discover.limit.title')}</h1>
        <p className="text-white/80 text-lg mb-2">{t('discover.limit.panelDescription')}</p>
        <p className="text-primary font-bold text-xl mb-8">{timeRemaining}</p>
        
        <Card className="w-full max-w-sm bg-white/10 border-white/20">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg">{t('discover.limit.manageAccountTitle')}</h3>
            <p className="text-white/70 mt-2 mb-4 text-sm">{t('discover.limit.manageAccountDescription')}</p>
            <Button className="w-full" onClick={handleManageAccount}>
                {t('discover.limit.manageAccountButton')}
            </Button>
          </CardContent>
        </Card>

      </motion.div>
    </motion.div>
  );
}
