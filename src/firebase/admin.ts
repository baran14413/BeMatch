"use server";
import { initializeApp, getApps, App, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// IMPORTANT: Path to the service account key file.
// This file should be placed in the root of your project.
// MAKE SURE this file is included in your .gitignore file to prevent it from being committed.
const serviceAccountKey = process.env.SERVICE_ACCOUNT_KEY;

let adminApp: App;

if (!getApps().length) {
  if (!serviceAccountKey) {
    throw new Error("SERVICE_ACCOUNT_KEY environment variable is not set. Cannot initialize Firebase Admin SDK.");
  }

  try {
    adminApp = initializeApp({
      credential: cert(JSON.parse(serviceAccountKey)),
      storageBucket: `${JSON.parse(serviceAccountKey).project_id}.appspot.com`,
    });
  } catch (error) {
    console.error("Failed to parse SERVICE_ACCOUNT_KEY or initialize Firebase Admin SDK:", error);
    throw new Error("Firebase Admin SDK initialization failed.");
  }

} else {
  adminApp = getApps()[0];
}

export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp).bucket();
