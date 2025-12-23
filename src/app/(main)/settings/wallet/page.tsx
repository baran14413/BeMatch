'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Star, Gem, ArrowLeft, Loader2, Zap } from "lucide-react";
import Link from 'next/link';
import { useLanguage } from "@/context/language-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';
import { format, formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { addMinutes, isFuture } from 'date-fns';
import { Separator } from "@/components/ui/separator";

const InfoCard = ({ icon: Icon, title, value, actionText, onActionClick, disabled = false, description }: { icon: React.ElementType, title: string, value: string, actionText: string, onActionClick?: () => void, disabled?: boolean, description?: string }) => (
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
            {onActionClick && <Button onClick={onActionClick} variant="secondary" className="w-full" disabled={disabled}>{actionText}</Button>}
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

export default function WalletPage() {
    const { t, locale } = useLanguage();
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

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
    
    const handlePurchaseSuperLikes = async (amount: number) => {
        if (!userDocRef) return;
        try {
            await updateDoc(userDocRef, {
                superLikes: increment(amount)
            });
            toast({
                title: `${amount} Süper Beğeni Eklendi!`,
                description: 'Hesabına yeni Süper Beğeniler yüklendi.',
            });
        } catch (error) {
            console.error("Error purchasing super likes:", error);
            toast({ variant: 'destructive', title: 'Satın Alma Hatası', description: 'İşlem sırasında bir hata oluştu.'});
        }
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
                        <h1 className="text-3xl font-bold text-primary">{t('walletPage.title')}</h1>
                        <p className="text-muted-foreground">{t('walletPage.description')}</p>
                    </div>
                </header>
                {isLoading ? <WalletSkeleton /> : (
                    <div className="p-4 md:p-8 md:pt-0 space-y-8 pb-[calc(env(safe-area-inset-bottom,0rem)+2rem)]">
                        {userProfile?.premiumTier ? (
                             <Card className="overflow-hidden shadow-lg border-0">
                                <div className="p-6 bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 dark:from-yellow-500 dark:via-amber-500 dark:to-orange-600 text-black">
                                    <CardHeader className="p-0 mb-4">
                                        <div className="flex items-center gap-3">
                                            <Crown className="w-8 h-8" />
                                            <CardTitle className="text-2xl text-black">{t(`walletPage.${userProfile.premiumTier}Sub`)}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <p className="font-medium">
                                            {t('walletPage.nextBillDate')} 
                                            <span className="font-bold">
                                                {userProfile.premiumExpiresAt ? format(userProfile.premiumExpiresAt.toDate(), 'dd MMMM yyyy', { locale: locale === 'tr' ? tr : enUS }) : 'N/A'}
                                            </span>
                                        </p>
                                        <Button onClick={() => router.push('/settings/subscriptions')} variant="outline" className="mt-4 bg-transparent border-black text-black hover:bg-black/10">{t('walletPage.manageSub')}</Button>
                                    </CardContent>
                                </div>
                            </Card>
                        ) : (
                             <Card className="text-center p-6">
                                <CardTitle>{t('walletPage.noSubscription')}</CardTitle>
                                <CardDescription className="mt-2">{t('walletPage.noSubscriptionDesc')}</CardDescription>
                                <Button onClick={() => router.push('/settings/subscriptions')} className="mt-4">{t('walletPage.browsePackages')}</Button>
                            </Card>
                        )}
                       
                        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
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
                             <InfoCard
                                icon={Star}
                                title={t('walletPage.superLikes')}
                                value={userProfile?.superLikes?.toString() || '0'}
                                actionText={t('walletPage.getMore')}
                            />
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-center">Süper Beğeni Satın Al</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <InfoCard
                                    icon={Star}
                                    title="5 Süper Beğeni"
                                    value="25 ₺"
                                    actionText="Satın Al"
                                    onActionClick={() => handlePurchaseSuperLikes(5)}
                                />
                                <InfoCard
                                    icon={Star}
                                    title="15 Süper Beğeni"
                                    value="50 ₺"
                                    actionText="Satın Al"
                                    onActionClick={() => handlePurchaseSuperLikes(15)}
                                />
                                <InfoCard
                                    icon={Star}
                                    title="30 Süper Beğeni"
                                    value="80 ₺"
                                    description="En Popüler"
                                    actionText="Satın Al"
                                    onActionClick={() => handlePurchaseSuperLikes(30)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}
