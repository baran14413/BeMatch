'use client';
import { useState } from 'react';
import type { UserProfile, UserStatus } from '@/lib/data';
import Image from 'next/image';
import { MapPin, Info, Music, Dumbbell, Plane, Clapperboard, Gamepad2, BookOpen, Utensils, Camera, Mountain, PartyPopper, User, Crown, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useUserStatus } from '@/hooks/use-user-status';
import { differenceInMinutes, isToday, isYesterday, format, formatDistanceToNowStrict } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

type ProfileCardProps = {
  profile: UserProfile;
  onShowDetails: () => void;
  onShowCompatibility: () => void;
  isTopCard: boolean;
};

const interestIcons: { [key: string]: React.ElementType } = {
  music: Music,
  sports: Dumbbell,
  travel: Plane,
  movies: Clapperboard,
  gaming: Gamepad2,
  reading: BookOpen,
  cooking: Utensils,
  photography: Camera,
  hiking: Mountain,
  dancing: PartyPopper,
  // Add other interests with their icons here
};

const getCountryFlag = (location: string | undefined): string => {
    if (!location) return '';
    const parts = location.split(', ');
    const countryCode = parts[parts.length - 1].trim().toUpperCase();

    if (countryCode.length !== 2) return ''; // Not a valid country code

    const codePoints = countryCode
        .split('')
        .map(char => 0x1F1E6 + (char.charCodeAt(0) - 'A'.charCodeAt(0)));
        
    try {
        return String.fromCodePoint(...codePoints);
    } catch(e) {
        return countryCode;
    }
}

const formatLastSeen = (status: UserStatus | null, t: (key: string) => string, locale: 'tr' | 'en'): string | null => {
    if (!status || status.state === 'online') {
        return null;
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


export default function ProfileCard({ profile, onShowDetails, onShowCompatibility, isTopCard }: ProfileCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { t, locale } = useLanguage();
  const userStatus = useUserStatus(profile.id);
  const totalImages = profile.imageUrls?.length || 1;
  const flag = getCountryFlag(profile.location);
  const isOnline = !profile.isSystemAccount && userStatus?.state === 'online';
  const lastSeenText = profile.isSystemAccount ? t('chat.online') : formatLastSeen(userStatus, t, locale);
  const isPremium = !!profile.premiumTier;


  const navigateImages = (e: React.MouseEvent, direction: 'next' | 'prev') => {
    // Prevent swipe gesture from triggering when changing images
    e.stopPropagation();
    if (!isTopCard) return;

    if (direction === 'next') {
      setCurrentImageIndex((prev) => Math.min(prev + 1, totalImages - 1));
    } else {
      setCurrentImageIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  const displayedInterests = profile.interests?.slice(0, 3) || [];
  const imageUrl = profile.imageUrls?.[currentImageIndex] || profile.avatarUrl;

  return (
    <div className="w-full h-full bg-card rounded-2xl shadow-lg overflow-hidden relative group">
      {/* Progress Bars */}
      {totalImages > 1 && isTopCard && (
        <div className="absolute top-2 left-2 right-2 z-20 flex items-center gap-1">
          {Array.from({ length: totalImages }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'h-1 flex-1 rounded-full',
                idx === currentImageIndex ? 'bg-white' : 'bg-white/40'
              )}
            />
          ))}
        </div>
      )}

      <div className="relative w-full h-full">
        {imageUrl && (
            <Image 
                src={imageUrl} 
                alt={`${profile.name}'s photo ${currentImageIndex + 1}`}
                fill
                className="object-cover"
                priority={isTopCard}
            />
        )}
        {/* Navigation Overlays */}
        {totalImages > 1 && isTopCard && (
          <>
            <div className="absolute top-0 left-0 h-full w-1/2 z-10" onClick={(e) => navigateImages(e, 'prev')}></div>
            <div className="absolute top-0 right-0 h-full w-1/2 z-10" onClick={(e) => navigateImages(e, 'next')}></div>
          </>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4 text-white w-full space-y-2">
            <div className="flex items-center gap-2">
                <h2 className={cn("text-3xl font-bold", isPremium && "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500")}>
                    {profile.name} {profile.age}
                </h2>
                {isPremium ? (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold text-xs border-none">
                        Premium
                    </Badge>
                ) : (
                    <>
                        {profile.gender === 'man' && <User className="w-6 h-6 text-blue-400" />}
                        {profile.gender === 'woman' && <User className="w-6 h-6 text-pink-400" />}
                    </>
                )}
            </div>
            {profile.bio && <p className="text-white/90 text-sm truncate">{profile.bio}</p>}
            
             <div className="flex items-center gap-2 text-sm pt-1">
                {(profile.location || profile.distance !== undefined) && (
                    <Badge variant="secondary" className="bg-black/40 text-white border border-white/30 backdrop-blur-sm shadow-lg shadow-black/50">
                        {profile.location && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{profile.location}</span>
                            </div>
                        )}
                        {profile.distance !== undefined && (
                            <span>&nbsp;• {profile.distance} km</span>
                        )}
                    </Badge>
                )}
            </div>

            {displayedInterests.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {displayedInterests.map((interest) => {
                  const Icon = interestIcons[interest] || null;
                  return (
                    <Badge
                      key={interest}
                      variant="secondary"
                      className="bg-white/20 text-white border border-white/30 backdrop-blur-sm shadow-lg shadow-black/50"
                    >
                      {Icon && <Icon className="w-3 h-3 mr-1" />}
                      {t(`interests.${interest}`)}
                    </Badge>
                  );
                })}
              </div>
            )}
        </div>
         <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onShowCompatibility(); }}
              className="relative bg-black/30 text-white hover:bg-black/50 hover:text-white rounded-full w-9 h-9"
            >
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75 animate-ping-slow"></span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onShowDetails(); }}
              className="bg-black/30 text-white hover:bg-black/50 hover:text-white rounded-full w-9 h-9"
            >
              <Info className="w-5 h-5" />
            </Button>
         </div>
        <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
            {flag && (
                <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-lg shadow-lg">
                    <span>{flag}</span>
                </div>
            )}
            {isOnline ? (
                <Badge variant="secondary" className="bg-green-500 text-white text-xs border-none px-2.5 py-1.5 backdrop-blur-sm shadow-lg">
                    {t('chat.online')}
                </Badge>
            ) : lastSeenText && (
                 <Badge variant="secondary" className="bg-gray-500/80 text-white text-xs border-none px-2.5 py-1.5 backdrop-blur-sm shadow-lg">
                    {lastSeenText}
                </Badge>
            )}
        </div>
      </div>
    </div>
  );
}
