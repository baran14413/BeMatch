'use client';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Settings, ChevronLeft, ChevronRight, Pencil, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { AnimatePresence, motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/lib/data';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { interestIcons } from '@/lib/interest-icons';
import { useTwa } from '@/hooks/use-twa';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { t } = useLanguage();
  const isWebView = useTwa();
  
  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  
  const isLoading = isUserLoading || isProfileLoading;

  const images = userProfile?.imageUrls || [];
  const isPremium = !!userProfile?.premiumTier;

  const handleNextImage = () => {
    if (selectedImageIndex === null || !userProfile?.imageUrls) return;
    setSelectedImageIndex((prevIndex) => 
        prevIndex === null ? 0 : (prevIndex + 1) % images.length
    );
  };

  const handlePrevImage = () => {
    if (selectedImageIndex === null || !userProfile?.imageUrls) return;
    setSelectedImageIndex((prevIndex) =>
      prevIndex === null ? 0 : (prevIndex - 1 + images.length) % images.length
    );
  };

  if (isLoading) {
    return (
        <div className="h-full p-4 md:p-6 bg-gray-50 dark:bg-black">
            <div className="max-w-2xl mx-auto space-y-8">
                 <div className="flex items-center justify-between">
                    <div className="flex-1"></div>
                    <div className="flex flex-col items-center space-y-2 flex-1">
                        <Skeleton className="w-32 h-32 rounded-full" />
                        <div className="text-center pt-2 space-y-2">
                            <Skeleton className="h-8 w-40" />
                        </div>
                    </div>
                    <div className="flex-1 flex justify-end">
                       <Settings className="w-6 h-6 text-muted-foreground" />
                    </div>
                 </div>
                 <Card>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-3 gap-3">
                            <Skeleton className="aspect-square rounded-lg" />
                            <Skeleton className="aspect-square rounded-lg" />
                            <Skeleton className="aspect-square rounded-lg" />
                        </div>
                    </CardContent>
                 </Card>
                 <Skeleton className="h-20 w-full" />
                 <Skeleton className="h-20 w-full" />
            </div>
        </div>
    )
  }

  if (!userProfile) {
    return <div className="p-8 text-center">{t('profile.notFound')}</div>
  }

  return (
    <div className="h-full p-4 md:p-6 bg-gray-50 dark:bg-black">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="flex flex-col items-center space-y-2 flex-1">
            <div className="relative">
              {isPremium && <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary via-yellow-400 to-orange-500 opacity-75 blur-lg animate-spin-slow"></div>}
              <Avatar className="relative w-32 h-32 border-4 border-background">
                <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} className="object-cover"/>
                <AvatarFallback>{userProfile.name ? userProfile.name.charAt(0) : ''}</AvatarFallback>
              </Avatar>
            </div>
            <div className="text-center pt-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{userProfile.name}</h1>
                {isPremium && <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400" />}
              </div>
            </div>
          </div>
          <div className="flex-1 flex justify-end">
            <Link href="/settings" passHref>
              <Button variant="ghost" size="icon" aria-label={t('settings.title')}>
                <Settings className="w-6 h-6 text-muted-foreground" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Bio */}
        {userProfile.bio && (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t('discover.aboutMe')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{userProfile.bio}</p>
                </CardContent>
            </Card>
        )}

        {/* Interests */}
        {(userProfile.interests && userProfile.interests.length > 0) && (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">İlgi Alanlarım</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {userProfile.interests.map(interest => {
                        const Icon = interestIcons[interest];
                        return (
                            <Badge key={interest} variant="secondary" className="text-base py-1 px-3">
                                {Icon && <Icon className="w-4 h-4 mr-2"/>}
                                {t(`interests.${interest}`)}
                            </Badge>
                        );
                    })}
                </CardContent>
            </Card>
        )}

        {/* Prompts */}
        {(userProfile.prompts && userProfile.prompts.length > 0) && (
            <div className="space-y-4">
                 {userProfile.prompts.map((prompt, index) => (
                    <Card key={index}>
                        <CardHeader>
                            <p className="text-sm font-semibold text-muted-foreground">{prompt.question}</p>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg">{prompt.answer}</p>
                        </CardContent>
                    </Card>
                 ))}
            </div>
        )}

        {/* Photo Gallery */}
        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{t('profile.myPhotos')}</CardTitle>
             </div>
          </CardHeader>
          <CardContent>
             {images.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                    {images.map((url, index) => (
                        <button 
                          key={index} 
                          className="relative aspect-square rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          onClick={() => setSelectedImageIndex(index)}
                        >
                            <Image src={url} alt={`${t('profile.profilePhoto')} ${index + 1}`} fill className="object-cover transition-transform group-hover:scale-105" />
                        </button>
                    ))}
                </div>
             ) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>No photos yet. Add some from the gallery settings!</p>
                </div>
             )}
          </CardContent>
        </Card>

        {/* BeMatch Gold Banner */}
        {!isPremium && !isWebView && (
          <Link href="/settings/subscriptions" passHref>
              <Card className="overflow-hidden shadow-lg border-0 cursor-pointer">
                  <div className="p-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                       <CardContent className="p-0 flex items-center gap-4">
                          <Crown className="w-8 h-8" />
                          <div>
                              <h2 className="text-lg font-bold">{t('profile.getGold')}</h2>
                              <p className="text-sm">{t('profile.goldDescription')}</p>
                          </div>
                      </CardContent>
                  </div>
              </Card>
          </Link>
        )}
      </div>

      <AnimatePresence>
        {selectedImageIndex !== null && images.length > 0 && (
          <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
            <DialogContent 
              className="bg-black/90 border-none p-0 w-screen h-screen max-w-none flex items-center justify-center"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DialogHeader className="sr-only">
                  <DialogTitle>Enlarged profile photo</DialogTitle>
              </DialogHeader>
              
              <AnimatePresence mode="wait">
                  <motion.div
                      key={selectedImageIndex}
                      initial={{ opacity: 0.5, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0.5, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="relative w-[90vw] h-[80vh]"
                      onClick={(e) => e.stopPropagation()}
                  >
                      <Image
                          src={images[selectedImageIndex]}
                          alt="Enlarged profile"
                          fill
                          className="object-contain"
                      />
                  </motion.div>
              </AnimatePresence>

              {images.length > 1 && (
                  <>
                      <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 rounded-full h-12 w-12 z-50"
                          onClick={(e) => {e.stopPropagation(); handlePrevImage();}}
                      >
                          <ChevronLeft className="w-10 h-10" />
                      </Button>
                      <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 rounded-full h-12 w-12 z-50"
                          onClick={(e) => {e.stopPropagation(); handleNextImage();}}
                      >
                          <ChevronRight className="w-10 h-10" />
                      </Button>
                  </>
              )}
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
