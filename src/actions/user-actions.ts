'use server';

import { adminDb } from '@/lib/firebaseAdmin';
import type { UserProfile } from '@/lib/data';

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const usersSnapshot = await adminDb.collection('users').orderBy('createdAt', 'desc').limit(50).get();
    if (usersSnapshot.empty) {
      return [];
    }
    // Firestore Timestamps need to be serialized.
    return usersSnapshot.docs.map(doc => {
        const data = doc.data();
        const user = { id: doc.id, ...data } as UserProfile;
        // Convert any Timestamp objects to serializable format (ISO string)
        if (data.createdAt) {
            user.createdAt = data.createdAt.toDate().toISOString();
        }
         if (data.premiumExpiresAt) {
            user.premiumExpiresAt = data.premiumExpiresAt.toDate().toISOString();
        }
        if (data.boostExpiresAt) {
            user.boostExpiresAt = data.boostExpiresAt.toDate().toISOString();
        }
        if (data.passwordLastUpdatedAt) {
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
    try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if(!userDoc.exists) return null;
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    } catch (error) {
        console.error(`Error fetching user ${uid}:`, error);
        return null;
    }
}
