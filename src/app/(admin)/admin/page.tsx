import AdminDashboardClient from "@/components/admin/admin-dashboard";

export default async function AdminDashboard() {
    // --- Data Fetching (Server-Side) ---
    // Temporarily disable data fetching to fix the white screen issue.
    const users: any[] = [];
    const reports: any[] = [];
    
    const totalUsers = 0;
    const totalReports = 0;
    const pendingReports = 0;
    const totalMatches = 0;
    const premiumUsers = 0;
    const premiumPercentage = 0;
    const matchesLastMonth = 0;

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
