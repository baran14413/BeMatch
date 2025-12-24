'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from 'next/link';
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { subscriptionPackages, PricingPlan } from '@/config/subscriptions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const FeatureListItem = ({ children, included }: { children: React.ReactNode, included: boolean }) => (
    <li className={cn("flex items-start gap-3", !included && "opacity-50")}>
        <CheckCircle2 className={cn("w-5 h-5 mt-0.5 flex-shrink-0", included ? "text-green-500" : "text-muted-foreground/50")} />
        <span className={cn("text-muted-foreground", !included && "line-through")}>{children}</span>
    </li>
);

type Period = 'weekly' | 'monthly' | 'yearly';

const SubscriptionCard = ({ pkg }: { pkg: typeof subscriptionPackages[0] }) => {
    const { t } = useLanguage();
    const [selectedPeriod, setSelectedPeriod] = useState<Period>('monthly');

    const currentPrice = pkg.pricing.find(p => p.period === selectedPeriod);

    return (
        <Card 
            className={cn(
                "flex flex-col border-2",
                pkg.isPopular ? "border-primary/50 ring-2 ring-primary shadow-lg" : "border-border"
            )}
        >
            {pkg.isPopular && (
                <Badge className="absolute -top-3 self-center" style={{ background: pkg.colors.from, color: 'white' }}>{t('subscriptionsPage.mostPopular')}</Badge>
            )}
            <CardHeader className="items-center text-center">
                <CardTitle 
                    className="text-4xl font-bold tracking-tight"
                    style={{ color: pkg.colors.from }}
                >
                    {pkg.name}
                </CardTitle>
                {currentPrice && (
                    <div className="flex items-baseline gap-1 relative h-10">
                        <span className="text-4xl font-bold">{currentPrice.price}₺</span>
                        <span className="text-muted-foreground">/ {t(`subscriptionsPage.${selectedPeriod}`)}</span>
                        {currentPrice.badge && (
                                <Badge variant="destructive" className="absolute -right-12 -top-2">{currentPrice.badge}</Badge>
                        )}
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-1 space-y-8">
                <RadioGroup value={selectedPeriod} onValueChange={(value: string) => setSelectedPeriod(value as Period)} className="grid grid-cols-3 gap-2">
                     {pkg.pricing.map((p) => (
                        <Label
                            key={p.period}
                            htmlFor={`${pkg.id}-${p.period}`}
                            className={cn(
                                "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                selectedPeriod === p.period && "border-primary"
                            )}
                        >
                            <RadioGroupItem value={p.period} id={`${pkg.id}-${p.period}`} className="sr-only" />
                            <span className="font-semibold text-sm">{t(`subscriptionsPage.${p.period}`)}</span>
                            <span className="text-xs text-muted-foreground">{p.price}₺</span>
                        </Label>
                    ))}
                </RadioGroup>
                
                <ul className="space-y-4">
                    {pkg.features.map((feature, i) => (
                        <FeatureListItem key={i} included={feature.included}>
                            {t(feature.text)}
                        </FeatureListItem>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
                <Button 
                    className="w-full h-12 text-lg font-bold"
                    style={{ background: `linear-gradient(to right, ${pkg.colors.from}, ${pkg.colors.to})`, color: 'white' }}
                >
                    {t('subscriptionsPage.choosePlan')}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default function SubscriptionsPage() {
    const { t } = useLanguage();

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
                
                <div className="px-4 md:px-8 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start pb-[calc(env(safe-area-inset-bottom,0rem)+2rem)]">
                    {subscriptionPackages.map((pkg) => (
                        <SubscriptionCard key={pkg.id} pkg={pkg} />
                    ))}
                </div>
            </div>
        </ScrollArea>
    );
}
