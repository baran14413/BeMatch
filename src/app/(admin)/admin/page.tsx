import { getAllUsers } from "@/actions/user-actions"
import { getAllReports } from "@/actions/report-actions"
import { adminDb } from "@/lib/firebaseAdmin"
import { Timestamp } from "firebase-admin/firestore";
import AdminDashboardClient from "@/components/admin/admin-dashboard";

export default async function AdminDashboard() {
    // --- Data Fetching (Server-Side) ---
    const users = await getAllUsers();
    const reports = await getAllReports();
    const matchesSnapshot = await adminDb.collection('matches').get();

    const totalUsers = users.length;
    const totalReports = reports.length;
    const pendingReports = reports.filter(r => r.status === 'pending').length;
    const totalMatches = matchesSnapshot.size;

    const premiumUsers = users.filter(u => u.premiumTier).length;
    const premiumPercentage = totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0;
    
    const matchesLastMonth = matchesSnapshot.docs.filter(doc => {
      const data = doc.data();
      // Ensure timestamp exists and has the toDate method before calling it
      return data.timestamp && typeof data.timestamp.toDate === 'function';
    }).filter(doc => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // We can now safely call toDate()
        return (doc.data().timestamp as Timestamp).toDate() > thirtyDaysAgo;
    }).length;

    // --- Pass data to Client Component ---
    return (
        <AdminDashboardClient
            totalUsers={totalUsers}
            totalReports={totalReports}
            pendingReports={pendingReports}
            totalMatches={totalMatches}
            premiumUsers={premiumUsers}
            premiumPercentage={premiumPercentage}
            matchesLastMonth={matchesLastMonth}
        />
    )
}
