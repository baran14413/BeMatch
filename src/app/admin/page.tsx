'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Heart, Crown, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

const StatCard = ({ title, value, icon: Icon, iconBg, trend, trendText }: { title: string; value: string; icon: React.ElementType; iconBg: string; trend: number; trendText: string; }) => (
    <Card className="dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className={cn("flex items-center justify-center h-8 w-8 rounded-lg", iconBg)}>
                <Icon className="h-4 w-4 text-white" />
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
                {trend >= 0 ? <ArrowUp className="h-3 w-3 text-green-500" /> : <ArrowDown className="h-3 w-3 text-red-500" />}
                <span className={cn(trend >= 0 ? 'text-green-500' : 'text-red-500', "font-semibold")}>{trend >= 0 ? '+' : ''}{trend}%</span>
                {trendText}
            </p>
        </CardContent>
    </Card>
);


const userGrowthData = [
  { date: '2023-05-01', users: 2000 },
  { date: '2023-05-05', users: 2400 },
  { date: '2023-05-10', users: 2200 },
  { date: '2023-05-15', users: 3000 },
  { date: '2023-05-20', users: 2800 },
  { date: '2023-05-25', users: 4500 },
  { date: '2023-05-30', users: 7000 },
];

const genderData = [
  { name: 'Woman', value: 400, color: '#ec4899' }, // pink-500
  { name: 'Man', value: 300, color: '#3b82f6' }, // blue-500
  { name: 'Other', value: 50, color: '#a855f7' }, // purple-500
  { name: 'Not Specified', value: 100, color: '#14b8a6' }, // teal-500
];

export default function AdminDashboardPage() {
    const firestore = useFirestore();

    const { data: users } = useCollection(useMemoFirebase(() => query(collection(firestore, "users")), [firestore]));
    const { data: premiumUsers } = useCollection(useMemoFirebase(() => query(collection(firestore, "users"), where("premiumTier", "!=", null)), [firestore]));
    const { data: matches } = useCollection(useMemoFirebase(() => query(collection(firestore, "matches")), [firestore]));
    const { data: pendingReports } = useCollection(useMemoFirebase(() => query(collection(firestore, "reports"), where("status", "==", "pending")), [firestore]));
    
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={users?.length.toLocaleString() ?? '...'} icon={Users} iconBg="bg-blue-500" trend={5.2} trendText="this week" />
        <StatCard title="Active Matches" value={matches?.length.toLocaleString() ?? '...'} icon={Heart} iconBg="bg-pink-500" trend={12.5} trendText="this week" />
        <StatCard title="Premium Subscribers" value={premiumUsers?.length.toLocaleString() ?? '...'} icon={Crown} iconBg="bg-yellow-500" trend={8.1} trendText="this week" />
        <StatCard title="Pending Reports" value={pendingReports?.length.toLocaleString() ?? '...'} icon={AlertTriangle} iconBg="bg-red-500" trend={-3} trendText="from yesterday" />
      </div>
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 dark:bg-gray-800">
          <CardHeader>
            <CardTitle>User Growth & Activity</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={userGrowthData}>
                    <defs>
                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                        }}
                    />
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <Area type="monotone" dataKey="users" stroke="#ec4899" fillOpacity={1} fill="url(#colorUv)" />
                </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 dark:bg-gray-800">
          <CardHeader>
            <CardTitle>User Demographics</CardTitle>
          </CardHeader>
          <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                 <PieChart>
                    <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                        }}
                    />
                    <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        innerRadius={80}
                        outerRadius={120}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    </PieChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}