'server-only';
import * as admin from 'firebase-admin';

// IMPORTANT: Create a 'serviceAccountKey.json' file in your project's root directory.
// Go to your Firebase project settings -> Service accounts -> Generate new private key.
let serviceAccount;
try {
  // This is the standard way to include the service account key in a secure server environment.
  // Ensure the file path is correct and the file is present.
  serviceAccount = require('../../../serviceAccountKey.json');
} catch (e) {
  console.warn(
    'Firebase Admin initialization skipped: serviceAccountKey.json not found. Admin features will be disabled.'
  );
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
  
  // If serviceAccount is null (file not found), return null immediately.
  if (!serviceAccount) {
    return null;
  }
  
  try {
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

    return adminApp;

  } catch (error: any) {
    // This will catch any parsing errors or other initialization issues.
    console.error("Firebase Admin SDK Initialization Error:", error.message);
    return null; // Return null on error to prevent crashing the build.
  }
}
