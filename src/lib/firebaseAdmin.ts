'server-only';
import * as admin from 'firebase-admin';

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
 * @returns {FirebaseAdminApp} The initialized Firebase Admin services (auth and db).
 */
export function getFirebaseAdmin(): FirebaseAdminApp {
  // If the adminApp instance already exists, return it to avoid re-initialization.
  if (adminApp) {
    return adminApp;
  }
  
  try {
    // Check if there are no existing Firebase apps initialized. This is important
    // to prevent errors, especially in development environments with hot-reloading.
    if (admin.apps.length === 0) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
            console.warn("Firebase Admin credentials not found in environment variables. Admin features will be disabled during build.");
            // Return a dummy object or throw a specific error that can be caught later
            // For now, we'll throw to make it clear why admin features might fail at runtime.
            throw new Error("Missing Firebase Admin credentials in environment variables.");
        }

        // Initialize the Firebase Admin SDK with credentials from environment variables.
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    }

    // Create and cache the admin app instance with the required services.
    adminApp = {
      auth: admin.auth(),
      db: admin.firestore(),
    };

    return adminApp;

  } catch (error: any) {
    // If initialization fails, log the error for debugging purposes.
    // We re-throw the error so that server actions that depend on this will fail,
    // which is the correct behavior if admin SDK can't be initialized.
    console.error("Firebase Admin SDK Initialization Error:", error.message);
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}. Check your environment variables and private key format.`);
  }
}
