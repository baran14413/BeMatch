import 'server-only';
import * as admin from 'firebase-admin';

interface FirebaseAdminApp {
  auth: admin.auth.Auth;
  db: admin.firestore.Firestore;
}

function getFirebaseAdmin(): FirebaseAdminApp {
  if (admin.apps.length > 0) {
    const defaultApp = admin.app();
    return {
      auth: admin.auth(defaultApp),
      db: admin.firestore(defaultApp),
    };
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    throw new Error(
      'Missing Firebase Admin SDK environment variables. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in your .env.local file.'
    );
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      // Replace escaped newlines
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });

  return {
    auth: admin.auth(app),
    db: admin.firestore(app),
  };
}

// Export functions that return the services to ensure initialization happens first.
export const adminAuth = getFirebaseAdmin().auth;
export const adminDb = getFirebaseAdmin().db;
