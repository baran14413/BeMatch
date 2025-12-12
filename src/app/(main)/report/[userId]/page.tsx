'use client';

import { useState, useRef } from 'react';
import { useUser, useFirestore, useStorage } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Camera, Loader2, Send, X } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const BEMATCH_SYSTEM_ID = 'bematch_system_account';

const reportReasons = [
  { id: 'inappropriate_photos', label: 'Uygunsuz Fotoğraflar' },
  { id: 'spam_or_scam', label: 'Spam veya Dolandırıcılık' },
  { id: 'harassment', label: 'Taciz veya Zorbalık' },
  { id: 'fake_profile', label: 'Sahte Profil' },
  { id: 'underage', label: 'Yaşı Küçük Kullanıcı' },
  { id: 'other', label: 'Diğer' },
];

export default function ReportPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { toast } = useToast();

  const reportedUserId = params.userId as string;
  const matchIdParam = searchParams.get('matchId');

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendSystemMessage = async (currentUserId: string) => {
    if (!firestore) return;
    
    const matchId = [currentUserId, BEMATCH_SYSTEM_ID].sort().join('_');
    const matchRef = doc(firestore, 'matches', matchId);
    
    try {
        const matchSnap = await getDoc(matchRef);
        if (!matchSnap.exists()) {
            const bematchLogo = PlaceHolderImages.find(p => p.id === 'bematch-logo')?.imageUrl;
            
            // Create BeMatch system user doc if it doesn't exist
            const bematchUserRef = doc(firestore, 'users', BEMATCH_SYSTEM_ID);
            const bematchUserSnap = await getDoc(bematchUserRef);
            if (!bematchUserSnap.exists()) {
                await setDoc(bematchUserRef, {
                    id: BEMATCH_SYSTEM_ID,
                    name: 'BeMatch',
                    avatarUrl: bematchLogo || '',
                    isSystemAccount: true,
                });
            }

            // Create the match
            await setDoc(matchRef, {
                users: [currentUserId, BEMATCH_SYSTEM_ID],
                timestamp: serverTimestamp(),
                lastMessage: t('report.systemMessage'),
            });
        }
        
        // Add the message
        const messagesColRef = collection(firestore, 'matches', matchId, 'messages');
        await addDoc(messagesColRef, {
            senderId: BEMATCH_SYSTEM_ID,
            text: t('report.systemMessage'),
            timestamp: serverTimestamp(),
            isRead: false,
        });

    } catch (error) {
        console.error("Error sending system message:", error);
        // We can fail silently here, as it's a non-critical confirmation message.
    }
  };


  const handleSubmit = async () => {
    if (!reason) {
      toast({ variant: 'destructive', title: t('report.reasonRequired') });
      return;
    }
    if (!user) {
      toast({ variant: 'destructive', title: t('report.loginRequired') });
      return;
    }

    setIsSubmitting(true);

    try {
      let screenshotUrl = '';
      if (screenshot) {
        const screenshotId = uuidv4();
        const storageRef = ref(storage, `reports/${user.uid}/${screenshotId}.jpg`);
        await uploadString(storageRef, screenshot, 'data_url');
        screenshotUrl = await getDownloadURL(storageRef);
      }

      const reportData: any = {
        reporterId: user.uid,
        reportedUserId,
        reason,
        description,
        screenshotUrl,
        timestamp: serverTimestamp(),
        status: 'pending',
      };
      if (matchIdParam) {
        reportData.matchId = matchIdParam;
      }

      await addDoc(collection(firestore, 'reports'), reportData);
      await sendSystemMessage(user.uid);


      toast({
        title: t('report.successTitle'),
        description: t('report.successDescription'),
      });

      router.back();
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
    <div className="h-full bg-gray-50 dark:bg-black">
      <header className="p-4 py-6 md:p-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">{t('report.title')}</h1>
          <p className="text-muted-foreground">{t('report.description')}</p>
        </div>
      </header>

      <div className="p-4 md:p-8 md:pt-0 space-y-8 max-w-2xl mx-auto">
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
            <CardDescription>Lütfen olay hakkında daha fazla bilgi verin.</CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle>{t('report.evidenceTitle')}</CardTitle>
            <CardDescription>{t('report.evidenceDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            {screenshot ? (
              <div className="relative w-full aspect-video rounded-md overflow-hidden">
                <Image src={screenshot} alt="Ekran görüntüsü önizlemesi" layout="fill" className="object-contain" />
                 <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setScreenshot(null)}>
                    <X className="h-4 w-4" />
                 </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                <Camera className="mr-2 h-4 w-4" />
                {t('report.uploadButton')}
              </Button>
            )}
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
  );
}
