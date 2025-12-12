'use client';
import React, { useRef } from 'react';
import { useOnboardingContext } from '@/context/onboarding-context';
import { Plus, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';
import { ScrollArea } from '@/components/ui/scroll-area';

const MAX_PHOTOS = 3;

export default function StepPhotos() {
  const { formData, updateFormData, setStepValid } = useOnboardingContext();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && formData.photos.length < MAX_PHOTOS) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhotos = [...formData.photos, reader.result as string];
        updateFormData({ ...formData, photos: newPhotos });
        setStepValid(newPhotos.length >= 1); // En az 1 fotoğraf gerekli
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    updateFormData({ ...formData, photos: newPhotos });
    setStepValid(newPhotos.length >= 1);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4 flex flex-col h-full">
      <ScrollArea className="flex-1 pr-4 -mr-4">
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <p className="text-muted-foreground text-sm">
              {t('onboarding.photos.info', { count: MAX_PHOTOS })}
            </p>
            <p className="text-muted-foreground text-xs italic">
              {t('onboarding.photos.profilePhotoHint')}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: MAX_PHOTOS }).map((_, index) => {
              const photo = formData.photos[index];
              if (photo) {
                return (
                  <div key={index} className="relative aspect-[3/4]">
                    {index === 0 && (
                      <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">{t('profile.title')}</div>
                    )}
                    <Image
                      src={photo}
                      alt={`${t('onboarding.photos.previewAlt')} ${index + 1}`}
                      fill
                      className="object-cover rounded-lg border-2 border-gray-200"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                      onClick={() => handleRemovePhoto(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              }
              if (index === formData.photos.length) {
                return (
                  <button
                    key={index}
                    onClick={triggerFileInput}
                    className="aspect-[3/4] flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/50 text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Plus className="w-8 h-8" />
                    <span className="text-xs font-semibold mt-1">{t('onboarding.photos.addButton')}</span>
                  </button>
                );
              }
              return (
                <div
                  key={index}
                  className="aspect-[3/4] flex items-center justify-center rounded-lg bg-gray-100 dark:bg-card border-2 border-dashed border-gray-200 dark:border-gray-700"
                />
              );
            })}
          </div>
        </div>
      </ScrollArea>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg"
      />
    </div>
  );
}
