'use client';
import { useEffect, useState } from 'react';
import { useOnboardingContext } from '@/context/onboarding-context';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function StepLocation() {
  const { formData, updateFormData, setStepValid } = useOnboardingContext();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCityFromCoordinates = async (latitude: number, longitude: number) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        if (!response.ok) throw new Error('Failed to fetch city.');
        const data = await response.json();
        const city = data.address.city || data.address.town || data.address.county || 'Bilinmeyen Konum';
        const countryCode = data.address.country_code.toUpperCase();
        return `${city}, ${countryCode}`;
    } catch (error) {
        console.error("Reverse geocoding error:", error);
        toast({ variant: 'destructive', title: 'Konum alınamadı', description: 'Konum bilgisi alınamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.' });
        return null;
    }
  };

  const handleLocationRequest = () => {
    if (!navigator.geolocation) {
        setError(t('locationPage.noSupport'));
        toast({ variant: 'destructive', title: t('locationPage.noSupport') });
        return;
    }

    setIsLocating(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationString = await getCityFromCoordinates(latitude, longitude);
        if (locationString) {
          updateFormData({ 
              location: locationString, 
              latitude,
              longitude,
              locationEnabled: true 
          });
        }
        setIsLocating(false);
      }, 
      (err) => {
        console.error("Geolocation error: ", err);
        let errorTitle = "Konum Hatası";
        let errorDescription = "Bilinmeyen bir hata oluştu.";

        switch(err.code) {
            case err.PERMISSION_DENIED:
                errorTitle = "Konum İzni Reddedildi";
                errorDescription = "BeMatch'in konumunuza erişmesine izin vermelisiniz. Lütfen tarayıcı ayarlarından izni etkinleştirin.";
                break;
            case err.POSITION_UNAVAILABLE:
                 errorTitle = "Konum Bilgisi Alınamıyor";
                 errorDescription = "Cihazınızın konum servisleri kapalı olabilir. Lütfen telefonunuzun ayarlarından konumu açıp tekrar deneyin.";
                break;
            case err.TIMEOUT:
                 errorTitle = "İstek Zaman Aşımına Uğradı";
                 errorDescription = "Konum alma zaman aşımına uğradı. Cihazınızın konum servislerinin açık olduğundan emin olun.";
                break;
        }
        setError(errorDescription);
        toast({
            variant: "destructive",
            title: errorTitle,
            description: errorDescription,
        });
        setIsLocating(false);
      },
      {
          timeout: 10000, // Wait 10 seconds
          enableHighAccuracy: false
      }
    );
  };

  useEffect(() => {
    setStepValid(formData.locationEnabled);
  }, [formData.locationEnabled, setStepValid]);

  const locationTaken = formData.locationEnabled && formData.location;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-6">
        <div className={cn(
            'w-24 h-24 rounded-full flex items-center justify-center transition-colors',
            locationTaken ? 'bg-green-100 dark:bg-green-900/50' : 'bg-primary/10'
            )}>
            <MapPin className={cn(
                "w-12 h-12 transition-colors",
                locationTaken ? 'text-green-500' : 'text-primary'
            )} />
        </div>
        
        <p className="text-muted-foreground">
            {locationTaken 
                ? t('onboarding.location.info') 
                : "Yakınındaki eşleşmeleri bulmak için konum servislerini etkinleştir."
            }
        </p>

        {!locationTaken && (
            <Button onClick={handleLocationRequest} disabled={isLocating} className="w-full max-w-xs">
                {isLocating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLocating ? t('locationPage.findingLocation') : t('onboarding.location.enableButton')}
            </Button>
        )}
        
        {error && (
            <div className="flex items-center gap-2 text-sm text-destructive p-3 bg-destructive/10 rounded-md">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
            </div>
        )}

        {locationTaken && (
            <div className="text-center p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">Mevcut Konumun</p>
              <p className="text-lg font-semibold pt-1">{formData.location}</p>
            </div>
        )}
    </div>
  );
}
