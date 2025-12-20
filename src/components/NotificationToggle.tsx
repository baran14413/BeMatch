'use client';

import { useFcmToken } from '@/hooks/useFcmToken';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NotificationToggle() {
  const { toast } = useToast();
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
      title: 'Bildirimler engellendi',
      description: 'Bildirimleri etkinleştirmek için tarayıcı veya sistem ayarlarınızı kontrol etmelisiniz.',
    });
  };

  if (!isNotificationSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bildirimler</CardTitle>
          <CardDescription>Yeni eşleşmeler ve mesajlar gibi önemli güncellemelerden anında haberdar ol.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
             <p className="text-sm text-muted-foreground">Bu cihazda desteklenmiyor</p>
             <BellOff className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bildirimler</CardTitle>
        <CardDescription>Yeni eşleşmeler ve mesajlar gibi önemli güncellemelerden anında haberdar ol.</CardDescription>
      </CardHeader>
      <CardContent>
        {notificationPermission === 'granted' && (
           <div className="flex items-center justify-between p-3 bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg">
             <p className="text-sm font-medium">Bildirimler aktif</p>
             <Bell className="w-5 h-5" />
          </div>
        )}
        {notificationPermission === 'default' && (
          <Button onClick={handleRequestPermission} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
            Bildirimlere İzin Ver
          </Button>
        )}
        {notificationPermission === 'denied' && (
          <Button onClick={handleDisabledClick} variant="destructive" className="w-full">
            <BellOff className="w-4 h-4 mr-2" />
            Bildirimler Engellendi
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
