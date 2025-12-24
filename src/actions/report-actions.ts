'use server';

import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import type { Report } from '@/lib/data';

export async function getAllReports(): Promise<Report[]> {
  const admin = getFirebaseAdmin();
  if (!admin) {
    console.log('Skipping getAllReports: Firebase Admin not initialized.');
    return [];
  }
  const { db: adminDb } = admin;

  try {
    const reportsSnapshot = await adminDb.collection('reports').orderBy('timestamp', 'desc').get();
    if (reportsSnapshot.empty) {
      return [];
    }
     // Firestore Timestamps need to be serialized before passing from server to client components.
    return reportsSnapshot.docs.map(doc => {
        const data = doc.data();
        const report = { id: doc.id, ...data } as Report;
        // Convert Timestamp to a serializable format (ISO string)
        if (data.timestamp && data.timestamp.toDate) {
            report.timestamp = data.timestamp.toDate().toISOString();
        }
        return report;
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    // In a real app, you might want to throw the error or handle it differently
    return [];
  }
}
