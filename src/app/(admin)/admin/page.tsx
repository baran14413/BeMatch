import AdminDashboardClient from "@/components/admin/admin-dashboard";
import { getAllUsers } from "@/actions/user-actions"
import { getAllReports } from "@/actions/report-actions"
import { isFuture } from 'date-fns';
import type { UserProfile, Report } from '@/lib/data';

export default async function AdminDashboard() {
    // --- Data Fetching (Server-Side) ---
    const users: UserProfile[] = await getAllUsers();
    const reports: Report[] = await getAllReports();
    
    // --- Data Processing ---
    const totalUsers = users.length;
    const totalReports = reports.length;
    const pendingReports = reports.filter(r => r.status === 'pending').length;
    // In a real app with payments, you'd fetch this from a different source
    const totalMatches = 1253; // Placeholder, as we don't have a match-actions yet
    const premiumUsers = users.filter(u => u.premiumTier).length;
    const premiumPercentage = totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0;
    const matchesLastMonth = 241; // Placeholder

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
