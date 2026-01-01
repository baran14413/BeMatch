'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import PasswordStrength from '@/components/auth/password-strength';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from '@/context/language-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth, useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

export default function SecurityPage() {
    const { t, locale } = useLanguage();
    const auth = useAuth();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const userDocRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile } = useDoc<UserProfile>(userDocRef);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);

    const [deleteStep, setDeleteStep] = useState(0);
    const [selectedReason, setSelectedReason] = useState('');
    const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [passwordLastUpdated, setPasswordLastUpdated] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient && userProfile?.passwordLastUpdatedAt) {
            setPasswordLastUpdated(formatDistanceToNow(userProfile.passwordLastUpdatedAt.toDate(), { addSuffix: true, locale: locale === 'tr' ? tr : enUS }));
        }
    }, [isClient, userProfile, locale]);

    const deletionReasons = [
        { id: 'privacy', label: t('securityPage.deletionReasons.privacy') },
        { id: 'matches', label: t('securityPage.deletionReasons.matches') },
        { id: 'break', label: t('securityPage.deletionReasons.break') },
        { id: 'met_someone', label: t('securityPage.deletionReasons.met_someone') },
        { id: 'technical', label: t('securityPage.deletionReasons.technical') },
        { id: 'other', label: t('securityPage.deletionReasons.other') },
    ];

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast({ variant: 'destructive', title: t('onboarding.credentials.passwordMismatch') });
            return;
        }
        if (currentPassword === newPassword) {
            toast({ variant: 'destructive', title: t('securityPage.passwordSameAsCurrent') });
            return;
        }
        if (!user || !user.email) return;

        setIsPasswordSaving(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            if (userDocRef) {
                await updateDoc(userDocRef, {
                    passwordLastUpdatedAt: serverTimestamp()
                });
            }

            toast({ title: "Başarılı", description: "Şifreniz başarıyla güncellendi." });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: "Hata", description: "Şifre değiştirilemedi. Mevcut şifrenizi kontrol edin." });
        } finally {
            setIsPasswordSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user || !user.email) return;
    
        setIsDeleting(true);
        try {
          const credential = EmailAuthProvider.credential(user.email, deleteConfirmPassword);
          await reauthenticateWithCredential(user, credential);
          
          const deletionLogRef = doc(firestore, 'deletedUsers', user.uid);
          await setDoc(deletionLogRef, {
            email: user.email,
            reason: selectedReason,
            deletedAt: serverTimestamp(),
          });
    
          if (userDocRef) {
            await deleteDoc(userDocRef);
          }
          
          await deleteUser(user);
    
          toast({
            title: 'Hesap Silindi',
            description: 'Hesabınız kalıcı olarak silindi. Sizi tekrar aramızda görmeyi umuyoruz.',
          });
          router.push('/');
        } catch (error: any) {
          console.error('Hesap silme hatası:', error);
          let description =
            'İşlem sırasında bir hata oluştu. Lütfen şifrenizi kontrol edip tekrar deneyin.';
          if (error.code === 'auth/invalid-credential') {
            description =
              'Girilen şifre yanlış. Lütfen hesabınızın şifresini doğru girdiğinizden emin olun.';
          }
           if (error.code === 'permission-denied') {
             description =
              'Hesap silme işlemi için yetkiniz yok veya bir kural ihlali oluştu. Lütfen destek ile iletişime geçin.';
          }
          toast({
            variant: 'destructive',
            title: 'Hesap Silinemedi',
            description: description,
          });
        } finally {
          setIsDeleting(false);
        }
      };

    const resetDeleteFlow = () => {
        setDeleteStep(0);
        setSelectedReason('');
        setDeleteConfirmPassword('');
    }

    if (!isClient) {
      return null;
    }

    return (
        <ScrollArea className="h-full">
            <div className="h-full bg-gray-50 dark:bg-black">
                <header className="p-4 py-6 md:p-8 flex items-center gap-4 border-b mb-8 pt-[calc(env(safe-area-inset-top,0rem)+1.5rem)]">
                    <Link href="/settings" passHref>
                         <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-primary">{t('securityPage.title')}</h1>
                        <p className="text-muted-foreground">{t('securityPage.description')}</p>
                    </div>
                </header>

                <div className="p-4 md:p-8 md:pt-0 space-y-12 pb-[calc(env(safe-area-inset-bottom,0rem)+2rem)]">
                    <Card>
                      <Accordion type="single" collapsible>
                        <AccordionItem value="item-1" className="border-b-0">
                          <AccordionTrigger className="p-6 hover:no-underline">
                              <div className="text-left">
                                <h3 className="text-lg font-semibold">{t('securityPage.changePassword')}</h3>
                                <p className="text-sm text-muted-foreground">{t('securityPage.changePasswordDescription')}</p>
                              </div>
                          </AccordionTrigger>
                          <AccordionContent className="p-6 pt-0">
                            <div className="space-y-6">
                                {passwordLastUpdated && (
                                    <p className="text-sm text-muted-foreground">
                                        {t('securityPage.lastPasswordUpdate')}: {passwordLastUpdated}
                                    </p>
                                )}
                                <div className="space-y-2 relative">
                                    <Label htmlFor="currentPassword">{t('securityPage.currentPassword')}</Label>
                                    <Input id="currentPassword" type={showCurrent ? 'text' : 'password'} placeholder={t('securityPage.passwordHintCurrent')} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                                    <Button type="button" variant="ghost" size="icon" className="absolute right-2.5 top-8 h-7 w-7 text-muted-foreground" onClick={() => setShowCurrent(!showCurrent)}>
                                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <div className="space-y-2 relative">
                                    <Label htmlFor="newPassword">{t('securityPage.newPassword')}</Label>
                                    <Input id="newPassword" type={showNew ? 'text' : 'password'} placeholder={t('securityPage.passwordHintNew')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                     <Button type="button" variant="ghost" size="icon" className="absolute right-2.5 top-8 h-7 w-7 text-muted-foreground" onClick={() => setShowNew(!showNew)}>
                                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <PasswordStrength password={newPassword} />
                                </div>
                                <div className="space-y-2 relative">
                                    <Label htmlFor="confirmPassword">{t('securityPage.confirmNewPassword')}</Label>
                                    <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder={t('securityPage.passwordHintConfirm')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                     <Button type="button" variant="ghost" size="icon" className="absolute right-2.5 top-8 h-7 w-7 text-muted-foreground" onClick={() => setShowConfirm(!showConfirm)}>
                                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <Button onClick={handleChangePassword} disabled={isPasswordSaving}>
                                    {isPasswordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('securityPage.savePassword')}
                                </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </Card>
                    
                     <Card>
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1" className="border-b-0">
                                <AccordionTrigger className="p-6 hover:no-underline text-destructive hover:text-destructive/90 [&[data-state=open]>svg]:text-destructive">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-6 h-6" />
                                        <div className="text-left">
                                            <h3 className="text-lg font-semibold">{t('securityPage.deleteAccountTitle')}</h3>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-6 pt-0">
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground">{t('securityPage.deleteAccountInfo')}</p>
                                         <AlertDialog onOpenChange={(open) => !open && resetDeleteFlow()}>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" className="w-full">{t('securityPage.startDeletion')}</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                {deleteStep === 0 && (
                                                    <>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t('securityPage.deleteModal.step0Title')}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                               {t('securityPage.deleteModal.step0Description')}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <div className="py-4 space-y-4">
                                                            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                                                                {deletionReasons.map((reason) => (
                                                                    <div key={reason.id} className="flex items-center space-x-2">
                                                                        <RadioGroupItem value={reason.id} id={reason.id} />
                                                                        <Label htmlFor={reason.id} className="cursor-pointer">{reason.label}</Label>
                                                                    </div>
                                                                ))}
                                                            </RadioGroup>
                                                        </div>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                                            <Button onClick={() => setDeleteStep(1)} disabled={!selectedReason}>
                                                                {t('common.continue')}
                                                            </Button>
                                                        </AlertDialogFooter>
                                                    </>
                                                )}
                                                {deleteStep === 1 && (
                                                    <>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t('securityPage.deleteModal.step1Title')}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t('securityPage.deleteModal.step1Description')}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <div className="space-y-2 py-4">
                                                            <Label htmlFor="password-confirm">{t('securityPage.deleteModal.passwordLabel')}</Label>
                                                            <Input id="password-confirm" type="password" placeholder={t('securityPage.deleteModal.passwordPlaceholder')} value={deleteConfirmPassword} onChange={(e) => setDeleteConfirmPassword(e.target.value)} />
                                                        </div>
                                                        <AlertDialogFooter>
                                                            <Button variant="ghost" onClick={() => setDeleteStep(0)} disabled={isDeleting}>{t('common.goBack')}</Button>
                                                            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90" disabled={!deleteConfirmPassword || isDeleting}>
                                                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                {t('securityPage.deleteModal.confirmDelete')}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </>
                                                )}
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                     </Card>
                </div>
            </div>
        </ScrollArea>
    );
}
