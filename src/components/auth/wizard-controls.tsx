'use client';
import { useOnboardingContext } from '@/context/onboarding-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface WizardControlsProps {
  totalSteps: number;
}

export default function WizardControls({ totalSteps }: WizardControlsProps) {
  const { currentStep, prevStep, nextStep, isStepValid, isLastStep, isLoading } = useOnboardingContext();
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between gap-4">
       {currentStep > 0 && (
         <Button
            variant="outline"
            onClick={prevStep}
            className="h-14 w-14 rounded-full flex-shrink-0"
            aria-label={t('common.back')}
            disabled={isLoading}
        >
            <ArrowLeft className="h-6 w-6" />
        </Button>
       )}

      <Button onClick={() => nextStep(totalSteps)} disabled={!isStepValid || isLoading} className="font-bold text-lg py-7 rounded-xl w-full">
        {isLoading ? <Loader2 className="animate-spin" /> : (isLastStep ? t('onboarding.createAccount') : t('common.next'))}
      </Button>
    </div>
  );
}
