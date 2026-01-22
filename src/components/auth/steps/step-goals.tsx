'use client';
import { useOnboardingContext } from '@/context/onboarding-context';
import { Card } from '@/components/ui/card';
import { Heart, Coffee, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useEffect } from 'react';

export default function StepGoals() {
  const { formData, updateFormData, setStepValid } = useOnboardingContext();
  const { t } = useLanguage();

  const goals = [
    { id: 'long-term', label: t('onboarding.goals.longTerm') },
    { id: 'casual', label: t('onboarding.goals.casual') },
    { id: 'chat', label: t('onboarding.goals.chat') },
  ];
  
  const icons = {
    'long-term': Heart,
    'casual': Coffee,
    'chat': MessageSquare,
  }

  useEffect(() => {
    setStepValid(!!formData.goal);
  }, [formData.goal, setStepValid]);

  const handleSelect = (goalId: string) => {
    updateFormData({ goal: goalId });
  };

  return (
    <div className="space-y-4">
      {goals.map((goal) => {
        const Icon = icons[goal.id as keyof typeof icons];
        return (
          <Card
            key={goal.id}
            onClick={() => handleSelect(goal.id)}
            className={cn(
              'p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 border-2',
              formData.goal === goal.id
                ? 'border-primary bg-primary/5 shadow-md'
                : 'hover:border-primary/50 hover:bg-accent'
            )}
          >
            <Icon className={cn('w-6 h-6', formData.goal === goal.id ? 'text-primary' : 'text-muted-foreground')} />
            <span className="font-semibold">{goal.label}</span>
          </Card>
        );
      })}
    </div>
  );
}
