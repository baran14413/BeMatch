'use client';
import { useMemo } from 'react';
import AdminDashboardClient from "@/components/admin/admin-dashboard";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, Timestamp } from 'firebase/firestore';
import type { UserProfile, Report, Match } from '@/lib/data';
import { subMonths, isValid, parseISO, format, startOfMonth, endOfMonth, eachMonthOfInterval, getMonth } from 'date-fns';
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
    const { stats, userGrowthData } = useMemo(() => {
        if (isLoading || !users || !reports || !matches) {
            return {
                stats: {
                    totalUsers: 0,
                    totalReports: 0,
                    pendingReports: 0,
                    totalMatches: 0,
                    premiumUsers: 0,
                    premiumPercentage: 0,
                    matchesLastMonth: 0,
                },
                userGrowthData: [],
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
        
        const calculatedStats = {
            totalUsers,
            totalReports,
            pendingReports,
            totalMatches,
            premiumUsers,
            premiumPercentage,
            matchesLastMonth,
        };

        // Calculate user growth data
        const usersByMonth: { [key: string]: number } = {};
        if (users.length > 0) {
            const usersWithCreationDate = users.filter(u => u.createdAt);
            
            if (usersWithCreationDate.length > 0) {
                const firstUserDate = usersWithCreationDate.reduce((earliest, user) => {
                    // This check is now safe because we filtered users without createdAt
                    const userDate = user.createdAt?.toDate ? user.createdAt.toDate() : parseISO(user.createdAt!);
                    return userDate < earliest ? userDate : earliest;
                }, new Date());

                const allMonths = eachMonthOfInterval({
                    start: startOfMonth(firstUserDate),
                    end: endOfMonth(new Date())
                });

                // Initialize all months to 0
                allMonths.forEach(month => {
                    const monthKey = format(month, 'yyyy-MM');
                    usersByMonth[monthKey] = 0;
                });
                
                usersWithCreationDate.forEach(user => {
                    const userDate = user.createdAt?.toDate ? user.createdAt.toDate() : parseISO(user.createdAt!);
                    if (isValid(userDate)) {
                        const monthKey = format(userDate, 'yyyy-MM');
                        usersByMonth[monthKey] = (usersByMonth[monthKey] || 0) + 1;
                    }
                });
            }
        }
        
        const calculatedUserGrowthData = Object.entries(usersByMonth)
            .map(([monthKey, count]) => {
                const [year, monthNum] = monthKey.split('-');
                return {
                    name: `${format(new Date(parseInt(year), parseInt(monthNum) - 1), 'MMM')}`,
                    newUsers: count
                };
            })
            .sort((a,b) => new Date(a.name).getMonth() - new Date(b.name).getMonth());
            
        return { stats: calculatedStats, userGrowthData: calculatedUserGrowthData };


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
            userGrowthData={userGrowthData}
        />
    );
}
