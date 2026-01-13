'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/context/language-context';
import { Users, Plus, Headphones } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { VoiceRoom } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import CreateRoomDialog from '@/components/voice/create-room-dialog';


const RoomCardSkeleton = () => (
    <Card className="overflow-hidden flex flex-col bg-card">
        <div className="p-4 relative h-32 flex flex-col justify-end bg-muted/50">
             <Skeleton className="w-3/4 h-6" />
        </div>
        <CardContent className="p-4 flex-1">
            <div className="flex -space-x-2 overflow-hidden mb-4">
                 <Skeleton className="h-10 w-10 rounded-full" />
                 <Skeleton className="h-10 w-10 rounded-full" />
                 <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <div className="flex items-center">
                <Skeleton className="h-4 w-24" />
            </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
            <Skeleton className="h-10 w-full" />
        </CardFooter>
    </Card>
);


export default function VoiceLoungePage() {
  const { t } = useLanguage();
  const firestore = useFirestore();

  const roomsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'voiceRooms'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: rooms, isLoading } = useCollection<VoiceRoom>(roomsQuery);

  return (
    <ScrollArea className="h-full">
      <div className="h-full bg-gray-50 dark:bg-black">
        <header className="p-4 md:p-8 pt-[calc(env(safe-area-inset-top,0rem)+1rem)]">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
                 <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Headphones className="w-6 h-6 text-primary" />
                 </div>
                 <div>
                    <h1 className="text-3xl font-bold text-primary">LoveSound</h1>
                    <p className="text-muted-foreground">Sesli sohbet odalarında yeni insanlarla tanış.</p>
                 </div>
            </div>
            <CreateRoomDialog>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Oda Oluştur
                </Button>
            </CreateRoomDialog>
          </div>
        </header>

        <main className="p-4 md:p-8 md:pt-0 pb-[calc(env(safe-area-inset-bottom,0rem)+1rem)]">
          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <RoomCardSkeleton />
                <RoomCardSkeleton />
                <RoomCardSkeleton />
            </div>
          ) : rooms && rooms.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                <Card key={room.id} className="overflow-hidden flex flex-col bg-card">
                    <CardHeader 
                        className="p-0 relative h-32 flex flex-col justify-end"
                         style={{
                            backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8), transparent), url(https://picsum.photos/seed/${room.id}/600/400)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        <div className="p-4">
                            <CardTitle className="text-white text-xl">{room.title}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 flex-1">
                    {/* Participant avatars can be fetched in a subcollection later */}
                    <div className="flex -space-x-2 overflow-hidden mb-4">
                        {Array.from({length: Math.min(room.participantCount, 5)}).map((_, i) => (
                           <Avatar key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-card">
                             <AvatarImage src={`https://i.pravatar.cc/150?u=${room.id}-${i}`} />
                             <AvatarFallback>K</AvatarFallback>
                           </Avatar>
                        ))}
                    </div>
                    <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                        {room.participantCount} / {room.maxParticipants} Katılımcı
                        </span>
                    </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                    <Link href={`/voice-lounge/${room.id}`} passHref className="w-full">
                        <Button className="w-full" disabled={room.participantCount >= room.maxParticipants}>
                            {room.participantCount >= room.maxParticipants ? 'Oda Dolu' : 'Odaya Katıl'}
                        </Button>
                    </Link>
                    </CardFooter>
                </Card>
                ))}
            </div>
          ) : (
             <div className="text-center py-16">
                <p className="text-muted-foreground">Henüz aktif bir oda bulunmuyor.</p>
                <CreateRoomDialog>
                    <Button className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        İlk Odayı Sen Oluştur
                    </Button>
                </CreateRoomDialog>
            </div>
          )}
        </main>
      </div>
    </ScrollArea>
  );
}
