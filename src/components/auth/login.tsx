'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Heart, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
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

type AuthView = 'login' | 'register';

interface LoginProps {
  onSwitchView: (view: AuthView) => void;
  onLoginSuccess: () => void;
}

export default function Login({ onSwitchView, onLoginSuccess }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const { t } = useLanguage();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: t('login.successTitle'),
        description: t('login.successDescription'),
      });
      onLoginSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('login.errorTitle'),
        description: t('login.errorDescription'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
        toast({
            variant: "destructive",
            title: t('login.errorTitle'),
            description: t('login.forgotPassword.emailRequired'),
        });
        return;
    }
    setIsResetting(true);
    try {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({
            title: t('login.forgotPassword.successTitle'),
            description: t('login.forgotPassword.successDescription'),
        });
        setIsResetDialogOpen(false);
        setResetEmail('');
    } catch (error: any) {
         toast({
            variant: "destructive",
            title: t('login.forgotPassword.errorTitle'),
            description: error.code === 'auth/user-not-found' 
                ? t('login.forgotPassword.userNotFound') 
                : error.message,
        });
    } finally {
        setIsResetting(false);
    }
  };

  return (
    <ScrollArea className="h-full">
        <div className="w-full px-6 py-8 flex flex-col h-full justify-center">
            <div className="text-center mb-10 mt-16">
                <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
                <h1 className="text-4xl font-extrabold text-primary tracking-tight">{t('login.title')}</h1>
                <p className="mt-2 text-muted-foreground">
                {t('login.description')}
                </p>
            </div >

            <div className="space-y-6">
                <div className="space-y-2">
                <Label htmlFor="email">{t('login.email')}</Label>
                <Input id="email" type="email" placeholder={t('login.emailPlaceholder')} className="h-14 text-lg" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">{t('login.password')}</Label>
                        <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                            <AlertDialogTrigger asChild>
                                 <button className="text-xs font-medium text-primary hover:underline">
                                    {t('login.forgotPassword.trigger')}
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('login.forgotPassword.title')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t('login.forgotPassword.description')}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4">
                                     <Label htmlFor="reset-email" className="sr-only">Email</Label>
                                     <Input
                                        id="reset-email"
                                        type="email"
                                        placeholder={t('login.emailPlaceholder')}
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                    />
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={handlePasswordReset} disabled={isResetting}>
                                        {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t('login.forgotPassword.button')}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <div className="relative">
                        <Input id="password" type={showPassword ? 'text' : 'password'} placeholder={t('login.passwordPlaceholder')} className="h-14 text-lg" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-9 w-9 text-muted-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 flex flex-col gap-4">
                <Button onClick={handleLogin} disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 font-bold text-lg py-7 rounded-xl">
                {isLoading ? <Loader2 className="animate-spin" /> : t('login.button')}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                {t('login.noAccount')}{' '}
                <button onClick={() => onSwitchView('register')} className="font-semibold text-primary hover:underline">
                    {t('login.createAccount')}
                </button>
                </p>
            </div>
        </div>
    </ScrollArea>
  );
}
