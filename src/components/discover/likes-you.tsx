'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from "@/context/language-context";
import { Card } from "../ui/card";
import { Star, Heart, MessageSquare, Crown } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, getDoc, getDocs, query, where, addDoc, serverTimestamp, writeBatch, deleteDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import ProfileDetails from './profile-details';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type LikeInfo = {
    id: string; // liker's ID
    type: 'like' | 'superlike';
};

type LikedByProfile = UserProfile & {
    likeType: 'like' | 'superlike';
};

const LikesGridSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[3/4] rounded-lg" />
        ))}
    </div>
);

const BlurredLikesOverlay = () => {
    const { t } = useLanguage();
    const router = useRouter();
    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center bg-black/60 backdrop-blur-md">
            <Crown className="w-16 h-16 text-yellow-400 mb-4" />
            <h3 className="text-xl font-bold text-white">Seni Beğenenleri Gör</h3>
            <p className="text-white/80 mt-2 mb-6">BeMatch Gold'a yükselterek seni beğenen herkesi anında gör ve eşleşme şansını artır.</p>
            <Button onClick={() => router.push('/settings/subscriptions')} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                Gold'u Keşfet
            </Button>
        </div>
    );
};

export default function LikesGrid() {
    const { t } = useLanguage();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [likedByProfiles, setLikedByProfiles] = useState<LikedByProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState<LikedByProfile | null>(null);

    const currentUserDocRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: currentUserProfile, isLoading: isLoadingCurrentUser } = useDoc<UserProfile>(currentUserDocRef);
    const isPremium = !!currentUserProfile?.premiumTier;

    const likedByQuery = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, 'users', user.uid, 'likedBy');
    }, [user, firestore]);

    const { data: likes, isLoading: isLoadingLikes } = useCollection<LikeInfo>(likedByQuery);

     const handleStartChat = async (profile: LikedByProfile) => {
        if (!user || !firestore) return;

        const currentUserId = user.uid;
        const targetUserId = profile.id;
        const chatId = [currentUserId, targetUserId].sort().join('_');
        
        const matchesRef = collection(firestore, 'matches');
        
        try {
            const q = query(matchesRef, where('users', 'array-contains', currentUserId));
            const querySnapshot = await getDocs(q);
            let existingMatchId: string | null = null;

            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.users.includes(targetUserId)) {
                    existingMatchId = doc.id;
                }
            });

            if (existingMatchId) {
                router.push(`/chat/${existingMatchId}`);
            } else {
                const batch = writeBatch(firestore);
                const matchRef = doc(matchesRef, chatId);
                const matchData = {
                    users: [currentUserId, targetUserId],
                    timestamp: serverTimestamp(),
                    lastMessage: ''
                };
                batch.set(matchRef, matchData);

                const likedByRef = doc(firestore, 'users', currentUserId, 'likedBy', targetUserId);
                batch.delete(likedByRef);

                await batch.commit().catch(serverError => {
                    const permissionError = new FirestorePermissionError({
                        path: matchRef.path, // Most likely failure path
                        operation: 'create',
                        requestResourceData: matchData,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                    throw permissionError;
                });

                router.push(`/chat/${chatId}`);
            }
        } catch (error) {
             if (!(error instanceof FirestorePermissionError)) {
                 const permissionError = new FirestorePermissionError({
                    path: `matches`,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
            }
        }
    };


    useEffect(() => {
        const fetchProfiles = async () => {
            if (!likes || !firestore) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const profilePromises = likes.map(async (like) => {
                    const userDocRef = doc(firestore, 'users', like.id);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        return { 
                            ...(userDoc.data() as UserProfile), 
                            id: userDoc.id, 
                            likeType: like.type 
                        };
                    }
                    return null;
                });

                const profiles = (await Promise.all(profilePromises)).filter(p => p !== null) as LikedByProfile[];
                setLikedByProfiles(profiles);
            } catch (error) {
                console.error("Error fetching liked by profiles: ", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchProfiles();

    }, [likes, firestore]);

    
    if (isLoading || isUserLoading || isLoadingCurrentUser) {
        return <LikesGridSkeleton />;
    }

    if (likedByProfiles.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-8">
                <p className="text-muted-foreground">{t('likes.noLikesYet')}</p>
            </div>
        )
    }
    
    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 relative">
                {!isPremium && <BlurredLikesOverlay />}
                {likedByProfiles.map((like) => (
                    <Card 
                        key={like.id} 
                        className={cn("aspect-[3/4] rounded-lg overflow-hidden relative group", !isPremium && "blur-md")}
                    >
                       <div onClick={() => isPremium && setSelectedProfile(like)} className={cn("cursor-pointer w-full h-full", !isPremium && "pointer-events-none")}>
                         {like.avatarUrl && <Image src={like.avatarUrl} alt={like.name} fill className="object-cover"/>}
                         
                         <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                            <p className="text-white font-bold truncate">{like.name}</p>
                         </div>

                         <div className={cn("absolute top-1.5 right-1.5 p-1.5 rounded-full",
                           like.likeType === 'superlike' && "bg-blue-500/80",
                           like.likeType === 'like' && "bg-red-500/80",
                         )}>
                          {like.likeType === 'superlike' && <Star className="w-4 h-4 text-white fill-white"/>}
                          {like.likeType === 'like' && <Heart className="w-4 h-4 text-white fill-white"/>}
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
                           <SheetDescription>{t('discover.profileDetailsDescription', { name: selectedProfile.name })}</SheetDescription>
                         </SheetHeader>
                         <div className="flex-1 overflow-hidden">
                           <ProfileDetails profile={selectedProfile} />
                         </div>
                       </>
                   )}
                </SheetContent>
            </Sheet>
        </>
    )
}
