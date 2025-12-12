'use client';
import { useState, useEffect } from 'react';
import { useOnboardingContext } from '@/context/onboarding-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PasswordStrength from '@/components/auth/password-strength';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
import PolicySheet from '@/components/auth/policy-sheet';

export default function StepCredentials() {
  const { formData, updateFormData, setStepValid } = useOnboardingContext();
  const { t } = useLanguage();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isConfirmTouched, setIsConfirmTouched] = useState(false);
  const [sheetContent, setSheetContent] = useState<'terms' | 'privacy' | null>(null);

  useEffect(() => {
    const hasLetters = /[a-zA-Z]/.test(formData.password);
    const hasNumbers = /\d/.test(formData.password);
    const isPasswordStrongEnough = formData.password.length >= 8 && hasLetters && hasNumbers;
    const isPasswordMatch = formData.password === formData.confirmPassword;
    setStepValid(isPasswordStrongEnough && isPasswordMatch);
  }, [formData.password, formData.confirmPassword, setStepValid]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const passwordsDontMatch = isConfirmTouched && formData.confirmPassword && formData.password !== formData.confirmPassword;

  const legalText = t('onboarding.welcome.legal_agreement');
  const parts = legalText.split(/<terms>|<\/terms>|<privacy>|<\/privacy>/);


  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-6">
        <div className="space-y-2">
            <Label htmlFor="password">{t('onboarding.credentials.password')}</Label>
            <p className="text-xs text-muted-foreground -mt-1 mb-2">
                {t('onboarding.credentials.passwordPolicy')}
            </p>
            <div className="relative">
              <Input 
              id="password" 
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('onboarding.credentials.passwordPlaceholder')}
              value={formData.password}
              onChange={handleChange}
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
            <PasswordStrength password={formData.password} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('onboarding.credentials.confirmPassword')}</Label>
            <div className="relative">
              <Input 
              id="confirmPassword" 
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder={t('onboarding.credentials.confirmPasswordPlaceholder')}
              value={formData.confirmPassword}
              onChange={handleChange}
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
      </div>
      <div className="mt-auto">
          <div className="text-center text-xs text-muted-foreground mb-4">
            {parts[0]}
            <button onClick={() => setSheetContent('terms')} className="underline hover:text-primary">{parts[1]}</button>
            {parts[2]}
            <button onClick={() => setSheetContent('privacy')} className="underline hover:text-primary">{parts[3]}</button>
            {parts[4]}
        </div>
      </div>
      <PolicySheet
        isOpen={!!sheetContent}
        onOpenChange={(open) => !open && setSheetContent(null)}
        initialTab={sheetContent === 'terms' ? 'terms' : 'privacy'}
      />
    </div>
  );
}
