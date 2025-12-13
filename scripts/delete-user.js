// This script PERMANENTLY deletes a user from Firebase Authentication,
// their profile from Firestore, and all their associated files from Cloud Storage.
// Usage: node scripts/delete-user.js <user-uid>

const admin = require('firebase-admin');
const path = require('path');

// --- IMPORTANT ---
// 1. Download your service account key JSON file from the Firebase console.
//    (Project Settings > Service accounts > Generate new private key)
// 2. Rename it to `serviceAccountKey.json` and place it in the root of this project.
// 3. This file is already in .gitignore to prevent it from being committed.
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (e) {
  console.error('\x1b[31m%s\x1b[0m', 'ERROR: `serviceAccountKey.json` not found in the project root.');
  console.error('Please download it from your Firebase project settings (Service Accounts tab) and place it in the root directory.');
  process.exit(1);
}

// Get the UID from the command line arguments
const uid = process.argv[2];

if (!uid) {
  console.error('\x1b[31m%s\x1b[0m', 'ERROR: Please provide the user\'s UID as an argument.');
  console.log('Usage: node scripts/delete-user.js <user-uid>');
  process.exit(1);
}

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.appspot.com`
});

const auth = admin.auth();
const firestore = admin.firestore();
const storage = admin.storage().bucket();

const deleteUserAndData = async (uidToDelete) => {
  console.log(`Starting deletion process for UID: ${uidToDelete}...`);

  // 1. Delete from Cloud Storage
  try {
    const prefix = `users/${uidToDelete}/`;
    await storage.deleteFiles({ prefix });
    console.log(`✅ Successfully deleted all files in Storage for folder: ${prefix}`);
  } catch (error) {
    if (error.code === 404) {
        console.log(`⚠️  No files found in Storage for user ${uidToDelete}. Skipping.`);
    } else {
        console.error('\x1b[31m%s\x1b[0m', `❌ Error deleting files from Storage for UID ${uidToDelete}:`);
        console.error(error);
        // We will continue to try deleting from Firestore and Auth
    }
  }

  // 2. Delete from Firestore
  try {
    const userDocRef = firestore.collection('users').doc(uidToDelete);
    await userDocRef.delete();
    console.log(`✅ Successfully deleted Firestore document for UID ${uidToDelete}.`);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ Error deleting Firestore document for UID ${uidToDelete}:`);
    console.error(error);
     // We will continue to try deleting from Auth
  }
  
  // 3. Delete from Firebase Authentication
  try {
    await auth.deleteUser(uidToDelete);
    console.log(`✅ Successfully deleted user from Authentication for UID ${uidToDelete}.`);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
        console.error('\x1b[31m%s\x1b[0m', `ERROR: User with UID "${uidToDelete}" not found in Firebase Authentication.`);
    } else {
        console.error('\x1b[31m%s\x1b[0m', `❌ Error deleting user from Authentication for UID ${uidToDelete}:`);
        console.error(error);
    }
    return; // Exit if Auth deletion fails
  }
  
  console.log('\x1b[32m%s\x1b[0m', `\n🎉 Deletion process complete for UID: ${uidToDelete}`);
};

deleteUserAndData(uid).then(() => {
    process.exit(0);
}).catch(() => {
    process.exit(1);
});
