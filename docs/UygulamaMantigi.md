# "BeMatch" Uygulama Mimarisi ve Mantığı

Bu doküman, BeMatch flört uygulamasının teknik mimarisini, temel iş mantığını ve kod yapısını açıklamaktadır.

## 1. Teknoloji Mimarisi

Uygulama, modern ve ölçeklenebilir bir web uygulaması oluşturmak için aşağıdaki teknolojiler üzerine kurulmuştur:

-   **Frontend Framework:** **Next.js 14** (App Router ile) - Sunucu Taraflı Bileşenler (Server Components) ve İstemci Taraflı Bileşenler (Client Components) özelliklerinden faydalanır.
-   **UI Kütüphanesi:** **ShadCN UI** ve **Tailwind CSS** - Hızlı, özelleştirilebilir ve modern bir arayüz oluşturmak için kullanılır.
-   **Animasyonlar:** **Framer Motion** - Akıcı ve interaktif kullanıcı arayüzü animasyonları için kullanılır.
-   **Backend ve Veritabanı:** **Firebase**
    -   **Authentication:** E-posta/şifre ile kullanıcı girişi ve kaydı.
    -   **Firestore:** Kullanıcı profilleri, eşleşmeler, sohbet mesajları gibi tüm ana verilerin saklandığı NoSQL veritabanı.
    -   **Realtime Database:** Kullanıcıların çevrimiçi/çevrimdışı (presence) durumlarını anlık olarak takip etmek için kullanılır.
    -   **Storage:** Kullanıcıların profil fotoğraflarını ve sohbet içinde gönderilen medyaları (resim, ses kaydı) saklamak için kullanılır.
-   **Sunucu Taraflı İşlemler:** **Next.js Server Actions** ve **Firebase Admin SDK** - Güvenlik kurallarını atlayarak yönetici panelinde veri çekme gibi yetkili işlemler için kullanılır.
-   **Form Yönetimi:** **React Hook Form** - Özellikle çok adımlı kayıt sihirbazında form durumunu yönetmek için kullanılır.
-   **Durum Yönetimi (State Management):** **React Context API** - Kullanıcı oturumu (`FirebaseProvider`), kayıt formu verileri (`OnboardingProvider`) ve dil seçenekleri (`LanguageProvider`) gibi global durumları yönetmek için kullanılır.

## 2. Temel Kullanıcı Akışı ve Mantığı

### a. Kayıt ve Oturum Açma

-   **Onboarding (Yeni Kullanıcı Kaydı):** Yeni bir kullanıcı, `OnboardingWizard` bileşeni üzerinden çok adımlı bir sihirbazla kayıt olur. Bu süreçte adı, yaşı, ilgi alanları, fotoğrafları gibi temel profil bilgileri toplanır ve `OnboardingContext` içinde geçici olarak saklanır. Son adımda `createUserWithEmailAndPassword` ile Firebase Auth'da kullanıcı oluşturulur ve toplanan tüm verilerle birlikte Firestore'da yeni bir `users` belgesi yaratılır.
-   **Login (Giriş):** Mevcut kullanıcılar, `Login` bileşeni üzerinden e-posta ve şifreleriyle `signInWithEmailAndPassword` fonksiyonu kullanılarak giriş yapar.

### b. Ana Ekranlar

-   **/discover (Keşfet):** Uygulamanın ana ekranıdır. Diğer kullanıcıların profilleri kartlar halinde sunulur. Kullanıcılar kartları sağa (beğen), sola (geç) veya yukarı (süper beğen) kaydırabilir.
    -   **Eşleşme Mantığı:** Bir kullanıcı (A), diğer bir kullanıcıyı (B) beğendiğinde (sağa kaydırdığında), sistem B kullanıcısının `likedBy` alt koleksiyonuna A kullanıcısının ID'si ile bir belge yazar. Ardından, A kullanıcısının `likedBy` koleksiyonunda B'den gelen bir beğeni olup olmadığını kontrol eder. Eğer varsa, bu bir **eşleşmedir (match)**. `matches` koleksiyonunda her iki kullanıcının ID'sini içeren yeni bir belge (sohbet odası) oluşturulur.
-   **/likes (Beğeniler):** Mevcut kullanıcıyı beğenen kişilerin profillerinin listelendiği ekrandır. Bu ekran, `users/{userId}/likedBy` koleksiyonundaki verileri okuyarak çalışır. Premium üye olmayan kullanıcılar için profiller bulanık gösterilir.
-   **/lounge (Sohbet Listesi):** Kullanıcının tüm aktif eşleşmelerinin (sohbetlerinin) listelendiği yerdir. `matches` koleksiyonunda, mevcut kullanıcının ID'sini içeren belgeleri sorgulayarak bu listeyi oluşturur. Her sohbet için son mesajı ve okunmamış mesaj durumunu gösterir.
-   **/chat/{chatId} (Sohbet Ekranı):** İki kullanıcının özel olarak mesajlaştığı ekrandır. Mesajlar, `matches/{matchId}/messages` alt koleksiyonunda saklanır. Bu ekranda ayrıca sesli mesaj kaydetme, resim gönderme, mesaja tepki verme gibi interaktif özellikler bulunur.
-   **/profile (Profil):** Kullanıcının kendi profilini görüntülediği ve ayarlar sayfasına geçiş yapabildiği ekrandır.

## 3. Veritabanı Yapısı (Firestore)

-   `/users/{userId}`: Her kullanıcının ana profil bilgilerini (isim, yaş, bio, resim URL'leri, ilgi alanları, tercihleri vb.) içeren belge.
-   `/users/{userId}/likedBy/{likerId}`: `{userId}`'yi beğenen kullanıcıların (`{likerId}`) kim ve ne tür bir beğeni (`like`, `superlike`) attığını tutan alt koleksiyon.
-   `/matches/{matchId}`: İki kullanıcı arasında bir eşleşme olduğunda oluşturulan sohbet odasıdır. `{matchId}` genellikle iki kullanıcının ID'sinin birleştirilmesiyle oluşturulur. Bu belge, `users` dizisi (katılımcıları belirtir) ve son mesaj gibi bilgileri içerir.
-   `/matches/{matchId}/messages/{messageId}`: Belirli bir sohbete ait tüm mesajların saklandığı alt koleksiyon. Her mesaj; gönderen ID'si, metin, zaman damgası ve okunma durumu gibi veriler içerir.
-   `/reports/{reportId}`: Bir kullanıcının başka bir kullanıcıyı şikayet etmesi durumunda oluşturulan belge. Yönetici panelinden incelenir.

## 4. Güvenlik Kuralları

-   **`firestore.rules`:**
    -   Bir kullanıcı sadece kendi profil belgesini (`/users/{kendiId}`) yazabilir.
    -   Herkes diğer kullanıcıların profilini okuyabilir (Keşfet ekranı için gereklidir).
    -   Bir kullanıcı, sadece kendi dahil olduğu `match` belgesini ve o `match` içindeki mesajları okuyup yazabilir.
    -   Yöneticiler (`admin` rolü), belirli kuralları atlayarak verilere erişebilir (örneğin, raporları okumak).
-   **`storage.rules`:**
    -   Bir kullanıcı sadece kendi klasörüne (`/users/{kendiId}/photos/`) profil fotoğrafı yükleyebilir.
    -   Bir kullanıcı, sadece katılımcısı olduğu bir sohbete (`/chats/{matchId}/...`) resim veya ses kaydı yükleyebilir.

## 5. Yönetici (Admin) Paneli

-   **Amaç:** Yöneticilere (admin, moderatör) uygulama verilerini (kullanıcılar, eşleşmeler, raporlar) görüntüleme ve yönetme imkanı sunar.
-   **Teknik Mantık:** Admin panelindeki veri okuma işlemleri, normal kullanıcıların tabi olduğu Firestore Güvenlik Kurallarından etkilenmez. Bunun nedeni, bu işlemlerin **Firebase Admin SDK** kullanan **Server Action**'lar aracılığıyla yapılmasıdır.
    -   `src/actions/match-actions.ts` gibi dosyalar `'use server'` direktifi ile sunucu tarafında çalışır.
    -   Bu dosyalar, tam yetkiye sahip olan `adminDb` nesnesini (`src/lib/firebaseAdmin.ts`) kullanarak Firestore'a doğrudan sorgu atar.
    -   Bu sayede, "tüm eşleşmeleri listele" gibi normalde bir istemcinin yapamayacağı işlemleri güvenli bir şekilde gerçekleştirir.
    -   Sonuçlar, istemci bileşenine (örneğin, `MatchesTable.tsx`) serileştirilmiş veri olarak döndürülür.

## 6. Önemli Bileşenler ve Kancalar (Hooks)

-   `useUser()`: Mevcut kullanıcının kimlik doğrulama durumunu (`user`, `isUserLoading`) global olarak sağlayan özel bir kancadır.
-   `useCollection()` ve `useDoc()`: Firestore koleksiyonlarına veya belgelerine anlık (real-time) olarak abone olmayı kolaylaştıran kancalardır. Veri değişiklikleri olduğunda bileşenin otomatik olarak yeniden render edilmesini sağlarlar.
-   `PresenceProvider`: Firebase Realtime Database'i kullanarak bir kullanıcının uygulamada "çevrimiçi" mi yoksa "çevrimdışı" mı olduğunu takip eder ve bu bilgiyi diğer kullanıcılara (örneğin sohbet ekranında) gösterir.
-   `FirebaseErrorListener`: Uygulama genelinde oluşan Firestore izin hatalarını (permission errors) yakalayıp Next.js'in hata ekranında detaylı bir şekilde gösteren merkezi bir hata dinleyicisidir. Bu, geliştirme sürecinde hataların kaynağını bulmayı çok kolaylaştırır.
