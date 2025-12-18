'use server';

import { adminDb } from '@/lib/firebaseAdmin';
import type { Match } from '@/lib/data';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Fetches all match documents from the Firestore 'matches' collection using the Admin SDK.
 * This bypasses all Firestore security rules.
 * @returns A promise that resolves to an array of Match objects.
 */
export async function getAllMatches(): Promise<Match[]> {
  try {
    const matchesSnapshot = await adminDb.collection('matches').orderBy('timestamp', 'desc').get();
    
    if (matchesSnapshot.empty) {
      return [];
    }

    const matches: Match[] = matchesSnapshot.docs.map(doc => {
      const data = doc.data();
      // Serialize Firestore Timestamps to JS Date objects for client-side compatibility
      const serializedData = {
        ...data,
        id: doc.id,
        timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(),
      };
      return serializedData as Match;
    });

    return matches;
  } catch (error) {
    console.error("Error fetching all matches with Admin SDK:", error);
    // In a real-world app, you might want to throw a more specific error
    // or return an object indicating failure.
    throw new Error('Failed to fetch match history.');
  }
}
