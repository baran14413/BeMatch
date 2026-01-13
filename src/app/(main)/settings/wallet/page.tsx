'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Crown, Star, Gem, ArrowLeft, Loader2, Zap, ExternalLink } from "lucide-react";
import Link from 'next/link';
import { useLanguage } from "@/context/language-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';
import { format, formatDistanceToNow, formatDistanceStrict } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { addMinutes, isFuture } from 'date-fns';
import { Separator } from "@/components/ui/separator";
import { useGooglePlayBilling } from "@/hooks/useGooglePlayBilling";
import { useState } from 'react';
import { useTwa } from "@/hooks/use-twa";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";


const InfoCard = ({ icon: Icon, title, value, actionText, onActionClick, disabled = false, isLoading = false, description }: { icon: React.ElementType, title: string, value: string, actionText?: string, onActionClick?: () => void, disabled?: boolean, isLoading?: boolean, description?: string }) => (
    <Card className="text-center">
        <CardHeader className="items-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Icon className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-4xl font-bold">{value}</p>
            {onActionClick && (
                <Button onClick={onActionClick} variant="secondary" className="w-full" disabled={disabled || isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : actionText}
                </Button>
            )}
        </CardContent>
    </Card>
);

const WalletSkeleton = () => (
    <div className="p-4 md:p-8 md:pt-0 space-y-8">
        <Card className="overflow-hidden">
            <Skeleton className="h-[150px] w-full" />
        </Card>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[230px] w-full" />
            <Skeleton className="h-[230px] w-full" />
            <Skeleton className="h-[230px] w-full" />
        </div>
    </div>
);

const superLikePackages = {
    'superlike_5': { amount: 5, price: '25 TL' },
    'superlike_15': { amount: 15, price: '50 TL' },
    'superlike_30': { amount: 30, price: '80 TL' },
};


export default function WalletPage() {
    const { t, locale } = useLanguage();
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const isWebView = useTwa();
    
    const [purchasingId, setPurchasingId] = useState<string | null>(null);
    const manageAccountUrl = "https://bematch.netlify.app/settings/subscriptions";

    const { state: billingState, purchase } = useGooglePlayBilling({
        onPurchaseSuccess: () => {
            toast({
                title: 'Satın Alma Başarılı!',
                description: 'Satın alım hesabınıza eklendi.',
            });
            setPurchasingId(null);
        },
        onPurchaseError: (error) => {
            toast({
                variant: 'destructive',
                title: 'Satın Alma Başarısız Oldu',
                description: error,
            });
            setPurchasingId(null);
        },
    });

    const userDocRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const isLoading = isUserLoading || isProfileLoading;
    const boostIsActive = userProfile?.boostExpiresAt && isFuture(userProfile.boostExpiresAt.toDate());

    const handleBoost = async () => {
        if (!userDocRef) return;
        const newExpiry = addMinutes(new Date(), 30);
        try {
            await updateDoc(userDocRef, { boostExpiresAt: newExpiry });
            toast({ title: t('walletPage.boost.success') });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to activate boost.'});
        }
    };
    
    const handlePurchaseSuperLikes = async (productId: string) => {
        const packageName = process.env.NEXT_PUBLIC_TWA_PACKAGE_NAME;
        if (!packageName) {
            toast({
                variant: "destructive",
                title: "Yapılandırma Hatası",
                description: "Ödeme işlemi yapılamıyor. Uygulama yapılandırması eksik.",
            });
            return;
        }
        setPurchasingId(productId);
        await purchase(productId, packageName);
    };

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

    const isPurchasingAny = billingState === 'PURCHASING';
    
    return (
        <div className="h-dvh flex flex-col bg-background">
            <header className="p-4 py-6 md:p-8 flex items-center gap-4 pt-[calc(env(safe-area-inset-top,0rem)+1.5rem)]">
                <Link href="/settings" passHref>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-primary">{t('walletPage.title')}</h1>
                    <p className="text-muted-foreground">{t('walletPage.description')}</p>
                </div>
            </header>
            <ScrollArea className="flex-1">
                {isLoading ? <WalletSkeleton /> : (
                    <div className="p-4 md:p-8 md:pt-0 space-y-8 pb-[calc(env(safe-area-inset-bottom,0rem)+2rem)]">
                        {userProfile?.premiumTier ? (
                             <Card className="overflow-hidden shadow-lg border-0">
                                <div className="p-6 bg-gradient-to-br from-red-500 via-red-600 to-rose-700 text-white">
                                    <CardHeader className="p-0 mb-4">
                                        <div className="flex items-center gap-3">
                                            <Crown className="w-8 h-8" />
                                            <CardTitle className="text-2xl text-white">{t(`walletPage.${userProfile.premiumTier}Sub`)}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <p className="font-medium">
                                            {t('walletPage.nextBillDate')} 
                                            <span className="font-bold">
                                                {userProfile.premiumExpiresAt ? format(userProfile.premiumExpiresAt.toDate(), 'dd MMMM yyyy', { locale: locale === 'tr' ? tr : enUS }) : 'N/A'}
                                            </span>
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            <Button onClick={handleManageAccount} className={cn(buttonVariants({ variant: "outline", className: "bg-transparent border-white text-white hover:bg-white/10" }))}>
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                {t('walletPage.manageSubWeb')}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </div>
                            </Card>
                        ) : (
                             <Card className="text-center p-6">
                                <CardTitle>{t('walletPage.noSubscription')}</CardTitle>
                                <CardDescription className="mt-2">{t('walletPage.noSubscriptionDesc')}</CardDescription>
                                <Button onClick={handleManageAccount} className={cn(buttonVariants({ variant: 'destructive', className: "mt-4" }))}>
                                    {t('walletPage.manageSubWeb')}
                                </Button>
                            </Card>
                        )}
                       
                       {!isWebView && (
                        <div className="grid md:grid-cols-2 gap-6">
                             <Card className="text-center">
                                <CardHeader className="items-center">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                        <Zap className="w-8 h-8 text-primary" />
                                    </div>
                                    <CardTitle>{t('walletPage.boost.title')}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     {boostIsActive ? (
                                        <>
                                            <p className="text-2xl font-bold text-green-500">{t('walletPage.boost.active')}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {t('walletPage.boost.activeDesc')}
                                                <br/>
                                                {formatDistanceToNow(userProfile.boostExpiresAt.toDate(), { addSuffix: true, locale: locale === 'tr' ? tr : enUS })}
                                            </p>
                                        </>
                                     ) : (
                                        <>
                                            <p className="text-2xl font-bold">1</p>
                                            <Button onClick={handleBoost} variant="secondary" className="w-full">{t('walletPage.boost.action')}</Button>
                                        </>
                                     )}
                                </CardContent>
                            </Card>
                             <Card className="text-center">
                                <CardHeader className="items-center">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                        <Star className="w-8 h-8 text-primary" />
                                    </div>
                                    <CardTitle>{t('walletPage.superLikes')}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-4xl font-bold">{userProfile?.superLikes?.toString() || '0'}</p>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="secondary" className="w-full">{t('walletPage.getMore')}</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>{t('walletPage.getMore')} {t('walletPage.superLikes')}</DialogTitle>
                                                <DialogDescription>
                                                    Fark edilmek için Süper Beğeni paketlerinden birini seç.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                {Object.entries(superLikePackages).map(([id, pkg]) => (
                                                     <Button 
                                                        key={id}
                                                        onClick={() => handlePurchaseSuperLikes(id)}
                                                        disabled={isPurchasingAny}
                                                        className="w-full justify-between h-14"
                                                        variant="outline"
                                                     >
                                                         <div className="flex items-center gap-2">
                                                            {isPurchasingAny && purchasingId === id ? <Loader2 className="animate-spin w-4 h-4" /> : <Star className="w-5 h-5 text-blue-400" />}
                                                            <span>{pkg.amount} Süper Beğeni</span>
                                                         </div>
                                                         <span className="font-bold">{pkg.price}</span>
                                                     </Button>
                                                ))}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </CardContent>
                            </Card>
                        </div>
                       )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
