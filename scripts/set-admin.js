// This script sets a custom claim on a user to make them an admin.
// Usage: node scripts/set-admin.js <user_email>

const admin = require('firebase-admin');

// IMPORTANT: Replace this with the path to your service account key file
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Hata: Lütfen admin yapmak istediğiniz kullanıcının e-posta adresini girin.');
  console.log('Kullanım: node scripts/set-admin.js <kullanici_email>');
  process.exit(1);
}

admin
  .auth()
  .getUserByEmail(userEmail)
  .then((user) => {
    // See the UserRecord reference doc for the contents of userRecord.
    console.log(`Kullanıcı bulundu: ${user.uid}, ${user.email}`);
    console.log('Mevcut yetkileri:', user.customClaims);
    console.log('Admin yetkisi atanıyor...');

    return admin.auth().setCustomUserClaims(user.uid, {
      role: 'admin',
    });
  })
  .then(() => {
    console.log('Başarılı! Kullanıcıya "admin" rolü atandı.');
    console.log('Değişikliklerin etkili olması için kullanıcının yeniden giriş yapması gerekebilir.');
    process.exit(0);
  })
  .catch((error) => {
    console.log('Kullanıcı atanırken hata oluştu:', error);
    process.exit(1);
  });
