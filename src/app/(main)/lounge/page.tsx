'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, getDoc, deleteDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { UserProfile, Match } from "@/lib/data";
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Circle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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

import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useUnreadMessages } from "@/hooks/use-unread-messages";


type ConversationPreview = {
    chatId: string;
    otherUser: { name: string; avatarUrl: string; };
    lastMessage: string;
    timestamp: any;
};

export default function LoungePage() {
  const { t, locale } = useLanguage();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const unreadMessagesByMatch = useUnreadMessages();

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const matchesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'matches'), where('users', 'array-contains', user.uid));
  }, [user, firestore]);

  const { data: matches, isLoading } = useCollection<Match>(matchesQuery);

  useEffect(() => {
    if (!matches || !user) {
        setConversations([]);
        return;
    };
    
    const convs = matches.map(match => {
        const otherUserId = match.users.find(uid => uid !== user.uid)!;
        const otherUserInfo = (match as any)[`user_info_${otherUserId}`];
        return {
            chatId: match.id,
            otherUser: {
                name: otherUserInfo?.name || 'Bilinmeyen Kullanıcı',
                avatarUrl: otherUserInfo?.avatarUrl || '',
            },
            lastMessage: match.lastMessage,
            timestamp: match.timestamp?.toDate(),
        };
    }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    setConversations(convs);

  }, [matches, user]);

  const handleDeleteConversation = async () => {
    if (!firestore || !chatToDelete) return;
    const matchDocRef = doc(firestore, 'matches', chatToDelete);
    
    deleteDoc(matchDocRef)
        .then(() => {
            setConversations(prev => prev.filter(c => c.chatId !== chatToDelete));
            toast({
                title: t('lounge.chatDeletedTitle'),
                description: t('lounge.chatDeletedDescription'),
            });
        })
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: matchDocRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setChatToDelete(null);
        });
  };

  return (
    <>
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Conversation List */}
      <div className="flex flex-col h-full">
          <header className="p-3 px-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-foreground">{t('lounge.conversations')}</h1>
             <Button variant="ghost" size="icon" onClick={() => setIsEditMode(!isEditMode)}>
                {isEditMode ? <X className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
            </Button>
          </header>
          <ScrollArea className="flex-1">
              <div className="flex flex-col">
                {isLoading ? (
                    <div className="p-4 space-y-4">
                        {Array.from({length: 3}).map((_, i) => (
                             <div key={i} className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                                <div className="space-y-2 flex-1">
                                <div className="h-4 bg-muted rounded w-3/4 animate-pulse"/>
                                <div className="h-4 bg-muted rounded w-1/2 animate-pulse"/>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : conversations.length > 0 ? conversations.map((convo) => (
                    <div key={convo.chatId} className="flex items-center">
                         <Link href={`/chat/${convo.chatId}`} className="flex-1">
                            <div className={cn(
                                "pl-3 py-3 flex items-center gap-3 cursor-pointer rounded-lg w-full border-b",
                                "hover:bg-secondary/50 transition-colors duration-200"
                            )}>
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={convo.otherUser.avatarUrl} alt={convo.otherUser.name} className="object-cover"/>
                                    <AvatarFallback>{convo.otherUser.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-foreground text-md truncate">{convo.otherUser.name}</p>
                                      {!!unreadMessagesByMatch[convo.chatId] && (
                                          <Circle className="w-2.5 h-2.5 text-blue-500 fill-current" />
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">{convo.lastMessage || t('lounge.startChatting')}</p>
                                </div>
                                
                                <div className="text-xs text-muted-foreground ml-auto pl-2 text-right whitespace-normal">
                                    {convo.timestamp && formatDistanceToNow(convo.timestamp, { addSuffix: true, locale: locale === 'tr' ? tr : enUS })}
                                </div>
                            </div>
                        </Link>
                         <AnimatePresence>
                            {isEditMode && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                >
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 mx-2"
                                        onClick={() => setChatToDelete(convo.chatId)}
                                    >
                                        <Trash2 className="w-5 h-5"/>
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-8">
                        <p className="text-muted-foreground">{t('lounge.noConversations')}</p>
                    </div>
                )}
              </div>
          </ScrollArea>
      </div>
    </div>
    <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('lounge.deleteChatConfirmationTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('lounge.deleteChatConfirmationDescription')}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConversation} className="bg-destructive hover:bg-destructive/90">
                    {t('common.delete')}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
