
'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from 'next/link';
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mainSubscriptionPackage } from '@/config/subscriptions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useGooglePlayBilling } from '@/hooks/useGooglePlayBilling';
import { useToast } from '@/hooks/use-toast';

const FeatureListItem = ({ children }: { children: React.ReactNode }) => (
    <li className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-500" />
        <span className="text-muted-foreground">{children}</span>
    </li>
);

type Period = 'weekly' | 'monthly' | 'yearly';

export default function SubscriptionsPage() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [selectedPeriod, setSelectedPeriod] = useState<Period>('monthly');
    const { purchase, isReady, state, error } = useGooglePlayBilling();

    const currentPrice = mainSubscriptionPackage.pricing.find(p => p.period === selectedPeriod);
    const isLoading = state === 'PURCHASING' || state === 'LOADING';

    const handlePurchase = async () => {
        if (!currentPrice) return;
        const result = await purchase(currentPrice.productId);
        if (result?.success) {
            toast({
                title: 'Satın Alma Başarılı!',
                description: `BeMatch Gold aboneliğiniz başarıyla başlatıldı.`,
            });
        } else if (error?.code !== 'USER_CANCELLED') {
             toast({
                variant: 'destructive',
                title: 'Satın Alma Başarısız',
                description: error?.message || 'Bilinmeyen bir hata oluştu.',
            });
        }
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
                
                <div className="px-4 md:px-8 pb-8 flex justify-center pb-[calc(env(safe-area-inset-bottom,0rem)+2rem)]">
                    <Card className="flex flex-col border-2 border-primary/50 ring-2 ring-primary shadow-lg w-full max-w-md">
                        <CardHeader className="items-center text-center">
                             <CardTitle 
                                className="text-4xl font-bold tracking-tight"
                                style={{ color: mainSubscriptionPackage.colors.from }}
                            >
                                {mainSubscriptionPackage.name}
                            </CardTitle>
                            <CardDescription>Tüm premium özelliklere erişin.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-8">
                            <RadioGroup value={selectedPeriod} onValueChange={(value: string) => setSelectedPeriod(value as Period)} className="grid grid-cols-3 gap-2">
                                {mainSubscriptionPackage.pricing.map((p) => (
                                    <Label
                                        key={p.period}
                                        htmlFor={p.productId}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                                            selectedPeriod === p.period && "border-primary ring-2 ring-primary/50"
                                        )}
                                    >
                                        <RadioGroupItem value={p.period} id={p.productId} className="sr-only" />
                                        {p.badge && (
                                            <Badge variant="destructive" className="absolute -top-3 text-xs">{p.badge}</Badge>
                                        )}
                                        <span className="font-semibold text-sm">{t(`subscriptionsPage.${p.period}`)}</span>
                                        <span className="text-xs text-muted-foreground">{p.price}</span>
                                    </Label>
                                ))}
                            </RadioGroup>
                            
                            <ul className="space-y-4">
                                {mainSubscriptionPackage.features.map((feature, i) => (
                                    <FeatureListItem key={i}>
                                        {t(feature.text)}
                                    </FeatureListItem>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="flex-col gap-2">
                            <Button 
                                className="w-full h-12 text-lg font-bold"
                                style={{ background: `linear-gradient(to right, ${mainSubscriptionPackage.colors.from}, ${mainSubscriptionPackage.colors.to})`, color: 'white' }}
                                onClick={handlePurchase}
                                disabled={!isReady || isLoading}
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : `${currentPrice?.price} ile Abone Ol`}
                            </Button>
                            {!isReady && error && <p className="text-xs text-destructive">{error.message}</p>}
                            <p className="text-xs text-muted-foreground text-center pt-2">Satın alma işleminiz Google Play üzerinden güvenli bir şekilde gerçekleştirilecektir.</p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </ScrollArea>
    );
}
