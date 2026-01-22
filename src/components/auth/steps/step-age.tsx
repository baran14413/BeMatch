'use client';
import { useOnboardingContext } from '@/context/onboarding-context';
import { useLanguage } from '@/context/language-context';
import { differenceInYears, isValid } from 'date-fns';
import { useEffect, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function StepAge() {
  const { formData, updateFormData, setStepValid } = useOnboardingContext();
  const { t } = useLanguage();

  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  const handleDateChange = (part: 'day' | 'month' | 'year', value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    updateFormData({ ...formData, [part]: numericValue });

    if (part === 'day' && numericValue.length === 2) {
      monthRef.current?.focus();
    } else if (part === 'month' && numericValue.length === 2) {
      yearRef.current?.focus();
    }
  };

  const { age, isValidDate, isUnderage, date } = useMemo(() => {
    const { day, month, year } = formData;
    if (!day || !month || !year || year.length < 4) {
      return { age: 0, isValidDate: false, isUnderage: false, date: null };
    }

    const parsedDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    const isValidDateCheck = isValid(parsedDate) && parsedDate.getFullYear() === parseInt(year, 10) && (parsedDate.getMonth() + 1) === parseInt(month, 10) && parsedDate.getDate() === parseInt(day, 10);
    
    if (isValidDateCheck) {
      const calculatedAge = differenceInYears(new Date(), parsedDate);
      const isUnderage = calculatedAge < 18;
      return { age: calculatedAge, isValidDate: true, isUnderage, date: parsedDate };
    }
    
    return { age: 0, isValidDate: false, isUnderage: false, date: null };
  }, [formData.day, formData.month, formData.year]);

  useEffect(() => {
    if (isValidDate && !isUnderage) {
        if (formData.age !== age || formData.dateOfBirth?.getTime() !== date?.getTime()) {
           updateFormData({ dateOfBirth: date!, age });
        }
        setStepValid(true);
    } else {
        setStepValid(false);
    }
  }, [isValidDate, isUnderage, age, date, setStepValid, updateFormData, formData.age, formData.dateOfBirth]);


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="day" className="text-muted-foreground">{t('common.day')}</Label>
          <Input
            ref={dayRef}
            id="day"
            type="tel"
            placeholder={t('common.dayPlaceholder')}
            maxLength={2}
            value={formData.day}
            onChange={(e) => handleDateChange('day', e.target.value)}
            className="h-14 text-lg text-center"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="month" className="text-muted-foreground">{t('common.month')}</Label>
          <Input
            ref={monthRef}
            id="month"
            type="tel"
            placeholder={t('common.monthPlaceholder')}
            maxLength={2}
            value={formData.month}
            onChange={(e) => handleDateChange('month', e.target.value)}
            className="h-14 text-lg text-center"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year" className="text-muted-foreground">{t('common.year')}</Label>
          <Input
            ref={yearRef}
            id="year"
            type="tel"
            placeholder={t('common.yearPlaceholder')}
            maxLength={4}
            value={formData.year}
            onChange={(e) => handleDateChange('year', e.target.value)}
            className="h-14 text-lg text-center"
          />
        </div>
      </div>
      <div className="h-6 text-center">
        {formData.year.length === 4 && !isValidDate && (
          <p className="text-sm text-destructive">{t('onboarding.invalidDate')}</p>
        )}
        {isValidDate && isUnderage && (
            <p className="text-sm text-destructive">{t('onboarding.ageInfo')}</p>
        )}
        {isValidDate && !isUnderage && (
            <p className="text-sm font-semibold text-primary">{t('onboarding.currentAge', { age: age })}</p>
        )}
      </div>
    </div>
  );
}
