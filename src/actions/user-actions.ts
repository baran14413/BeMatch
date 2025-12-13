'use server';

import { revalidatePath } from 'next/cache';
import { adminAuth } from '@/lib/firebaseAdmin';

/**
 * Sets a custom role for a Firebase user.
 * This is a server-only function.
 * @param uid The user's ID.
 * @param role The role to assign (e.g., 'admin', 'moderator').
 * @returns An object with success status and an optional error message.
 */
export async function setUserRoleAction(uid: string, role: string) {
  try {
    await adminAuth.setCustomUserClaims(uid, { role });
    // Revalidate the users path to reflect role changes immediately in the admin panel
    revalidatePath('/admin/users');
    return { success: true, message: `Role '${role}' assigned to user ${uid}.` };
  } catch (error: any) {
    console.error(`Failed to set role for user ${uid}:`, error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}

/**
 * Deletes a Firebase user and all their associated data.
 * This is a server-only function.
 * @param uid The user's ID to delete.
 * @returns An object with success status and an optional error message.
 */
export async function deleteUserAction(uid: string) {
  try {
    // Note: Deleting user data from Firestore and Storage should be handled
    // via Firebase Extension "Delete User Data" or Cloud Functions for robustness.
    // This action will only delete the Firebase Auth user.
    await adminAuth.deleteUser(uid);
    
    // Revalidate the users path to update the list in the admin panel
    revalidatePath('/admin/users');
    return { success: true, message: `User ${uid} deleted successfully.` };
  } catch (error: any) {
    console.error(`Failed to delete user ${uid}:`, error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
