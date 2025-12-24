
export type PricingPlan = {
  productId: string; // Google Play Product ID
  period: 'weekly' | 'monthly' | 'yearly';
  price: string; // Display price, e.g., '89.99 TL'
  badge?: string;
};

export type SubscriptionFeature = {
  text: string;
  included: boolean;
};

export type SubscriptionPackage = {
  id: string; // e.g., 'gold'
  name: string;
  colors: {
    from: string;
    to: string;
  };
  features: SubscriptionFeature[];
  pricing: PricingPlan[];
};

// We now have only one main package with different pricing tiers.
export const mainSubscriptionPackage: SubscriptionPackage = {
  id: 'gold',
  name: 'BeMatch GOLD',
  colors: {
    from: '#f59e0b', // amber-500
    to: '#fcd34d',   // amber-300
  },
  features: [
    { text: 'subscriptionsPage.features.unlimitedLikes', included: true },
    { text: 'subscriptionsPage.features.unlimitedRewind', included: true },
    { text: 'subscriptionsPage.features.seeWhoLikesYou', included: true },
    { text: 'subscriptionsPage.features.superLikesWeeklyGold', included: true },
    { text: 'subscriptionsPage.features.boostMonthly', included: true },
    { text: 'subscriptionsPage.features.passport', included: true },
    { text: 'subscriptionsPage.features.priorityLikes', included: true },
    { text: 'subscriptionsPage.features.noAds', included: true },
  ],
  pricing: [
    { productId: 'weekly-base', period: 'weekly', price: '39.99 TL' },
    { productId: 'monthly-base', period: 'monthly', price: '89.99 TL', badge: 'En Popüler' },
    { productId: 'yearly-base', period: 'yearly', price: '499.99 TL', badge: 'Süper Avantaj' },
  ],
};
