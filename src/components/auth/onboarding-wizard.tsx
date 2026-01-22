'use client';
import { useOnboardingContext } from '@/context/onboarding-context';
import StepIndicator from '@/components/auth/step-indicator';
import StepName from '@/components/auth/steps/step-name';
import StepAge from '@/components/auth/steps/step-age';
import StepGender from '@/components/auth/steps/step-gender';
import StepGoals from '@/components/auth/steps/step-goals';
import StepInterests from '@/components/auth/steps/step-interests';
import StepLocation from '@/components/auth/steps/step-location';
import StepDistance from '@/components/auth/steps/step-distance';
import StepBio from '@/components/auth/steps/step-bio';
import StepPhotos from '@/components/auth/steps/step-photos';
import StepEmail from '@/components/auth/steps/step-email';
import StepCredentials from '@/components/auth/steps/step-credentials';
import WizardControls from '@/components/auth/wizard-controls';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '@/context/language-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type AuthView = 'login' | 'register';

interface OnboardingWizardProps {
  onSwitchView: (view: AuthView) => void;
  onRegisterSuccess: () => void;
}

export default function OnboardingWizard({ onSwitchView, onRegisterSuccess }: OnboardingWizardProps) {
  const { currentStep } = useOnboardingContext();
  const { t } = useLanguage();

  const steps = [
    { component: StepName, title: t("onboarding.stepNameTitle") },
    { component: StepAge, title: t('onboarding.stepAgeTitle') },
    { component: StepGender, title: t('onboarding.stepGenderTitle') },
    { component: StepGoals, title: t('onboarding.stepGoalsTitle') },
    { component: StepInterests, title: t('onboarding.stepInterestsTitle') },
    { component: StepLocation, title: t('onboarding.stepLocationTitle') },
    { component: StepDistance, title: t('onboarding.stepDistanceTitle') },
    { component: StepBio, title: t('onboarding.stepBioTitle') },
    { component: StepPhotos, title: t('onboarding.stepPhotosTitle') },
    { component: StepEmail, title: t('onboarding.credentials.emailTitle') },
    { component: StepCredentials, title: t('onboarding.credentials.passwordTitle') },
  ];
  
  const CurrentStepComponent = steps[currentStep]?.component;

  if (!CurrentStepComponent) {
    // Handle the case where the step is out of bounds, maybe reset or show an error
    return <div>Error: Invalid step.</div>;
  }

  return (
    <div className="w-full h-full flex flex-col bg-background">
        <div className="p-4 pt-[calc(env(safe-area-inset-top,0rem)+1rem)]">
            <StepIndicator currentStep={currentStep} totalSteps={steps.length} />
        </div>
        <ScrollArea className="flex-1" viewportClassName="flex">
            <div className="flex-1 flex flex-col px-6 pb-4">
               <AnimatePresence mode="wait">
                 <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="w-full flex-1 flex flex-col"
                  >
                    <div className="text-center pt-2 pb-6">
                        <h2 className="text-3xl font-bold">{steps[currentStep].title}</h2>
                    </div>
                    <div className="flex-1 flex flex-col">
                        <CurrentStepComponent />
                    </div>
                  </motion.div>
               </AnimatePresence>
            </div>
        </ScrollArea>
        <div className="p-4 pt-0 mt-auto space-y-3 pb-[calc(env(safe-area-inset-bottom,0rem)+1rem)]">
            <WizardControls
              totalSteps={steps.length}
            />
        </div>
    </div>
  );
}
