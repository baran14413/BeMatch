'use client';
import { useOnboardingContext } from '@/context/onboarding-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useEffect } from 'react';
import type { UserProfile } from '@/lib/data';

export default function StepGender() {
  const { formData, updateFormData, setStepValid } = useOnboardingContext();
  const { t } = useLanguage();

  const genders = [
    { id: 'woman', label: t('onboarding.gender.woman') },
    { id: 'man', label: t('onboarding.gender.man') },
  ];

  const interests = [
    { id: 'man', label: t('onboarding.interestedIn.men') },
    { id: 'woman', label: t('onboarding.interestedIn.women') },
    { id: 'everyone', label: t('onboarding.interestedIn.everyone') },
  ];
  
  useEffect(() => {
    setStepValid(!!formData.gender && !!formData.interestedIn);
  }, [formData.gender, formData.interestedIn, setStepValid]);

  const handleSelectGender = (genderId: 'woman' | 'man') => {
    updateFormData({ gender: genderId });
  };

  const handleSelectInterest = (interestId: 'woman' | 'man' | 'everyone') => {
    updateFormData({ interestedIn: interestId });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="font-semibold text-center mb-3">{t('onboarding.gender.yourGender')}</p>
        <div className="space-y-3">
        {genders.map((gender) => (
            <Button
            key={gender.id}
            onClick={() => handleSelectGender(gender.id as 'woman' | 'man')}
            variant={formData.gender === gender.id ? 'default' : 'outline'}
            className={cn('w-full justify-center h-12 text-base')}
            >
            {gender.label}
            </Button>
        ))}
        </div>
      </div>
       <div>
        <p className="font-semibold text-center mb-3">{t('onboarding.interestedIn.showMe')}</p>
        <div className="space-y-3">
        {interests.map((interest) => (
            <Button
            key={interest.id}
            onClick={() => handleSelectInterest(interest.id as 'woman' | 'man' | 'everyone')}
            variant={formData.interestedIn === interest.id ? 'default' : 'outline'}
            className={cn('w-full justify-center h-12 text-base')}
            >
            {interest.label}
            </Button>
        ))}
        </div>
      </div>
    </div>
  );
}
