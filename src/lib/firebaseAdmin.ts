import 'server-only';
import * as admin from 'firebase-admin';

// Debug log to check if environment variables are loaded by Next.js
console.log(
  'Firebase Admin Env Check:',
  {
    PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'LOADED' : 'MISSING',
    CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'LOADED' : 'MISSING',
    PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'LOADED' : 'MISSING',
  }
);

interface FirebaseAdminApp {
  auth: admin.auth.Auth;
  db: admin.firestore.Firestore;
}

function getFirebaseAdmin(): FirebaseAdminApp {
  // Check if the app is already initialized to prevent errors during hot-reloading.
  if (admin.apps.length > 0) {
    const defaultApp = admin.app();
    return {
      auth: admin.auth(defaultApp),
      db: admin.firestore(defaultApp),
    };
  }

  // Retrieve environment variables.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  // Throw a clear, descriptive error if any required variables are missing.
  if (!privateKey || !clientEmail || !projectId) {
    throw new Error(
      'Missing Firebase Admin SDK environment variables. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in your .env.local file.'
    );
  }

  // Initialize the Firebase Admin SDK.
  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      // Sanitize the private key by replacing escaped newlines with actual newlines.
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });

  // Return the initialized services.
  return {
    auth: admin.auth(app),
    db: admin.firestore(app),
  };
}

// Export the services through the getter function to ensure initialization.
export const adminAuth = getFirebaseAdmin().auth;
export const adminDb = getFirebaseAdmin().db;
