'use server';
import 'server-only';
import * as admin from 'firebase-admin';

// IMPORTANT: Ensure you have a 'serviceAccountKey.json' file in your project's root directory.
// This file should be obtained from your Firebase project settings.
// DO NOT commit this file to public version control. Add it to your .gitignore.
import serviceAccount from '../../serviceAccountKey.json';

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
            // Use the imported service account object directly.
            // This is the most reliable way to provide credentials.
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
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
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}. Ensure your serviceAccountKey.json is valid.`);
  }
}

// Export the services through the getter function to ensure initialization.
export const adminAuth = getFirebaseAdmin().auth;
export const adminDb = getFirebaseAdmin().db;
