import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getTierLimits } from './subscriptionConstants';

export interface SubscriptionResult {
    success: boolean;
    error?: string;
}

/**
 * Universal Mock Payment Flow (Tries to imitate real stores + acts as a single gateway)
 * Grants a subscription tier for a specified amount of days.
 *
 * @param userId - Firebase User UID
 * @param tierId - e.g. 'gold-weekly', 'gold-monthly', 'gold-yearly'
 * @param periodDays - Duration in days
 */
export const grantSubscription = async (userId: string, tierId: string, periodDays: number): Promise<SubscriptionResult> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return { success: false, error: 'User not found' };
        }

        const now = Date.now();
        const expiryDate = now + periodDays * 24 * 60 * 60 * 1000;

        let periodName = 'none';
        if (periodDays === 7) periodName = 'haftalık';
        if (periodDays === 30) periodName = 'aylık';
        if (periodDays === 365) periodName = 'yıllık';

        const newSubscription = {
            planId: tierId,
            planName: `BeMatch Premium (${periodName})`,
            status: 'active',
            expiryDate: expiryDate,
            period: periodName,
            updatedAt: serverTimestamp()
        };

        const limits = getTierLimits(tierId);
        const todayStr = new Date().toISOString().split('T')[0];

        // Immediately refill the wallet limits based on the new tier!
        const newWallet = {
            lastResetDate: todayStr,
            likes: limits.dailyLikes,
            superLikes: limits.dailySuperLikes,
            boosts: limits.dailyBoosts,
            rewinds: limits.dailyRewinds
        };

        // Batch the updates atomically
        await updateDoc(userRef, {
            subscription: newSubscription,
            wallet: newWallet,
            isPremium: true,
            premiumPlan: tierId
        });

        return { success: true };
    } catch (error) {
        console.error("Error granting subscription:", error);
        return { success: false, error: (error as Error).message };
    }
};
