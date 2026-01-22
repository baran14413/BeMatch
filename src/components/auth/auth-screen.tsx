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
      {view === 'login' && <Login onSwitchView={onSwitchView} onLoginSuccess={onAuthSuccess} />}
      {view === 'register' && <OnboardingWizard onSwitchView={onSwitchView} onRegisterSuccess={onAuthSuccess} />}
    </div>
  );
}
