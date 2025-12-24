'server-only';
import * as admin from 'firebase-admin';

let serviceAccount: admin.ServiceAccount;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  serviceAccount = require('../../serviceAccountKey.json');
} catch (error) {
    console.error("Failed to load serviceAccountKey.json. Make sure the file exists in the root directory.", error);
    throw new Error("serviceAccountKey.json is missing or invalid. This file is required for Firebase Admin SDK initialization.");
}


interface FirebaseAdminApp {
  auth: admin.auth.Auth;
  db: admin.firestore.Firestore;
}

// Singleton pattern to initialize Firebase Admin only once.
let adminApp: FirebaseAdminApp | undefined;

function getFirebaseAdmin(): FirebaseAdminApp {
  // If already initialized, return the existing instance.
  if (adminApp) {
    return adminApp;
  }
  
  try {
    // Check if the default app is already initialized to prevent errors during hot-reloading.
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }

    // Store the initialized services in the singleton variable.
    adminApp = {
      auth: admin.auth(),
      db: admin.firestore(),
    };

    return adminApp;

  } catch (error: any) {
    console.error("Firebase Admin SDK Initialization Error:", error.message);
    // Re-throw a more user-friendly error to be caught by the page.
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}. Check your environment variables and private key format.`);
  }
}

// Export the services through the getter function to ensure initialization.
export const adminAuth = getFirebaseAdmin().auth;
export const adminDb = getFirebaseAdmin().db;
