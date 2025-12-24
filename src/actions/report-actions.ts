'use server';

import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import type { Report } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const ADMIN_NOT_INITIALIZED_ERROR = { 
    success: false, 
    message: "Firebase Admin SDK'sı başlatılmadı. Lütfen sunucu yapılandırmasını kontrol edin." 
};

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


export async function updateReportStatus(reportId: string, status: 'pending' | 'reviewed' | 'resolved') {
    const admin = getFirebaseAdmin();
    if (!admin) {
        return ADMIN_NOT_INITIALIZED_ERROR;
    }
    const { db } = admin;

    try {
        const reportRef = db.collection('reports').doc(reportId);
        await reportRef.update({ status });
        
        revalidatePath('/admin/safety');
        return { success: true, message: `Rapor durumu ${status} olarak güncellendi.` };

    } catch (error: any) {
        console.error("Error updating report status:", error);
        return { success: false, message: error.message };
    }
}
