'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowLeft, Monitor, Sun, Moon, Bell, BellOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useLanguage } from "@/context/language-context";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

export default function ApplicationSettingsPage() {
    const { toast } = useToast();
    const { setTheme, theme } = useTheme();
    const { locale, setLocale, t } = useLanguage();
    
    // Cache states
    const [cacheSize, setCacheSize] = useState<string>('0 KB');
    const [lastCleared, setLastCleared] = useState<string | null>(null);

    // Notification states
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
    const [isNotificationLoading, setIsNotificationLoading] = useState(false);

    // --- NOTIFICATION LOGIC ---
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    const handleRequestNotificationPermission = async () => {
        if (!('Notification' in window)) return;

        setIsNotificationLoading(true);
        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            if (permission === 'granted') {
                toast({
                    title: "Bildirimlere İzin Verildi",
                    description: "Artık yeni eşleşmelerden haberdar olacaksın!",
                });
            }
        } catch (error) {
            console.error("Notification permission error:", error);
            toast({
                variant: 'destructive',
                title: "Hata",
                description: "Bildirim izni istenirken bir hata oluştu.",
            });
        } finally {
            setIsNotificationLoading(false);
        }
    };
    
    const getNotificationStatusText = () => {
        switch (notificationPermission) {
            case 'granted':
                return "Bildirimlere izin verildi.";
            case 'denied':
                return "Bildirimler engellendi.";
            default:
                return "Bildirimler için izin istenmedi.";
        }
    };


    // --- CACHE LOGIC ---
    const calculateCacheSize = () => {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key);
                if (value) {
                    total += (key.length + value.length) * 2; // Roughly in bytes
                }
            }
        }
        const sizeInKB = (total / 1024).toFixed(2);
        setCacheSize(`${sizeInKB} KB`);
    };
    
    const loadCacheInfo = () => {
        const lastClearedTimestamp = localStorage.getItem('cacheLastCleared');
        if (lastClearedTimestamp) {
            const date = new Date(parseInt(lastClearedTimestamp, 10));
            setLastCleared(formatDistanceToNow(date, { addSuffix: true, locale: locale === 'tr' ? tr : enUS }));
        } else {
            setLastCleared(t('applicationPage.neverCleared'));
        }
        calculateCacheSize();
    };

    useEffect(() => {
        loadCacheInfo();
    }, [locale]);


    const handleClearCache = () => {
        // Preserve essential settings
        const theme = localStorage.getItem('theme');
        const locale = localStorage.getItem('locale');

        // Clear everything else
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key !== 'theme' && key !== 'locale') {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Restore essential settings if they existed
        if(theme) localStorage.setItem('theme', theme);
        if(locale) localStorage.setItem('locale', locale);

        // Set new cleared timestamp
        localStorage.setItem('cacheLastCleared', Date.now().toString());
        
        toast({
            title: t('applicationPage.cacheClearedTitle'),
            description: t('applicationPage.cacheClearedDescription'),
        });
        
        // Reload info
        loadCacheInfo();
    };

    return (
        <ScrollArea className="h-full">
            <div className="h-full bg-gray-50 dark:bg-black">
                <header className="p-4 py-6 md:p-8 flex items-center gap-4">
                    <Link href="/settings" passHref>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-primary">{t('applicationPage.title')}</h1>
                        <p className="text-muted-foreground">{t('applicationPage.description')}</p>
                    </div>
                </header>

                <div className="p-4 md:p-8 md:pt-0 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('applicationPage.appearance')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 pr-4">
                                    <p className="font-medium">{t('applicationPage.theme')}</p>
                                    <p className="text-sm text-muted-foreground">{t('applicationPage.themeDescription')}</p>
                                </div>
                                <Select onValueChange={setTheme} defaultValue={theme}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder={t('applicationPage.selectTheme')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">
                                            <div className="flex items-center gap-2">
                                                <Sun className="w-4 h-4" /> {t('applicationPage.light')}
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="dark">
                                            <div className="flex items-center gap-2">
                                                <Moon className="w-4 h-4" /> {t('applicationPage.dark')}
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="system">
                                            <div className="flex items-center gap-2">
                                                <Monitor className="w-4 h-4" /> {t('applicationPage.system')}
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Separator />
                             <div className="flex items-center justify-between">
                                <div className="flex-1 pr-4">
                                    <p className="font-medium">{t('applicationPage.language')}</p>
                                    <p className="text-sm text-muted-foreground">{t('applicationPage.languageDescription')}</p>
                                </div>
                                <Select onValueChange={(value) => setLocale(value as 'tr' | 'en')} defaultValue={locale}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder={t('applicationPage.selectLanguage')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                                        <SelectItem value="en">🇬🇧 English</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Bildirimler</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-2">
                                        {notificationPermission === 'granted' ? <Bell className="w-5 h-5 text-green-500" /> : <BellOff className="w-5 h-5 text-destructive" />}
                                        <p className="font-medium">Anlık Bildirimler</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {getNotificationStatusText()}
                                    </p>
                                </div>
                                {notificationPermission === 'default' && (
                                     <Button variant="default" size="sm" onClick={handleRequestNotificationPermission} disabled={isNotificationLoading}>
                                        {isNotificationLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "İzin Ver"}
                                    </Button>
                                )}
                                {notificationPermission === 'denied' && (
                                    <p className="text-xs text-muted-foreground max-w-[150px] text-right">
                                        İzin vermek için tarayıcı ayarlarınızı kontrol edin.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('applicationPage.dataManagement')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-start justify-between">
                                <div className="flex-1 pr-4 space-y-4">
                                    <div>
                                      <p className="font-medium">{t('applicationPage.clearCache')}</p>
                                      <p className="text-sm text-muted-foreground">{t('applicationPage.clearCacheDescription')}</p>
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p><span className="font-semibold">{t('applicationPage.cacheSize')}:</span> {cacheSize}</p>
                                        <p><span className="font-semibold">{t('applicationPage.lastCleared')}:</span> {lastCleared}</p>
                                    </div>
                                </div>
                                <Button variant="destructive" size="sm" onClick={handleClearCache} className="mt-1">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t('applicationPage.clear')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ScrollArea>
    );
}
