
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
 * Retrieves the service account credentials from the environment variable.
 * This is the secure way to handle credentials in a deployment environment.
 * @returns {admin.ServiceAccount | null} The service account object or null.
 */
function getServiceAccount(): admin.ServiceAccount | null {
    if (process.env.SERVICE_ACCOUNT_KEY) {
        try {
            // The environment variable is expected to be a base64 encoded JSON string.
            const serviceAccountJson = Buffer.from(process.env.SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
            return JSON.parse(serviceAccountJson);
        } catch (e) {
            console.error('Error parsing SERVICE_ACCOUNT_KEY from environment variable:', e);
            return null;
        }
    }
    // In a deployed environment, we don't fall back to a local file.
    // The environment variable is required.
    return null;
}


/**
 * A getter function to initialize and/or retrieve the Firebase Admin services.
 * This ensures that initialization only happens once per server instance.
 * Returns null if credentials are not available, preventing build failures.
 * @returns {FirebaseAdminApp | null} The initialized Firebase Admin services or null.
 */
export function getFirebaseAdmin(): FirebaseAdminApp | null {
  // If the adminApp instance already exists, return it to avoid re-initialization.
  if (adminApp) {
    return adminApp;
  }
  
  const serviceAccount = getServiceAccount();

  // If serviceAccount is null, log a specific warning and return null.
  if (!serviceAccount) {
    // This check runs on the server, so the log will appear in your server console/terminal.
    console.warn(
        'Firebase Admin initialization skipped: SERVICE_ACCOUNT_KEY environment variable is not set or is invalid. Admin features will be disabled.'
    );
    return null;
  }
  
  try {
    // Initialize the app only if it hasn't been initialized yet.
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }

    // Create and cache the admin app instance with the required services.
    adminApp = {
      auth: admin.auth(),
      db: admin.firestore(),
    };

    console.log("Firebase Admin SDK initialized successfully.");
    return adminApp;

  } catch (error: any) {
    // This will catch any parsing errors or other initialization issues.
    console.error("Firebase Admin SDK Initialization Error:", error.message);
    // Provide a more helpful error message if the key is likely malformed.
    if (error.message.includes('Invalid credential')) {
         console.error('Hint: The service account key might be corrupted or malformed. Please check the environment variable.');
    }
    return null; // Return null on error to prevent crashing.
  }
}
