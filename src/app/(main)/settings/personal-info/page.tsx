'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, Monitor, Clock, Calendar, ArrowLeft, BadgeCheck, Mail, Loader2, AlertTriangle } from "lucide-react";
import Link from 'next/link';
import { useLanguage } from '@/context/language-context';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import type { UserProfile } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { sendEmailVerification } from 'firebase/auth';
import { usePageVisibility } from '@/hooks/use-page-visibility';

const InfoItem = ({ label, value }: { label: string, value: string | React.ReactNode }) => (
    <div className="flex justify-between items-center py-3">
        <p className="text-muted-foreground">{label}</p>
        <div className="font-semibold text-right">{value}</div>
    </div>
);

const SessionItem = ({ icon: Icon, title, time }: { icon: React.ElementType, title: string, time: string }) => (
    <div className="flex items-center gap-4 py-3">
        <Icon className="w-8 h-8 text-primary" />
        <div className="flex-1">
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">{time}</p>
        </div>
    </div>
);

export default function PersonalInfoPage() {
    const { t, locale } = useLanguage();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    const [isSendingVerification, setIsSendingVerification] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const isVisible = usePageVisibility();

    const userDocRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);
    
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    useEffect(() => {
        if (isVisible && user) {
            user.reload();
        }
    }, [isVisible, user]);
    
    useEffect(() => {
        if(userProfile) {
            setFirstName(userProfile.firstName || '');
            setLastName(userProfile.lastName || '');
        }
    }, [userProfile]);

    const handleSendVerification = async () => {
        if (!user) return;
        setIsSendingVerification(true);
        try {
            await sendEmailVerification(user);
            toast({
                title: t('login.forgotPassword.successTitle'),
                description: t('login.forgotPassword.successDescription'),
            });
        } catch (error) {
            console.error("Error sending verification email:", error);
            toast({
                variant: 'destructive',
                title: t('common.error'),
                description: (error as Error).message,
            });
        } finally {
            setIsSendingVerification(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!userDocRef || !firstName.trim() || !lastName.trim()) return;
        setIsSaving(true);
        try {
            await updateDoc(userDocRef, {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                name: `${firstName.trim()} ${lastName.trim()}`
            });
            toast({
                title: "Başarılı",
                description: "Kişisel bilgilerin başarıyla güncellendi.",
            });
        } catch(error) {
            console.error("Error updating personal info:", error);
            toast({
                variant: 'destructive',
                title: t('common.error'),
                description: "Bilgiler güncellenirken bir hata oluştu.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const isLoading = isUserLoading || isProfileLoading;
    
    const lastSignInTime = user?.metadata.lastSignInTime 
        ? formatDistanceToNow(new Date(user.metadata.lastSignInTime), { addSuffix: true, locale: locale === 'tr' ? tr : enUS }) 
        : '...';
        
    const creationTime = user?.metadata.creationTime 
        ? new Date(user.metadata.creationTime).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : '...';
        
    const originalNameIsSet = !!userProfile?.firstName && !!userProfile?.lastName;
    const nameHasChanged = originalNameIsSet && (firstName !== userProfile.firstName || lastName !== userProfile.lastName);

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
                        <h1 className="text-3xl font-bold text-primary">{t('personalInfoPage.title')}</h1>
                        <p className="text-muted-foreground">{t('personalInfoPage.description')}</p>
                    </div>
                </header>

                <div className="p-4 md:p-8 md:pt-0 space-y-8 pb-[calc(env(safe-area-inset-bottom,0rem)+2rem)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('personalInfoPage.profileDetails')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isLoading ? (
                                <div className="space-y-4 py-2">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-8 w-full" />
                                    <Skeleton className="h-8 w-full" />
                                </div>
                            ) : userProfile && user ? (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">{t('personalInfoPage.firstName')}</Label>
                                        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="lastName">{t('personalInfoPage.lastName')}</Label>
                                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                    </div>
                                    <div className="divide-y">
                                        <InfoItem label={t('personalInfoPage.age')} value={userProfile.age.toString()} />
                                        <InfoItem 
                                            label="E-posta" 
                                            value={
                                            <div className="flex items-center gap-3">
                                                <span>{user.email}</span>
                                                {user.emailVerified ? (
                                                    <div className="flex items-center gap-1 text-green-600">
                                                        <BadgeCheck className="w-5 h-5" />
                                                        <span className="text-sm font-medium">{t('personalInfoPage.verified')}</span>
                                                    </div>
                                                ) : (
                                                    <Button size="sm" variant="outline" onClick={handleSendVerification} disabled={isSendingVerification}>
                                                        {isSendingVerification ? (
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        ) : (
                                                             <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                                                        )}
                                                        {t('personalInfoPage.verify')}
                                                    </Button>
                                                )}
                                            </div>
                                        } />
                                    </div>
                                </>
                            ) : (
                                <p>{t('profile.notFound')}</p>
                            )}
                        </CardContent>
                    </Card>
                    
                    {nameHasChanged && (
                         <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full md:w-auto">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {t('common.save')}
                        </Button>
                    )}


                    <Card>
                        <CardHeader>
                            <CardTitle>{t('personalInfoPage.sessionActivity')}</CardTitle>
                            <CardDescription>{t('personalInfoPage.sessionDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent className="divide-y">
                             {isLoading ? (
                                <div className="space-y-4 py-2">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                             ) : (
                                <>
                                    <SessionItem icon={Clock} title={t('personalInfoPage.activeNow')} time={lastSignInTime} />
                                    <SessionItem icon={Calendar} title={t('personalInfoPage.accountCreation')} time={creationTime} />
                                </>
                             )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ScrollArea>
    );
}
