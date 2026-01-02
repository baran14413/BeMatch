'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Globe, Lock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '../ui/slider';

export default function CreateRoomDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleCreateRoom = async () => {
    if (!title.trim() || !user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Oda Adı Gerekli',
        description: 'Lütfen odanız için bir isim belirleyin.',
      });
      return;
    }
    if (!isPublic && !password.trim()) {
      toast({
        variant: 'destructive',
        title: 'Şifre Gerekli',
        description: 'Özel odalar için bir şifre belirlemelisiniz.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const roomData = {
        title: title.trim(),
        ownerId: user.uid,
        isPublic: isPublic,
        passwordHash: !isPublic ? password : null, // In a real app, you'd hash this
        participantCount: 0,
        maxParticipants: maxParticipants,
        createdAt: serverTimestamp(),
        bannedUserIds: [],
      };

      await addDoc(collection(firestore, 'voiceRooms'), roomData);
      
      toast({
        title: 'Oda Oluşturuldu!',
        description: `'${title.trim()}' odası başarıyla oluşturuldu.`,
      });
      
      // Reset form and close dialog
      setTitle('');
      setPassword('');
      setIsPublic(true);
      setMaxParticipants(7);
      setOpen(false);
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        variant: 'destructive',
        title: 'Oda Oluşturulamadı',
        description: 'Oda oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isFormValid = title.trim() && (isPublic || password.trim());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yeni Bir Sesli Oda Oluştur</DialogTitle>
          <DialogDescription>
            Arkadaşlarınla veya yeni insanlarla tanışmak için bir oda oluştur.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="room-title">Oda Adı</Label>
            <Input
              id="room-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Hafta sonu planları..."
              autoFocus
            />
          </div>
          
          <div className="space-y-3">
             <Label>Oda Tipi</Label>
             <div className="grid grid-cols-2 gap-2">
                 <Button variant={isPublic ? 'default' : 'outline'} onClick={() => setIsPublic(true)} className="flex items-center gap-2">
                    <Globe className="w-4 h-4"/>
                    Herkese Açık
                </Button>
                <Button variant={!isPublic ? 'default' : 'outline'} onClick={() => setIsPublic(false)} className="flex items-center gap-2">
                    <Lock className="w-4 h-4"/>
                    Özel
                </Button>
             </div>
          </div>

          {!isPublic && (
            <div className="space-y-2">
              <Label htmlFor="room-password">Oda Şifresi</Label>
              <Input
                id="room-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifreyi girin"
              />
            </div>
          )}

           <div className="space-y-3">
             <div className="flex justify-between">
                <Label>Maksimum Katılımcı</Label>
                <span className="font-bold text-primary">{maxParticipants}</span>
             </div>
             <Slider 
                value={[maxParticipants]} 
                onValueChange={(value) => setMaxParticipants(value[0])}
                min={2} 
                max={7} 
                step={1} 
            />
           </div>

        </div>
        <DialogFooter>
          <Button onClick={handleCreateRoom} disabled={!isFormValid || isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Odayı Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
