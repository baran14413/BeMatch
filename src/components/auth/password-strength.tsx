'use client';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';

type StrengthLevel = 'Zayıf' | 'Orta' | 'Güçlü' | '' | 'Weak' | 'Medium' | 'Strong';

interface PasswordStrengthProps {
  password?: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password = '' }) => {
  const { t } = useLanguage();
  
  const strengthLevels = {
    weak: t('passwordStrength.weak'),
    medium: t('passwordStrength.medium'),
    strong: t('passwordStrength.strong'),
  };

  const checkStrength = (password: string): StrengthLevel => {
    if (!password || password.length === 0) return '';
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (password.length >= 8 && hasLetters && hasNumbers) {
      return strengthLevels.strong as StrengthLevel;
    }
    if (password.length >= 6 && (hasLetters || hasNumbers)) {
      return strengthLevels.medium as StrengthLevel;
    }
    return strengthLevels.weak as StrengthLevel;
  };

  const strength = checkStrength(password);

  const getBarColor = (level: StrengthLevel) => {
    if (level === strengthLevels.weak) return 'bg-red-500';
    if (level === strengthLevels.medium) return 'bg-yellow-500';
    if (level === strengthLevels.strong) return 'bg-green-500';
    return 'bg-gray-200';
  };
  
  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className={cn('h-1.5 flex-1 rounded-full', strength === strengthLevels.weak || strength === strengthLevels.medium || strength === strengthLevels.strong ? getBarColor(strengthLevels.weak as StrengthLevel) : 'bg-gray-200')} />
        <div className={cn('h-1.5 flex-1 rounded-full', strength === strengthLevels.medium || strength === strengthLevels.strong ? getBarColor(strengthLevels.medium as StrengthLevel) : 'bg-gray-200')} />
        <div className={cn('h-1.5 flex-1 rounded-full', strength === strengthLevels.strong ? getBarColor(strengthLevels.strong as StrengthLevel) : 'bg-gray-200')} />
      </div>
      {strength && <p className="text-xs font-medium" style={{ color: getBarColor(strength).replace('bg-','').replace('-500','') }}>{strength}</p>}
    </div>
  );
};

export default PasswordStrength;
