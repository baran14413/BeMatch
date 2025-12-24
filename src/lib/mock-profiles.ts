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
    interests: ['art', 'travel', 'reading', 'cooking'],
    location: 'İstanbul, TR',
    latitude: 41.0082,
    longitude: 28.9784,
    prompts: [
        { question: 'En son okuduğun kitap?', answer: 'Yeraltından Notlar. İnsanın iç dünyasına dair inanılmaz bir yolculuktu.' },
        { question: 'Bir hafta sonu kaçamağı için hayalindeki yer?', answer: 'Kesinlikle Kapadokya! Balonlarla gökyüzünde süzülmek harika olurdu.' }
    ],
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
    interests: ['music', 'travel', 'dancing'],
    location: 'İzmir, TR',
    latitude: 38.4237,
    longitude: 27.1428,
    prompts: [
        { question: 'Seni en çok ne güldürür?', answer: 'İyi bir stand-up gösterisi veya arkadaşlarımla yaptığım saçma şakalar.' },
    ],
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
    email: 'ceren@example.com',
    zodiac: 'Oğlak'
  },
    {
    id: 'mock_gizem_4',
    isSystemAccount: true,
    name: 'Gizem',
    firstName: 'Gizem',
    lastName: 'Aydın',
    age: 27,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNzE5ODZ8MHwxfGFsbHx8fHx8fHx8fDE2ODAwMDY2Mzc&ixlib=rb-1.2.1&q=80&w=1080',
    imageUrls: [
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNzE5ODZ8MHwxfGFsbHx8fHx8fHx8fDE2ODAwMDY2Mzc&ixlib=rb-1.2.1&q=80&w=1080',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNzE5ODZ8MHwxfGFsbHx8fHx8fHx8fDE2ODAwMDY2Mzc&ixlib=rb-1.2.1&q=80&w=1080'
    ],
    bio: 'Güneşi ve denizi seven, enerjisi yüksek biriyim. Hafta sonları yeni koylar keşfetmeyi, yoga yapmayı ve arkadaşlarımla gün batımını izlemeyi severim. Pozitif ve maceracı bir ruh.',
    gender: 'woman',
    interests: ['travel', 'yoga', 'photography'],
    location: 'Antalya, TR',
    latitude: 36.8969,
    longitude: 30.7133,
    prompts: [
        { question: 'Hayat motton nedir?', answer: 'Anı yaşa, pişman olma!' }
    ],
    email: 'gizem@example.com',
    zodiac: 'İkizler'
  },
  {
    id: 'mock_elif_5',
    isSystemAccount: true,
    name: 'Elif',
    firstName: 'Elif',
    lastName: 'Öztürk',
    age: 29,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNzE5ODZ8MHwxfGFsbHx8fHx8fHx8fDE2ODAwMDY2Mzc&ixlib=rb-1.2.1&q=80&w=1080',
    imageUrls: [
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNzE5ODZ8MHwxfGFsbHx8fHx8fHx8fDE2ODAwMDY2Mzc&ixlib=rb-1.2.1&q=80&w=1080'
    ],
    bio: 'Öğrenci ruhlu bir akademisyen. Sanat tarihi, eski filmler ve kahve kokusu hayatımın vazgeçilmezleri. Sakin bir akşamda iyi bir film izlemek gibisi yok.',
    gender: 'woman',
    interests: ['movies', 'reading', 'art'],
    location: 'Eskişehir, TR',
    latitude: 39.7667,
    longitude: 30.5256,
    prompts: [
        { question: 'Seni en çok etkileyen film?', answer: 'Blade Runner. Estetiği ve sorgulattığı felsefi konular büyüleyici.' }
    ],
    email: 'elif@example.com',
    zodiac: 'Başak'
  },
  {
    id: 'mock_busra_6',
    isSystemAccount: true,
    name: 'Büşra',
    firstName: 'Büşra',
    lastName: 'Şahin',
    age: 26,
    avatarUrl: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNzE5ODZ8MHwxfGFsbHx8fHx8fHx8fDE2ODAwMDY2Mzc&ixlib=rb-1.2.1&q=80&w=1080',
    imageUrls: [
        'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNzE5ODZ8MHwxfGFsbHx8fHx8fHx8fDE2ODAwMDY2Mzc&ixlib=rb-1.2.1&q=80&w=1080'
    ],
    bio: 'Tam bir adrenalin tutkunuyum! Fırsat buldukça yamaç paraşütü yapar, dağ bisikletine binerim. Maceraya her zaman varım.',
    gender: 'woman',
    interests: ['sports', 'hiking', 'travel'],
    location: 'Fethiye, TR',
    latitude: 36.6214,
    longitude: 29.1156,
    prompts: [],
    email: 'busra@example.com',
    zodiac: 'Koç'
  },
  {
    id: 'mock_yagmur_7',
    isSystemAccount: true,
    name: 'Yağmur',
    firstName: 'Yağmur',
    lastName: 'Çelik',
    age: 24,
    avatarUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNzE5ODZ8MHwxfGFsbHx8fHx8fHx8fDE2ODAwMDY2Mzc&ixlib=rb-1.2.1&q=80&w=1080',
    imageUrls: [
        'https://images.unsplash.com/photo-1548142813-c348350df52b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNzE5ODZ8MHwxfGFsbHx8fHx8fHx8fDE2ODAwMDY2Mzc&ixlib=rb-1.2.1&q=80&w=1080'
    ],
    bio: 'Biraz oyuncu, biraz da teknoloji meraklısıyım. Akşamları arkadaşlarla online oyun oynamak veya yeni çıkan bir diziyi "binge-watch" yapmak gibisi yok.',
    gender: 'woman',
    interests: ['gaming', 'movies', 'technology'],
    location: 'Bursa, TR',
    latitude: 40.1885,
    longitude: 29.0610,
    prompts: [],
    email: 'yagmur@example.com',
    zodiac: 'Kova'
  },
  {
    id: 'mock_deniz_8',
    isSystemAccount: true,
    name: 'Deniz',
    firstName: 'Deniz',
    lastName: 'Arslan',
    age: 31,
    avatarUrl: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNzE5ODZ8MHwxfGFsbHx8fHx8fHx8fDE2ODAwMDY2Mzc&ixlib=rb-1.2.1&q=80&w=1080',
    imageUrls: [
      'https://images.unsplash.com/photo-1554151228-14d9def656e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNzE5ODZ8MHwxfGFsbHx8fHx8fHx8fDE2ODAwMDY2Mzc&ixlib=rb-1.2.1&q=80&w=1080'
    ],
    bio: 'Gurme lezzetlerin ve iyi müziğin peşindeyim. Yeni restoranlar denemeyi, konserlere gitmeyi ve kendi mutfağımda yeni tarifler yaratmayı çok severim.',
    gender: 'woman',
    interests: ['cooking', 'music', 'foodie'],
    location: 'Gaziantep, TR',
    latitude: 37.0662,
    longitude: 37.3833,
    prompts: [
        { question: 'En sevdiğin mutfak hangisi?', answer: 'İtalyan mutfağına bayılırım ama Antep yemeklerinin yeri ayrı tabii.' }
    ],
    email: 'deniz@example.com',
    zodiac: 'Terazi'
  }
];
