'use server';
// Force-load environment variables from .env.local
import 'dotenv/config';

import { revalidatePath } from 'next/cache';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

/**
 * Sets a custom role for a Firebase user and stores it in Firestore.
 * This is a server-only function.
 * @param uid The user's ID.
 * @param role The role to assign (e.g., 'admin', 'moderator').
 * @returns An object with success status and an optional error message.
 */
export async function setUserRoleAction(uid: string, role: string) {
  try {
    // 1. Set the custom claim in Firebase Authentication.
    await adminAuth.setCustomUserClaims(uid, { role });

    // 2. Update the role in the user's Firestore document for client-side access.
    const userDocRef = adminDb.collection('users').doc(uid);
    await userDocRef.update({ role });
    
    // 3. Revalidate the users path to reflect role changes immediately in the admin panel.
    revalidatePath('/admin/users');
    return { success: true, message: `Role '${role}' assigned to user ${uid}.` };
  } catch (error: any) {
    console.error(`Failed to set role for user ${uid}:`, error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}


/**
 * Deletes a Firebase user and all their associated data from Auth and Firestore.
 * This is a server-only function.
 * @param uid The user's ID to delete.
 * @returns An object with success status and an optional error message.
 */
export async function deleteUserAction(uid: string) {
  try {
    // 1. Delete the user from Firebase Authentication
    await adminAuth.deleteUser(uid);

    // 2. Delete the user's profile document from Firestore
    const userDocRef = adminDb.collection('users').doc(uid);
    await userDocRef.delete();

    // 3. Revalidate the users path to update the list in the admin panel
    revalidatePath('/admin/users');
    
    return { success: true, message: `User ${uid} deleted successfully from Auth and Firestore.` };
  } catch (error: any) {
    console.error(`Failed to delete user ${uid}:`, error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
