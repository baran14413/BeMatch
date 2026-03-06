/**
 * ---------------------------------------------------------------------------
 * BEMATCH SUBSCRIPTION & WALLET CONSTANTS (SECURE ARCHITECTURE)
 * ---------------------------------------------------------------------------
 * Defines the strict limits and permissions for every subscription tier.
 * UNLIMITED flags are represented by the constant -1. 
 * Any feature amount equal to -1 is considered unlimited and never consumed.
 */

// Sınırsız özellikleri belirtmek için kullanılan sabit değer.
export const UNLIMITED = -1;

export type SubscriptionTierType = 'FREE' | 'gold-weekly' | 'gold-monthly' | 'gold-yearly';

export interface TierLimits {
    dailyLikes: number;
    dailySuperLikes: number;
    dailyBoosts: number;
    dailyRewinds: number;
    // Permissions
    hideAds: boolean;
    seeWhoLikedYou: boolean;
    incognitoMode: boolean;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTierType, TierLimits> = {
    'FREE': {
        dailyLikes: 10,
        dailySuperLikes: 0,
        dailyBoosts: 0,
        dailyRewinds: 3,
        hideAds: false,
        seeWhoLikedYou: false,
        incognitoMode: false
    },
    'gold-weekly': {
        dailyLikes: UNLIMITED, // Sınırsız
        dailySuperLikes: 5,
        dailyBoosts: 3,
        dailyRewinds: 5,
        hideAds: true,
        seeWhoLikedYou: true,
        incognitoMode: false
    },
    'gold-monthly': {
        dailyLikes: UNLIMITED,
        dailySuperLikes: 10,
        dailyBoosts: 10,
        dailyRewinds: UNLIMITED,
        hideAds: true,
        seeWhoLikedYou: true,
        incognitoMode: true
    },
    'gold-yearly': {
        dailyLikes: UNLIMITED,
        dailySuperLikes: UNLIMITED,
        dailyBoosts: UNLIMITED,
        dailyRewinds: UNLIMITED,
        hideAds: true,
        seeWhoLikedYou: true,
        incognitoMode: true
    }
};

/**
 * Yardımcı Fonksiyon: Belli bir tier adının mevcut olup olmadığını doğrular
 * Kullanıcının abonelik verisi silinmiş ya da yanlış gelirse fallback için kullanışlı.
 */
export const getTierLimits = (tierName: string | undefined | null): TierLimits => {
    if (!tierName || !SUBSCRIPTION_TIERS[tierName as SubscriptionTierType]) {
        return SUBSCRIPTION_TIERS['FREE'];
    }
    return SUBSCRIPTION_TIERS[tierName as SubscriptionTierType];
};
