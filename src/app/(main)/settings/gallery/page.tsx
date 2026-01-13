
'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Plus, X, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';
import Link from 'next/link';
import { useUser, useFirestore, useStorage, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MAX_PHOTOS = 6;

export default function GallerySettingsPage() {
  const { t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const [localPhotos, setLocalPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile?.imageUrls) {
      setLocalPhotos(userProfile.imageUrls);
    }
  }, [userProfile]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && localPhotos.length < MAX_PHOTOS) {
      const file = e.target.files[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          const photoId = uuidv4();
          const storageRef = ref(storage, `users/${user!.uid}/photos/${photoId}.jpg`);
          
          await uploadString(storageRef, dataUrl, 'data_url');
          const downloadURL = await getDownloadURL(storageRef);

          const updatedPhotos = [...localPhotos, downloadURL];
          const updatePayload: { imageUrls: string[], avatarUrl?: string } = { imageUrls: updatedPhotos };
          
          // If this is the first photo being added, set it as the avatar.
          if (localPhotos.length === 0) {
            updatePayload.avatarUrl = updatedPhotos[0];
          }

          await updateDoc(userDocRef!, updatePayload);

          setLocalPhotos(updatedPhotos);
          toast({ title: t('galleryPage.photoAdded') });
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error uploading photo: ", error);
        toast({ variant: 'destructive', title: t('galleryPage.errorAddingPhoto') });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoToDelete) return;

    if (localPhotos.length <= 1) {
      toast({ variant: 'destructive', title: t('galleryPage.errorLastPhoto') });
      setPhotoToDelete(null);
      return;
    }
    
    try {
      // Delete from Storage
      const photoRef = ref(storage, photoToDelete);
      await deleteObject(photoRef);

      // Delete from Firestore
      const updatedPhotos = localPhotos.filter(url => url !== photoToDelete);
      const updatePayload: { imageUrls: string[], avatarUrl?: string } = { imageUrls: updatedPhotos };
      
      // If the deleted photo was the avatar, set the new first photo as the avatar.
      if (userProfile?.avatarUrl === photoToDelete) {
        updatePayload.avatarUrl = updatedPhotos[0];
      }

      await updateDoc(userDocRef!, updatePayload);
      
      setLocalPhotos(updatedPhotos);
      toast({ title: t('galleryPage.photoRemoved') });

    } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
             const updatedPhotos = localPhotos.filter(url => url !== photoToDelete);
             const updatePayload: { imageUrls: string[], avatarUrl?: string } = { imageUrls: updatedPhotos };
              if (userProfile?.avatarUrl === photoToDelete) {
                updatePayload.avatarUrl = updatedPhotos[0];
              }
             await updateDoc(userDocRef!, updatePayload);
             setLocalPhotos(updatedPhotos);
             toast({ title: t('galleryPage.photoRemoved') });
        } else {
            console.error("Error removing photo: ", error);
            toast({ variant: 'destructive', title: t('galleryPage.errorRemovingPhoto') });
        }
    } finally {
        setPhotoToDelete(null);
    }
  };

  const triggerFileInput = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };
  
  const isLoading = isUserLoading || isProfileLoading;

  return (
    <ScrollArea className="h-full">
      <div className="h-full bg-gray-50 dark:bg-black">
        <header className="p-4 py-6 md:p-8 flex items-center gap-4 border-b mb-8 pt-[calc(env(safe-area-inset-top,0rem)+1.5rem)]">
            <Link href="/settings" passHref>
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
            </Link>
            <div>
                <h1 className="text-3xl font-bold text-primary">{t('settings.editGallery')}</h1>
                <p className="text-muted-foreground">{t('galleryPage.description')}</p>
            </div>
        </header>

        <div className="p-4 md:p-8 md:pt-0 space-y-4 pb-[calc(env(safe-area-inset-bottom,0rem)+2rem)]">
          <p className="text-center text-muted-foreground text-sm">
            {t('onboarding.photos.info', { count: MAX_PHOTOS })}
          </p>
          <p className="text-center text-muted-foreground text-xs italic">
            {t('onboarding.photos.profilePhotoHint')}
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
            {isLoading ? (
              Array.from({ length: MAX_PHOTOS }).map((_, index) => (
                  <Skeleton key={index} className="aspect-square rounded-lg" />
              ))
            ) : (
              <>
              {Array.from({ length: MAX_PHOTOS }).map((_, index) => {
                  const photo = localPhotos[index];
                  if (photo) {
                  return (
                      <div key={index} className="relative aspect-square">
                      {index === 0 && (
                          <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">{t('profile.title')}</div>
                      )}
                      <Image
                          src={photo}
                          alt={`${t('onboarding.photos.previewAlt')} ${index + 1}`}
                          fill
                          className="object-cover rounded-lg border-2 border-gray-200"
                      />
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button
                                size="icon"
                                variant="destructive"
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                                onClick={() => setPhotoToDelete(photo)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                          </AlertDialogTrigger>
                           {photoToDelete === photo && (
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>{t('galleryPage.deleteConfirmTitle')}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          {t('galleryPage.deleteConfirmDescription')}
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="relative w-32 h-32 self-center my-4">
                                      <Image src={photo} alt="Preview" fill className="object-cover rounded-md" />
                                  </div>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setPhotoToDelete(null)}>{t('common.cancel')}</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleRemovePhoto} className="bg-destructive hover:bg-destructive/90">
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          {t('galleryPage.deleteConfirmAction')}
                                      </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                           )}
                        </AlertDialog>
                      </div>
                  );
                  }
                  if (index === localPhotos.length) {
                  return (
                      <button
                      key={index}
                      onClick={triggerFileInput}
                      disabled={isUploading}
                      className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/50 text-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                      {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Plus className="w-8 h-8" />}
                      <span className="text-xs font-semibold mt-1">
                          {isUploading ? t('galleryPage.uploading') : t('onboarding.photos.addButton')}
                      </span>
                      </button>
                  );
                  }
                  return (
                  <div
                      key={index}
                      className="aspect-square flex items-center justify-center rounded-lg bg-gray-100 dark:bg-card border-2 border-dashed border-gray-200 dark:border-gray-700"
                  />
                  );
              })}
              </>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg"
            disabled={isUploading}
          />
        </div>
      </div>
    </ScrollArea>
  );
}
