
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
import { useGooglePlayBilling } from "@/hooks/useGooglePlayBilling";
import { useTwa } from '@/hooks/use-twa';

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
    isPurchasingAny,
    isThisBeingPurchased,
}:{
    pkg: SubscriptionPackage,
    onPurchase: (productId: string) => void,
    isPurchasingAny: boolean,
    isThisBeingPurchased: boolean,
}) => {
    const { t } = useLanguage();
    const showSpinner = isThisBeingPurchased;
    const isDisabled = isPurchasingAny;

    return (
        <Card className={cn(
            "flex flex-col w-full max-w-md mx-auto transition-all",
             pkg.isPopular ? "border-2 border-destructive/50 ring-2 ring-destructive shadow-lg" : ""
        )}>
            {pkg.isPopular && (
                <Badge 
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm py-1 bg-destructive text-destructive-foreground" 
                >
                    {t('subscriptionsPage.mostPopular')}
                </Badge>
            )}
            <CardHeader className="items-center text-center">
                 <CardTitle 
                    className="text-4xl font-bold tracking-tight bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
                >
                    {pkg.name}
                </CardTitle>
                <CardDescription>{t(pkg.description)}</CardDescription>
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
                    className="w-full h-12 text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                    onClick={() => onPurchase(pkg.productId)}
                    disabled={isDisabled}
                >
                    {showSpinner ? <Loader2 className="animate-spin" /> : t('subscriptionsPage.choosePlan')}
                </Button>
            </CardFooter>
        </Card>
    );
};


export default function SubscriptionsPage() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [purchasingId, setPurchasingId] = useState<string | null>(null);
    const isWebView = useTwa();

    const { state: billingState, purchase } = useGooglePlayBilling({
        onPurchaseSuccess: () => {
            toast({
                title: 'Satın Alma Başarılı!',
                description: 'Premium üyelik avantajlarının tadını çıkarın!',
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
        const packageName = "com.bematch.bematch";
        setPurchasingId(productId);
        await purchase(productId, packageName);
    };

    if (!isWebView) {
        return (
            <div className="h-dvh flex flex-col items-center justify-center text-center p-6 bg-background">
                 <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>{t('subscriptionsPage.noPackagesInWebview')}</CardTitle>
                        <CardDescription>{t('subscriptionsPage.noPackagesInWebviewDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <a href="https://play.google.com/store/apps/details?id=com.bematch.bematch" target="_blank" rel="noopener noreferrer">
                            <Button>{t('subscriptionsPage.goToWebsite')}</Button>
                        </a>
                    </CardContent>
                 </Card>
            </div>
        )
    }
    
    return (
        <div className="h-dvh flex flex-col bg-background">
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
            
            <ScrollArea className="flex-1">
                <div className="px-4 md:px-8 pb-[calc(env(safe-area-inset-bottom,0rem)+6rem)] space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start h-full">
                    {subscriptionPackages.map(pkg => (
                        <PackageCard 
                            key={pkg.id} 
                            pkg={pkg}
                            onPurchase={handlePurchase}
                            isPurchasingAny={billingState === 'PURCHASING'}
                            isThisBeingPurchased={billingState === 'PURCHASING' && purchasingId === pkg.productId}
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
