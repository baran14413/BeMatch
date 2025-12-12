'use client';
import { useState } from 'react';
import Login from '@/components/auth/login';
import OnboardingWizard from '@/components/auth/onboarding-wizard';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useLanguage } from '@/context/language-context';
import { useTheme } from "next-themes";
import { Monitor, Sun, Moon } from "lucide-react";


type AuthView = 'login' | 'register';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [view, setView] = useState<AuthView>('login');
  const { locale, setLocale, t } = useLanguage();
  const { setTheme, theme } = useTheme();

  const onSwitchView = (newView: AuthView) => {
    setView(newView);
  };

  return (
    <div className="relative h-full w-full">
        {view === 'login' && (
             <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
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
        )}
      {view === 'login' && <Login onSwitchView={onSwitchView} onLoginSuccess={onAuthSuccess} />}
      {view === 'register' && <OnboardingWizard onSwitchView={onSwitchView} onRegisterSuccess={onAuthSuccess} />}
    </div>
  );
}
