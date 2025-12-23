'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp, query, where, getDocs, writeBatch, doc, updateDoc } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function ReportPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { toast } = useToast();

  const reportedUserId = params.userId as string;
  const matchIdParam = searchParams.get('matchId');

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const reportReasons = [
    { id: 'inappropriate_photos', label: t('report.reasons.inappropriate_photos') },
    { id: 'spam_or_scam', label: t('report.reasons.spam_or_scam') },
    { id: 'harassment', label: t('report.reasons.harassment') },
    { id: 'fake_profile', label: t('report.reasons.fake_profile') },
    { id: 'underage', label: t('report.reasons.underage') },
    { id: 'other', label: t('report.reasons.other') },
  ];

  const handleBlockUser = async () => {
    if (!user || !firestore || !reportedUserId || !matchIdParam) return;

    try {
        const matchRef = doc(firestore, 'matches', matchIdParam);
        await updateDoc(matchRef, {
            isBlocked: true,
            blockedBy: user.uid,
        });

        toast({
            title: t('report.blockSuccessTitle'),
        });

    } catch (error) {
        console.error("Error blocking user:", error);
        toast({
            variant: "destructive",
            title: t('common.error'),
            description: t('report.blockErrorDescription'),
        });
    } finally {
        router.back();
    }
  };


  const handleSubmit = async () => {
    if (!reason) {
      toast({ variant: 'destructive', title: t('report.reasonRequired') });
      return;
    }
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: t('report.loginRequired') });
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData: any = {
        reporterId: user.uid,
        reportedUserId,
        reason,
        description,
        timestamp: serverTimestamp(),
        status: 'pending',
      };
      if (matchIdParam) {
        reportData.matchId = matchIdParam;
      }

      await addDoc(collection(firestore, 'reports'), reportData);
      
      toast({
        title: t('report.successTitle'),
        description: t('report.successDescription'),
      });
      
      setShowBlockConfirm(true);

    } catch (error) {
      console.error('Rapor gönderme hatası:', error);
      toast({
        variant: 'destructive',
        title: t('report.errorTitle'),
        description: t('report.errorDescription'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="h-full bg-gray-50 dark:bg-black">
      <header className="p-4 md:p-8 flex items-center gap-4 pt-[calc(env(safe-area-inset-top,0rem)+1rem)]">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">{t('report.title')}</h1>
          <p className="text-muted-foreground">{t('report.description')}</p>
        </div>
      </header>

      <div className="p-4 md:p-8 md:pt-0 space-y-8 max-w-2xl mx-auto pb-[calc(env(safe-area-inset-bottom,0rem)+2rem)]">
        <Card>
          <CardHeader>
            <CardTitle>{t('report.reasonTitle')}</CardTitle>
            <CardDescription>{t('report.reasonDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
              {reportReasons.map((r) => (
                <div key={r.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.id} id={r.id} />
                  <Label htmlFor={r.id} className="font-normal cursor-pointer">{r.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('report.descriptionTitle')}</CardTitle>
            <CardDescription>{t('report.descriptionInfo')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('report.descriptionPlaceholder')}
              rows={4}
            />
          </CardContent>
        </Card>

        <Button onClick={handleSubmit} disabled={isSubmitting || !reason} className="w-full">
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {t('report.submitButton')}
        </Button>
      </div>
    </div>
    <AlertDialog open={showBlockConfirm} onOpenChange={setShowBlockConfirm}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('report.blockConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                   {t('report.blockConfirmDescription')}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => router.back()}>{t('report.noThanks')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleBlockUser}>
                    {t('report.yesBlock')}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
