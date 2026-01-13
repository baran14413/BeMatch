'use server';

import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import type { Match } from '@/lib/data';

export async function getAllMatches(): Promise<Match[]> {
  const admin = getFirebaseAdmin();
  if (!admin) {
    console.log('Skipping getAllMatches: Firebase Admin not initialized.');
    return [];
  }
  const { db: adminDb } = admin;

  try {
    const matchesSnapshot = await adminDb.collection('matches').orderBy('timestamp', 'desc').get();
    if (matchesSnapshot.empty) {
      return [];
    }
     // Firestore Timestamps need to be serialized before passing from server to client components.
    return matchesSnapshot.docs.map(doc => {
        const data = doc.data();
        const match = { id: doc.id, ...data } as Match;
        // Convert Timestamp to a serializable format (ISO string)
        if (data.timestamp && data.timestamp.toDate) {
            match.timestamp = data.timestamp.toDate().toISOString();
        }
        return match;
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    // In a real app, you might want to throw the error or handle it differently
    return [];
  }
}
