'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Heart, Crown, AlertTriangle, ArrowUp, ArrowDown, UserPlus, ShieldCheck } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import type { UserProfile, Match, Report } from '@/lib/data';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


const StatCard = ({ title, value, icon: Icon, iconBg, trend, trendText }: { title: string; value: string; icon: React.ElementType; iconBg: string; trend?: number; trendText?: string; }) => (
    <Card className="dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className={cn("flex items-center justify-center h-8 w-8 rounded-lg", iconBg)}>
                <Icon className="h-4 w-4 text-white" />
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {trend !== undefined && trendText && (
                 <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {trend >= 0 ? <ArrowUp className="h-3 w-3 text-green-500" /> : <ArrowDown className="h-3 w-3 text-red-500" />}
                    <span className={cn(trend >= 0 ? 'text-green-500' : 'text-red-500', "font-semibold")}>{trend >= 0 ? '+' : ''}{trend}%</span>
                    {trendText}
                </p>
            )}
        </CardContent>
    </Card>
);

const activityConfig = {
    report: { icon: AlertTriangle, color: 'bg-red-500' },
    newUser: { icon: UserPlus, color: 'bg-blue-500' },
    match: { icon: Heart, color: 'bg-pink-500' },
    verification: { icon: ShieldCheck, color: 'bg-green-500' },
};

const getBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'pending': return 'bg-red-600 hover:bg-red-700';
        case 'success': return 'bg-pink-600 hover:bg-pink-700';
        case 'verified': return 'bg-green-600 hover:bg-green-700';
        case 'new user': return 'bg-blue-600 hover:bg-blue-700';
        case 'resolved': return 'bg-gray-600 hover:bg-gray-700';
        default: return 'secondary';
    }
}

const RecentActivities = ({ activities }: { activities: any[] }) => {
    return (
        <Card className="lg:col-span-7 dark:bg-gray-800">
            <CardHeader>
                <CardTitle>Latest events and activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {activities.map((activity) => {
                    const config = activityConfig[activity.type as keyof typeof activityConfig] || {icon: Users, color: 'bg-gray-500'};
                    return (
                        <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-500/10">
                             <div className={cn("flex items-center justify-center h-10 w-10 rounded-lg", config.color)}>
                                <config.icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">{activity.description}</p>
                                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                            </div>
                            <Badge className={cn("text-white", getBadgeVariant(activity.status))}>{activity.status}</Badge>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}

export default function AdminDashboardPage() {
    const firestore = useFirestore();
    const { user } = useUser();

    const usersQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, "users"), orderBy('createdAt', 'desc'), limit(5));
    }, [user, firestore]);

    const premiumUsersQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, "users"), where("premiumTier", "!=", null))
    }, [user, firestore]);
    
    const reportsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, "reports"), orderBy('timestamp', 'desc'), limit(5));
    }, [user, firestore]);

     const matchesQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, "matches"), orderBy('timestamp', 'desc'), limit(5));
    }, [user, firestore]);

    const { data: usersData } = useCollection<UserProfile>(usersQuery);
    const { data: premiumUsers } = useCollection(premiumUsersQuery);
    const { data: reportsData } = useCollection<Report>(reportsQuery);
    const { data: matchesData } = useCollection<Match>(matchesQuery);

    const combinedActivities = useMemo(() => {
        const activities: any[] = [];

        usersData?.forEach(u => activities.push({
            id: `user-${u.id}`,
            type: 'newUser',
            description: `New user @${u.email.split('@')[0]} signed up and completed onboarding`,
            timestamp: u.createdAt ? formatDistanceToNow(u.createdAt.toDate(), { addSuffix: true }) : 'just now',
            status: 'New User',
            date: u.createdAt?.toDate() || new Date()
        }));

        reportsData?.forEach(r => activities.push({
            id: `report-${r.id}`,
            type: 'report',
            description: `User @${r.reporterId.slice(0, 8)} reported @${r.reportedUserId.slice(0,8)} for ${r.reason.replace(/_/g, ' ')}`,
            timestamp: r.timestamp ? formatDistanceToNow(r.timestamp.toDate(), { addSuffix: true }) : 'just now',
            status: r.status.charAt(0).toUpperCase() + r.status.slice(1),
            date: r.timestamp?.toDate() || new Date()
        }));

        matchesData?.forEach(m => activities.push({
            id: `match-${m.id}`,
            type: 'match',
            description: `New match created between @${m.users[0].slice(0,8)} and @${m.users[1].slice(0,8)}`,
            timestamp: m.timestamp ? formatDistanceToNow(m.timestamp.toDate(), { addSuffix: true }) : 'just now',
            status: 'Success',
            date: m.timestamp?.toDate() || new Date()
        }));

        return activities.sort((a,b) => b.date - a.date).slice(0, 10);

    }, [usersData, reportsData, matchesData]);
    
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={usersData?.length.toLocaleString() ?? '...'} icon={Users} iconBg="bg-blue-500" trend={5.2} trendText="this week" />
        <StatCard title="Active Matches" value={matchesData?.length.toLocaleString() ?? '...'} icon={Heart} iconBg="bg-pink-500" />
        <StatCard title="Premium Subscribers" value={premiumUsers?.length.toLocaleString() ?? '...'} icon={Crown} iconBg="bg-yellow-500" trend={8.1} trendText="this week" />
        <StatCard title="Pending Reports" value={reportsData?.filter(r => r.status === 'pending').length.toLocaleString() ?? '...'} icon={AlertTriangle} iconBg="bg-red-500" trend={-3} trendText="from yesterday" />
      </div>
      <div className="grid gap-4 lg:grid-cols-7">
        <RecentActivities activities={combinedActivities} />
      </div>
    </>
  );
}
