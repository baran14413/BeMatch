'use client';

import { useFcmToken } from '@/hooks/useFcmToken';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useLanguage } from '@/context/language-context';

export default function NotificationToggle() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { 
    notificationPermission, 
    requestPermission, 
    isNotificationSupported 
  } = useFcmToken();

  const [isLoading, setIsLoading] = useState(false);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    await requestPermission();
    setIsLoading(false);
  };

  const handleDisabledClick = () => {
    toast({
      variant: 'destructive',
      title: t('notifications.blockedTitle'),
      description: t('notifications.blockedDescription'),
    });
  };

  if (!isNotificationSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('notifications.title')}</CardTitle>
          <CardDescription>{t('notifications.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
             <p className="text-sm text-muted-foreground">{t('notifications.notSupported')}</p>
             <BellOff className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('notifications.title')}</CardTitle>
        <CardDescription>{t('notifications.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {notificationPermission === 'granted' && (
           <div className="flex items-center justify-between p-3 bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg">
             <p className="text-sm font-medium">{t('notifications.active')}</p>
             <Bell className="w-5 h-5" />
          </div>
        )}
        {notificationPermission === 'default' && (
          <Button onClick={handleRequestPermission} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
            {t('notifications.enableButton')}
          </Button>
        )}
        {notificationPermission === 'denied' && (
          <Button onClick={handleDisabledClick} variant="destructive" className="w-full">
            <BellOff className="w-4 h-4 mr-2" />
            {t('notifications.blockedButton')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
