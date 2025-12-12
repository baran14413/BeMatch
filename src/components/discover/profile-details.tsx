'use client';
import { useState } from 'react';
import type { UserProfile } from '@/lib/data';
import Image from 'next/image';
import VoiceNote from './voice-note';
import { Heart, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/context/language-context';

type ProfileDetailsProps = {
  profile: UserProfile;
};

export default function ProfileDetails({ profile }: ProfileDetailsProps) {
  const { t } = useLanguage();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [showLike, setShowLike] = useState<{ id: string; x: number; y: number } | null>(null);

  const handleDoubleClick = (e: React.MouseEvent, id: string) => {
    const newLikedItems = new Set(likedItems);
    if (newLikedItems.has(id)) {
      newLikedItems.delete(id);
    } else {
      newLikedItems.add(id);
    }
    setLikedItems(newLikedItems);

    const rect = e.currentTarget.getBoundingClientRect();
    setShowLike({ id, x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setShowLike(null), 600);
  };
  
  const renderMedia = (url: string, index: number) => {
    const id = `media-${index}`;
    return (
      <div
        key={id}
        className="relative w-full aspect-[3/4] rounded-lg overflow-hidden snap-center"
        onDoubleClick={(e) => handleDoubleClick(e, id)}
      >
        <Image src={url} alt={`${profile.name}'s photo ${index + 1}`} fill className="object-cover" />
        {likedItems.has(id) && (
          <div className="absolute top-3 right-3 bg-black/50 p-2 rounded-full">
            <Heart className="w-5 h-5 text-red-500 fill-current" />
          </div>
        )}
        {showLike?.id === id && (
          <div
            className="absolute animate-in fade-in zoom-in-50"
            style={{ left: showLike.x - 24, top: showLike.y - 24, pointerEvents: 'none' }}
          >
            <Heart className="w-12 h-12 text-white/90 fill-red-500/80" />
          </div>
        )}
      </div>
    );
  };

  return (
    <ScrollArea className="flex-1 w-full">
        <div className="p-6 pt-0 space-y-8 snap-start">
            <div className="text-center pt-4">
                <h2 className="text-2xl font-bold">{profile.name}, {profile.age}</h2>
                 <div className="flex items-center justify-center gap-2 mt-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <p>{profile.location}</p>
                </div>
                 {profile.distance && (
                    <p className="text-sm mt-1 text-muted-foreground">{t('discover.distanceAway', { distance: profile.distance })}</p>
                )}
            </div>

            <div className="relative">
              <h3 className="text-lg font-semibold">{t('discover.aboutMe')}</h3>
              <p className="text-foreground/80 mt-1">{profile.bio}</p>
          </div>

          {profile.voiceNoteUrl && (
          <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t('discover.myVoiceNote')}</h3>
              <VoiceNote audioSrc={profile.voiceNoteUrl} />
          </div>
          )}

          {profile.prompts.map((prompt, index) => {
          const id = `prompt-${index}`;
          return (
              <div
              key={id}
              className="p-4 rounded-lg bg-secondary relative snap-start"
              onDoubleClick={(e) => handleDoubleClick(e, id)}
              >
              <h3 className="text-sm font-semibold text-muted-foreground">{prompt.question}</h3>
              <p className="text-lg text-foreground mt-1">{prompt.answer}</p>
              {likedItems.has(id) && (
                  <div className="absolute top-5 right-5 bg-black/50 p-2 rounded-full">
                  <Heart className="w-5 h-5 text-red-500 fill-current" />
                  </div>
              )}
              {showLike?.id === id && (
                  <div
                      className="absolute animate-in fade-in zoom-in-50"
                      style={{ left: showLike.x - 24, top: showLike.y - 24, pointerEvents: 'none' }}
                  >
                      <Heart className="w-12 h-12 text-foreground/80 fill-red-500/80" />
                  </div>
                  )}
              </div>
          );
          })}

          {profile.imageUrls.slice(1).map((url, index) => renderMedia(url, index + 1))}

          {profile.videoUrl && (
            <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden snap-center">
                <video
                src={profile.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                />
            </div>
          )}
      </div>
    </ScrollArea>
  );
}
