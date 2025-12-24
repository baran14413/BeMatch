'use client';
import { useMemo } from 'react';
import AdminDashboardClient from "@/components/admin/admin-dashboard";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { UserProfile, Report, Match } from '@/lib/data';
import { subMonths, isValid, parseISO } from 'date-fns';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="xl:col-span-2">
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="grid gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
            </CardContent>
        </Card>
    </div>
);


export default function AdminDashboard() {
    const firestore = useFirestore();

    // Setup queries for all necessary collections
    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
    const reportsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'reports')) : null, [firestore]);
    const matchesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'matches')) : null, [firestore]);

    // Fetch data using useCollection hook
    const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);
    const { data: reports, isLoading: isLoadingReports } = useCollection<Report>(reportsQuery);
    const { data: matches, isLoading: isLoadingMatches } = useCollection<Match>(matchesQuery);

    const isLoading = isLoadingUsers || isLoadingReports || isLoadingMatches;

    // Memoize the calculation of statistics
    const stats = useMemo(() => {
        if (isLoading || !users || !reports || !matches) {
            return {
                totalUsers: 0,
                totalReports: 0,
                pendingReports: 0,
                totalMatches: 0,
                premiumUsers: 0,
                premiumPercentage: 0,
                matchesLastMonth: 0,
            };
        }

        const totalUsers = users.length;
        const totalReports = reports.length;
        const pendingReports = reports.filter(r => r.status === 'pending').length;
        const totalMatches = matches.length;
        const premiumUsers = users.filter(u => u.premiumTier).length;
        const premiumPercentage = totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0;
        
        const oneMonthAgo = subMonths(new Date(), 1);

        const matchesLastMonth = matches.filter(m => {
            if (!m.timestamp) return false;
            // The timestamp can be a Firestore Timestamp object or an ISO string
            const matchDate = m.timestamp.toDate ? m.timestamp.toDate() : parseISO(m.timestamp);
            return isValid(matchDate) && matchDate > oneMonthAgo;
        }).length;
        
        return {
            totalUsers,
            totalReports,
            pendingReports,
            totalMatches,
            premiumUsers,
            premiumPercentage,
            matchesLastMonth,
        };

    }, [isLoading, users, reports, matches]);

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <AdminDashboardClient
            totalUsers={stats.totalUsers}
            totalReports={stats.totalReports}
            pendingReports={stats.pendingReports}
            totalMatches={stats.totalMatches}
            premiumUsers={stats.premiumUsers}
            premiumPercentage={stats.premiumPercentage}
            matchesLastMonth={stats.matchesLastMonth}
        />
    );
}
