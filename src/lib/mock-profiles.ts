'use client';
import type { UserProfile } from './data';

export const mockProfiles: UserProfile[] = [
  {
    id: 'mock_asli_1',
    isSystemAccount: true,
    name: 'Aslı',
    firstName: 'Aslı',
    lastName: 'Yılmaz',
    age: 28,
    avatarUrl: 'https://images.unsplash.com/photo-1557053910-d9eadeed1c58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0fGVufDB8fHx8MTc2NDcwNjIzNXww&ixlib=rb-4.1.0&q=80&w=1080',
    imageUrls: [
      'https://images.unsplash.com/photo-1557053910-d9eadeed1c58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0fGVufDB8fHx8MTc2NDcwNjIzNXww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1659892603525-cf7845582784?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHx3b21hbiUyMGhpa2luZ3xlbnwwfHx8fDE3NjQ3MTM4ODN8MA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1611244420030-b22f359eee31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHx3b21hbiUyMHBhaW50aW5nfGVufDB8fHx8MTc2NDY0NjQ0NHww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    bio: 'Hayatı dolu dolu yaşamayı seven biriyim. Sanat galerilerini gezmek, yeni yerler keşfetmek ve güzel bir kahve eşliğinde kitap okumak en büyük keyiflerim.',
    gender: 'woman',
    interests: ['art', 'travel', 'reading', 'coffee'],
    location: 'İstanbul, TR',
    latitude: 41.0082,
    longitude: 28.9784,
    prompts: [
        { question: 'En son okuduğun kitap?', answer: 'Yeraltından Notlar. İnsanın iç dünyasına dair inanılmaz bir yolculuktu.' },
        { question: 'Bir hafta sonu kaçamağı için hayalindeki yer?', answer: 'Kesinlikle Kapadokya! Balonlarla gökyüzünde süzülmek harika olurdu.' }
    ],
    // Mock-specific fields
    email: 'asli@example.com',
    zodiac: 'Yengeç',
    premiumTier: 'gold'
  },
  {
    id: 'mock_ebru_2',
    isSystemAccount: true,
    name: 'Ebru',
    firstName: 'Ebru',
    lastName: 'Kaya',
    age: 25,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHx3b21hbiUyMHNtaWxpbmd8ZW58MHx8fHwxNzY0NzA1ODUwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    imageUrls: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHx3b21hbiUyMHNtaWxpbmd8ZW58MHx8fHwxNzY0NzA1ODUwfDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1532347922424-c652d9b7208e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHx3b21hbiUyMGJlYWNofGVufDB8fHx8MTc2NDYyNjg4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    bio: 'Yaz insanıyım! Deniz, kum, güneş üçlüsü olmadan yapamam. Arkadaşlarımla sahilde vakit geçirmeyi ve yeni müzikler keşfetmeyi severim.',
    gender: 'woman',
    interests: ['music', 'travel', 'beach', 'dancing'],
    location: 'İzmir, TR',
    latitude: 38.4237,
    longitude: 27.1428,
    prompts: [
        { question: 'Seni en çok ne güldürür?', answer: 'İyi bir stand-up gösterisi veya arkadaşlarımla yaptığım saçma şakalar.' },
    ],
    // Mock-specific fields
    email: 'ebru@example.com',
    zodiac: 'Aslan'
  },
  {
    id: 'mock_ceren_3',
    isSystemAccount: true,
    name: 'Ceren',
    firstName: 'Ceren',
    lastName: 'Demir',
    age: 30,
    avatarUrl: 'https://images.unsplash.com/photo-1526835746352-0b9da4054862?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHx3b21hbiUyMHByb2ZpbGV8ZW58MHx8fHwxNzY0NjcxNzAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    imageUrls: [
      'https://images.unsplash.com/photo-1526835746352-0b9da4054862?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHx3b21hbiUyMHByb2ZpbGV8ZW58MHx8fHwxNzY0NjcxNzAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    bio: 'Kariyer odaklı ama eğlenmeyi de bilen biriyim. İş çıkışı spora gitmek veya arkadaşlarımla güzel bir akşam yemeği yemek favorim.',
    gender: 'woman',
    interests: ['fitness', 'cooking', 'movies', 'technology'],
    location: 'Ankara, TR',
    latitude: 39.9334,
    longitude: 32.8597,
    prompts: [],
    // Mock-specific fields
    email: 'ceren@example.com',
    zodiac: 'Oğlak'
  },
];
