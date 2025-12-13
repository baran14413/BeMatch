import * as admin from 'firebase-admin';

// Ensure the private key is correctly formatted.
// When copying from a .json file, the `\n` characters are often escaped as `\\n`.
// When using environment variables, they must be un-escaped.
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

const serviceAccount: admin.ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: privateKey,
};

// Singleton pattern to initialize Firebase Admin SDK only once.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    // Provide a more descriptive error if initialization fails due to missing env vars.
    if (error.code === 'app/invalid-credential') {
      console.error(
        'Firebase Admin SDK initialization failed. ' +
        'Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables are set correctly.'
      );
    } else {
        console.error('Firebase Admin SDK initialization failed:', error);
    }
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
