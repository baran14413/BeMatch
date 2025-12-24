'use client';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore, useStorage, useUser } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from './language-context';


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
    interestedIn: '',
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

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isStepValid, setStepValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const { user } = useUser();

  const isLastStep = currentStep === 10;

  useEffect(() => {
    // If the user logs out, reset the onboarding form state
    if (!user) {
      resetOnboarding();
    }
  }, [user]);

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleRegister = async () => {
    setIsLoading(true);

    try {
      // Get IP and country info
      let ipAddress = 'N/A';
      let country = 'N/A';
      try {
        const geoResponse = await fetch('https://ipapi.co/json/');
        const geoData = await geoResponse.json();
        ipAddress = geoData.ip;
        country = `${geoData.country_name}, ${geoData.country_code}`;
      } catch (geoError) {
        console.warn("Could not fetch geolocation data:", geoError);
      }
      
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      
      // 2. Create the user profile document in Firestore WITHOUT photo URLs first
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
          role: 'user', // Default role
          avatarUrl: '', // Initially empty
          imageUrls: [], // Initially empty
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
          ipAddress: ipAddress,
          country: country
      };
      
      await setDoc(userDocRef, initialProfileData);

      // 3. Now that user is authenticated and doc exists, upload photos
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

      // 4. Update the user document with the photo URLs
      if (photoURLs.length > 0) {
          await updateDoc(userDocRef, {
              avatarUrl: photoURLs[0],
              imageUrls: photoURLs
          });
      }


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
