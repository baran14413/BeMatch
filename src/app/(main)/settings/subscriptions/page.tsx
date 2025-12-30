
'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from 'next/link';
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { subscriptionPackages, type SubscriptionPackage } from '@/config/subscriptions';
import { useToast } from '@/hooks/use-toast';
import { useGooglePlayBilling } from '@/hooks/useGooglePlayBilling';

const FeatureListItem = ({ text, included }: { text: string, included: boolean }) => (
    <li className={cn("flex items-start gap-3", !included && "text-muted-foreground/50 line-through")}>
        {included ? 
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-500" /> : 
            <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        }
        <span>{text}</span>
    </li>
);


const PackageCard = ({
    pkg,
    onPurchase,
    isPurchasingThis,
    isBillingLoading,
    isBillingReady,
}:{
    pkg: SubscriptionPackage,
    onPurchase: (productId: string) => void,
    isPurchasingThis: boolean,
    isBillingLoading: boolean,
    isBillingReady: boolean;
}) => {
    const { t } = useLanguage();
    const isButtonDisabled = isBillingLoading || !isBillingReady;

    return (
        <Card className={cn(
            "flex flex-col w-full max-w-md mx-auto transition-all",
             pkg.isPopular ? "border-2 border-primary/50 ring-2 ring-primary shadow-lg" : ""
        )}>
            {pkg.isPopular && (
                <Badge 
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm py-1" 
                    style={{ backgroundColor: pkg.colors.badge, color: 'white' }}
                >
                    {t('subscriptionsPage.mostPopular')}
                </Badge>
            )}
            <CardHeader className="items-center text-center">
                 <CardTitle 
                    className="text-4xl font-bold tracking-tight"
                    style={{ color: pkg.colors.from }}
                >
                    {pkg.name}
                </CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-8">
                <div className="text-center">
                    <span className="text-4xl font-bold">{pkg.price}</span>
                    <span className="text-muted-foreground">{t(pkg.period)}</span>
                </div>
                <ul className="space-y-4">
                    {pkg.features.map((feature, i) => (
                        <FeatureListItem key={i} text={t(feature.text)} included={feature.included} />
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="flex-col gap-2 mt-4">
                <Button 
                    className="w-full h-12 text-lg font-bold"
                    style={{ background: `linear-gradient(to right, ${pkg.colors.from}, ${pkg.colors.to})`, color: 'white' }}
                    onClick={() => onPurchase(pkg.productId)}
                    disabled={isButtonDisabled}
                >
                    {isPurchasingThis || !isBillingReady ? <Loader2 className="animate-spin" /> : t('subscriptionsPage.choosePlan')}
                </Button>
            </CardFooter>
        </Card>
    );
};


export default function SubscriptionsPage() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [purchasingId, setPurchasingId] = useState<string | null>(null);

    const { purchase, isReady, isLoading } = useGooglePlayBilling({
        onPurchaseSuccess: () => {
            toast({
                title: 'Satın Alma Başarılı!',
                description: 'Aboneliğiniz başarıyla etkinleştirildi. Avantajların tadını çıkarın!',
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

    const handlePurchase = async (productId: string) => {
        if (!isReady) {
            toast({
                variant: 'destructive',
                title: 'Ödeme Sistemi Hazır Değil',
                description: 'Lütfen birkaç saniye bekleyip tekrar deneyin veya uygulamayı yeniden başlatın.',
            });
            return;
        }
        setPurchasingId(productId);
        
        const packageName = process.env.NEXT_PUBLIC_TWA_PACKAGE_NAME;
        if (!packageName) {
            console.error("TWA package name is not configured in environment variables.");
             toast({
                variant: 'destructive',
                title: 'Yapılandırma Hatası',
                description: 'Uygulama paket adı bulunamadı. Satın alma işlemi gerçekleştirilemiyor.',
            });
            setPurchasingId(null);
            return;
        }

        await purchase(productId, packageName);
    };
    
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
                        <h1 className="text-3xl font-bold text-primary">{t('subscriptionsPage.title')}</h1>
                        <p className="text-muted-foreground">{t('subscriptionsPage.description')}</p>
                    </div>
                </header>
                
                <div className="px-4 md:px-8 pb-8 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start pb-[calc(env(safe-area-inset-bottom,0rem)+2rem)]">
                   {subscriptionPackages.map(pkg => (
                       <PackageCard 
                          key={pkg.id} 
                          pkg={pkg}
                          onPurchase={handlePurchase}
                          isBillingLoading={isLoading}
                          isBillingReady={isReady}
                          isPurchasingThis={isLoading && purchasingId === pkg.productId}
                        />
                   ))}
                </div>
                 <div className="px-4 md:px-8 pb-8 text-center">
                    <p className="text-xs text-muted-foreground pt-2">Satın alma işleminiz Google Play üzerinden güvenli bir şekilde gerçekleştirilecektir.</p>
                </div>
            </div>
        </ScrollArea>
    );
}
