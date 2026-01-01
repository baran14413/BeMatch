
'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { X, Star, Heart, Rewind, Sparkles, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useIsMobile } from '@/hooks/use-mobile';
import ProfileCard from '@/components/discover/profile-card';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, where, doc, writeBatch, getDoc, serverTimestamp, getDocs, updateDoc, Timestamp, limit, orderBy } from 'firebase/firestore';
import type { UserProfile, SwipeItem, UserItem, AdItem, PersonalityTrait } from '@/lib/data';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import ProfileDetails from '@/components/discover/profile-details';
import CompatibilityRadar from '@/components/profile/compatibility-radar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Card, CardContent } from '@/components/ui/card';


type SwipeDirection = 'left' | 'right' | 'up';
type SwipeType = 'like' | 'nope' | 'superlike';

const MAX_VISIBLE_CARDS = 3;
const DAILY_REWIND_LIMIT = 3;
const AD_FREQUENCY = 3; // Show an ad every 3 user profiles

// --- Ad Injection Logic ---
const injectAds = (profiles: UserProfile[]): SwipeItem[] => {
  const items: SwipeItem[] = [];
  let adCounter = 1;
  profiles.forEach((profile, index) => {
    items.push({ type: 'user', user: profile });
    if ((index + 1) % AD_FREQUENCY === 0) {
      items.push({ type: 'ad', id: `ad-${adCounter++}` });
    }
  });
  return items;
};

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


const AdBanner = () => {
    useEffect(() => {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error(err);
        }
    }, []);

    return (
        <ins className="adsbygoogle"
             style={{ display: "block" }}
             data-ad-client="ca-pub-9707142962495660"
             data-ad-slot="YOUR_AD_SLOT_ID" // TODO: Replace with your ad slot ID
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
    );
};

const AdCard = ({ item }: { item: AdItem }) => {
  return (
    <Card className="w-full h-full bg-muted flex flex-col items-center justify-center p-4">
        <CardContent className='w-full p-0'>
             <div className="text-center text-muted-foreground mb-4">
                <p className="text-xs font-semibold uppercase">Advertisement</p>
            </div>
            {/* The actual ad container */}
            <div className="w-full h-64 bg-background rounded-lg flex items-center justify-center">
                 <AdBanner />
            </div>
        </CardContent>
    </Card>
  );
};


const SwipeableCard = ({
  item,
  onSwipe,
  onShowDetails,
  onShowCompatibility,
  isTop,
}: {
  item: SwipeItem;
  onSwipe: (direction: SwipeDirection, triggeredByButton?: boolean) => void;
  onShowDetails: () => void;
  onShowCompatibility: () => void;
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
    
    // Ads can't be superliked
    if (item.type === 'user' && Math.abs(offset.y) > Math.abs(offset.x) && offset.y < -swipeThreshold * 1.5) {
        onSwipe('up');
        return;
    }

    if (offset.x > swipeThreshold || swipePower(offset.x, velocity.x) > 10000) {
      onSwipe('right');
    } else if (offset.x < -swipeThreshold || swipePower(offset.x, velocity.x) < -10000) {
      onSwipe('left');
    }
  };

  // Both user and ad cards are draggable when on top
  const isDraggable = isTop;


  return (
    <motion.div
      className="absolute w-full h-full"
      drag={isDraggable}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.35}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate, cursor: isDraggable ? 'grab' : 'auto' }}
      whileDrag={{ cursor: 'grabbing' }}
    >
      {item.type === 'user' ? (
          <>
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

            <ProfileCard 
                profile={item.user} 
                onShowDetails={onShowDetails}
                onShowCompatibility={onShowCompatibility}
                isTopCard={isTop}
            />
        </>
      ) : (
          <AdCard item={item} />
      )}
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

// Dummy data for compatibility chart
const createDummyTraits = (): PersonalityTrait[] => {
  const traits = ["Macera", "Mizah", "Duygusallık", "Dışadönüklük", "Planlılık"];
  return traits.map(trait => ({
    trait,
    userScore: Math.floor(Math.random() * 60) + 40, // Score between 40-100
    viewerScore: 0, // This will be filled for the other user
  }));
};


export default function DiscoverPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { t, locale } = useLanguage();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const router = useRouter();
  
  const [detailsProfile, setDetailsProfile] = useState<UserProfile | null>(null);
  const [compatibilityProfile, setCompatibilityProfile] = useState<UserProfile | null>(null);
  const [newlyMatchedProfile, setNewlyMatchedProfile] = useState<UserProfile | null>(null);

  const [profileIndex, setProfileIndex] = useState(0);
  const [visibleStack, setVisibleStack] = useState<SwipeItem[]>([]);
  const [history, setHistory] = useState<{item: SwipeItem, type: SwipeType}[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);

  // Fetch current user's profile to get their coordinates and preferences
  const currentUserDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: currentUserProfile } = useDoc<UserProfile>(currentUserDocRef);
  const isPremium = !!currentUserProfile?.premiumTier;


  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'users'),
        limit(50)
    );
  }, [firestore, user]);


  const { data: profiles, isLoading: isLoadingProfiles } = useCollection<UserProfile>(usersQuery);

  const swipeableItems = useMemo((): SwipeItem[] => {
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
    
    const uniqueProfiles = Array.from(new Map(combinedProfiles.map(p => [p.id, p])).values());

    const filteredProfiles = uniqueProfiles
      .filter(p => {
        const isNotSelf = p.id !== user.uid;
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
        const distance = (p.latitude && p.longitude && currentLat && currentLon) ? getDistanceInKm(currentLat, currentLon, p.latitude, p.longitude) : undefined;
        const isBoosted = p.boostExpiresAt && isFuture((p.boostExpiresAt as Timestamp).toDate());
        const personalityTraits = p.personalityTraits || {
            macera: Math.floor(Math.random() * 60) + 40,
            mizah: Math.floor(Math.random() * 60) + 40,
            duygusallık: Math.floor(Math.random() * 60) + 40,
            dışadönüklük: Math.floor(Math.random() * 60) + 40,
            planlılık: Math.floor(Math.random() * 60) + 40,
        };
        return { ...p, distance, isBoosted, personalityTraits };
      })
      .filter(p => {
          if (p.isSystemAccount) return true;
          if (globalMode || p.distance === undefined) return true;
          return p.distance <= maxDistance;
      })
      .sort((a, b) => {
        if (a.isSystemAccount && !b.isSystemAccount) return -1;
        if (!a.isSystemAccount && b.isSystemAccount) return 1;

        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });

    // Inject ads only if the user is not premium
    if (!isPremium) {
        return injectAds(filteredProfiles);
    }
    
    // For premium users, return only user items
    return filteredProfiles.map(p => ({ type: 'user', user: p }));

  }, [profiles, currentUserProfile, user, isPremium]);

  const currentUserTraits = useMemo(() => {
    if (!currentUserProfile?.personalityTraits) return createDummyTraits();
    return Object.entries(currentUserProfile.personalityTraits).map(([trait, score]) => ({
        trait,
        userScore: score,
        viewerScore: 0,
    }));
  }, [currentUserProfile]);

  const viewerProfileTraits = useMemo(() => {
    if (!compatibilityProfile?.personalityTraits) return createDummyTraits();
    return Object.entries(compatibilityProfile.personalityTraits).map(([trait, score]) => ({
        trait,
        userScore: score, // This will be used as viewer score
        viewerScore: 0,
    }));
  }, [compatibilityProfile]);


  const handleReset = () => {
    setProfileIndex(0);
    setHistory([]);
  };

  const handleRewind = async () => {
    if (history.length === 0 || !currentUserProfile || !currentUserDocRef) return;

    // Premium users have unlimited rewinds.
    const isPremiumUser = !!currentUserProfile.premiumTier;
    
    const lastRewindDate = currentUserProfile.lastRewindAt?.toDate();
    const rewindsToday = (lastRewindDate && isToday(lastRewindDate)) ? (currentUserProfile.rewindCount || 0) : 0;

    if (!isPremiumUser && rewindsToday >= DAILY_REWIND_LIMIT) {
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

    if (!isPremiumUser) {
        const newRewindCount = rewindsToday + 1;
        await updateDoc(currentUserDocRef, {
            rewindCount: newRewindCount,
            lastRewindAt: serverTimestamp(),
        });
    }
    
    if (lastAction.item.type === 'user') {
      toast({
          title: "Geri Alındı!",
          description: `${lastAction.item.user.name} profiline geri döndün.`
      });
    }

  };

  const handleSwipe = useCallback(async (direction: SwipeDirection, triggeredByButton: boolean = false) => {
    if (showTutorial) {
        setShowTutorial(false);
        localStorage.setItem('hasSeenSwipeTutorial', 'true');
    }
    if (visibleStack.length === 0 || !user || !firestore || !currentUserProfile) return;

    const swipedItem = visibleStack[visibleStack.length - 1];
    
    // Common logic for both ads and users: advance the card stack
    const swipeType: SwipeType = direction === 'right' ? 'like' : direction === 'up' ? 'superlike' : 'nope';
    setHistory(prev => [{item: swipedItem, type: swipeType}, ...prev]);
    setProfileIndex(prev => prev + 1);
    
    // If it's an ad, just dismiss it. Don't do any other logic.
    // Ads can't be liked or superliked.
    if (swipedItem.type === 'ad') {
        return;
    }

    // --- User-specific swipe logic ---
    const swipedProfile = swipedItem.user;
    
    // If it's a mock profile and the user liked them, initiate an AI chat.
    if (swipedProfile.isSystemAccount && (swipeType === 'like' || swipeType === 'superlike')) {
        try {
            const matchId = [currentUserProfile.id, swipedProfile.id].sort().join('_');
            const matchRef = doc(firestore, 'matches', matchId);
            const matchDoc = await getDoc(matchRef);

            if (matchDoc.exists()) {
                console.log(`Match with ${swipedProfile.name} already exists. Skipping AI message.`);
                return;
            }

            const bioPart = currentUserProfile.bio ? `, Bio: ${currentUserProfile.bio}` : '';
            const interestsPart = (currentUserProfile.interests && currentUserProfile.interests.length > 0) ? `, Interests: ${currentUserProfile.interests.join(', ')}` : '';
            const userProfileString = `Name: ${currentUserProfile.name}, Age: ${currentUserProfile.age}${bioPart}${interestsPart}`;

            const result = await generateAiIcebreaker({
                userProfile: userProfileString,
                mockProfileName: swipedProfile.name,
                language: locale,
            });

            if (result.icebreaker) {
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

    if (direction === 'up' && !isPremium) {
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

  }, [visibleStack, user, firestore, currentUserProfile, toast, t, router, locale, showTutorial, isPremium]);

  const isLoading = isUserLoading || isLoadingProfiles || !currentUserProfile;

  useEffect(() => {
    if (swipeableItems.length > 0) {
      const initialStack = swipeableItems.slice(profileIndex, profileIndex + MAX_VISIBLE_CARDS).reverse();
      setVisibleStack(initialStack);
    } else {
      setVisibleStack([]);
    }
  }, [swipeableItems, profileIndex]);

  useEffect(() => {
    if (isMobile && profiles && profiles.length > 0) {
      const hasSeenTutorial = localStorage.getItem('hasSeenSwipeTutorial');
      if (!hasSeenTutorial) {
        const timer = setTimeout(() => {
          setShowTutorial(true);
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [isMobile, profiles]);

  if (isMobile === undefined) {
    return null;
  }
  
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
                {visibleStack.map((item, index) => {
                  const isTop = index === visibleStack.length - 1;
                  const stackIndex = visibleStack.length - 1 - index;
                  return (
                    <motion.div
                      key={item.type === 'user' ? item.user.id : item.id}
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
                        x: item.id === (visibleStack[visibleStack.length - 1] as AdItem | UserItem).id ? (history[0]?.type === 'like' || history[0]?.type === 'superlike' ? 300 : -300) : 0,
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
                        item={item}
                        onSwipe={(direction) => handleSwipe(direction)}
                        onShowDetails={() => item.type === 'user' && setDetailsProfile(item.user)}
                        onShowCompatibility={() => item.type === 'user' && setCompatibilityProfile(item.user)}
                        isTop={isTop}
                      />
                    </motion.div>
                  );
                })}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <NoMoreProfiles onReset={handleReset} />
              </div>
            )}
          </AnimatePresence>
        </div>
        {showTutorial && <TutorialOverlay />}
      </div>
      
      {/* Ad Banner - This can be moved or removed if AdCard is sufficient */}
      
      <Sheet open={!!detailsProfile} onOpenChange={(isOpen) => !isOpen && setDetailsProfile(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl flex flex-col">
            <SheetHeader className="pt-[calc(env(safe-area-inset-top,0rem)+0.75rem)]">
                <SheetTitle className="sr-only">{t('discover.profileDetailsTitle')}</SheetTitle>
            </SheetHeader>
            {detailsProfile && <ProfileDetails profile={detailsProfile} />}
        </SheetContent>
      </Sheet>
      
       <Sheet open={!!compatibilityProfile} onOpenChange={(isOpen) => !isOpen && setCompatibilityProfile(null)}>
        <SheetContent 
            side="bottom" 
            className="h-auto bg-background/80 backdrop-blur-md border-t border-border/50 rounded-t-2xl flex flex-col p-0"
        >
            <div className="relative p-4 flex items-center justify-center border-b">
                <SheetHeader className="text-center">
                    <SheetTitle className="sr-only">Uyumluluk Analizi</SheetTitle>
                </SheetHeader>
            </div>
            {compatibilityProfile && currentUserProfile && (
                <div className="p-4 pt-4">
                     <CompatibilityRadar currentUserTraits={currentUserTraits} viewerProfileTraits={viewerProfileTraits} />
                </div>
            )}
        </SheetContent>
      </Sheet>
    </div>
    </>
  );
}
