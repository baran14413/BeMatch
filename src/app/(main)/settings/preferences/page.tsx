'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/language-context';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/lib/data';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PreferencesPage() {
    const { t } = useLanguage();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const [distance, setDistance] = useState(50);
    const [ageRange, setAgeRange] = useState([18, 55]);
    const [globalMode, setGlobalMode] = useState(true);
    const [interestedIn, setInterestedIn] = useState<UserProfile['interestedIn']>('everyone');
    const [isSaving, setIsSaving] = useState(false);

     const interestOptions = [
        { id: 'man', label: t('onboarding.interestedIn.men') },
        { id: 'woman', label: t('onboarding.interestedIn.women') },
        { id: 'everyone', label: t('onboarding.interestedIn.everyone') },
    ];

    useEffect(() => {
        if (userProfile) {
            setDistance(userProfile.maxDistance || 50);
            setAgeRange(userProfile.ageRange || [18, 55]);
            setGlobalMode(userProfile.globalMode === undefined ? true : userProfile.globalMode);
            setInterestedIn(userProfile.interestedIn || 'everyone');
        }
    }, [userProfile]);

    const handleSaveChanges = async () => {
        if (!userDocRef) return;
        setIsSaving(true);
        try {
            await updateDoc(userDocRef, {
                maxDistance: distance,
                ageRange: ageRange,
                globalMode: globalMode,
                interestedIn: interestedIn,
            });
            toast({
                title: t('preferencesPage.saveSuccessTitle'),
                description: t('preferencesPage.saveSuccessDescription'),
            });
        } catch (error) {
            console.error("Failed to save preferences: ", error);
            toast({
                variant: 'destructive',
                title: t('preferencesPage.saveErrorTitle'),
            });
        } finally {
            setIsSaving(false);
        }
    };

    const isLoading = isUserLoading || isProfileLoading;

    if (isLoading) {
        return (
             <div className="h-full bg-gray-50 dark:bg-black p-4 md:p-8">
                <header className="py-2 flex items-center gap-4 mb-4">
                    <Skeleton className="h-10 w-10" />
                    <div className="space-y-2">
                         <Skeleton className="h-8 w-48" />
                         <Skeleton className="h-4 w-64" />
                    </div>
                </header>
                 <div className="space-y-8">
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                    </Card>
                     <Card>
                        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                    </Card>
                     <Card>
                        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                    </Card>
                 </div>
            </div>
        )
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
                        <h1 className="text-3xl font-bold text-primary">{t('preferencesPage.title')}</h1>
                        <p className="text-muted-foreground">{t('preferencesPage.description')}</p>
                    </div>
                </header>

                <div className="p-4 md:p-8 md:pt-0 space-y-8 pb-[calc(env(safe-area-inset-bottom,0rem)+2rem)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('preferencesPage.showMe')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                             {interestOptions.map((option) => (
                                <Button
                                    key={option.id}
                                    onClick={() => setInterestedIn(option.id as UserProfile['interestedIn'])}
                                    variant={interestedIn === option.id ? 'default' : 'outline'}
                                    className={cn('w-full justify-center h-12 text-base')}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('preferencesPage.locationTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="global-mode" className="font-medium">{t('preferencesPage.globalMode')}</Label>
                                    <p className="text-sm text-muted-foreground">{t('preferencesPage.globalModeDescription')}</p>
                                </div>
                                <Switch
                                    id="global-mode"
                                    checked={globalMode}
                                    onCheckedChange={setGlobalMode}
                                />
                            </div>
                            <Separator />
                            <div className="space-y-4" aria-disabled={globalMode} style={{ opacity: globalMode ? 0.5 : 1 }}>
                                <div className="flex justify-between items-baseline">
                                    <Label htmlFor='distance-slider'>{t('preferencesPage.maxDistance')}</Label>
                                    <span className="text-lg font-semibold text-primary">{distance} {t('common.km')}</span>
                                </div>
                                <Slider
                                    id="distance-slider"
                                    value={[distance]}
                                    max={150}
                                    step={1}
                                    onValueChange={(value) => setDistance(value[0])}
                                    disabled={globalMode}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('preferencesPage.ageRange')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-baseline">
                                    <Label>{t('preferencesPage.ageRange')}</Label>
                                    <span className="text-lg font-semibold text-primary">{ageRange[0]} - {ageRange[1]}</span>
                                </div>
                                 <Slider
                                    value={ageRange}
                                    max={65}
                                    min={18}
                                    step={1}
                                    onValueChange={setAgeRange}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full md:w-auto">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {t('preferencesPage.save')}
                    </Button>
                </div>
            </div>
        </ScrollArea>
    );
}
