'use server'; // Make this a server component to fetch data
import AdminDashboardClient from "@/components/admin/admin-dashboard";
import { getAllUsers } from "@/actions/user-actions"
import { getAllReports } from "@/actions/report-actions"
import { getAllMatches } from "@/actions/match-actions"
import { subMonths } from 'date-fns';
import type { UserProfile, Report, Match } from '@/lib/data';

export default async function AdminDashboard() {
    // --- Data Fetching (Server-Side) ---
    // Fetch all data on the server using admin actions
    const users: UserProfile[] = await getAllUsers();
    const reports: Report[] = await getAllReports();
    const matches: Match[] = await getAllMatches();
    
    // --- Data Processing ---
    const totalUsers = users.length;
    const totalReports = reports.length;
    const pendingReports = reports.filter(r => r.status === 'pending').length;
    const totalMatches = matches.length;
    const premiumUsers = users.filter(u => u.premiumTier).length;
    const premiumPercentage = totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0;
    
    const oneMonthAgo = subMonths(new Date(), 1);
    const matchesLastMonth = matches.filter(m => {
        if (!m.timestamp) return false;
        // Firestore timestamp can be a string (if serialized) or an object
        const matchDate = new Date(m.timestamp);
        return matchDate > oneMonthAgo;
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
    );
}
