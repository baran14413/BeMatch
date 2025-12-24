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
 * Returns null if credentials are not available, preventing build failures.
 * @returns {FirebaseAdminApp | null} The initialized Firebase Admin services or null.
 */
export function getFirebaseAdmin(): FirebaseAdminApp | null {
  // If we are in the build process on the server (e.g., Netlify), and env vars are not set,
  // skip initialization to prevent build failure. The app will run fine in production
  // because the env vars will be present there.
  if (process.env.NODE_ENV === 'production' && !process.env.FIREBASE_PROJECT_ID) {
    console.warn("Firebase Admin credentials not found. Skipping initialization during build process.");
    return null;
  }
  
  // If the adminApp instance already exists, return it to avoid re-initialization.
  if (adminApp) {
    return adminApp;
  }
  
  try {
    // IMPORTANT: Replace escaped newlines for the private key
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    // If essential credentials are not present, throw an error.
    if (!projectId || !clientEmail || !privateKey) {
        throw new Error("Firebase Admin credentials not found in environment variables.");
    }

    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: projectId,
                clientEmail: clientEmail,
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
    // This will catch any parsing errors or other initialization issues.
    console.error("Firebase Admin SDK Initialization Error:", error.message);
    return null; // Return null on error to prevent crashing the build.
  }
}
