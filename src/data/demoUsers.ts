export interface DemoUser {
    id: string | number
    name: string
    age: number
    bio: string
    distance: string
    photos: string[]
    interests: string[]
    lookingFor: string
    countryCode?: string
    job?: string
    school?: string
    subscription?: {
        planId: string
        planName: string
        status: 'active' | 'expired' | 'none'
        expiryDate: number
        period: string
    }
}

export const demoUsers: DemoUser[] = [
    {
        id: 1,
        name: 'Elif',
        age: 24,
        bio: 'Kahve bağımlısı ☕ Kitap kurdu 📚 Hayatı keşfetmeyi seviyorum ✨',
        distance: '3 km uzakta',
        photos: [
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
        ],
        interests: ['☕ Kahve', '📚 Kitap', '✈️ Seyahat', '🎵 Müzik'],
        lookingFor: 'Uzun süreli ilişki',
        job: 'Grafik Tasarımcı',
        school: 'İstanbul Üniversitesi',
    },
    {
        id: 2,
        name: 'Zeynep',
        age: 22,
        bio: 'Yoga & meditasyon 🧘‍♀️ Doğa aşığı 🌿 Pozitif enerji her zaman 💫',
        distance: '5 km uzakta',
        photos: [
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop',
        ],
        interests: ['🧘 Yoga', '🌿 Doğa', '📸 Fotoğraf', '🍳 Yemek'],
        lookingFor: 'Yeni insanlarla tanışma',
        job: 'Fizyoterapist',
        school: 'Ankara Üniversitesi',
    },
    {
        id: 3,
        name: 'Merve',
        age: 26,
        bio: 'Müzik hayatım 🎵 Gitar çalıyorum 🎸 Konser kaçırmam! 🎤',
        distance: '8 km uzakta',
        photos: [
            'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop',
        ],
        interests: ['🎵 Müzik', '🎸 Enstrüman', '🎬 Film', '💃 Dans'],
        lookingFor: 'Kısa da olur, uzun da',
        job: 'Müzik Öğretmeni',
    },
    {
        id: 4,
        name: 'Ayşe',
        age: 23,
        bio: 'Spor benim tutkum 💪 Maraton koşucusu 🏃‍♀️ Sağlıklı yaşam 🥗',
        distance: '2 km uzakta',
        photos: [
            'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1464863979621-258859e62245?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
        ],
        interests: ['⚽ Spor', '🏋️ Fitness', '🍳 Yemek', '🐾 Hayvanlar'],
        lookingFor: 'Uzun süreli ilişki',
        job: 'Diyetisyen',
        school: 'Ege Üniversitesi',
    },
    {
        id: 5,
        name: 'Selin',
        age: 25,
        bio: 'Dünyayı gezmek istiyorum 🗺️ Fotoğraf çekmeyi seviyorum 📷 Maceracı ruh 🌍',
        distance: '12 km uzakta',
        photos: [
            'https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1496440737103-cd596325d314?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&h=800&fit=crop',
        ],
        interests: ['✈️ Seyahat', '📸 Fotoğraf', '🎨 Sanat', '☕ Kahve'],
        lookingFor: 'Henüz emin değilim',
        job: 'Serbest Fotoğrafçı',
    },
    {
        id: 6,
        name: 'Büşra',
        age: 27,
        bio: 'Yazılımcı kız 💻 Kedi annesi 🐱 Anime hayranı 🎌',
        distance: '6 km uzakta',
        photos: [
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1557862921-37829c790f19?w=600&h=800&fit=crop',
        ],
        interests: ['💻 Teknoloji', '🎮 Oyun', '🐾 Hayvanlar', '📚 Kitap'],
        lookingFor: 'Uzun süreli ilişki',
        job: 'Frontend Developer',
        school: 'ODTÜ',
    },
]
