'use server';

import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import type { UserProfile } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const ADMIN_NOT_INITIALIZED_ERROR = { 
    success: false, 
    message: "Firebase Admin SDK'sı başlatılmadı. Lütfen sunucu yapılandırmasını kontrol edin." 
};

export async function getAllUsers(): Promise<UserProfile[]> {
  const admin = getFirebaseAdmin();
  if (!admin) {
    console.log('Skipping getAllUsers: Firebase Admin not initialized.');
    return [];
  }
  const { db: adminDb } = admin;

  try {
    const usersSnapshot = await adminDb.collection('users').orderBy('name', 'asc').limit(50).get();
    if (usersSnapshot.empty) {
      return [];
    }
    // Firestore Timestamps need to be serialized.
    return usersSnapshot.docs.map(doc => {
        const data = doc.data();
        const user = { id: doc.id, ...data } as UserProfile;
        // Convert any Timestamp objects to serializable format (ISO string)
        if (data.createdAt && data.createdAt.toDate) {
            user.createdAt = data.createdAt.toDate().toISOString();
        }
         if (data.premiumExpiresAt && data.premiumExpiresAt.toDate) {
            user.premiumExpiresAt = data.premiumExpiresAt.toDate().toISOString();
        }
        if (data.boostExpiresAt && data.boostExpiresAt.toDate) {
            user.boostExpiresAt = data.boostExpiresAt.toDate().toISOString();
        }
        if (data.passwordLastUpdatedAt && data.passwordLastUpdatedAt.toDate) {
            user.passwordLastUpdatedAt = data.passwordLastUpdatedAt.toDate().toISOString();
        }
        return user;
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function getUser(uid: string): Promise<UserProfile | null> {
    const admin = getFirebaseAdmin();
    if (!admin) {
        console.log(`Skipping getUser(${uid}): Firebase Admin not initialized.`);
        return null;
    }
    const { db: adminDb } = admin;
    
    try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if(!userDoc.exists) return null;
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    } catch (error) {
        console.error(`Error fetching user ${uid}:`, error);
        return null;
    }
}

export async function updateUserRole(uid: string, role: string) {
    const admin = getFirebaseAdmin();
    if (!admin) {
        return ADMIN_NOT_INITIALIZED_ERROR;
    }
    const { auth, db } = admin;

    try {
        // Set custom claim for auth token
        await auth.setCustomUserClaims(uid, { role });
        
        // Update the role in the Firestore document for UI consistency
        const userRef = db.collection('users').doc(uid);
        await userRef.update({ role });
        
        revalidatePath('/admin/users');
        return { success: true, message: `User role updated to ${role}.` };

    } catch (error: any) {
        console.error("Error updating user role:", error);
        return { success: false, message: error.message };
    }
}

export async function banUserAccount(uid: string, currentStatus: boolean) {
    const admin = getFirebaseAdmin();
    if (!admin) {
        return ADMIN_NOT_INITIALIZED_ERROR;
    }
    const { auth, db } = admin;
    const newBanStatus = !currentStatus;

    try {
        // Disable/Enable user in Firebase Auth
        await auth.updateUser(uid, { disabled: newBanStatus });

        // Update the flag in Firestore
        const userRef = db.collection('users').doc(uid);
        await userRef.update({ isBanned: newBanStatus });

        revalidatePath('/admin/users');
        return { success: true, message: `User has been ${newBanStatus ? 'banned' : 'unbanned'}.` };
    } catch (error: any) {
        console.error("Error banning/unbanning user:", error);
        return { success: false, message: error.message };
    }
}

export async function deleteUserAccount(uid: string) {
    const admin = getFirebaseAdmin();
    if (!admin) {
        return ADMIN_NOT_INITIALIZED_ERROR;
    }
    const { auth, db } = admin;

    try {
        // Delete from Auth
        await auth.deleteUser(uid);

        // Delete from Firestore
        await db.collection('users').doc(uid).delete();
        
        // You might want to also delete user-generated content here in a more complex app
        
        revalidatePath('/admin/users');
        return { success: true, message: "User account permanently deleted." };

    } catch (error: any) {
        console.error("Error deleting user account:", error);
        return { success: false, message: error.message };
    }
}
