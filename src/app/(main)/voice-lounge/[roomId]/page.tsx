'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ArrowLeft, Hand, MicOff, MoreHorizontal, PhoneMissed, Send, ThumbsUp, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { VoiceRoom, UserProfile, Message } from '@/lib/data';
import { doc, collection, query, orderBy } from 'firebase/firestore';

const RoomLoader = () => (
    <div className="flex flex-col h-dvh items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Odaya bağlanılıyor...</p>
    </div>
);


export default function VoiceRoomPage() {
  const router = useRouter();
  const params = useParams();
  const firestore = useFirestore();
  const { roomId } = params;

  // Fetch room data
  const roomDocRef = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    return doc(firestore, 'voiceRooms', roomId as string);
  }, [firestore, roomId]);
  const { data: room, isLoading: isLoadingRoom } = useDoc<VoiceRoom>(roomDocRef);

  // Fetch participants (placeholder for now)
   const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    // In a real app, this would be a subcollection like 'voiceRooms/{roomId}/participants'
    return query(collection(firestore, 'users'), orderBy('name', 'asc'));
  }, [firestore, roomId]);
  const { data: participants, isLoading: isLoadingParticipants } = useCollection<UserProfile>(participantsQuery);
  
  // Fetch messages (placeholder for now)
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    // This would be 'voiceRooms/{roomId}/messages'
    return query(collection(firestore, 'matches', 'chatId_placeholder', 'messages'));
  }, [firestore, roomId]);
  const { data: messages, isLoading: isLoadingMessages } = useCollection<Message>(messagesQuery);
  
  const isLoading = isLoadingRoom || isLoadingParticipants || isLoadingMessages;

  if (isLoading) {
      return <RoomLoader />;
  }

  if (!room) {
    // Handle case where room doesn't exist
    // You might want to redirect or show a "not found" message
    return (
        <div className="flex flex-col h-dvh items-center justify-center gap-4">
            <p className="text-destructive">Oda bulunamadı.</p>
            <Button onClick={() => router.back()}>Geri Dön</Button>
        </div>
    );
  }
  
  // For now, we'll use a slice of the fetched users as mock participants
  const mockParticipants = participants?.slice(0, room.participantCount) || [];
  const currentUser = mockParticipants[1]; // Assume current user is the second one for mock UI

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-gradient-to-b from-card to-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 pt-[calc(env(safe-area-inset-top,0rem)+1rem)] z-10 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="text-center">
            <h1 className="text-xl font-bold">{room.title}</h1>
            <p className="text-sm text-muted-foreground">{room.participantCount} kişi dinliyor</p>
        </div>
        <Button variant="ghost" size="icon" className="text-foreground">
          <MoreHorizontal className="w-6 h-6" />
        </Button>
      </header>
      
      {/* Participants Grid */}
      <div className="p-4 border-b">
        <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex items-center gap-6 pb-2">
                {mockParticipants.map(participant => (
                    <div key={participant.id} className="flex flex-col items-center gap-2 text-center w-20">
                        <div className={cn("relative rounded-full p-1")}>
                            <Avatar className={cn("w-16 h-16 border-2 border-transparent")}>
                                <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                                <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {room.ownerId === participant.id && (
                                <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 leading-none">
                                    <Hand className="w-3 h-3" />
                                </div>
                            )}
                        </div>
                        <p className="font-semibold text-xs truncate w-full">{participant.name}</p>
                    </div>
                ))}
            </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 space-y-4">
        {/* Messages will be rendered here from `messages` state */}
      </ScrollArea>

      {/* Footer Controls */}
      <footer className="p-4 pb-[calc(env(safe-area-inset-bottom,0rem)+1rem)] border-t bg-background/80 backdrop-blur-md z-10 space-y-4">
        <div className="flex items-end gap-2">
            <Textarea placeholder="Bir mesaj yaz..." className="flex-1 resize-none rounded-2xl" rows={1} />
            <Button size="icon" className="rounded-full h-10 w-10"><Send className="w-5 h-5"/></Button>
        </div>
        <div className="flex items-center justify-center gap-4">
            <Button variant="secondary" size="icon" className="w-14 h-14 rounded-full text-muted-foreground">
                <ThumbsUp className="w-6 h-6" />
            </Button>
            <Button variant="secondary" size="icon" className="w-14 h-14 rounded-full text-muted-foreground">
                <MicOff className="w-6 h-6" />
            </Button>
            <Button variant="destructive" size="icon" className="w-14 h-14 rounded-full" onClick={() => router.back()}>
                <PhoneMissed className="w-6 h-6" />
            </Button>
        </div>
      </footer>
    </div>
  );
}
