'use server';

import { adminDb } from '@/lib/firebaseAdmin';
import type { Report } from '@/lib/data';

export async function getAllReports(): Promise<Report[]> {
  try {
    const reportsSnapshot = await adminDb.collection('reports').orderBy('timestamp', 'desc').get();
    if (reportsSnapshot.empty) {
      return [];
    }
    return reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
  } catch (error) {
    console.error('Error fetching reports:', error);
    // In a real app, you might want to throw the error or handle it differently
    return [];
  }
}
