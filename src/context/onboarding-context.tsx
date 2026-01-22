'use client';
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore, useStorage, useUser } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, Timestamp, updateDoc, writeBatch, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from './language-context';
import { generateAiIcebreaker } from '@/ai/flows/generate-ai-icebreaker';
import type { UserProfile } from '@/lib/data';


interface FormData {
  firstName: string;
  lastName: string;
  day: string;
  month: string;
  year: string;
  dateOfBirth: Date | undefined;
  age: number;
  gender: string;
  interestedIn: string;
  goal: string;
  interests: string[];
  location: string;
  latitude?: number;
  longitude?: number;
  locationEnabled: boolean;
  maxDistance: number;
  bio: string;
  photos: string[];
  email: string;
  password: string;
  confirmPassword: string;
}

const initialFormData: FormData = {
    firstName: '',
    lastName: '',
    day: '',
    month: '',
    year: '',
    dateOfBirth: undefined,
    age: 0,
    gender: '',
    interestedIn: 'everyone',
    goal: '',
    interests: [],
    location: '',
    latitude: undefined,
    longitude: undefined,
    locationEnabled: false,
    maxDistance: 50,
    bio: '',
    photos: [],
    email: '',
    password: '',
    confirmPassword: '',
};

interface OnboardingContextType {
  currentStep: number;
  isLastStep: boolean;
  formData: FormData;
  isStepValid: boolean;
  isLoading: boolean;
  setStepValid: (isValid: boolean) => void;
  updateFormData: (data: Partial<FormData>) => void;
  nextStep: (totalSteps: number) => void;
  prevStep: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const BEMATCH_SYSTEM_ID = 'bematch_system_account';

const scheduleMockMessages = (
    firestore: any,
    newUserId: string,
    newUserProfile: UserProfile,
    language: 'tr' | 'en'
) => {
    const mockNames = ["Aslı", "Ebru", "Ceren", "Selin", "Gizem", "Elif", "Büşra", "Yağmur", "Deniz", "İrem"];
    
    const shuffledMocks = [...mockNames].sort(() => 0.5 - Math.random());
    const selectedMocks = shuffledMocks.slice(0, Math.floor(Math.random() * 2) + 3);

    selectedMocks.forEach((mockName) => {
        const delay = (Math.random() * 5 + 10) * 60 * 1000; // 10 to 15 minutes

        setTimeout(async () => {
            try {
                // Construct profile string safely, handling undefined fields
                const bioPart = newUserProfile.bio ? `, Bio: ${newUserProfile.bio}` : '';
                const interestsPart = (newUserProfile.interests && newUserProfile.interests.length > 0) ? `, Interests: ${newUserProfile.interests.join(', ')}` : '';
                const userProfileString = `Name: ${newUserProfile.name}, Age: ${newUserProfile.age}${bioPart}${interestsPart}`;

                const result = await generateAiIcebreaker({
                    userProfile: userProfileString,
                    mockProfileName: mockName,
                    language: language,
                });

                if (result.icebreaker) {
                    const mockProfileId = `mock_${mockName.toLowerCase().replace(/ /g, '_')}`;
                    const matchId = [newUserId, mockProfileId].sort().join('_');
                    const matchRef = doc(firestore, 'matches', matchId);
                    const messageRef = doc(collection(firestore, 'matches', matchId, 'messages'));

                    const batch = writeBatch(firestore);

                    const mockAvatar = `https://i.pravatar.cc/300?u=${mockName}`;
                    
                    const userInfoKey = `user_info_${newUserId}`;
                    const mockInfoKey = `user_info_${mockProfileId}`;

                    batch.set(matchRef, {
                        users: [newUserId, mockProfileId],
                        timestamp: serverTimestamp(),
                        lastMessage: result.icebreaker,
                        [userInfoKey]: {
                            name: newUserProfile.name,
                            avatarUrl: newUserProfile.avatarUrl,
                        },
                        [mockInfoKey]: {
                            name: mockName,
                            avatarUrl: mockAvatar,
                        }
                    });

                    batch.set(messageRef, {
                        senderId: mockProfileId,
                        text: result.icebreaker,
                        timestamp: serverTimestamp(),
                        isRead: false,
                        isAiGenerated: true,
                    });

                    await batch.commit();
                }
            } catch (error) {
                console.error(`Failed to send scheduled message from ${mockName}:`, error);
            }
        }, delay);
    });
};


export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isStepValid, setStepValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t, locale } = useLanguage();

  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const { user } = useUser();

  const isLastStep = currentStep === 10;

  useEffect(() => {
    if (!user) {
      resetOnboarding();
    }
  }, [user]);

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const createWelcomeChat = useCallback(async (userId: string, userName: string, userAvatar: string) => {
    const matchId = [userId, BEMATCH_SYSTEM_ID].sort().join('_');
    const matchRef = doc(firestore, 'matches', matchId);
    const messagesColRef = doc(firestore, 'matches', matchId, 'messages', uuidv4());

    const batch = writeBatch(firestore);

    const welcomeMessage = locale === 'tr' 
        ? `Merhaba ${userName}! Harika bir başlangıç yapman için buradayız. Profilini tamamladın, şimdi etrafındaki harika insanları keşfetme zamanı. Bol şans!`
        : `Hi ${userName}! We're here to help you get off to a great start. You've completed your profile, now it's time to discover the amazing people around you. Good luck!`;
        
    const userInfoKey = `user_info_${userId}`;
    const systemInfoKey = `user_info_${BEMATCH_SYSTEM_ID}`;

    batch.set(matchRef, {
        users: [userId, BEMATCH_SYSTEM_ID],
        timestamp: serverTimestamp(),
        lastMessage: locale === 'tr' ? "BeMatch'e hoş geldin!" : "Welcome to BeMatch!",
        [userInfoKey]: {
            name: userName,
            avatarUrl: userAvatar,
        },
        [systemInfoKey]: {
            name: "BeMatch",
            avatarUrl: 'https://images.unsplash.com/photo-1580473828758-718abc902934?w=500',
        },
    });

    batch.set(messagesColRef, {
        senderId: BEMATCH_SYSTEM_ID,
        text: welcomeMessage,
        timestamp: serverTimestamp(),
        isRead: false,
    });

    try {
        await batch.commit();
    } catch(error) {
        console.error("Welcome chat creation failed:", error);
    }
  }, [firestore, locale]);


  const handleRegister = async () => {
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      await auth.currentUser?.getIdToken(true);

      const userDocRef = doc(firestore, 'users', user.uid);
      
      const initialProfileData = {
          id: user.uid,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          name: `${formData.firstName} ${formData.lastName}`,
          age: formData.age,
          dateOfBirth: formData.dateOfBirth ? Timestamp.fromDate(formData.dateOfBirth) : null,
          gender: formData.gender,
          interestedIn: formData.interestedIn,
          bio: formData.bio,
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
          interests: formData.interests,
          goal: formData.goal,
          role: 'user',
          avatarUrl: '',
          imageUrls: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          prompts: [],
          zodiac: '',
          videoUrl: '',
          videoDescription: '',
          voiceNoteUrl: '',
          globalMode: true,
          maxDistance: formData.maxDistance,
          ageRange: [18, 55],
      };
      
      await setDoc(userDocRef, initialProfileData);

      const uploadPhotos = async (userId: string, photos: string[]): Promise<string[]> => {
          const photoURLs: string[] = [];
          for (const photo of photos) {
            const photoId = uuidv4();
            const storageRef = ref(storage, `users/${userId}/photos/${photoId}.jpg`);
            const uploadResult = await uploadString(storageRef, photo, 'data_url');
            const downloadURL = await getDownloadURL(uploadResult.ref);
            photoURLs.push(downloadURL);
          }
          return photoURLs;
      };
      
      const photoURLs = await uploadPhotos(user.uid, formData.photos);

      if (photoURLs.length > 0) {
          await updateDoc(userDocRef, {
              avatarUrl: photoURLs[0],
              imageUrls: photoURLs
          });
      }

      await createWelcomeChat(user.uid, initialProfileData.name, photoURLs[0] || '');

      const fullNewUserProfile = { ...initialProfileData, avatarUrl: photoURLs[0] || '', imageUrls: photoURLs } as UserProfile;
      scheduleMockMessages(firestore, user.uid, fullNewUserProfile, locale);


      toast({
        title: t('onboarding.toasts.successTitle'),
        description: t('onboarding.toasts.successDescription'),
      });

      router.push('/discover');

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        variant: 'destructive',
        title: t('onboarding.toasts.errorTitle'),
        description: error.message || t('onboarding.toasts.errorDescription'),
      });
    } finally {
        setIsLoading(false);
    }
  };


  const nextStep = (totalSteps: number) => {
    if (isLastStep) {
        handleRegister();
        return;
    }
    if (currentStep < totalSteps - 1) {
        setCurrentStep((prev) => prev + 1);
        setStepValid(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
        setCurrentStep((prev) => prev - 1);
        setStepValid(true);
    }
  };

  const resetOnboarding = () => {
    setCurrentStep(0);
    setFormData(initialFormData);
    setStepValid(false);
  }

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        isLastStep,
        formData,
        isStepValid,
        isLoading,
        setStepValid,
        updateFormData,
        nextStep,
        prevStep,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboardingContext = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
};
