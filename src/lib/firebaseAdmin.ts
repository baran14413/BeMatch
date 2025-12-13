import 'server-only';
import * as admin from 'firebase-admin';

interface FirebaseAdminApp {
  auth: admin.auth.Auth;
  db: admin.firestore.Firestore;
}

let app: admin.app.App | undefined;

function getFirebaseAdmin(): FirebaseAdminApp {
  if (app) {
    return {
      auth: admin.auth(app),
      db: admin.firestore(app),
    };
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    throw new Error(
      'Missing Firebase Admin SDK environment variables. Ensure FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, and FIREBASE_PROJECT_ID are set.'
    );
  }

  try {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    if (error.code === 'app/duplicate-app') {
      // This can happen in development with hot-reloading.
      // Get the already initialized app.
      app = admin.app();
    } else {
      console.error('Firebase Admin SDK initialization failed:', error);
      throw error; // Re-throw the error to fail fast during setup
    }
  }

  return {
    auth: admin.auth(app),
    db: admin.firestore(app),
  };
}

// Export getter functions instead of direct service objects
export const adminAuth = (): admin.auth.Auth => getFirebaseAdmin().auth;
export const adminDb = (): admin.firestore.Firestore => getFirebaseAdmin().db;
