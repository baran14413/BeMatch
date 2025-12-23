'use client';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/language-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const interestsList = [
  'music', 'travel', 'gaming', 'movies', 'reading', 'cooking',
  'sports', 'fitness', 'art', 'photography', 'hiking', 'dancing',
  'technology', 'fashion', 'yoga', 'camping', 'theater', 'volunteering'
];

const MAX_INTERESTS = 7;

export default function InterestsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { t } = useLanguage();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.interests) {
      setSelectedInterests(userProfile.interests);
    }
  }, [userProfile]);

  const handleToggle = (interest: string) => {
    const newInterests = new Set(selectedInterests);
    if (newInterests.has(interest)) {
      newInterests.delete(interest);
    } else {
      if (newInterests.size < MAX_INTERESTS) {
        newInterests.add(interest);
      } else {
        toast({
          variant: 'destructive',
          title: t('interestsPage.limitTitle'),
          description: t('interestsPage.limitDescription', { count: MAX_INTERESTS }),
        });
      }
    }
    setSelectedInterests(Array.from(newInterests));
  };

  const handleSave = async () => {
    if (!userDocRef) return;
    setIsSaving(true);
    try {
      await updateDoc(userDocRef, { interests: selectedInterests });
      toast({
        title: t('interestsPage.saveSuccessTitle'),
        description: t('interestsPage.saveSuccessDescription'),
      });
    } catch (error) {
      console.error('Error saving interests:', error);
      toast({
        variant: 'destructive',
        title: t('interestsPage.saveErrorTitle'),
        description: t('interestsPage.saveErrorDescription'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isUserLoading || isProfileLoading;

  return (
    <ScrollArea className="h-full">
        <div className="h-full bg-gray-50 dark:bg-black">
            <header className="p-4 py-6 md:p-8 flex items-center gap-4 pt-[calc(env(safe-area-inset-top,0rem)+1.5rem)]">
                 <Link href="/settings" passHref>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-primary">{t('interestsPage.title')}</h1>
                    <p className="text-muted-foreground">{t('interestsPage.description', { count: MAX_INTERESTS })}</p>
                </div>
            </header>

            <div className="p-4 md:p-8 md:pt-0 space-y-8 pb-[calc(env(safe-area-inset-bottom,0rem)+2rem)]">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">{t('interestsPage.selected', { count: selectedInterests.length, max: MAX_INTERESTS })}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {isLoading ? (
                             <div className="flex flex-wrap gap-3 justify-center">
                                {Array.from({length: 18}).map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
                             </div>
                        ) : (
                            <div className="flex flex-wrap gap-3 justify-center">
                            {interestsList.map((interest) => (
                                <Badge
                                key={interest}
                                onClick={() => handleToggle(interest)}
                                variant={selectedInterests.includes(interest) ? 'default' : 'secondary'}
                                className={cn(
                                    'px-4 py-2 text-sm font-semibold cursor-pointer transition-all rounded-full',
                                    selectedInterests.includes(interest)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                )}
                                >
                                {t(`interests.${interest}`)}
                                </Badge>
                            ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
                 <Button onClick={handleSave} disabled={isSaving || isLoading} className="w-full md:w-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('interestsPage.save')}
                </Button>
            </div>
        </div>
    </ScrollArea>
  );
}
