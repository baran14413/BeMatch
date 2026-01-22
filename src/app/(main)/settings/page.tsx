'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Heart, LogOut, MapPin, Shield, ShieldCheck, SlidersHorizontal, Smartphone, User, Wallet, GalleryHorizontal, Crown, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';

const SettingsSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-4">
        <h2 className="px-4 text-lg font-semibold text-muted-foreground">{title}</h2>
        <Card>
            <CardContent className="p-0">
                <ul className="divide-y">
                    {children}
                </ul>
            </CardContent>
        </Card>
    </div>
);

const SettingsItem = ({ icon: Icon, label, href, target }: { icon: React.ElementType, label: string, href?: string, target?: string }) => (
    <li className="list-none">
        <Link 
            href={href!} 
            target={target} 
            rel={target === '_blank' ? 'noopener noreferrer' : undefined} 
            className="flex items-center p-4 hover:bg-secondary cursor-pointer"
        >
            <Icon className="w-6 h-6 mr-4 text-primary" />
            <span className="flex-1 font-medium">{label}</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Link>
    </li>
);

const SettingsButton = ({ icon: Icon, label, onClick }: { icon: React.ElementType, label: string, onClick: () => void }) => (
     <li className="list-none">
        <button onClick={onClick} className="w-full">
            <div className="flex items-center p-4 hover:bg-secondary cursor-pointer">
                <Icon className="w-6 h-6 mr-4 text-primary" />
                <span className="flex-1 font-medium text-left">{label}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
        </button>
    </li>
);

export default function SettingsPage() {
    const { t } = useLanguage();
    const auth = useAuth();
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(() => {
        if (!authUser) return null;
        return doc(firestore, 'users', authUser.uid);
    }, [authUser, firestore]);
    const { data: userProfile } = useDoc<UserProfile>(userDocRef);

    const isAdmin = userProfile?.role === 'admin';

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({
                title: t('settings.logout'),
                description: "Görüşmek üzere!",
            });
            router.replace('/?loggedOut=true');
        } catch (error) {
            console.error("Logout error: ", error);
            toast({
                variant: 'destructive',
                title: "Çıkış yapılamadı",
                description: "Bir hata oluştu, lütfen tekrar deneyin.",
            });
        }
    };

  return (
    <ScrollArea className="h-full">
        <div className="h-full bg-gray-50 dark:bg-black">
            <header className="p-4 md:p-8 flex items-center gap-4 pt-[calc(env(safe-area-inset-top,0rem)+1.5rem)]">
                 <Link href="/profile" passHref>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-primary">{t('settings.title')}</h1>
                    <p className="text-muted-foreground">{t('settings.description')}</p>
                </div>
            </header>

            <div className="p-4 md:p-8 md:pt-0 space-y-8 pb-[calc(env(safe-area-inset-bottom,0rem)+2rem)]">
                {isAdmin && (
                    <SettingsSection title="Yönetim">
                         <SettingsItem icon={Shield} label="Admin Paneli" href="/admin" />
                    </SettingsSection>
                )}

                <SettingsSection title={t('settings.account')}>
                    <SettingsItem icon={Crown} label={t('subscriptionsPage.title')} href="/settings/subscriptions" />
                    <SettingsItem icon={User} label={t('settings.personalInfo')} href="/settings/personal-info" />
                    <SettingsItem icon={GalleryHorizontal} label={t('settings.editGallery')} href="/settings/gallery" />
                    <SettingsItem icon={Wallet} label={t('settings.wallet')} href="/settings/wallet"/>
                    <SettingsItem icon={Heart} label={t('settings.editInterests')} href="/settings/interests" />
                </SettingsSection>

                <SettingsSection title={t('settings.discovery')}>
                    <SettingsItem icon={MapPin} label={t('settings.location')} href="/settings/location"/>
                    <SettingsItem icon={SlidersHorizontal} label={t('settings.preferences')} href="/settings/preferences"/>
                </SettingsSection>

                 <SettingsSection title={t('settings.app')}>
                    <SettingsItem icon={Smartphone} label={t('settings.application')} href="/settings/application"/>
                    <SettingsItem icon={Star} label="Uygulamayı Değerlendir" href="https://play.google.com/store/apps/details?id=com.bematch.bematch" target="_blank" />
                </SettingsSection>

                <SettingsSection title={t('settings.privacySecurity')}>
                    <SettingsItem icon={ShieldCheck} label={t('settings.privacySecurity')} href="/settings/security" />
                </SettingsSection>

                <SettingsSection title={t('settings.session')}>
                    <SettingsButton icon={LogOut} label={t('settings.logout')} onClick={handleLogout} />
                </SettingsSection>
            </div>
        </div>
    </ScrollArea>
  );
}
