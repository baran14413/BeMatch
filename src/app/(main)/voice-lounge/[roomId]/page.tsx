'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ArrowLeft, Hand, MicOff, MoreHorizontal, PhoneMissed, Send, ThumbsUp } from 'lucide-react';
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
    { id: 'u6', name: 'Selin', avatarUrl: 'https://i.pravatar.cc/150?u=selin', isSpeaking: false },
  ],
  messages: [
      {id: 'm1', senderId: 'u2', text: 'Bu film hakkında ne düşünüyorsunuz?', timestamp: '10:30'},
      {id: 'm2', senderId: 'u1', text: 'Bence harikaydı! Özellikle sonu çok etkileyiciydi.', timestamp: '10:31'},
      {id: 'm3', senderId: 'u3', text: 'Katılıyorum, hiç beklemiyordum.', timestamp: '10:32'},
  ]
};


export default function VoiceRoomPage() {
  const router = useRouter();
  const params = useParams();
  const { roomId } = params;
  
  const room = mockRoomData; // Use mock data for now
  const currentUser = room.participants[1]; // Assume current user is Burak for mock

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-gradient-to-b from-card to-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 pt-[calc(env(safe-area-inset-top,0rem)+1rem)] z-10 border-b">
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
      <div className="p-4 border-b">
        <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex items-center gap-6 pb-2">
                {room.participants.map(participant => (
                    <div key={participant.id} className="flex flex-col items-center gap-2 text-center w-20">
                        <div className={cn("relative rounded-full p-1", participant.isSpeaking && "bg-primary/50")}>
                            <Avatar className={cn("w-16 h-16 border-2", participant.isSpeaking ? 'border-primary' : 'border-transparent')}>
                                <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                                <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {participant.isModerator && (
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
        {room.messages.map(message => {
            const isMe = message.senderId === currentUser.id;
            const sender = room.participants.find(p => p.id === message.senderId);
            return (
                <div key={message.id} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                    {!isMe && (
                         <Avatar className="w-8 h-8">
                            <AvatarImage src={sender?.avatarUrl} alt={sender?.name} />
                            <AvatarFallback>{sender?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    )}
                    <div className={cn("max-w-[75%] rounded-2xl px-4 py-2", isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-secondary rounded-bl-none")}>
                        {!isMe && <p className="text-xs font-bold text-primary pb-1">{sender?.name}</p>}
                        <p>{message.text}</p>
                        <p className="text-xs text-right opacity-70 mt-1">{message.timestamp}</p>
                    </div>
                </div>
            )
        })}
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
