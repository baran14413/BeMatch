'use client';
import { useEffect, useState } from 'react';
import { useOnboardingContext } from '@/context/onboarding-context';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/language-context';

export default function StepDistance() {
  const { formData, updateFormData, setStepValid } = useOnboardingContext();
  const { t } = useLanguage();
  const [distance, setDistance] = useState(formData.maxDistance || 50);

  useEffect(() => {
    // This step is always valid, as there is a default value.
    setStepValid(true);
  }, [setStepValid]);

  const handleSliderChange = (value: number[]) => {
      const newDistance = value[0];
      setDistance(newDistance);
      updateFormData({ maxDistance: newDistance });
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-full pt-6 space-y-4">
            <div className="flex justify-between items-baseline px-2">
                <Label htmlFor='distance-slider'>{t('preferencesPage.maxDistance')}</Label>
                <span className="font-semibold text-primary">{distance} {t('common.km')}</span>
            </div>
            <Slider
                id="distance-slider"
                value={[distance]}
                max={150}
                min={1}
                step={1}
                onValueChange={handleSliderChange}
            />
        </div>
        <p className="text-muted-foreground text-sm pt-4">
            {t('onboarding.distance.info')}
        </p>
    </div>
  );
}
