import 'server-only';
import * as admin from 'firebase-admin';

// Debug log to check if environment variables are loaded by Next.js
// This helps in diagnosing deployment issues.
if (process.env.NODE_ENV === 'development') {
    console.log('Firebase Admin Env Check:', {
        PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'LOADED' : 'MISSING',
        CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'LOADED' : 'MISSING',
        PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'LOADED' : 'MISSING',
    });
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

  // Retrieve environment variables.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  // Throw a clear, descriptive error if any required variables are missing.
  if (!privateKey || !clientEmail || !projectId) {
    throw new Error(
      'Missing Firebase Admin SDK environment variables. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in your environment.'
    );
  }

  try {
    // Check if the default app is already initialized to prevent errors during hot-reloading.
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                // The key is passed directly. Firebase Admin SDK handles the parsing.
                privateKey,
            }),
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
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}. Check your environment variables and private key format.`);
  }
}

// Export the services through the getter function to ensure initialization.
export const adminAuth = getFirebaseAdmin().auth;
export const adminDb = getFirebaseAdmin().db;
