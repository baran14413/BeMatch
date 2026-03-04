import { db } from '../firebase'
import { serverTimestamp, writeBatch, doc } from 'firebase/firestore'

const FEMALE_NAMES = ['Elif', 'Zeynep', 'Merve', 'Ayşe', 'Selin', 'Büşra', 'Derya', 'Gözde', 'Hilal', 'İrem', 'Kübra', 'Leyla', 'Melek', 'Nihal', 'Özgür', 'Pelin', 'Rüya', 'Seda', 'Tuğba', 'Yağmur', 'Ece', 'Buse', 'Damla', 'Gizem', 'Hazel', 'Melis', 'Nilay', 'Pınar', 'Sude', 'Yaren']
const MALE_NAMES = ['Ahmet', 'Mehmet', 'Can', 'Demir', 'Eren', 'Fatih', 'Gökhan', 'Hakan', 'İbrahim', 'Kaan', 'Levent', 'Murat', 'Nihat', 'Oğuz', 'Polat', 'Rıza', 'Serkan', 'Tolga', 'Umut', 'Volkan', 'Burak', 'Cihan', 'Deniz', 'Emre', 'Furkan', 'Güney', 'Hüseyin', 'İsmet', 'Kerem', 'Mert']

const BIOS = [
    'Kahve seviyorum ☕', 'Seyahat etmeyi severim ✈️', 'Kitap kurdu 📚', 'Müzik hayatım 🎵', 'Yoga & Meditasyon 🧘‍♀️',
    'Doğa aşığı 🌿', 'Spor benim için önemli 💪', 'Yeni yerler keşfetmek 🌍', 'Yemek yapmayı severim 🍳', 'Fotoğrafçılık 📸',
    'Yürüyüş ve kamp 🏕️', 'Yeni tatlar denemek 🍝', 'Film ve dizi tutkunu 🍿', 'Kedileri çok severim 🐈', 'Dans etmek ruhumu besler 💃'
]

interface BotOptions {
    count: number;
    city: string;
    gender: 'male' | 'female' | 'random';
}

export async function generateBots(
    options: BotOptions,
    onProgress: (current: number, total: number) => void
) {
    const { count, city, gender } = options;
    let createdCount = 0;

    // Use chunks of 50 for batches
    const BATCH_SIZE = 50;
    const totalBatches = Math.ceil(count / BATCH_SIZE);

    for (let b = 0; b < totalBatches; b++) {
        const batch = writeBatch(db);
        const currentBatchSize = Math.min(BATCH_SIZE, count - createdCount);

        for (let i = 0; i < currentBatchSize; i++) {
            const botGender = gender === 'random' ? (Math.random() > 0.5 ? 'male' : 'female') : gender;
            const namesPool = botGender === 'female' ? FEMALE_NAMES : MALE_NAMES;
            const name = namesPool[Math.floor(Math.random() * namesPool.length)];

            // Unique Photo Strategy: Use Unsplash source with specific keywords and a random seed (sig)
            // This ensures uniqueness for every generated bot
            const randomSeed = Math.floor(Math.random() * 1000000);
            const photoKeyword = botGender === 'female' ? 'woman,portrait' : 'man,portrait';
            const photoUrl = `https://source.unsplash.com/featured/600x800?${photoKeyword}&sig=${randomSeed}`;

            const botId = `bot_${botGender === 'female' ? 'f' : 'm'}_${city}_${Date.now()}_${createdCount}`;
            const userRef = doc(db, 'users', botId);

            batch.set(userRef, {
                uid: botId,
                firstName: name,
                gender: botGender,
                locationCity: city,
                isBot: true,
                eloScore: 100,
                bio: BIOS[Math.floor(Math.random() * BIOS.length)],
                birthDate: `01/01/${1990 + Math.floor(Math.random() * 20)}`, // Ages 14-34 roughly
                photos: [photoUrl],
                createdAt: serverTimestamp(),
                role: 'user',
                online: true,
                lastSeen: Date.now(),
                isPremium: Math.random() > 0.8 // 20% premium bots
            });

            createdCount++;
        }

        await batch.commit();
        onProgress(createdCount, count);
    }

    return createdCount;
}

export const TURKEY_CITIES = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın', 'Balıkesir',
    'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli',
    'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari',
    'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
    'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir',
    'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat',
    'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman',
    'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
];
