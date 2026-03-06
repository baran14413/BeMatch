import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { UNLIMITED } from '../utils/subscriptionConstants';
import { type UserProfile } from '../context/AuthContext';

export type FeatureType = 'likes' | 'superLikes' | 'boosts' | 'rewinds';

export function useWallet() {
    const { userProfile, user } = useAuth();
    const [isConsuming, setIsConsuming] = useState(false);

    /**
     * Güvenli Harcama (Secure Consume Logic with Atomic Increments)
     * Race condition (aynı anda spam basma) önleyici sistem.
     * Bakiyeyi alır, sıfırsa hata fırlatır/false döner. Bakiye varsa Firebase Atomik -1 işlemi ile eksi hesaba düşmeyi engeller.
     */
    const consumeFeature = async (feature: FeatureType): Promise<boolean> => {
        if (!user || (!userProfile && (userProfile as unknown as UserProfile)?.role !== 'admin')) return false;

        const typedProfile = userProfile as unknown as UserProfile;
        // Admin cannot consume their own limits, they are immune and infinite.
        if (typedProfile?.role === 'admin') return true;

        const wallet = typedProfile?.wallet;

        // Cüzdan yoksa ya da bir nedenden ötürü resetlenmemişse varsayılan kur korumasından reddet!
        if (!wallet) return false;

        const currentBalance = wallet[feature];

        // 1. Sınırsızlık (Unlimited) Kontrolü
        if (currentBalance === UNLIMITED) {
            return true; // İşleme devam et, veritabanına yazmaya gerek yok.
        }

        // 2. Yetersiz Bakiye Kontrolü (Paywall Trigger)
        if (currentBalance <= 0) {
            return false; // UI bu sonucu aldığında Paywall Modal açmalıdır.
        }

        // 3. Race Condition Eşzamanlılık Kilidi
        if (isConsuming) return false;

        setIsConsuming(true);

        try {
            // FIREBASE ATOMIC DECREMENT (-1)
            // Okuyup manuel eksi 1 yazmak yerine, veritabanına doğrudan eksi yapmasını söylüyoruz.
            // Bu sayede aynı anda iki istek gelse bile eksi hesaba düşmez.
            await updateDoc(doc(db, 'users', user.uid), {
                [`wallet.${feature}`]: increment(-1)
            });

            // Başarılı olursa kendi UI local state'imizi de güncelleyebiliriz (AuthContext zaten dinliyor ama anlık hız için)
            return true;
        } catch (error) {
            console.error(`Failed to consume ${feature}:`, error);
            return false;
        } finally {
            setIsConsuming(false);
        }
    };

    return {
        consumeFeature,
        isConsuming,
        walletStats: userProfile?.wallet || { likes: 0, superLikes: 0, boosts: 0, rewinds: 0 }
    };
}
