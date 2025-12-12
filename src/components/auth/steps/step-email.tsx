'use client';
import { useEffect } from 'react';
import { useOnboardingContext } from '@/context/onboarding-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/language-context';

export default function StepEmail() {
  const { formData, updateFormData, setStepValid } = useOnboardingContext();
  const { t } = useLanguage();

  useEffect(() => {
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    setStepValid(isEmailValid);
  }, [formData.email, setStepValid]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ email: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">{t('onboarding.credentials.email')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t('onboarding.credentials.emailPlaceholder')}
          value={formData.email}
          onChange={handleChange}
          className="h-14 text-lg"
          autoFocus
        />
      </div>
    </div>
  );
}
