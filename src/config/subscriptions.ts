
export type PricingPlan = {
  productId: string; // Add the Google Play Product ID here
  period: 'weekly' | 'monthly' | 'yearly';
  price: string;
  badge?: string;
};

export type SubscriptionFeature = {
  text: string;
  included: boolean;
};

export type SubscriptionPackage = {
  id: string; // e.g., 'plus', 'gold', 'platinum'
  name: string;
  tierLevel: number;
  isPopular: boolean;
  colors: {
    from: string;
    to: string;
  };
  features: SubscriptionFeature[];
  pricing: PricingPlan[];
};

export const subscriptionPackages: SubscriptionPackage[] = [
  {
    id: 'plus',
    name: 'BeMatch PLUS',
    tierLevel: 1,
    isPopular: false,
    colors: {
      from: '#64748b', // slate-500
      to: '#94a3b8',   // slate-400
    },
    features: [
      { text: 'subscriptionsPage.features.noAds', included: true },
      { text: 'subscriptionsPage.features.unlimitedLikes', included: true },
      { text: 'subscriptionsPage.features.unlimitedRewind', included: true },
      { text: 'subscriptionsPage.features.superLikesWeekly', included: true },
      { text: 'subscriptionsPage.features.hideProfile', included: false },
      { text: 'subscriptionsPage.features.boostMonthly', included: false },
      { text: 'subscriptionsPage.features.passport', included: false },
      { text: 'subscriptionsPage.features.priorityLikes', included: false },
    ],
    pricing: [
      { productId: 'plus_weekly', period: 'weekly', price: '69.99' },
      { productId: 'plus_monthly', period: 'monthly', price: '199.99', badge: '≈%30' },
      { productId: 'plus_yearly', period: 'yearly', price: '1,199.99', badge: 'En Avantajlı' },
    ],
  },
  {
    id: 'gold',
    name: 'BeMatch GOLD',
    tierLevel: 2,
    isPopular: true,
    colors: {
      from: '#f59e0b', // amber-500
      to: '#fcd34d',   // amber-300
    },
    features: [
      { text: 'subscriptionsPage.features.allPlus', included: true },
      { text: 'subscriptionsPage.features.superLikesWeeklyGold', included: true },
      { text: 'subscriptionsPage.features.boostMonthly', included: true },
      { text: 'subscriptionsPage.features.passport', included: true },
      { text: 'subscriptionsPage.features.hideProfile', included: true },
      { text: 'subscriptionsPage.features.priorityLikes', included: false },
    ],
    pricing: [
      { productId: 'gold_weekly', period: 'weekly', price: '119.99' },
      { productId: 'gold_monthly', period: 'monthly', price: '349.99' },
      { productId: 'gold_yearly', period: 'yearly', price: '2,399.99', badge: 'En Popüler' },
    ],
  },
  {
    id: 'platinum',
    name: 'BeMatch PLATINUM',
    tierLevel: 3,
    isPopular: false,
    colors: {
      from: '#1f2937', // gray-800
      to: '#4b5563',   // gray-600
    },
    features: [
      { text: 'subscriptionsPage.features.allGold', included: true },
      { text: 'subscriptionsPage.features.priorityLikes', included: true },
      { text: 'subscriptionsPage.features.superLikesWeeklyVip', included: true },
    ],
    pricing: [
      { productId: 'platinum_weekly', period: 'weekly', price: '199.99' },
      { productId: 'platinum_monthly', period: 'monthly', price: '599.99' },
      { productId: 'platinum_yearly', period: 'yearly', price: '4,199.99', badge: 'VIP' },
    ],
  },
];
