'use client';
import { useEffect, useState, useCallback } from 'react';
import { useOnboardingContext } from '@/context/onboarding-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/firebase';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';


const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


export default function StepEmail() {
  const { formData, updateFormData, setStepValid } = useOnboardingContext();
  const { t } = useLanguage();
  const auth = useAuth();
  
  const [isChecking, setIsChecking] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const debouncedEmail = useDebounce(formData.email, 500);

  const isEmailFormatValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const checkEmailAvailability = useCallback(async (email: string) => {
      if (!isEmailFormatValid(email)) {
          setEmailError(null);
          setIsChecking(false);
          return;
      }
      setIsChecking(true);
      setEmailError(null);
      try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.length > 0) {
              setEmailError(t('chat.toasts.emailInUse'));
          }
      } catch (error) {
          console.error("Email check failed:", error);
          // Don't show an error to the user for this, just allow them to proceed
          // as the final registration will catch it anyway.
      } finally {
          setIsChecking(false);
      }
  }, [auth, t]);

  useEffect(() => {
    if (debouncedEmail) {
      checkEmailAvailability(debouncedEmail);
    } else {
      setIsChecking(false);
      setEmailError(null);
    }
  }, [debouncedEmail, checkEmailAvailability]);

  useEffect(() => {
    const isFormatValid = isEmailFormatValid(formData.email);
    setStepValid(isFormatValid && !emailError && !isChecking);
  }, [formData.email, emailError, isChecking, setStepValid]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ email: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">{t('onboarding.credentials.email')}</Label>
        <div className="relative">
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t('onboarding.credentials.emailPlaceholder')}
            value={formData.email}
            onChange={handleChange}
            className={cn("h-14 text-lg", emailError && "border-destructive")}
            autoComplete="email"
            autoFocus
          />
          {isChecking && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
          )}
        </div>
         {emailError && (
            <p className="text-sm text-destructive mt-2">{emailError}</p>
        )}
      </div>
    </div>
  );
}
