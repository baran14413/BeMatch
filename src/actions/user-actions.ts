'use server';

import { adminDb } from '@/lib/firebaseAdmin';
import type { UserProfile } from '@/lib/data';

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const usersSnapshot = await adminDb.collection('users').orderBy('createdAt', 'desc').limit(50).get();
    if (usersSnapshot.empty) {
      return [];
    }
    return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
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
