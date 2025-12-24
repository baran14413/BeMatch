'server-only';
import * as admin from 'firebase-admin';

// Initialize a variable to hold the service account credentials.
let serviceAccount: admin.ServiceAccount;

try {
  // Attempt to load the service account key from the JSON file.
  // Using require() is a common pattern in Node.js for loading JSON files.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  serviceAccount = require('../../serviceAccountKey.json');
} catch (error) {
    // If the file fails to load, log a detailed error message and stop execution.
    console.error("CRITICAL: Failed to load serviceAccountKey.json. Make sure the file exists in the root directory of your project.", error);
    // This error is thrown to prevent the application from starting without proper admin configuration.
    throw new Error("serviceAccountKey.json is missing or invalid. This file is required for Firebase Admin SDK initialization.");
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
        // Initialize the Firebase Admin SDK with the loaded service account credentials.
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
    // If initialization fails, log the error for debugging purposes.
    console.error("Firebase Admin SDK Initialization Error:", error.message);
    // Re-throw a more user-friendly error to be surfaced in the application logs.
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}. Check your service account credentials.`);
  }
}
