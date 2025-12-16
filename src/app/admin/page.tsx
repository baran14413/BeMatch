'use client';

import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, FileText, DollarSign, Crown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, limit, orderBy, query, where } from 'firebase/firestore';
import type { UserProfile, Match, Report } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/context/language-context';

const StatCard = ({ title, value, icon: Icon, description, isLoading }: { title: string, value: string | number, icon: React.ElementType, description?: string, isLoading: boolean }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-16" />
            {description && <Skeleton className="h-3 w-24 mt-1" />}
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
);


export default function AdminDashboardPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { t, locale } = useLanguage();

    // Queries for statistics
    const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);
    
    const premiumUsersQuery = useMemoFirebase(() => query(collection(firestore, 'users'), where('premiumTier', '!=', null)), [firestore]);
    const { data: premiumUsers, isLoading: isLoadingPremium } = useCollection<UserProfile>(premiumUsersQuery);
    
    const matchesQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null; // Prevent query if firestore or user is not available
      return collection(firestore, 'matches');
    }, [firestore, user]);
    const { data: matches, isLoading: isLoadingMatches } = useCollection<Match>(matchesQuery);

    const pendingReportsQuery = useMemoFirebase(() => query(collection(firestore, 'reports'), where('status', '==', 'pending')), [firestore]);
    const { data: pendingReports, isLoading: isLoadingReports } = useCollection<Report>(pendingReportsQuery);

    // Queries for recent activities
    const recentUsersQuery = useMemoFirebase(() => query(collection(firestore, 'users'), orderBy('createdAt', 'desc'), limit(5)), [firestore]);
    const { data: recentUsers, isLoading: isLoadingRecentUsers } = useCollection<UserProfile>(recentUsersQuery);
    
    const recentReportsQuery = useMemoFirebase(() => query(collection(firestore, 'reports'), orderBy('timestamp', 'desc'), limit(5)), [firestore]);
    const { data: recentReports, isLoading: isLoadingRecentReports } = useCollection<Report>(recentReportsQuery);

    const recentActivities = [
        ...(recentUsers || []).map(u => ({ type: 'Kayıt Oldu' as const, data: u, timestamp: u.createdAt?.toDate() })),
        ...(recentReports || []).map(r => ({ type: 'Rapor' as const, data: r, timestamp: r.timestamp?.toDate() }))
    ].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 5);
    

  return (
    <div className="flex-1 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Kullanıcı"
          value={users?.length ?? 0}
          icon={Users}
          isLoading={isLoadingUsers}
        />
        <StatCard
          title="Premium Kullanıcı"
          value={premiumUsers?.length ?? 0}
          icon={Crown}
          isLoading={isLoadingPremium}
        />
        <StatCard
          title="Toplam Eşleşme"
          value={matches?.length ?? 0}
          icon={UserCheck}
          isLoading={isLoadingMatches}
        />
        <StatCard
          title="Bekleyen Raporlar"
          value={pendingReports?.length ?? 0}
          icon={FileText}
          isLoading={isLoadingReports}
        />
      </div>

      <Card>
         <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
          </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Kullanıcı/Raporlayan</TableHead>
                        <TableHead>Tür</TableHead>
                        <TableHead>Detaylar</TableHead>
                        <TableHead>Zaman</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(isLoadingRecentUsers || isLoadingRecentReports) ? (
                      Array.from({length: 3}).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                        </TableRow>
                      ))
                    ) : recentActivities.length > 0 ? (
                      recentActivities.map((activity, index) => {
                          let user, details;
                          if (activity.type === 'Kayıt Oldu') {
                              const userData = activity.data as UserProfile;
                              user = { name: userData.name, avatar: userData.avatarUrl };
                              details = userData.email;
                          } else { // Rapor
                              const reportData = activity.data as Report;
                              user = { name: `Rapor ID: ${reportData.id.substring(0, 6)}`, avatar: '' };
                              details = `Sebep: ${reportData.reason}`;
                          }

                          return (
                            <TableRow key={index}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span>{user.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={activity.type === 'Kayıt Oldu' ? 'default' : 'destructive'}>
                                        {activity.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>{details || '-'}</TableCell>
                                <TableCell>
                                  {activity.timestamp ? formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: locale === 'tr' ? tr : enUS }) : '-'}
                                </TableCell>
                            </TableRow>
                          );
                      })
                    ) : (
                      <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            Henüz bir aktivite yok.
                          </TableCell>
                      </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
