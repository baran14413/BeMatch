'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ArrowLeft, Hand, Mic, MicOff, MoreHorizontal, PhoneMissed, Send, ThumbsUp, Loader2, LogOut, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { VoiceRoom, UserProfile, Message } from '@/lib/data';
import { doc, collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, setDoc } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

const RoomLoader = () => (
    <div className="flex flex-col h-dvh items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Odaya bağlanılıyor...</p>
    </div>
);

function MessageBubble({ message, isMe, author }: { message: Message, isMe: boolean, author: UserProfile | undefined }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className={cn("group w-full flex items-start gap-2.5", isMe ? "justify-end" : "")}
    >
      {!isMe && (
         <Avatar className="w-8 h-8">
            <AvatarImage src={author?.avatarUrl} />
            <AvatarFallback>{author?.name?.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
        "max-w-[70%] break-words p-3 px-4 rounded-2xl relative flex flex-col",
        isMe
          ? 'rounded-tr-none bg-primary text-primary-foreground'
          : 'rounded-tl-none bg-secondary text-secondary-foreground'
      )}>
        {!isMe && <p className="text-xs font-bold mb-1">{author?.name}</p>}
        <p className="text-left whitespace-pre-wrap">{message.text}</p>
        <span className="text-xs self-end mt-1 opacity-70">
          {message.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}


export default function VoiceRoomPage() {
  const router = useRouter();
  const params = useParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { roomId } = params;

  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: currentUserProfile } = useDoc<UserProfile>(currentUserProfileRef);

  const roomDocRef = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    return doc(firestore, 'voiceRooms', roomId as string);
  }, [firestore, roomId]);
  const { data: room, isLoading: isLoadingRoom } = useDoc<VoiceRoom>(roomDocRef);

   const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    return query(collection(firestore, 'voiceRooms', roomId as string, 'participants'));
  }, [firestore, roomId]);
  const { data: participants, isLoading: isLoadingParticipants } = useCollection<UserProfile>(participantsQuery);
  
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    return query(collection(firestore, 'voiceRooms', roomId as string, 'messages'), orderBy('timestamp', 'asc'));
  }, [firestore, roomId]);
  const { data: messages, isLoading: isLoadingMessages } = useCollection<Message>(messagesQuery);
  
  const {
    localStream,
    peers,
    isMuted,
    toggleMute,
    speakingPeerId,
  } = useWebRTC(roomId as string, user?.uid);

  useEffect(() => {
    if (!user || !roomId || !firestore || !currentUserProfile) return;

    const participantRef = doc(firestore, 'voiceRooms', roomId as string, 'participants', user.uid);

    setDoc(participantRef, currentUserProfile);

    const handleBeforeUnload = () => {
      deleteDoc(participantRef);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      deleteDoc(participantRef);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, roomId, firestore, currentUserProfile]);


  const isLoading = isLoadingRoom || isLoadingParticipants || isLoadingMessages || !currentUserProfile;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !roomId || isSending) return;

    setIsSending(true);
    try {
        const messagesColRef = collection(firestore, 'voiceRooms', roomId as string, 'messages');
        await addDoc(messagesColRef, {
            senderId: user.uid,
            text: newMessage.trim(),
            timestamp: serverTimestamp()
        });
        setNewMessage('');
    } catch (error) {
        console.error("Error sending message:", error);
    } finally {
        setIsSending(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomDocRef) return;
    try {
      await deleteDoc(roomDocRef);
      toast({
        title: "Oda Silindi",
        description: "Oda başarıyla kapatıldı.",
      });
      router.push('/voice-lounge');
    } catch (error) {
      console.error("Error deleting room:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Oda silinirken bir sorun oluştu.",
      });
    }
  };


  if (isLoading) {
      return <RoomLoader />;
  }

  if (!room) {
    return (
        <div className="flex flex-col h-dvh items-center justify-center gap-4">
            <p className="text-destructive">Oda bulunamadı.</p>
            <Button onClick={() => router.back()}>Geri Dön</Button>
        </div>
    );
  }
  
  const allParticipants = participants ? [...participants, currentUserProfile].reduce((acc, p) => {
    if (p && !acc.some(ap => ap.id === p.id)) {
        acc.push(p);
    }
    return acc;
  }, [] as UserProfile[]) : [currentUserProfile];

  const isOwner = user?.uid === room.ownerId;

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-gradient-to-b from-card to-background">
      {/* Peers' audio elements */}
      {Object.entries(peers).map(([peerId, peer]) => (
        <audio key={peerId} ref={el => el && (el.srcObject = peer.stream)} autoPlay />
      ))}
      
      <header className="flex items-center justify-between p-4 pt-[calc(env(safe-area-inset-top,0rem)+1rem)] z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="text-center">
            <h1 className="text-xl font-bold">{room.title}</h1>
            <p className="text-sm text-muted-foreground">{participants?.length || 0} kişi dinliyor</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
             <Button variant="ghost" size="icon" className="text-foreground">
                <MoreHorizontal className="w-6 h-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1">
            {isOwner ? (
              <>
                 <Button variant="ghost" className="w-full justify-start">Odayı Yönet</Button>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
                           <Trash2 className="w-4 h-4 mr-2" /> Odayı Sil
                         </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu eylem geri alınamaz. Sesli sohbet odası kalıcı olarak kapatılacaktır.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteRoom} className="bg-destructive hover:bg-destructive/90">
                          Evet, Odayı Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
                 <Button variant="ghost" onClick={() => router.back()} className="w-full justify-start">
                   <LogOut className="w-4 h-4 mr-2" /> Odadan Ayrıl
                 </Button>
            )}
          </PopoverContent>
        </Popover>
      </header>
      
      <div className="p-4">
        <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex items-center gap-6 pb-2">
                {allParticipants?.map(participant => (
                    <div key={participant.id} className="flex flex-col items-center gap-2 text-center w-20">
                        <div className={cn("relative rounded-full p-0.5", speakingPeerId === participant.id && 'bg-gradient-to-tr from-primary to-blue-400 animate-pulse')}>
                            <Avatar className={cn("w-16 h-16 border-2", speakingPeerId === participant.id ? 'border-background' : 'border-transparent')}>
                                <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                                <AvatarFallback>{participant.name?.charAt(0)}</AvatarFallback>
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

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-t from-transparent to-background z-10 pointer-events-none" />
        <ScrollArea className="flex-1 p-4 space-y-4">
          <AnimatePresence>
              {messages?.map(message => {
                  const author = allParticipants.find(p => p.id === message.senderId);
                  return (
                      <MessageBubble key={message.id} message={message} isMe={message.senderId === user?.uid} author={author} />
                  )
              })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </ScrollArea>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-background z-10 pointer-events-none" />
      </div>

      <footer className="p-4 pb-[calc(env(safe-area-inset-bottom,0rem)+1rem)] z-10 space-y-3">
        <div className="flex items-end gap-2">
            <Textarea 
              placeholder="Bir mesaj yaz..." 
              className="flex-1 resize-none rounded-2xl" 
              rows={1}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                  }
              }}
            />
            <Button size="icon" className="rounded-full h-10 w-10" onClick={handleSendMessage} disabled={isSending}>
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5"/>}
            </Button>
        </div>
        <div className="flex items-center justify-center gap-4">
            <Button variant="secondary" size="icon" className="w-12 h-12 rounded-full text-muted-foreground">
                <ThumbsUp className="w-5 h-5" />
            </Button>
            <Button variant="secondary" size="icon" className="w-14 h-14 rounded-full text-muted-foreground" onClick={toggleMute}>
               {isMuted ? <MicOff className="w-6 h-6 text-destructive"/> : <Mic className="w-6 h-6" />}
            </Button>
            <Button variant="destructive" size="icon" className="w-12 h-12 rounded-full" onClick={() => router.back()}>
                <PhoneMissed className="w-5 h-5" />
            </Button>
        </div>
      </footer>
    </div>
  );
}
