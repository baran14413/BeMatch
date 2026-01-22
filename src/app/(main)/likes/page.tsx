'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from "@/context/language-context";
import { Card } from "@/components/ui/card";
import { Star, Heart, MessageSquare, Crown, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, getDoc, query, where, addDoc, serverTimestamp, writeBatch, deleteDoc } from 'firebase/firestore';
import type { UserProfile, Swipe } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import ProfileDetails from '@/components/discover/profile-details';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { useTwa } from '@/hooks/use-twa';
import Link from 'next/link';


const LikesGridSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[3/4] rounded-lg" />
        ))}
    </div>
);

const BlurredLikesOverlay = () => {
    const { t } = useLanguage();
    const { toast } = useToast();
    const manageAccountUrl = "https://bematch.netlify.app/settings/subscriptions";

    const handleManageAccount = () => {
        try {
            const newWindow = window.open(manageAccountUrl, '_blank', 'noopener,noreferrer');
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                 // If the popup was blocked, fall back to clipboard
                throw new Error('Pop-up blocked');
            }
        } catch (e) {
            navigator.clipboard.writeText(manageAccountUrl).then(() => {
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

    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center bg-black/60 backdrop-blur-md">
            <Crown className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-xl font-bold text-white">Seni Beğenenleri Gör</h3>
            <p className="text-white/80 mt-2 mb-6">Mevcut plan detaylarını görüntülemek veya değiştirmek için hesabını yönetebilirsin.</p>
            <Button onClick={handleManageAccount} className={cn(buttonVariants({ variant: 'destructive', className: "font-bold" }))}>
                <LinkIcon className="w-4 h-4 mr-2" />
                {t('walletPage.manageSubWeb')}
            </Button>
        </div>
    );
};

export default function LikesGrid() {
    const { t } = useLanguage();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const [selectedProfile, setSelectedProfile] = useState<Swipe | null>(null);

    const currentUserDocRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: currentUserProfile, isLoading: isLoadingCurrentUser } = useDoc<UserProfile>(currentUserDocRef);
    const isPremium = !!currentUserProfile?.premiumTier;

    // This query is now optimized. It fetches denormalized data, avoiding N+1 reads.
    const likedByQuery = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, 'users', user.uid, 'likedBy');
    }, [user, firestore]);

    const { data: likes, isLoading: isLoadingLikes } = useCollection<Swipe>(likedByQuery);

    // Mark likes as "viewed" when the user visits this page
    useEffect(() => {
        localStorage.setItem('lastLikesViewTimestamp', new Date().toISOString());
        // Dispatch a custom event so other components (like the header) can react immediately
        window.dispatchEvent(new CustomEvent('likes-viewed'));
    }, []);


     const handleStartChat = async (likerProfile: Swipe) => {
        if (!user || !firestore || !currentUserProfile) return;

        const currentUserId = user.uid;
        const targetUserId = likerProfile.id; // The liker's ID is the document ID

        if (!targetUserId) {
            console.error("Critical error: Liker profile ID is missing.", likerProfile);
            toast({
                variant: "destructive",
                title: "Sohbet Başlatılamadı",
                description: "Eşleşme bilgileri eksik. Lütfen tekrar deneyin.",
            });
            return;
        }
        
        const chatId = [currentUserId, targetUserId].sort().join('_');
        const matchRef = doc(firestore, 'matches', chatId);

        try {
            const matchDoc = await getDoc(matchRef);

            if (matchDoc.exists()) {
                router.push(`/chat/${chatId}`);
            } else {
                const batch = writeBatch(firestore);
                
                const safeMatchData = {
                    users: [currentUserId, targetUserId],
                    timestamp: serverTimestamp(),
                    lastMessage: '',
                     [`user_info_${currentUserId}`]: {
                        name: currentUserProfile.name || "Bilinmeyen Kullanıcı",
                        avatarUrl: currentUserProfile.avatarUrl || null,
                    },
                    [`user_info_${targetUserId}`]: {
                        name: likerProfile.likerName || "Bilinmeyen Kullanıcı",
                        avatarUrl: likerProfile.likerAvatar || null,
                    },
                };
                
                batch.set(matchRef, safeMatchData);

                const likedByRef = doc(firestore, 'users', currentUserId, 'likedBy', targetUserId);
                batch.delete(likedByRef);

                await batch.commit();
                router.push(`/chat/${chatId}`);
            }
        } catch (error) {
             console.error("Error starting chat from likes:", error);
             const permissionError = new FirestorePermissionError({
                path: matchRef.path,
                operation: 'get', // The most likely initial failure point
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    };

    const isLoading = isUserLoading || isLoadingCurrentUser || isLoadingLikes;
    
    if (isLoading) {
        return <div className="h-dvh bg-background"><LikesGridSkeleton /></div>;
    }
    
    const validLikes = likes?.filter(like => like.likerName && like.likerAvatar) || [];

    if (validLikes.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-8 bg-background">
                <p className="text-muted-foreground">{t('likes.noLikesYet')}</p>
            </div>
        )
    }
    
    return (
        <div className="h-dvh bg-background">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 relative h-full">
                {!isPremium && <BlurredLikesOverlay />}
                {validLikes.map((like) => (
                    <Card 
                        key={like.id} 
                        className={cn("aspect-[3/4] rounded-lg overflow-hidden relative group", !isPremium && "blur-md")}
                    >
                       <div className={cn("cursor-pointer w-full h-full", !isPremium && "pointer-events-none")}>
                         {like.likerAvatar && <Image src={like.likerAvatar} alt={like.likerName} fill className="object-cover"/>}
                         
                         <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                            <p className="text-white font-bold truncate">{like.likerName}</p>
                         </div>

                         <div className={cn("absolute top-1.5 right-1.5 p-1.5 rounded-full",
                           like.type === 'superlike' && "bg-blue-500/80",
                           like.type === 'like' && "bg-destructive/80",
                         )}>
                          {like.type === 'superlike' && <Star className="w-4 h-4 text-white fill-white"/>}
                          {like.type === 'like' && <Heart className="w-4 h-4 text-white fill-white"/>}
                         </div>
                       </div>
                       {isPremium && (
                           <Button onClick={() => handleStartChat(like)} className="absolute bottom-4 right-4 rounded-full h-12 w-12 bg-green-500 hover:bg-green-600">
                                <MessageSquare className="w-6 h-6 text-white" />
                            </Button>
                       )}
                    </Card>
                ))}
            </div>

            <Sheet open={!!selectedProfile} onOpenChange={(isOpen) => !isOpen && setSelectedProfile(null)}>
                <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl flex flex-col p-0">
                   {selectedProfile && (
                       <>
                         <SheetHeader className="sr-only">
                           <SheetTitle>{t('discover.profileDetailsTitle')}</SheetTitle>
                           <SheetDescription>{t('discover.profileDetailsDescription', { name: selectedProfile.likerName })}</SheetDescription>
                         </SheetHeader>
                         {/* This would require fetching the full profile which is what we want to avoid.
                             A full implementation would need to decide if a full profile view is needed here,
                             or if the card is enough. For now, this is disabled. */}
                         {/* <div className="flex-1 overflow-hidden">
                           <ProfileDetails profile={selectedProfile} />
                         </div> */}
                       </>
                   )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
