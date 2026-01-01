'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useLanguage } from '@/context/language-context';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

export default function LocationPage() {
    const { t, locale } = useLanguage();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const userDocRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile } = useDoc(userDocRef);

    const [currentLocation, setCurrentLocation] = useState("...");
    const [isUpdating, setIsUpdating] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const loadLocationInfo = () => {
        if (typeof window === 'undefined') return;
        if (userProfile?.location) {
            setCurrentLocation(userProfile.location);
        }
        const lastUpdatedTimestamp = localStorage.getItem('locationLastUpdated');
        if (lastUpdatedTimestamp) {
            const date = new Date(parseInt(lastUpdatedTimestamp, 10));
            setLastUpdated(formatDistanceToNow(date, { addSuffix: true, locale: locale === 'tr' ? tr : enUS }));
        } else {
            setLastUpdated(t('applicationPage.neverCleared'));
        }
    };

    useEffect(() => {
        if (isClient) {
            loadLocationInfo();
        }
    }, [userProfile, locale, isClient]);

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


    const handleUpdateLocation = () => {
        if (!navigator.geolocation) {
             toast({ variant: 'destructive', title: t('locationPage.noSupport') });
             return;
        }
        
        setIsUpdating(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const locationString = await getCityFromCoordinates(latitude, longitude);

            if (locationString && userDocRef) {
                try {
                    await updateDoc(userDocRef, { 
                        location: locationString,
                        latitude: latitude,
                        longitude: longitude,
                    });
                    
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('locationLastUpdated', Date.now().toString());
                    }

                    setCurrentLocation(locationString);
                    loadLocationInfo(); // Reload info to update timestamp
                    
                    toast({
                        title: t('locationPage.updateToastTitle'),
                        description: `${t('locationPage.newLocation')}: ${locationString}`,
                    });
                } catch (error) {
                     toast({ variant: 'destructive', title: t('locationPage.errorUpdating') });
                }
            }
             setIsUpdating(false);
        }, (error) => {
            console.error("Geolocation error: ", error);
             let errorTitle = "Konum Hatası";
             let errorDescription = "Konum bilginize erişilemedi. Lütfen cihazınızın konum servislerinin açık olduğundan ve tarayıcıya izin verdiğinizden emin olun.";
             if(error.code === error.PERMISSION_DENIED){
                 errorTitle = "Konum İzni Reddedildi";
                 errorDescription = "Konum iznini reddettiniz. Ayarlardan BeMatch için konuma izin vermeniz gerekiyor.";
             }
             toast({ 
                 variant: 'destructive', 
                 title: errorTitle,
                 description: errorDescription,
             });
             setIsUpdating(false);
        });
    };

    if (!isClient) {
      return null;
    }

    return (
        <ScrollArea className="h-full">
            <div className="h-full bg-gray-50 dark:bg-black">
                <header className="p-4 py-6 md:p-8 flex items-center gap-4 pt-[calc(env(safe-area-inset-top,0rem)+1.5rem)]">
                    <Link href="/settings" passHref>
                         <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-primary">{t('locationPage.title')}</h1>
                        <p className="text-muted-foreground">{t('locationPage.description')}</p>
                    </div>
                </header>

                <div className="p-4 md:p-8 md:pt-0 space-y-8 pb-[calc(env(safe-area-inset-bottom,0rem)+2rem)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('locationPage.currentLocation')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2 p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <MapPin className="w-6 h-6 text-primary" />
                                    <p className="text-lg font-semibold">{currentLocation}</p>
                                </div>
                                {lastUpdated && (
                                    <p className="text-xs text-muted-foreground pl-10">
                                      {t('locationPage.lastUpdated')}: {lastUpdated}
                                    </p>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t('locationPage.infoText')}
                            </p>
                            <Button onClick={handleUpdateLocation} className="w-full md:w-auto" disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isUpdating ? t('locationPage.updatingLocation') : t('locationPage.updateLocation')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ScrollArea>
    );
}
