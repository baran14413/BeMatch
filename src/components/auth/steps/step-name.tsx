'use client';
import { useEffect } from 'react';
import { useOnboardingContext } from '@/context/onboarding-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/language-context';

export default function StepName() {
  const { formData, updateFormData, setStepValid } = useOnboardingContext();
  const { t } = useLanguage();

  useEffect(() => {
    setStepValid(formData.firstName.trim() !== '' && formData.lastName.trim() !== '');
  }, [formData.firstName, formData.lastName, setStepValid]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="firstName">{t('onboarding.firstName')}</Label>
        <Input
          id="firstName"
          name="firstName"
          placeholder={t('onboarding.firstNamePlaceholder')}
          value={formData.firstName}
          onChange={handleChange}
          className="h-14 text-lg"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">{t('onboarding.lastName')}</Label>
        <Input
          id="lastName"
          name="lastName"
          placeholder={t('onboarding.lastNamePlaceholder')}
          value={formData.lastName}
          onChange={handleChange}
          className="h-14 text-lg"
        />
      </div>
    </div>
  );
}
