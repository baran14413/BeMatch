'use server';
// Force-load environment variables from .env.local
import 'dotenv/config';

import { revalidatePath } from 'next/cache';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

/**
 * Sets a custom role for a Firebase user.
 * This is a server-only function that only handles the custom claim.
 * @param uid The user's ID.
 * @param role The role to assign (e.g., 'admin', 'moderator').
 * @returns An object with success status and an optional error message.
 */
export async function setUserRoleAction(uid: string, role: string) {
  try {
    // 1. Set the custom claim in Firebase Authentication.
    await adminAuth.setCustomUserClaims(uid, { role });

    // 2. Revalidate the path to ensure any server-rendered components refresh.
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${uid}`);

    return { success: true, message: `Custom claim '${role}' assigned to user ${uid}.` };
  } catch (error: any) {
    console.error(`Failed to set custom claim for user ${uid}:`, error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}


/**
 * Deletes a Firebase user from Authentication ONLY.
 * The corresponding Firestore document should be deleted by the client.
 * @param uid The user's ID to delete from Auth.
 * @returns An object with success status and an optional error message.
 */
export async function deleteUserAction(uid: string) {
  try {
    // 1. Delete the user from Firebase Authentication
    await adminAuth.deleteUser(uid);
    
    // 2. Revalidate the users path to update the list in the admin panel
    revalidatePath('/admin/users');

    return { success: true, message: `User ${uid} deleted successfully from Authentication.` };
  } catch (error: any) {
    console.error(`Failed to delete user ${uid} from Auth:`, error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
