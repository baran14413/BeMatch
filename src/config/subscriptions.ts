
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
  description: string;
  colors: {
    from: string;
    to: string;
    badge: string;
  };
  features: SubscriptionFeature[];
  price: string;
  period: string;
  productId: string;
  isPopular?: boolean;
};

// We now have three distinct packages.
export const subscriptionPackages: SubscriptionPackage[] = [
  {
    id: 'weekly',
    name: 'Haftalık',
    description: 'Temel özelliklerle hızlı bir başlangıç yapın.',
    productId: 'weekly-base',
    price: '39.99 TL',
    period: '/hafta',
    colors: {
      from: '#6b7280',
      to: '#4b5563',
      badge: 'bg-gray-500',
    },
    features: [
      { text: 'subscriptionsPage.features.unlimitedLikes', included: true },
      { text: 'subscriptionsPage.features.unlimitedRewind', included: true },
      { text: 'subscriptionsPage.features.noAds', included: true },
      { text: 'subscriptionsPage.features.seeWhoLikesYou', included: false },
      { text: 'subscriptionsPage.features.superLikesWeeklyGold', included: false },
      { text: 'subscriptionsPage.features.boostMonthly', included: false },
      { text: 'subscriptionsPage.features.priorityLikes', included: false },
    ],
  },
  {
    id: 'gold',
    name: 'GOLD',
    description: 'En popüler özelliklerle eşleşme şansını artır.',
    productId: 'monthly-base',
    price: '89.99 TL',
    period: '/ay',
    isPopular: true,
    colors: {
      from: '#f59e0b',
      to: '#fcd34d',
      badge: 'bg-yellow-500',
    },
    features: [
      { text: 'subscriptionsPage.features.unlimitedLikes', included: true },
      { text: 'subscriptionsPage.features.unlimitedRewind', included: true },
      { text: 'subscriptionsPage.features.noAds', included: true },
      { text: 'subscriptionsPage.features.seeWhoLikesYou', included: true },
      { text: 'subscriptionsPage.features.superLikesWeeklyGold', included: true },
      { text: 'subscriptionsPage.features.boostMonthly', included: true },
      { text: 'subscriptionsPage.features.priorityLikes', included: false },
    ],
  },
  {
    id: 'platinum',
    name: 'PLATINUM',
    description: 'Tüm ayrıcalıklardan yararlan ve zirveye oyna.',
    productId: 'yearly-base',
    price: '499.99 TL',
    period: '/yıl',
    colors: {
      from: '#6d28d9',
      to: '#a78bfa',
      badge: 'bg-violet-600',
    },
    features: [
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
