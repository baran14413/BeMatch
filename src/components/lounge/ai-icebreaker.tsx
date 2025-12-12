'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bot, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/data';
import { generateAiIcebreaker } from '@/app/actions';
import { useLanguage } from '@/context/language-context';

export default function AiIcebreaker({ matchProfile }: { matchProfile: UserProfile }) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [icebreaker, setIcebreaker] = useState<string>('');
  const { toast } = useToast();

  const handleGenerate = () => {
    startTransition(async () => {
      const profileString = `${t('lounge.ai.name')}: ${matchProfile.name}, ${t('lounge.ai.age')}: ${matchProfile.age}, ${t('lounge.ai.bio')}: ${matchProfile.bio}, ${t('lounge.ai.prompts')}: ${matchProfile.prompts.map(p => `${p.question} ${p.answer}`).join(', ')}`;

      try {
        const result = await generateAiIcebreaker({ matchProfile: profileString });
        if (result.icebreaker) {
          setIcebreaker(result.icebreaker);
        } else {
            throw new Error(t('lounge.ai.errorCreating'));
        }
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: t('lounge.ai.errorTitle'),
          description: t('lounge.ai.errorDescription'),
        });
      }
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground">
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
          <span className="sr-only">{t('lounge.ai.title')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">{t('lounge.ai.title')}</h4>
            <p className="text-sm text-muted-foreground">
              {t('lounge.ai.description')}
            </p>
          </div>
          {icebreaker && (
            <div className="p-2 bg-secondary rounded-md">
              <p className="text-sm">{icebreaker}</p>
            </div>
          )}
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('lounge.ai.generating')}
              </>
            ) : (
              t('lounge.ai.generate')
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
