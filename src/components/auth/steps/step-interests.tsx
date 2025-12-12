'use client';
import { useEffect } from 'react';
import { useOnboardingContext } from '@/context/onboarding-context';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';

const interestsList = [
  'music', 'travel', 'gaming', 'movies', 'reading', 'cooking',
  'sports', 'fitness', 'art', 'photography', 'hiking', 'dancing',
  'technology', 'fashion', 'yoga', 'camping', 'theater', 'volunteering'
];

export default function StepInterests() {
  const { formData, updateFormData, setStepValid } = useOnboardingContext();
  const { t } = useLanguage();

  useEffect(() => {
    setStepValid(formData.interests.length > 0);
  }, [formData.interests, setStepValid]);

  const handleToggle = (interest: string) => {
    const newInterests = new Set(formData.interests);
    if (newInterests.has(interest)) {
      newInterests.delete(interest);
    } else {
      newInterests.add(interest);
    }
    updateFormData({ interests: Array.from(newInterests) });
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {interestsList.map((interest) => (
        <Badge
          key={interest}
          onClick={() => handleToggle(interest)}
          variant={formData.interests.includes(interest) ? 'default' : 'secondary'}
          className={cn(
            'px-4 py-2 text-sm font-semibold cursor-pointer transition-all rounded-full',
            formData.interests.includes(interest)
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
        >
          {t(`interests.${interest}`)}
        </Badge>
      ))}
    </div>
  );
}
