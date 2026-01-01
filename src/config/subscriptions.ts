
export type SubscriptionFeature = {
  text: string; // This will now be the translation key, e.g., 'subscriptionsPage.features.unlimitedLikes'
  included: boolean;
};

export type SubscriptionPackage = {
  id: string;
  name: string; // This is the direct name like 'GOLD', not a key
  description: string; // Translation key for description
  colors: {
    from: string;
    to: string;
    badge: string;
  };
  features: SubscriptionFeature[];
  price: string;
  period: string; // Translation key for period, e.g., '/ay' -> 'subscriptionsPage.monthly'
  productId: string; // The ID used in our app's logic (e.g., 'monthly-plan')
  isPopular?: boolean;
};

export const subscriptionPackages: SubscriptionPackage[] = [
  {
    id: 'weekly',
    name: 'Haftalık',
    description: 'Temel özelliklerle hızlı bir başlangıç yapın.',
    productId: 'weekly-plan', // Updated from weekly-base
    price: '39.99 TL',
    period: 'subscriptionsPage.weekly',
    colors: {
      from: '#6b7280',
      to: '#4b5563',
      badge: 'bg-gray-500',
    },
    features: [
      { text: 'subscriptionsPage.features.unlimitedLikes', included: true },
      { text: 'subscriptionsPage.features.unlimitedRewind', included: false },
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
    productId: 'monthly-plan', // Updated from monthly-base
    price: '89.99 TL',
    period: 'subscriptionsPage.monthly',
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
      { text: 'subscriptionsPage.features.boostMonthly', included: false },
      { text: 'subscriptionsPage.features.priorityLikes', included: false },
    ],
  },
  {
    id: 'platinum',
    name: 'PLATINUM',
    description: 'Tüm ayrıcalıklardan yararlan ve zirveye oyna.',
    productId: 'yearly-plan', // Updated from yearly-base
    price: '499.99 TL',
    period: 'subscriptionsPage.yearly',
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
