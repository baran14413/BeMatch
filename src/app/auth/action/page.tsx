'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { Eye, EyeOff, Loader2, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import PasswordStrength from '@/components/auth/password-strength';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";
import { Monitor, Sun, Moon } from "lucide-react";


function ResetPasswordForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<'verifyEmail' | 'resetPassword' | 'invalidCode' | 'loading'>('loading');
  const [oobCode, setOobCode] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmTouched, setIsConfirmTouched] = useState(false);

  useEffect(() => {
    const code = searchParams.get('oobCode');
    const pageMode = searchParams.get('mode');
    
    if (pageMode === 'resetPassword' && code) {
      setIsSubmitting(true);
      verifyPasswordResetCode(auth, code)
        .then(() => {
          setOobCode(code);
          setMode('resetPassword');
        })
        .catch((error) => {
          console.error("Invalid password reset code:", error);
          setMode('invalidCode');
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    } else if (pageMode === 'verifyEmail' && code) {
      // Handle email verification if needed in the future
      setMode('verifyEmail');
    } else {
      setMode('invalidCode');
    }
  }, [searchParams, auth]);

  const handleResetPassword = async () => {
    if (!oobCode) {
      toast({ variant: 'destructive', title: t('securityPage.resetError.title'), description: t('securityPage.resetError.codeMissing') });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: t('onboarding.credentials.passwordMismatch') });
      return;
    }
    const hasLetters = /[a-zA-Z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    if (newPassword.length < 8 || !hasLetters || !hasNumbers) {
      toast({ variant: 'destructive', title: t('securityPage.resetError.weakPassword') });
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      toast({ title: t('securityPage.resetSuccess.title'), description: t('securityPage.resetSuccess.description') });
      router.push('/');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('securityPage.resetError.title'), description: t('securityPage.resetError.generic') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordsDontMatch = isConfirmTouched && confirmPassword && newPassword !== confirmPassword;
  
  if (mode === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center text-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">{t('securityPage.verifyingCode')}</p>
        </div>
      )
  }

  if (mode === 'invalidCode') {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold text-destructive">{t('securityPage.resetError.invalidTitle')}</h2>
        <p className="text-muted-foreground mt-2">{t('securityPage.resetError.invalidDescription')}</p>
        <Button onClick={() => router.push('/')} className="mt-6">{t('securityPage.resetError.backToLogin')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="newPassword">{t('securityPage.newPassword')}</Label>
        <p className="text-xs text-muted-foreground -mt-1 mb-2">
            {t('onboarding.credentials.passwordPolicy')}
        </p>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder={t('onboarding.credentials.passwordPlaceholder')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-14 text-lg pr-12"
            autoFocus
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        <PasswordStrength password={newPassword} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('onboarding.credentials.confirmPassword')}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={t('onboarding.credentials.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setIsConfirmTouched(true)}
            className={cn('h-14 text-lg pr-12', passwordsDontMatch && 'border-destructive')}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {passwordsDontMatch && (
          <p className="text-xs text-destructive">{t('onboarding.credentials.passwordMismatch')}</p>
        )}
      </div>
      <Button onClick={handleResetPassword} disabled={isSubmitting} className="w-full h-14 text-lg">
        {isSubmitting ? <Loader2 className="animate-spin" /> : t('securityPage.resetButton')}
      </Button>
    </div>
  );
}

export default function ActionPage() {
    const { locale, setLocale, t } = useLanguage();
    const { setTheme, theme } = useTheme();

    return (
        <main className="w-full min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black p-4">
             <Card className="w-full max-w-md">
                 <CardHeader className="text-center">
                    <div className="flex items-center justify-between mb-4">
                         <Select onValueChange={setTheme} defaultValue={theme}>
                            <SelectTrigger className="w-auto bg-transparent border-border/50">
                                <SelectValue placeholder={t('applicationPage.selectTheme')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">
                                    <div className="flex items-center gap-2">
                                        <Sun className="w-4 h-4" /> {t('applicationPage.light')}
                                    </div>
                                </SelectItem>
                                <SelectItem value="dark">
                                    <div className="flex items-center gap-2">
                                        <Moon className="w-4 h-4" /> {t('applicationPage.dark')}
                                    </div>
                                </SelectItem>
                                <SelectItem value="system">
                                    <div className="flex items-center gap-2">
                                        <Monitor className="w-4 h-4" /> {t('applicationPage.system')}
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <Select onValueChange={(value) => setLocale(value as 'tr' | 'en')} defaultValue={locale}>
                            <SelectTrigger className="w-auto bg-transparent border-border/50">
                                <SelectValue placeholder={t('applicationPage.selectLanguage')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                                <SelectItem value="en">🇬🇧 English</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <Heart className="w-10 h-10 text-primary mx-auto" />
                     <CardTitle className="text-3xl font-bold tracking-tight">{t('securityPage.resetTitle')}</CardTitle>
                     <CardDescription>{t('securityPage.resetDescription')}</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-primary" />}>
                        <ResetPasswordForm />
                    </Suspense>
                 </CardContent>
             </Card>
        </main>
    )
}
