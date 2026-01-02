'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft, Hand, Mic, MicOff, MoreHorizontal, PhoneMissed, ThumbsUp } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

// Mock data, to be replaced with real data later
const mockRoomData = {
  id: '1',
  title: 'Gecenin Geyikleri',
  participants: [
    { id: 'u1', name: 'Ayşe', avatarUrl: 'https://i.pravatar.cc/150?u=ayse', isSpeaking: true, isModerator: true },
    { id: 'u2', name: 'Burak', avatarUrl: 'https://i.pravatar.cc/150?u=burak', isSpeaking: false },
    { id: 'u3', name: 'Can', avatarUrl: 'https://i.pravatar.cc/150?u=can', isSpeaking: false },
    { id: 'u4', name: 'Derya', avatarUrl: 'https://i.pravatar.cc/150?u=derya', isSpeaking: false },
    { id: 'u5', name: 'Emre', avatarUrl: 'https://i.pravatar.cc/150?u=emre', isSpeaking: false },
  ],
};


export default function VoiceRoomPage() {
  const router = useRouter();
  const params = useParams();
  const { roomId } = params;
  
  const room = mockRoomData; // Use mock data for now

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-gradient-to-b from-card to-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 pt-[calc(env(safe-area-inset-top,0rem)+1rem)] z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="text-center">
            <h1 className="text-xl font-bold">{room.title}</h1>
            <p className="text-sm text-muted-foreground">{room.participants.length} kişi dinliyor</p>
        </div>
        <Button variant="ghost" size="icon" className="text-foreground">
          <MoreHorizontal className="w-6 h-6" />
        </Button>
      </header>

      {/* Participants Grid */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-3 gap-x-4 gap-y-8">
            {room.participants.map(participant => (
                <div key={participant.id} className="flex flex-col items-center gap-2 text-center">
                    <div className={cn("relative rounded-full p-1", participant.isSpeaking && "bg-primary/50")}>
                        <Avatar className={cn("w-20 h-20 border-2", participant.isSpeaking ? 'border-primary' : 'border-transparent')}>
                            <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                            <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {participant.isModerator && (
                            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 leading-none">
                                <Hand className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                    <p className="font-semibold text-sm truncate w-full">{participant.name}</p>
                </div>
            ))}
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="flex items-center justify-center gap-4 p-4 pb-[calc(env(safe-area-inset-bottom,0rem)+1rem)] border-t bg-background/80 backdrop-blur-md z-10">
        <Button variant="secondary" size="icon" className="w-16 h-16 rounded-full text-muted-foreground">
            <ThumbsUp className="w-7 h-7" />
        </Button>
        <Button variant="secondary" size="icon" className="w-16 h-16 rounded-full text-muted-foreground">
            <MicOff className="w-7 h-7" />
        </Button>
        <Button variant="destructive" size="icon" className="w-16 h-16 rounded-full" onClick={() => router.back()}>
            <PhoneMissed className="w-7 h-7" />
        </Button>
      </footer>
    </div>
  );
}
