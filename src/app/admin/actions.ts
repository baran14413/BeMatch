"use server";

import { adminAuth, adminFirestore, adminStorage } from "@/firebase/admin";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAuth } from "firebase-admin/auth";

async function verifyAdmin() {
    const authHeader = headers().get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Unauthorized: No token provided.");
    }
    const idToken = authHeader.substring(7);

    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        if (decodedToken.role !== 'admin') {
            throw new Error("Forbidden: User is not an admin.");
        }
        return decodedToken;
    } catch (error) {
        console.error("Auth verification error:", error);
        throw new Error("Unauthorized: Invalid token.");
    }
}


export async function setRole(userId: string, role: string) {
    try {
        await verifyAdmin();
        await adminAuth.setCustomUserClaims(userId, { role });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        console.error(`Failed to set role for user ${userId}:`, error);
        return { success: false, error: error.message };
    }
}

export async function deleteUser(userId: string) {
    try {
        await verifyAdmin();
        
        // 1. Delete from Cloud Storage
        const prefix = `users/${userId}/`;
        try {
            await adminStorage.deleteFiles({ prefix });
        } catch (storageError: any) {
            // It's okay if the folder doesn't exist, but log other errors.
            if (storageError.code !== 404) {
                 console.warn(`Could not delete storage files for user ${userId}:`, storageError.message);
            }
        }

        // 2. Delete from Firestore
        await adminFirestore.collection('users').doc(userId).delete();

        // 3. Delete from Firebase Authentication
        await adminAuth.deleteUser(userId);

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        console.error(`Failed to delete user ${userId}:`, error);
        return { success: false, error: error.message };
    }
}
