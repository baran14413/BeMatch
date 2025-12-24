'server-only';
import * as admin from 'firebase-admin';

// IMPORTANT: This setup expects a 'serviceAccountKey.json' file in your project's root directory.
// Go to your Firebase project settings -> Service accounts -> Generate new private key.
let serviceAccount;
try {
  // This is the standard way to include the service account key in a secure server environment.
  serviceAccount = require('../../../serviceAccountKey.json');
} catch (e) {
  // Catch the error if the file doesn't exist, but don't log anything here.
  // The check below will provide a more informative message.
  serviceAccount = null;
}

// Define the structure for the cached Firebase Admin application instance.
interface FirebaseAdminApp {
  auth: admin.auth.Auth;
  db: admin.firestore.Firestore;
}

// Use a singleton pattern to ensure Firebase Admin is initialized only once.
let adminApp: FirebaseAdminApp | undefined;

/**
 * A getter function to initialize and/or retrieve the Firebase Admin services.
 * This ensures that initialization only happens once per server instance.
 * Returns null if credentials are not available, preventing build failures.
 * @returns {FirebaseAdminApp | null} The initialized Firebase Admin services or null.
 */
export function getFirebaseAdmin(): FirebaseAdminApp | null {
  // If the adminApp instance already exists, return it to avoid re-initialization.
  if (adminApp) {
    return adminApp;
  }
  
  // If serviceAccount is null (file not found), log a specific warning and return null.
  if (!serviceAccount) {
    console.warn(
        'Firebase Admin initialization skipped: "serviceAccountKey.json" not found in the project root. Admin features will be disabled.'
    );
    return null;
  }
  
  try {
    // Initialize the app only if it hasn't been initialized yet.
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }

    // Create and cache the admin app instance with the required services.
    adminApp = {
      auth: admin.auth(),
      db: admin.firestore(),
    };

    console.log("Firebase Admin SDK initialized successfully.");
    return adminApp;

  } catch (error: any) {
    // This will catch any parsing errors or other initialization issues.
    console.error("Firebase Admin SDK Initialization Error:", error.message);
    // Provide a more helpful error message if the key is likely malformed.
    if (error.message.includes('Invalid credential')) {
         console.error('Hint: The "serviceAccountKey.json" file might be corrupted or malformed. Please re-download it from your Firebase project settings.');
    }
    return null; // Return null on error to prevent crashing.
  }
}
