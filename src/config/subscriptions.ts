
export type SubscriptionFeature = {
  text: string; // This will now be the translation key, e.g., 'subscriptionsPage.features.unlimitedLikes'
  included: boolean;
};

export type SubscriptionPackage = {
  id: string;
  name: string; // This is the direct name like 'GOLD', not a key
  description: string; // Translation key for description
  features: SubscriptionFeature[];
  price: string;
  period: string; // Translation key for period, e.g., '/ay' -> 'subscriptionsPage.monthly'
  productId: string; // This is now the BASE PLAN ID from Google Play.
  isPopular?: boolean;
};

export const subscriptionPackages: SubscriptionPackage[] = [
  {
    id: 'premium',
    name: 'Premium',
    description: 'subscriptionsPage.description',
    productId: 'monthly-base', // Base Plan ID from Play Console
    price: '89.99 TL', // You should adjust this price in the UI
    period: 'subscriptionsPage.monthly',
    isPopular: true,
    features: [
      { text: 'subscriptionsPage.features.unlimitedSwipes', included: true },
      { text: 'subscriptionsPage.features.unlimitedLikes', included: true },
      { text: 'subscriptionsPage.features.unlimitedRewind', included: true },
      { text: 'subscriptionsPage.features.noAds', included: true },
      { text: 'subscriptionsPage.features.seeWhoLikesYou', included: true },
      { text: 'subscriptionsPage.features.superLikesWeeklyGold', included: true },
      { text: 'subscriptionsPage.features.boostMonthly', included: true },
      { text: 'subscriptionsPage.features.priorityLikes', included: true },
    ],
  },
];
