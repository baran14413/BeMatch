'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence, animate } from 'framer-motion';
import { X, Star, Heart, Rewind } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useIsMobile } from '@/hooks/use-mobile';
import ProfileCard from '@/components/discover/profile-card';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, where, doc, writeBatch, getDoc, serverTimestamp, getDocs, updateDoc, Timestamp, limit, orderBy } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import ProfileDetails from '@/components/discover/profile-details';
import TutorialOverlay from '@/components/discover/tutorial-overlay';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { isToday, isFuture } from 'date-fns';
import ItIsAMatch from '@/components/discover/it-is-a-match';
import { generateAiIcebreaker } from '@/ai/flows/generate-ai-icebreaker';
import { mockProfiles } from '@/lib/mock-profiles';


type SwipeDirection = 'left' | 'right' | 'up';
type SwipeType = 'like' | 'nope' | 'superlike';

const MAX_VISIBLE_CARDS = 3;
const DAILY_REWIND_LIMIT = 3;

// Haversine formula to calculate distance between two lat/lon points
const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return undefined;
  }
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance);
};


const SwipeableCard = ({
  profile,
  onSwipe,
  onShowDetails,
  isTop,
}: {
  profile: UserProfile;
  onSwipe: (direction: SwipeDirection, triggeredByButton?: boolean) => void;
  onShowDetails: () => void;
  isTop: boolean;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const likeOpacity = useTransform(x, [10, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -10], [1, 0]);
  const superlikeOpacity = useTransform(y, [-100, -10], [1, 0]);

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeThreshold = 100;
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };
    
    if (Math.abs(offset.y) > Math.abs(offset.x) && offset.y < -swipeThreshold * 1.5) {
        onSwipe('up');
        return;
    }

    if (offset.x > swipeThreshold || swipePower(offset.x, velocity.x) > 10000) {
      onSwipe('right');
    } else if (offset.x < -swipeThreshold || swipePower(offset.x, velocity.x) < -10000) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      className="absolute w-full h-full"
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.35}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate, cursor: isTop ? 'grab' : 'auto' }}
      whileDrag={{ cursor: 'grabbing' }}
    >
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-12 left-6 z-10 p-4 bg-black/30 rounded-full"
      >
        <Heart className="w-12 h-12 text-green-400" fill="currentColor" />
      </motion.div>

      <motion.div
        style={{ opacity: nopeOpacity }}
        className="absolute top-12 right-6 z-10 p-4 bg-black/30 rounded-full"
      >
        <X className="w-12 h-12 text-red-500" strokeWidth={3} />
      </motion.div>
      
       <motion.div
        style={{ opacity: superlikeOpacity }}
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 p-4 bg-black/30 rounded-full"
      >
        <Star className="w-12 h-12 text-blue-400" fill="currentColor" />
      </motion.div>

      <ProfileCard profile={profile} onShowDetails={onShowDetails} isTopCard={isTop}/>
    </motion.div>
  );
};

const DesktopProfileSkeleton = () => (
    <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-[500px] w-full rounded-2xl" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    </div>
)

const NoMoreProfiles = ({ onReset }: { onReset: () => void }) => {
    const { t } = useLanguage();
    return (
        <div className="text-center">
            <p className="text-muted-foreground">{t('discover.noMoreProfiles')}</p>
            <Button onClick={onReset} className="mt-4">
                {t('common.tryAgain')}
            </Button>
        </div>
    );
};


export default function DiscoverPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { t, locale } = useLanguage();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const router = useRouter();
  
  const [detailsProfile, setDetailsProfile] = useState<UserProfile | null>(null);
  const [newlyMatchedProfile, setNewlyMatchedProfile] = useState<UserProfile | null>(null);

  const [profileIndex, setProfileIndex] = useState(0);
  const [visibleStack, setVisibleStack] = useState<UserProfile[]>([]);
  const [history, setHistory] = useState<{profile: UserProfile, type: SwipeType}[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);

  // Fetch current user's profile to get their coordinates and preferences
  const currentUserDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: currentUserProfile } = useDoc<UserProfile>(currentUserDocRef);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'users'),
        limit(50)
    );
  }, [firestore, user]);


  const { data: profiles, isLoading: isLoadingProfiles } = useCollection<UserProfile>(usersQuery);

  const filteredAndSortedProfiles = useMemo(() => {
    // Combine real profiles from Firestore with mock profiles
    const combinedProfiles = [...(profiles || []), ...mockProfiles];

    if (!currentUserProfile || !user) return [];

    const {
        ageRange = [18, 55],
        globalMode = false,
        maxDistance = 150,
        interestedIn,
        latitude: currentLat,
        longitude: currentLon,
    } = currentUserProfile;

    const [minAge, maxAge] = ageRange;
    
    // Ensure uniqueness, giving priority to real profiles over mock profiles with the same ID
    const uniqueProfiles = Array.from(new Map(combinedProfiles.map(p => [p.id, p])).values());

    return uniqueProfiles
      .filter(p => {
        const isNotSelf = p.id !== user.uid;
        // For mock profiles, age/interest checks can be bypassed if desired
        if (p.isSystemAccount) return isNotSelf;

        const isInAgeRange = p.age >= minAge && p.age <= maxAge;
        
        let interestMatch = true;
        if (interestedIn && interestedIn !== 'everyone') {
            interestMatch = p.gender === interestedIn;
        }

        const hasAvatar = p.avatarUrl && p.avatarUrl.trim() !== '';

        return isNotSelf && isInAgeRange && interestMatch && hasAvatar;
      })
      .map(p => {
        // Don't calculate distance for mock profiles unless they have lat/lon
        const distance = p.latitude && p.longitude ? getDistanceInKm(currentLat!, currentLon!, p.latitude!, p.longitude!) : undefined;
        const isBoosted = p.boostExpiresAt && isFuture((p.boostExpiresAt as Timestamp).toDate());
        return { ...p, distance, isBoosted };
      })
      .filter(p => {
          if (p.isSystemAccount) return true; // Always include mock accounts
          if (globalMode || p.distance === undefined) {
              return true;
          }
          return p.distance <= maxDistance;
      })
      .sort((a, b) => {
        // Prioritize mock profiles to appear first if needed, or mix them in
        if (a.isSystemAccount && !b.isSystemAccount) return -1;
        if (!a.isSystemAccount && b.isSystemAccount) return 1;

        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
  }, [profiles, currentUserProfile, user]);

  
  useEffect(() => {
    if (filteredAndSortedProfiles.length > 0) {
      const initialStack = filteredAndSortedProfiles.slice(profileIndex, profileIndex + MAX_VISIBLE_CARDS).reverse();
      setVisibleStack(initialStack);
    } else {
      setVisibleStack([]);
    }
  }, [filteredAndSortedProfiles, profileIndex]);

  useEffect(() => {
    if (isMobile && profiles && profiles.length > 0) {
      const hasSeenTutorial = localStorage.getItem('hasSeenSwipeTutorial');
      if (!hasSeenTutorial) {
        setShowTutorial(true);
        const timer = setTimeout(() => {
          setShowTutorial(false);
          localStorage.setItem('hasSeenSwipeTutorial', 'true');
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [isMobile, profiles]);
  
  const handleReset = () => {
    setProfileIndex(0);
    setHistory([]);
  };

  const handleRewind = async () => {
    if (history.length === 0 || !currentUserProfile || !currentUserDocRef) return;

    const isPremium = !!currentUserProfile.premiumTier;
    
    const lastRewindDate = currentUserProfile.lastRewindAt?.toDate();
    const rewindsToday = (lastRewindDate && isToday(lastRewindDate)) ? (currentUserProfile.rewindCount || 0) : 0;

    if (!isPremium && rewindsToday >= DAILY_REWIND_LIMIT) {
        toast({
            title: "Günlük Geri Alma Hakkı Doldu",
            description: "Sınırsız geri alma için Gold'a yükselt!",
            action: <Button onClick={() => router.push('/settings/subscriptions')}>Yükselt</Button>
        });
        return;
    }

    const lastAction = history[0];
    setHistory(prev => prev.slice(1));
    setProfileIndex(prev => prev - 1);

    if (!isPremium) {
        const newRewindCount = rewindsToday + 1;
        await updateDoc(currentUserDocRef, {
            rewindCount: newRewindCount,
            lastRewindAt: serverTimestamp(),
        });
    }

    toast({
        title: "Geri Alındı!",
        description: `${lastAction.profile.name} profiline geri döndün.`
    })

  };

  const handleSwipe = useCallback(async (direction: SwipeDirection, triggeredByButton: boolean = false) => {
    if (visibleStack.length === 0 || !user || !firestore || !currentUserProfile) return;

    const swipedProfile = visibleStack[visibleStack.length - 1];
    const swipeType: SwipeType = direction === 'right' ? 'like' : direction === 'up' ? 'superlike' : 'nope';

    setHistory(prev => [{profile: swipedProfile, type: swipeType}, ...prev]);
    setProfileIndex(prev => prev + 1);

    // If it's a mock profile and the user liked them, initiate an AI chat.
    if (swipedProfile.isSystemAccount && (swipeType === 'like' || swipeType === 'superlike')) {
        try {
            // Construct profile string safely, handling undefined fields
            const bioPart = currentUserProfile.bio ? `, Bio: ${currentUserProfile.bio}` : '';
            const interestsPart = (currentUserProfile.interests && currentUserProfile.interests.length > 0) ? `, Interests: ${currentUserProfile.interests.join(', ')}` : '';
            const userProfileString = `Name: ${currentUserProfile.name}, Age: ${currentUserProfile.age}${bioPart}${interestsPart}`;

            const result = await generateAiIcebreaker({
                userProfile: userProfileString,
                mockProfileName: swipedProfile.name,
                language: locale,
            });

            if (result.icebreaker) {
                const matchId = [currentUserProfile.id, swipedProfile.id].sort().join('_');
                const matchRef = doc(firestore, 'matches', matchId);
                const messageRef = doc(collection(firestore, 'matches', matchId, 'messages'));

                const batch = writeBatch(firestore);
                
                const userInfoKey = `user_info_${currentUserProfile.id}`;
                const swipedInfoKey = `user_info_${swipedProfile.id}`;

                batch.set(matchRef, {
                    users: [currentUserProfile.id, swipedProfile.id],
                    timestamp: serverTimestamp(),
                    lastMessage: result.icebreaker,
                    [userInfoKey]: {
                        name: currentUserProfile.name,
                        avatarUrl: currentUserProfile.avatarUrl,
                    },
                    [swipedInfoKey]: {
                        name: swipedProfile.name,
                        avatarUrl: swipedProfile.avatarUrl,
                    },
                });

                batch.set(messageRef, {
                    senderId: swipedProfile.id,
                    text: result.icebreaker,
                    timestamp: serverTimestamp(),
                    isRead: false,
                    isAiGenerated: true,
                });

                await batch.commit();
                toast({
                    title: `Yeni Mesaj: ${swipedProfile.name}`,
                    description: 'Sohbetler sayfasına göz at.',
                });
            }
        } catch (error) {
            console.error(`Failed to send message from mock profile ${swipedProfile.name}:`, error);
            toast({
                variant: 'destructive',
                title: t('lounge.ai.errorTitle'),
                description: t('lounge.ai.errorDescription'),
            })
        }
        return;
    }
    
    // Regular swipe logic for real users
    if (swipeType === 'nope') return;

    if (direction === 'up' && !currentUserProfile.premiumTier) {
        toast({
            title: "Süper Beğeni İçin Yükselt!",
            description: "Süper Beğeni göndermek ve daha fazla dikkat çekmek için Gold'a yükselt.",
            action: <Button onClick={() => router.push('/settings/subscriptions')}>Yükselt</Button>
        });
        return;
    }

    const swipeData = {
        type: swipeType,
        timestamp: serverTimestamp(),
        likerId: currentUserProfile.id,
        likerName: currentUserProfile.name,
        likerAvatar: currentUserProfile.avatarUrl,
    };
    
    const targetUserLikedByRef = doc(firestore, 'users', swipedProfile.id, 'likedBy', user.uid);
    const swipedUserLikeDocRef = doc(firestore, 'users', user.uid, 'likedBy', swipedProfile.id);
    
    const batch = writeBatch(firestore);
    batch.set(targetUserLikedByRef, swipeData);

    getDoc(swipedUserLikeDocRef)
      .then(swipedUserLikeDoc => {
        if (swipedUserLikeDoc.exists()) {
            const matchId = [user.uid, swipedProfile.id].sort().join('_');
            const matchRef = doc(firestore, 'matches', matchId);
            
            const userInfoKey = `user_info_${user.uid}`;
            const swipedInfoKey = `user_info_${swipedProfile.id}`;

            const matchData = {
                users: [user.uid, swipedProfile.id],
                timestamp: serverTimestamp(),
                lastMessage: t('discover.newMatch'),
                [userInfoKey]: {
                    name: currentUserProfile.name,
                    avatarUrl: currentUserProfile.avatarUrl,
                },
                [swipedInfoKey]: {
                    name: swipedProfile.name,
                    avatarUrl: swipedProfile.avatarUrl,
                },
            };
            batch.set(matchRef, matchData);
            setNewlyMatchedProfile(swipedProfile);
        }

        batch.commit().catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `batch write`, // Placeholder path for batch
                operation: 'write',
            }));
        });

      })
      .catch(serverError => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: swipedUserLikeDocRef.path,
              operation: 'get',
          }));
      });

  }, [visibleStack, user, firestore, currentUserProfile, toast, t, router, locale]);

  if (isMobile === undefined) {
    return null;
  }

  const isLoading = isUserLoading || isLoadingProfiles || !currentUserProfile;

  if (isLoading) {
     return (
         <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-black md:p-8">
            {isMobile ? 
                <div className="w-full max-w-sm h-full relative flex items-center justify-center">
                     <Skeleton className="w-full h-full rounded-2xl" />
                </div>
                : 
                <div className='flex flex-col gap-8'>
                    <DesktopProfileSkeleton />
                </div>
            }
         </div>
     )
  }

  return (
    <>
    {newlyMatchedProfile && currentUserProfile && (
        <ItIsAMatch 
            currentUser={currentUserProfile}
            matchedUser={newlyMatchedProfile}
            onContinue={() => setNewlyMatchedProfile(null)}
        />
    )}
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black pb-[env(safe-area-inset-bottom,0rem)]">
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="w-full max-w-sm h-full relative">
          <AnimatePresence>
            {visibleStack.length > 0 ? (
              <>
                {visibleStack.map((profile, index) => {
                  const isTop = index === visibleStack.length - 1;
                  const stackIndex = visibleStack.length - 1 - index;
                  return (
                    <motion.div
                      key={profile.id}
                      initial={{
                        y: 0,
                        scale: 1 - stackIndex * 0.05,
                        opacity: index === visibleStack.length - 1 ? 1 : 0
                      }}
                      animate={{
                        y: stackIndex * -10,
                        scale: 1 - stackIndex * 0.05,
                        opacity: stackIndex < MAX_VISIBLE_CARDS -1 ? 1 : (isTop ? 1 : 0),
                      }}
                      exit={{
                        x: profile.id === visibleStack[visibleStack.length - 1].id ? (history[0]?.type === 'like' || history[0]?.type === 'superlike' ? 300 : -300) : 0,
                        opacity: 0,
                        transition: { duration: 0.3 }
                      }}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        zIndex: index,
                      }}
                    >
                      <SwipeableCard
                        profile={profile}
                        onSwipe={(direction) => handleSwipe(direction)}
                        onShowDetails={() => setDetailsProfile(profile)}
                        isTop={isTop}
                      />
                    </motion.div>
                  );
                })}
                {showTutorial && <TutorialOverlay />}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <NoMoreProfiles onReset={handleReset} />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <Sheet open={!!detailsProfile} onOpenChange={(isOpen) => !isOpen && setDetailsProfile(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl flex flex-col">
            <SheetHeader className="pt-[calc(env(safe-area-inset-top,0rem)+0.75rem)]">
                <SheetTitle className="sr-only">{t('discover.profileDetailsTitle')}</SheetTitle>
            </SheetHeader>
            {detailsProfile && <ProfileDetails profile={detailsProfile} />}
        </SheetContent>
      </Sheet>
    </div>
    </>
  );
}
