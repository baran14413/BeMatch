'use client';
import { useState, useEffect, useRef, useCallback }from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser, useFirestore, useMemoFirebase, useStorage, useCollection, useAuth } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteDoc,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import type { UserProfile, Message, Match } from '@/lib/data';
import { useUserStatus } from '@/hooks/use-user-status';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Plus, Mic, Send, CheckCheck, MoreHorizontal, Pencil, Trash2, CornerUpLeft, Bot, Loader2, StopCircle, X, CircleDot, Camera, ShieldBan, BadgeCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isToday, isYesterday, formatDistanceToNowStrict } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import VoiceMessagePlayer from '@/components/chat/voice-message-player';
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from '@/context/language-context';
import TypingIndicator from '@/components/chat/typing-indicator';
import ProfileDetails from '@/components/discover/profile-details';
import { generateAiChatResponse } from '@/app/actions';

const BEMATCH_SYSTEM_ID = 'bematch_system_account';
const AI_CHAT_MESSAGE_LIMIT = 8;


const ChatLoader = () => (
  <div className="flex flex-col h-screen overflow-hidden bg-black">
    {/* Header Skeleton */}
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 border-b border-white/10 bg-black/80 p-3 pt-12 pb-3 backdrop-blur-md">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
      </div>
    </header>

    {/* Messages Skeleton */}
    <div className="flex-1 space-y-4 overflow-y-auto px-4 pt-32 pb-24">
      <div className="flex justify-end">
        <Skeleton className="h-12 w-48 rounded-2xl rounded-tr-none" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-16 w-64 rounded-2xl rounded-tl-none" />
      </div>
       <div className="flex justify-end">
        <Skeleton className="h-10 w-32 rounded-2xl rounded-tr-none" />
      </div>
    </div>
    
    {/* Input Skeleton */}
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black p-3 pb-6">
        <div className="flex items-center gap-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-12 flex-1 rounded-full" />
            <Skeleton className="h-12 w-12 rounded-full" />
        </div>
    </footer>
  </div>
);

function formatMessageTimestamp(timestamp: any, locale: 'tr' | 'en') {
  if (!timestamp) return '';
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatUserStatus(status: ReturnType<typeof useUserStatus>, t: (key: string) => string, locale: 'tr' | 'en'): string {
    if (!status) return '...';
    if (status.state === 'online') {
        return t('chat.online');
    }
    const lastChangedDate = new Date(status.last_changed);
    if (isToday(lastChangedDate)) {
        return `${t('chat.today')} ${format(lastChangedDate, 'HH:mm')}`;
    }
    if (isYesterday(lastChangedDate)) {
        return `${t('chat.yesterday')} ${format(lastChangedDate, 'HH:mm')}`;
    }
    return formatDistanceToNowStrict(lastChangedDate, { addSuffix: true, locale: locale === 'tr' ? tr : enUS });
}

function MessageActions({ 
    message, 
    onReply,
    onEdit, 
    onDelete, 
    onReaction,
    isMyMessage
}: { 
    message: Message; 
    onReply: () => void;
    onEdit: () => void; 
    onDelete: () => void; 
    onReaction: (emoji: string) => void; 
    isMyMessage: boolean;
}) {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // System messages from BeMatch should not be interactive
  if (message.senderId === BEMATCH_SYSTEM_ID) {
    return null;
  }

  return (
    <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <PopoverTrigger asChild>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground/60 rounded-full hover:bg-secondary"
            >
                <MoreHorizontal className="w-5 h-5" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1" side="top" align={isMyMessage ? "end" : "start"}>
            <div className="flex flex-col items-start">
                <div className="flex items-center w-full">
                     <Button variant="ghost" className="w-full justify-start text-sm px-2" onClick={() => { onReply(); setIsMenuOpen(false); }}>
                        <CornerUpLeft className="w-4 h-4 mr-2" />
                        {t('chat.actions.reply')}
                    </Button>
                    {isMyMessage && (
                        <>
                           {(message.type === 'text' || !message.type) && (
                            <Button variant="ghost" className="w-full justify-start text-sm px-2" onClick={() => { onEdit(); setIsMenuOpen(false); }}>
                                <Pencil className="w-4 h-4 mr-2" />
                                {t('chat.actions.edit')}
                            </Button>
                           )}
                           <Button variant="ghost" className="w-full justify-start text-destructive text-sm px-2" onClick={() => { onDelete(); setIsMenuOpen(false); }}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t('chat.actions.delete')}
                            </Button>
                        </>
                    )}
                </div>
                <Separator />
                 <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { onReaction('❤️'); setIsMenuOpen(false); }}><span className="text-xl">❤️</span></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { onReaction('😂'); setIsMenuOpen(false); }}><span className="text-xl">😂</span></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { onReaction('👍'); setIsMenuOpen(false); }}><span className="text-xl">👍</span></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { onReaction('🙏'); setIsMenuOpen(false); }}><span className="text-xl">🙏</span></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { onReaction('😢'); setIsMenuOpen(false); }}><span className="text-xl">😢</span></Button>
                </div>
            </div>
        </PopoverContent>
    </Popover>
  );
}


const ViewOnceIcon = ({ active }: { active: boolean }) => (
    <div className="relative w-6 h-6">
      <CircleDot className={cn("w-6 h-6", active ? "text-primary" : "text-white")} />
      {active && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary-foreground">
          1
        </span>
      )}
    </div>
  );


export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.chatId as string;
  const CHARACTER_LIMIT = 500;
  const { t, locale } = useLanguage();

  const placeholders = [
    t('chat.placeholders.q1'),
    t('chat.placeholders.q2'),
    t('chat.placeholders.q3'),
    t('chat.placeholders.q4'),
    t('chat.placeholders.q5'),
  ];

  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const auth = useAuth();
  const { toast } = useToast();

  const [matchProfile, setMatchProfile] = useState<UserProfile | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [matchData, setMatchData] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Message | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [showProfileDetails, setShowProfileDetails] = useState(false);

  // Typing indicator state
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);

  // Image sending state
  const [imageToSend, setImageToSend] = useState<{dataUrl: string; file: File} | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  const [isSendingImage, setIsSendingImage] = useState(false);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Voice message state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // View Once Image state
  const [viewOnceImage, setViewOnceImage] = useState<Message | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isOverLimit = newMessage.length > CHARACTER_LIMIT;
  const isBlockedByMe = matchData?.isBlocked && matchData.blockedBy === user?.uid;
  const isBlockedByOther = matchData?.isBlocked && matchData.blockedBy !== user?.uid;
  const isSystemChat = matchProfile?.id === BEMATCH_SYSTEM_ID;
  const isMockChat = !!matchProfile?.isSystemAccount;
  const userStatus = useUserStatus(matchProfile?.id);
  const isPremium = !!currentUserProfile?.premiumTier;

  const messagesQuery = useMemoFirebase(() => {
    if (!chatId || !firestore) return null;
    return query(collection(firestore, 'matches', chatId, 'messages'), orderBy('timestamp', 'asc'));
  }, [chatId, firestore]);

  const { data: messages, isLoading: isLoadingMessages } = useCollection<Message>(messagesQuery);
  const userMessageCount = messages?.filter(m => m.senderId === user?.uid).length || 0;
  const chatLimitReached = isMockChat && !isPremium && userMessageCount >= AI_CHAT_MESSAGE_LIMIT;


  const updateTypingStatus = (isTyping: boolean) => {
    if (!user || !chatId || !firestore || isSystemChat || isMockChat) return;
    const matchRef = doc(firestore, 'matches', chatId);
    const typingUpdate = {
        [`typing.${user.uid}`]: isTyping
    };
    updateDoc(matchRef, typingUpdate).catch(err => {
      // We can silently fail here, as it's not a critical feature
      console.warn("Could not update typing status:", err);
    });
  };
  
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    } else {
      updateTypingStatus(true);
    }

    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
      typingTimeoutRef.current = null;
    }, 2000);
  };


  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prevIndex) => (prevIndex + 1) % placeholders.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [placeholders]);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const scrollHeight = textareaRef.current.scrollHeight;
        const newHeight = Math.min(scrollHeight, 96); // max-h-24 = 6rem = 96px
        textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [newMessage]);

  useEffect(() => {
    if (!chatId || !user || !firestore) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    
    let unsubscribeUser: () => void = () => {};
    let unsubscribeCurrentUser: () => void = () => {};
    
    const matchDocRef = doc(firestore, 'matches', chatId);
    
    const unsubscribeMatch = onSnapshot(matchDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const match = { id: docSnap.id, ...docSnap.data() } as Match;
            setMatchData(match);
            const otherUserId = match.users.find(uid => uid !== user.uid);
            
            if (otherUserId && match.typing) {
                setIsOtherUserTyping(!!match.typing[otherUserId]);
            }
            
            const currentUserDocRef = doc(firestore, 'users', user.uid);
            unsubscribeCurrentUser = onSnapshot(currentUserDocRef, (userDoc) => {
                if (userDoc.exists()) {
                    setCurrentUserProfile({ id: userDoc.id, ...userDoc.data() } as UserProfile);
                }
            });


            if (otherUserId && matchProfile?.id !== otherUserId) {
                if (unsubscribeUser) unsubscribeUser(); 
                
                const userDocRef = doc(firestore, 'users', otherUserId);
                unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
                    if (userDoc.exists()) {
                        setMatchProfile({ id: userDoc.id, ...userDoc.data() } as UserProfile);
                    } else {
                        // This case handles mock profiles which don't have a user document
                        const mockInfoKey = `user_info_${otherUserId}`;
                        const mockInfo = (match as any)[mockInfoKey];

                        if (mockInfo) {
                           setMatchProfile({
                                id: otherUserId,
                                name: mockInfo.name,
                                avatarUrl: mockInfo.avatarUrl,
                                isSystemAccount: true, // Mark it as a mock account
                           } as UserProfile)
                        } else {
                            toast({ variant: 'destructive', title: 'User not found' });
                            router.push('/lounge');
                        }
                    }
                    setIsLoading(false); 
                }, (error) => {
                    console.error("Error fetching match profile:", error);
                    const permissionError = new FirestorePermissionError({
                        path: userDocRef.path,
                        operation: 'get',
                    });
                    errorEmitter.emit('permission-error', permissionError);
                    setIsLoading(false);
                });
            } else if (!otherUserId) {
                setIsLoading(false);
            }
        } else {
            toast({ variant: 'destructive', title: 'Chat not found' });
            router.push('/lounge');
        }
    }, (error) => {
        console.error("Error fetching match data:", error);
        const permissionError = new FirestorePermissionError({
            path: matchDocRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false);
        router.push('/lounge');
    });

    return () => {
        unsubscribeMatch();
        unsubscribeUser();
        unsubscribeCurrentUser();
        if (user) {
            updateTypingStatus(false);
        }
    };
}, [chatId, user, firestore, router, toast]);

    // AI Response Logic for Mock Chats
  useEffect(() => {
    if (!messages || messages.length === 0 || !user || !isMockChat || isAiResponding) {
        return;
    }

    const lastMessage = messages[messages.length - 1];
    const userMessagesCount = messages.filter(m => m.senderId === user.uid).length;
    
    // If the last message is from the user, trigger AI response.
    if (lastMessage.senderId === user.uid) {
        
        const triggerAiResponse = async () => {
            if (!currentUserProfile || !matchProfile) return;

            setIsAiResponding(true);

            // Give a "typing" delay to make it feel more natural
            await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000)); // 2-5 seconds delay

            const chatHistory = messages
                .slice(-5) // Get last 5 messages for context
                .map(m => {
                    const senderName = m.senderId === user.uid ? currentUserProfile.name : matchProfile.name;
                    return `${senderName}: ${m.text}`;
                }).join('\n');
            
            const userProfileString = `Name: ${currentUserProfile.name}, Age: ${currentUserProfile.age}, Bio: ${currentUserProfile.bio || ''}, Interests: ${currentUserProfile.interests?.join(', ') || ''}`;

            try {
                const result = await generateAiChatResponse({
                    userProfile: userProfileString,
                    mockProfileName: matchProfile.name,
                    chatHistory: chatHistory,
                    messageCount: userMessagesCount, // Use the user's message count
                    language: locale,
                });

                if (result.response) {
                    const matchDocRef = doc(firestore, 'matches', chatId);
                    await addDoc(collection(firestore, 'matches', chatId, 'messages'), {
                         senderId: matchProfile.id,
                         text: result.response,
                         timestamp: serverTimestamp(),
                         isRead: true, // Mark as read since user is in chat
                         isAiGenerated: true,
                    });
                     await updateDoc(matchDocRef, {
                        lastMessage: result.response,
                        timestamp: serverTimestamp(),
                    });
                }
            } catch (error) {
                console.error("Error generating AI response:", error);
                // Optionally inform the user
            } finally {
                setIsAiResponding(false);
            }
        };

        triggerAiResponse();
    }
}, [messages, user, isMockChat, currentUserProfile, matchProfile, chatId, firestore, locale, isAiResponding]);



  useEffect(() => {
      if (messages && user && firestore && !isSystemChat) {
          const unreadMessages = messages.filter(message => message.senderId !== user.uid && !message.isRead);
          if (unreadMessages.length > 0) {
              const batch = writeBatch(firestore);
              unreadMessages.forEach(message => {
                  const messageRef = doc(firestore, 'matches', chatId, 'messages', message.id);
                  batch.update(messageRef, { isRead: true });
              });
              batch.commit().catch(err => {
                   const permissionError = new FirestorePermissionError({
                        path: `matches/${chatId}/messages/<batch>`,
                        operation: 'update',
                        requestResourceData: { isRead: true },
                   });
                   errorEmitter.emit('permission-error', permissionError);
              });
          }
      }
  }, [messages, user, firestore, chatId, isSystemChat]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherUserTyping, isAiResponding]);

  const handleSendMessage = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    updateTypingStatus(false);
    if(typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    const text = newMessage.trim();
    if (!text || !user || !firestore || !chatId || isOverLimit || isBlockedByMe || isBlockedByOther || isSystemChat || chatLimitReached) return;
    
    const matchDocRef = doc(firestore, 'matches', chatId);

    if (editingMessage) {
        const messageRef = doc(firestore, 'matches', chatId, 'messages', editingMessage.id);
        updateDoc(messageRef, {
            text: text,
            isEdited: true,
            updatedAt: serverTimestamp(),
        }).catch(err => {
             const permissionError = new FirestorePermissionError({
                path: messageRef.path,
                operation: 'update',
                requestResourceData: { text, isEdited: true },
             });
             errorEmitter.emit('permission-error', permissionError);
        });
        setEditingMessage(null);
    } else {
        const messageData: Partial<Message> = {
          senderId: user.uid,
          text,
          timestamp: serverTimestamp(),
          isRead: false,
          type: 'text',
        };
        if (replyingToMessage) {
            messageData.replyTo = {
                messageId: replyingToMessage.id,
                text: replyingToMessage.text,
                senderId: replyingToMessage.senderId,
                type: replyingToMessage.type,
                ...(replyingToMessage.imageUrl && { imageUrl: replyingToMessage.imageUrl }),
            };
        }

        addDoc(collection(firestore, 'matches', chatId, 'messages'), messageData)
            .then(() => {
                updateDoc(matchDocRef, {
                    lastMessage: text,
                    timestamp: serverTimestamp(),
                });
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: `matches/${chatId}/messages/<auto-id>`,
                    operation: 'create',
                    requestResourceData: messageData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    }

    setNewMessage('');
    setReplyingToMessage(null);

    // Update last message in match doc if we were editing
    if (editingMessage) {
      updateDoc(matchDocRef, {
        lastMessage: `${t('chat.editedPrefix')} ${text}`,
        timestamp: serverTimestamp()
      }).catch(console.error);
    }
  };
  
  const handleEditMessage = (message: Message) => {
      setReplyingToMessage(null);
      setEditingMessage(message);
      setNewMessage(message.text);
      textareaRef.current?.focus();
  };

  const cancelEdit = () => {
      setEditingMessage(null);
      setNewMessage('');
  };
    
  const handleReplyMessage = (message: Message) => {
      setEditingMessage(null);
      setReplyingToMessage(message);
      textareaRef.current?.focus();
  };

  const cancelReply = () => {
      setReplyingToMessage(null);
  };

  const handleDeleteMessage = async () => {
      if (!showDeleteConfirm || !firestore) return;

      const messageRef = doc(firestore, 'matches', chatId, 'messages', showDeleteConfirm.id);
      deleteDoc(messageRef).catch(err => {
         const permissionError = new FirestorePermissionError({
            path: messageRef.path,
            operation: 'delete',
         });
         errorEmitter.emit('permission-error', permissionError);
      });
      setShowDeleteConfirm(null);
      toast({
          title: t('chat.toasts.messageDeletedTitle'),
          description: t('chat.toasts.messageDeletedDescription'),
      });
  };
  
  const handleReaction = async (message: Message, emoji: string) => {
      if (!user || isSystemChat || isMockChat) return;
      const messageRef = doc(firestore, 'matches', chatId, 'messages', message.id);

      try {
        await runTransaction(firestore, async (transaction) => {
            const messageDoc = await transaction.get(messageRef);
            if (!messageDoc.exists()) {
                throw "Message does not exist!";
            }

            const data = messageDoc.data() as Message;
            const currentReactions = data.reactions || {};
            const myId = user.uid;
            
            let myCurrentReaction: string | null = null;

            for (const e in currentReactions) {
                const userIndex = currentReactions[e].indexOf(myId);
                if (userIndex > -1) {
                    myCurrentReaction = e;
                    break;
                }
            }

            if(myCurrentReaction === emoji) {
               currentReactions[emoji] = currentReactions[emoji].filter(id => id !== myId);
               if (currentReactions[emoji].length === 0) {
                  delete currentReactions[emoji];
               }
            } else {
               if (myCurrentReaction) {
                   currentReactions[myCurrentReaction] = currentReactions[myCurrentReaction].filter(id => id !== myId);
                   if (currentReactions[myCurrentReaction].length === 0) {
                      delete currentReactions[myCurrentReaction];
                   }
               }
               if (!currentReactions[emoji]) {
                  currentReactions[emoji] = [];
               }
               currentReactions[emoji].push(myId);
            }

            transaction.update(messageRef, { reactions: currentReactions });
        });
      } catch (e) {
          const permissionError = new FirestorePermissionError({
              path: messageRef.path,
              operation: 'update',
              requestResourceData: message.reactions,
          });
          errorEmitter.emit('permission-error', permissionError);
      }
  };

   const sendVoiceMessage = useCallback(async (audioBlob: Blob) => {
    if (!user || !storage || !firestore || !chatId || isSystemChat || isMockChat) return;

    const getDuration = (blob: Blob): Promise<number> => {
        return new Promise(resolve => {
            const audio = document.createElement('audio');
            audio.onloadedmetadata = () => {
                resolve(audio.duration);
                URL.revokeObjectURL(audio.src);
            };
            audio.src = URL.createObjectURL(blob);
        });
    };

    try {
        const duration = await getDuration(audioBlob);
        const audioId = uuidv4();
        const storageRef = ref(storage, `chats/${chatId}/voice_messages/${audioId}.webm`);

        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
        });

        await uploadString(storageRef, dataUrl, 'data_url');
        const downloadURL = await getDownloadURL(storageRef);

        const messageData: Partial<Message> = {
            senderId: user.uid,
            text: '',
            timestamp: serverTimestamp(),
            isRead: false,
            type: 'voice',
            audioUrl: downloadURL,
            audioDuration: duration,
        };

        const matchDocRef = doc(firestore, 'matches', chatId);
        
        await addDoc(collection(firestore, 'matches', chatId, 'messages'), messageData);
        await updateDoc(matchDocRef, {
            lastMessage: t('chat.lastMessageVoice'),
            timestamp: serverTimestamp()
        });

    } catch (error) {
        console.error("Error sending voice message:", error);
        toast({
            variant: "destructive",
            title: t('chat.toasts.voiceSendError')
        });
    }
  }, [user, storage, firestore, chatId, toast, t, isSystemChat, isMockChat]);

   const startRecording = useCallback(async () => {
    if (isRecording || !user || isBlockedByMe || isBlockedByOther || isSystemChat || isMockChat) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const options = {
            audioBitsPerSecond: 256000,
            mimeType: 'audio/webm;codecs=opus'
        };

        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;

        const audioChunks: Blob[] = [];
        recorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        recorder.onstop = () => {
            stream.getTracks().forEach(track => track.stop());
            if(recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
            setRecordingTime(0);
            
            const audioBlob = new Blob(audioChunks, { type: options.mimeType });
            sendVoiceMessage(audioBlob);
        };
        
        recorder.start();
        setIsRecording(true);
        recordingIntervalRef.current = setInterval(() => {
            setRecordingTime(prevTime => prevTime + 1);
        }, 1000);

    } catch (err) {
        console.error("Error starting recording:", err);
        toast({
            variant: "destructive",
            title: t('chat.toasts.recordStartErrorTitle'),
            description: t('chat.toasts.recordStartErrorDescription')
        });
    }
  }, [isRecording, user, toast, isBlockedByMe, isBlockedByOther, sendVoiceMessage, t, isSystemChat, isMockChat]);


  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToSend({ dataUrl: reader.result as string, file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendImage = async () => {
    if (!imageToSend || !user || isSendingImage || !storage || !firestore || !imageInputRef.current || isSystemChat || isMockChat) return;

    setIsSendingImage(true);
    try {
      const imageId = uuidv4();
      const storageRef = ref(storage, `chats/${chatId}/images/${imageId}.jpg`);
      
      await uploadString(storageRef, imageToSend.dataUrl, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);

      const messageData: Partial<Message> = {
        senderId: user.uid,
        text: imageCaption,
        timestamp: serverTimestamp(),
        isRead: false,
        type: 'image',
        imageUrl: downloadURL,
        isViewOnce: isViewOnce,
        isOpenedBy: [],
      };

      const matchDocRef = doc(firestore, 'matches', chatId);
      await addDoc(collection(firestore, 'matches', chatId, 'messages'), messageData);
      await updateDoc(matchDocRef, {
        lastMessage: imageCaption || t('chat.lastMessagePhoto'),
        timestamp: serverTimestamp(),
      });

      // Reset state
      setImageToSend(null);
      setImageCaption('');
      setIsViewOnce(false);
      imageInputRef.current.value = ''; // Reset file input
      toast({ title: t('chat.toasts.imageSent') });
    } catch (error) {
      console.error("Error sending image:", error);
      const permissionError = new FirestorePermissionError({
          path: `chats/${chatId}/images/<auto-id>`,
          operation: 'create',
          requestResourceData: { caption: imageCaption },
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({ variant: 'destructive', title: t('chat.toasts.imageSendError'), description: (error as Error).message });
    } finally {
      setIsSendingImage(false);
    }
  };

    const handleViewOnceImage = (message: Message) => {
        if (!user || !firestore || isSystemChat || isMockChat) return;
        
        const hasOpened = message.isOpenedBy?.includes(user.uid);
        if (hasOpened) return; // Don't open if already viewed

        setViewOnceImage(message);

        const messageRef = doc(firestore, 'matches', chatId, 'messages', message.id);
        const updatedOpenedBy = [...(message.isOpenedBy || []), user.uid];
        updateDoc(messageRef, { isOpenedBy: updatedOpenedBy });

        setTimeout(() => {
            setViewOnceImage(null);
        }, 5000); // Auto-close after 5 seconds
    };

  const getRepliedMessageSenderName = (message: Message) => {
    if (!message.replyTo) return '';
    if (message.replyTo.senderId === BEMATCH_SYSTEM_ID) return 'BeMatch';
    return message.replyTo.senderId === user?.uid ? t('chat.you') : matchProfile?.name || '...';
  };

  const handleBlockUser = async () => {
    if (!user || !firestore || !chatId || isSystemChat || isMockChat) return;
    const matchRef = doc(firestore, 'matches', chatId);
    try {
      await updateDoc(matchRef, {
        isBlocked: true,
        blockedBy: user.uid,
      });
      toast({
        title: t('chat.toasts.userBlocked', { name: matchProfile?.name }),
      });
    } catch (error) {
      console.error("Error blocking user:", error);
      toast({
        variant: "destructive",
        title: t('chat.toasts.blockError'),
      });
    }
  };

  const handleUnblockUser = async () => {
    if (!user || !firestore || !chatId || isSystemChat || isMockChat) return;
    const matchRef = doc(firestore, 'matches', chatId);
    try {
      await updateDoc(matchRef, {
        isBlocked: false,
        blockedBy: null,
      });
      toast({
        title: t('chat.toasts.userUnblocked', { name: matchProfile?.name }),
      });
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast({
        variant: "destructive",
        title: t('chat.toasts.unblockError'),
      });
    }
  };

  const handleReportUser = () => {
    if (!matchProfile || isSystemChat || isMockChat) return;
    router.push(`/report/${matchProfile.id}?matchId=${chatId}`);
  };
  
  const handleHeaderClick = () => {
    if (matchProfile && !isSystemChat && !isMockChat) {
      setShowProfileDetails(true);
    }
  };

    const handleManageAccount = () => {
        const url = "https://bematch.netlify.app/settings/subscriptions";
        try {
            const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                throw new Error('Pop-up blocked');
            }
        } catch (e) {
            navigator.clipboard.writeText(url).then(() => {
                toast({
                    title: "Link Kopyalandı",
                    description: "Hesabınızı yönetmek için lütfen linki tarayıcınıza yapıştırın.",
                });
            }).catch(err => {
                 toast({
                    variant: 'destructive',
                    title: "Hata",
                    description: "Link kopyalanamadı. Lütfen tekrar deneyin.",
                });
            });
        }
    };

  if (isLoading || !user) {
    return <ChatLoader />;
  }

  const formatRecordingTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
    <div className="flex flex-col h-dvh overflow-hidden bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 border-b border-border bg-background/90 px-4 pt-[calc(env(safe-area-inset-top,0rem)+0.75rem)] pb-3 backdrop-blur-md">
        <Button variant="ghost" size="icon" className="-ml-2 text-foreground" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div
            className="flex-1 flex items-center gap-3 cursor-pointer"
            onClick={handleHeaderClick}
            >
            {!matchProfile ? (
            <>
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
                </div>
            </>
            ) : (
            <>
                <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src={matchProfile.avatarUrl} alt={matchProfile.name} className="object-cover" />
                <AvatarFallback>{matchProfile.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                        <h2 className="text-lg font-bold text-foreground">{matchProfile.name}</h2>
                        {isSystemChat && <BadgeCheck className="w-5 h-5 text-blue-500 fill-current" />}
                    </div>
                <p className="text-sm text-muted-foreground">{isSystemChat ? 'Official Account' : formatUserStatus(userStatus, t, locale)}</p>
                </div>
            </>
            )}
        </div>
        {!isSystemChat && !isMockChat && (
            <div className="flex items-center gap-1">
            <Popover>
                <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-foreground">
                    <MoreHorizontal className="w-5 h-5" />
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1">
                    <Button variant="ghost" className="w-full justify-start" onClick={handleBlockUser}>{t('chat.actions.block')}</Button>
                    <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleReportUser}>{t('chat.actions.report')}</Button>
                </PopoverContent>
            </Popover>
            </div>
        )}
      </header>

      <div 
        style={{ overflowAnchor: 'none' }}
        className="flex-1 space-y-1 overflow-y-auto px-2 sm:px-4 pt-[calc(env(safe-area-inset-top,0rem)+5rem)] pb-[calc(env(safe-area-inset-bottom,0rem)+8rem)]"
      >
        <AnimatePresence>
          {messages && messages.map((message) => {
            const isMe = message.senderId === user?.uid;
            const hasBeenOpened = !!user && !!message.isOpenedBy?.length;

            if (message.type === 'image' && message.isViewOnce && hasBeenOpened) {
                const iOpenedIt = message.isOpenedBy!.includes(user!.uid);
                
                // If I am the receiver and I opened it, show "You opened..."
                if (!isMe && iOpenedIt) {
                    return (
                        <motion.div key={message.id} className="w-full flex items-start">
                            <div className="w-fit max-w-[85%]">
                                <div className="italic p-3 px-4 rounded-2xl bg-secondary text-secondary-foreground/70">
                                    {t('chat.viewOnce.opened_by_them')}
                                </div>
                            </div>
                        </motion.div>
                    );
                }
                
                // If I am the sender and the other person opened it
                if (isMe) {
                     return (
                        <motion.div key={message.id} className="w-full flex justify-end">
                            <div className="w-fit max-w-[85%]">
                                <div className="italic p-3 px-4 rounded-2xl bg-secondary text-secondary-foreground/70">
                                    {t('chat.viewOnce.opened_by_me')}
                                </div>
                            </div>
                        </motion.div>
                    );
                }
            }
            
            return (
                <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    className={cn(
                        "group w-full flex flex-col",
                        isMe ? "items-end" : "items-start"
                    )}
                >
                    <div className="w-fit max-w-[85%]">
                         <div className={cn(
                          'break-words p-3 px-4 rounded-2xl relative flex flex-col',
                          isMe
                            ? 'rounded-tr-none bg-primary text-primary-foreground'
                            : 'rounded-tl-none bg-secondary text-secondary-foreground',
                          message.type === 'voice' && '!p-2',
                          message.type === 'image' && !message.isViewOnce && '!p-1 !bg-transparent',
                           (message.type === 'image' && message.isViewOnce) && 'cursor-pointer'
                        )}
                        onClick={
                          message.type === 'image' && message.isViewOnce && !isMe
                            ? () => handleViewOnceImage(message)
                            : undefined
                        }>
                            
                            {message.replyTo && (
                                <div className='p-2 mb-2 border-l-2 border-primary/50 bg-black/10 rounded flex items-center gap-2'>
                                    {message.replyTo.type === 'image' && message.replyTo.imageUrl ? (
                                        <div className="relative w-10 h-10 rounded overflow-hidden">
                                            <Image src={message.replyTo.imageUrl} alt={t('chat.repliedImageAlt')} fill className="object-cover" />
                                        </div>
                                    ) : null}
                                    <div className='flex-1 min-w-0'>
                                        <p className='font-bold text-sm'>{getRepliedMessageSenderName(message)}</p>
                                        <p className='text-sm opacity-80 line-clamp-2'>{message.replyTo.type === 'image' ? t('chat.lastMessagePhoto') : message.replyTo.text}</p>
                                    </div>
                                </div>
                            )}

                             {message.type === 'image' ? (
                                <>
                                    {message.isViewOnce ? (
                                      <div className="flex items-center gap-2">
                                          <Camera className="w-5 h-5"/>
                                          <span>{t('chat.viewOnce.title')}</span>
                                      </div>
                                    ) : (
                                        <div className="relative aspect-square w-64 h-64 rounded-xl overflow-hidden">
                                            <Image src={message.imageUrl!} alt={message.text || t('chat.sentImageAlt')} layout="fill" className="object-cover"/>
                                            {message.text && (
                                              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                                                  <p className="text-white text-sm">{message.text}</p>
                                              </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : message.type === 'voice' && message.audioUrl ? (
                                <VoiceMessagePlayer src={message.audioUrl} duration={message.audioDuration} />
                            ) : (
                                <p className="text-left whitespace-pre-wrap break-words">{message.text}</p>
                            )}

                             <div className={cn("flex items-center justify-end gap-1.5 self-end mt-1 text-xs", 
                                isMe ? "text-primary-foreground/70" : "text-secondary-foreground/70",
                                message.type === 'voice' && "text-primary-foreground/70",
                                (message.type === 'image' && isMe && !message.isViewOnce) && "text-white/80"
                            )}>
                                {message.isEdited && <span>{t('chat.edited')}</span>}
                                <span>{formatMessageTimestamp(message.timestamp, locale)}</span>
                                {isMe && message.senderId !== BEMATCH_SYSTEM_ID && !isMockChat && (
                                    <CheckCheck className={cn("w-4 h-4", message.isRead ? "text-blue-400" : "opacity-50")} />
                                )}
                            </div>
                        </div>
                        <div className={cn(
                            'relative -mt-2 z-20 flex gap-2',
                             isMe ? 'mr-2 justify-end' : 'ml-2 justify-start'
                        )}>
                             {message.reactions && Object.keys(message.reactions).length > 0 && (
                                <div className={cn("flex gap-1 z-10")}>
                                    {Object.entries(message.reactions).map(([emoji, userIds]) => (
                                        userIds.length > 0 &&
                                        <div key={emoji} className="flex items-center bg-background border rounded-full px-1.5 py-0.5 text-xs shadow-md">
                                            <span>{emoji}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className='invisible group-hover:visible'>
                                <MessageActions
                                    message={message}
                                    onReply={() => handleReplyMessage(message)}
                                    onEdit={() => handleEditMessage(message)}
                                    onDelete={() => setShowDeleteConfirm(message)}
                                    onReaction={(emoji) => handleReaction(message, emoji)}
                                    isMyMessage={isMe}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )
          })}
        </AnimatePresence>
        {(isOtherUserTyping || isAiResponding) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="flex items-start"
          >
            <div className="w-fit max-w-[85%]">
              <TypingIndicator />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background p-3 pb-[calc(env(safe-area-inset-bottom,0rem)+0.75rem)]">
        {isBlockedByMe ? (
          <div className="text-center p-3">
            <p className='text-muted-foreground text-sm'>{t('chat.blockedUser', {name: matchProfile?.name})}</p>
            <Button variant="link" onClick={handleUnblockUser} className="text-destructive">
              {t('chat.unblockPrompt')}
            </Button>
          </div>
        ) : isBlockedByOther ? (
          <div className="text-center text-muted-foreground text-sm p-3">
            <p>{t('chat.blockedByOther')}</p>
          </div>
        ) : isSystemChat ? (
            <div className="text-center text-muted-foreground text-sm p-3">
                <p>{t('chat.systemChatDisabled')}</p>
            </div>
        ) : chatLimitReached ? (
            <div className="flex items-center justify-center">
                 <Button onClick={handleManageAccount} className="w-full max-w-sm">
                    {t('chat.manageAccount')}
                </Button>
            </div>
        ) : isRecording ? (
            <div className="flex items-center gap-3 w-full">
                <Button size="icon" variant="ghost" className="rounded-full text-red-500 animate-pulse">
                    <Mic className="w-6 h-6"/>
                </Button>
                <div className='flex-1 text-center font-mono text-muted-foreground'>
                   {formatRecordingTime(recordingTime)}
                </div>
                 <Button size="icon" variant="destructive" className="rounded-full" onClick={stopRecording}>
                    <StopCircle className="w-6 h-6"/>
                </Button>
            </div>
        ) : (
        <form onSubmit={handleSendMessage} className="flex items-start gap-2">
            {!isMockChat && <input type="file" ref={imageInputRef} onChange={handleImageFileChange} className="hidden" accept="image/*" />}
            {!isMockChat && <Button type="button" size="icon" variant="ghost" className="text-foreground/70 hover:text-foreground mt-1.5" onClick={() => imageInputRef.current?.click()}>
                <Plus className="w-6 h-6" />
            </Button>}
             <div className="flex-1">
                 {(editingMessage || replyingToMessage) && (
                    <div className="flex items-center justify-between text-xs px-3 py-1 bg-secondary rounded-t-lg">
                        <div className='text-primary flex-1 min-w-0 flex items-center gap-2'>
                           {replyingToMessage?.type === 'image' && replyingToMessage.imageUrl ? (
                                <div className="relative w-8 h-8 rounded-md overflow-hidden">
                                  <Image src={replyingToMessage.imageUrl} alt={t('chat.repliedImageAlt')} fill className="object-cover" />
                                </div>
                            ) : null}
                            <div>
                                <p className="font-bold">{editingMessage ? t('chat.editingMessage') : `${t('chat.replyingTo')}: ${getRepliedMessageSenderName({replyTo: replyingToMessage!} as Message)}`}</p>
                                <p className="line-clamp-1 text-foreground/60">{editingMessage?.text || (replyingToMessage?.type === 'image' ? t('chat.lastMessagePhoto') : replyingToMessage?.text)}</p>
                            </div>
                        </div>
                        <button type="button" className="p-1" onClick={() => editingMessage ? cancelEdit() : cancelReply()}>
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
                 <div className={cn("flex items-center bg-secondary rounded-2xl px-3 transition-colors relative", {"rounded-t-none": editingMessage || replyingToMessage, "border-destructive border": isOverLimit })}>
                  <div className="relative w-full">
                    <AnimatePresence>
                       {!newMessage && (
                            <motion.div
                                key={currentPlaceholderIndex}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="absolute inset-y-0 flex items-start pt-3 pointer-events-none"
                            >
                            <span className="text-muted-foreground whitespace-pre-wrap">{placeholders[currentPlaceholderIndex]}</span>
                            </motion.div>
                       )}
                    </AnimatePresence>
                     <Textarea
                      ref={textareaRef}
                      placeholder=""
                      className="flex-1 resize-none border-none bg-transparent py-3 px-0 text-base text-secondary-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 max-h-24 relative z-10"
                      rows={1}
                      value={newMessage}
                      onChange={handleTyping}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                              handleSendMessage(e);
                          }
                           if (e.key === 'Escape' && (editingMessage || replyingToMessage)) {
                              editingMessage ? cancelEdit() : cancelReply();
                           }
                      }}
                      maxLength={CHARACTER_LIMIT + 1}
                  />
                  </div>
                </div>
                 <div className="text-right text-xs pt-1 pr-2 h-4">
                    {newMessage.length > 0 && (
                        <span className={cn('text-muted-foreground', { 'text-destructive': isOverLimit })}>
                            {newMessage.length} / {CHARACTER_LIMIT}
                        </span>
                    )}
                </div>
            </div>

            {newMessage.trim() ? (
                <Button type="submit" size="icon" className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 mt-auto" disabled={!newMessage.trim() || isOverLimit}>
                    <Send className="w-6 h-6" />
                </Button>
            ) : !isMockChat && (
                <Button type="button" size="icon" className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 mt-auto" onClick={startRecording} >
                   <Mic className="w-6 h-6" />
                </Button>
            )}
        </form>
        )}
      </footer>
    </div>
     <AlertDialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('chat.deleteModal.title')}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('chat.deleteModal.description')}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteConfirm(null)}>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteMessage} className="bg-destructive hover:bg-destructive/90">
                    <Trash2 className="w-4 h-4" />
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
     <Dialog open={!!imageToSend} onOpenChange={(open) => { if (!open) {setImageToSend(null); if(imageInputRef.current) imageInputRef.current.value = ''}}}>
        <DialogContent className="p-0 m-0 bg-black border-none w-screen h-dvh max-w-none flex flex-col text-white">
             <DialogHeader className="sr-only">
                <DialogTitle>{t('chat.imagePreview.title')}</DialogTitle>
                <DialogDescription>{t('chat.imagePreview.title')}</DialogDescription>
            </DialogHeader>

            <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-2 pt-[calc(env(safe-area-inset-top,0rem)+0.5rem)] bg-black/50 backdrop-blur-sm">
                <Button variant="ghost" size="icon" onClick={() => {setImageToSend(null); if(imageInputRef.current) imageInputRef.current.value = ''}}><X /></Button>
                <p className="font-bold text-lg">{matchProfile?.name}</p>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 flex items-center justify-center overflow-hidden">
            {imageToSend && (
              <Image 
                src={imageToSend.dataUrl}
                alt={t('chat.imagePreview.alt')}
                fill
                className="object-contain"
              />
            )}
          </div>

          <footer className="absolute bottom-0 left-0 right-0 p-3 pb-[calc(env(safe-area-inset-bottom,0rem)+0.75rem)] bg-black/50 backdrop-blur-sm space-y-3">
            <div className="flex items-center w-full gap-2">
               <Button 
                    variant={'ghost'}
                    size="icon" 
                    className={cn("rounded-full h-12 w-12")}
                    onClick={() => {
                        const newIsViewOnce = !isViewOnce;
                        setIsViewOnce(newIsViewOnce);
                        if (newIsViewOnce) {
                          toast({ title: t('chat.toasts.viewOnceSet') });
                        }
                    }}
                >
                    <ViewOnceIcon active={isViewOnce} />
              </Button>
              <Input
                placeholder={t('chat.imagePreview.captionPlaceholder')}
                className="bg-zinc-800 border-none text-white h-12 flex-1"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
              />
              <Button 
                size="icon" 
                className="h-12 w-12 rounded-full bg-destructive hover:bg-destructive/90"
                onClick={handleSendImage}
                disabled={isSendingImage}
              >
                {isSendingImage ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </Button>
            </div>
          </footer>
        </DialogContent>
      </Dialog>
      <Dialog open={!!viewOnceImage} onOpenChange={(open) => !open && setViewOnceImage(null)}>
        <DialogContent className="p-0 m-0 bg-black border-none w-screen h-dvh max-w-none flex flex-col items-center justify-center text-white" onClick={() => setViewOnceImage(null)}>
             <DialogHeader className="sr-only">
                <DialogTitle>{t('chat.viewOnce.title')}</DialogTitle>
                 <DialogDescription>{t('chat.viewOnce.title')}</DialogDescription>
            </DialogHeader>
            {viewOnceImage && (
              <Image src={viewOnceImage.imageUrl!} alt={t('chat.viewOnce.alt')} fill className="object-contain" />
            )}
        </DialogContent>
      </Dialog>
       <Sheet open={showProfileDetails} onOpenChange={setShowProfileDetails}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl flex flex-col p-0">
          {matchProfile && <ProfileDetails profile={matchProfile} />}
        </SheetContent>
      </Sheet>
    </>
  );
}
