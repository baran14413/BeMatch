"use server";
import { initializeApp, getApps, App, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import path from "path";

// IMPORTANT: Path to the service account key file.
// This file should be placed in the root of your project.
// MAKE SURE this file is included in your .gitignore file to prevent it from being committed.
const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');

let adminApp: App;
let serviceAccount;

try {
  // Use require for JSON files as it's simpler and synchronous.
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  // This catch block is important for DX. If the file is missing,
  // we want to provide a clear error message.
  if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
    console.error("CRITICAL ERROR: `serviceAccountKey.json` not found in the project root.");
    console.error("Please download your service account key from the Firebase console (Project Settings > Service accounts > Generate new private key), rename it to `serviceAccountKey.json`, and place it in the root directory of your project.");
    // We throw a more user-friendly error to be caught by the server.
    throw new Error("Firebase Admin SDK setup is incomplete. `serviceAccountKey.json` is missing.");
  }
  // Re-throw other errors.
  throw error;
}


if (!getApps().length) {
  try {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: `${serviceAccount.project_id}.appspot.com`,
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    throw new Error("Firebase Admin SDK initialization failed.");
  }
} else {
  adminApp = getApps()[0];
}

export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp).bucket();
