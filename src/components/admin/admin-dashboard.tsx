'use client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Users, ShieldCheck, TrendingUp, TrendingDown } from "lucide-react"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Label, Pie, PieChart, Cell } from "recharts"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// --- DonutChart Component (Client-Side) ---
const DonutChart = ({ value, label, color }: { value: number, label: string, color: string }) => {
    const chartData = [{ name: 'value', value: value }, { name: 'rest', value: 100 - value }];
    const chartConfig = {
        value: { label: "Value" },
        rest: { label: "Rest" },
    } satisfies ChartConfig;

    return (
         <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full w-full">
            <PieChart>
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={25}
                    outerRadius={35}
                    strokeWidth={5}
                    startAngle={90}
                    endAngle={450}
                >
                    <Cell fill={color} />
                    <Cell fill="hsl(var(--muted))" />

                    <Label
                        content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                            <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                            >
                                <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-lg font-bold"
                                >
                                {value.toLocaleString()}%
                                </tspan>
                            </text>
                            )
                        }
                        }}
                    />
                </Pie>
            </PieChart>
        </ChartContainer>
    )
}

// --- StatCard Component (Client-Side) ---
const StatCard = ({ title, value, change, changeType }: { title: string, value: string, change: string, changeType: 'increase' | 'decrease' }) => (
    <div className="flex items-center justify-between">
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-lg font-bold">{value}</p>
        </div>
        <div className={`flex items-center text-sm font-semibold ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
            {changeType === 'increase' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {change}
        </div>
    </div>
)

// --- Main Dashboard Client Component ---
interface AdminDashboardClientProps {
    totalUsers: number;
    totalReports: number;
    pendingReports: number;
    totalMatches: number;
    premiumUsers: number;
    premiumPercentage: number;
    matchesLastMonth: number;
    userGrowthData: { name: string; newUsers: number }[];
}

export default function AdminDashboardClient({
    totalUsers,
    totalReports,
    pendingReports,
    totalMatches,
    premiumUsers,
    premiumPercentage,
    matchesLastMonth,
    userGrowthData,
}: AdminDashboardClientProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Genel Bakış</CardTitle>
              <CardDescription>Uygulamanızın temel metrikleri</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary"/>
                    </div>
                    <div className="flex-1">
                        <p className="font-bold">Toplam Kullanıcı</p>
                        <p className="text-sm text-muted-foreground">Kayıtlı tüm kullanıcılar</p>
                    </div>
                    <p className="font-bold text-lg">{totalUsers}</p>
                </div>
                 <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-yellow-500"/>
                    </div>
                    <div className="flex-1">
                        <p className="font-bold">Bekleyen Raporlar</p>
                        <p className="text-sm text-muted-foreground">İncelenmesi gereken şikayetler</p>
                    </div>
                    <p className="font-bold text-lg">{pendingReports}</p>
                </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Abonelikler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20">
                        <DonutChart value={premiumPercentage} label="Premium" color="hsl(var(--primary))" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{premiumUsers}</p>
                        <p className="text-sm text-muted-foreground">Premium Üye Sayısı</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20">
                        <DonutChart value={100 - premiumPercentage} label="Standart" color="#8884d8" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{totalUsers - premiumUsers}</p>
                        <p className="text-sm text-muted-foreground">Standart Üye Sayısı</p>
                    </div>
                </div>
            </CardContent>
          </Card>
          <Card>
             <CardHeader>
              <CardTitle>Etkileşim</CardTitle>
            </CardHeader>
             <CardContent className="space-y-4">
                <StatCard title="Toplam Eşleşme" value={totalMatches.toString()} change="+5.4%" changeType="increase" />
                <StatCard title="Son Ayın Eşleşmeleri" value={matchesLastMonth.toString()} change="+6.7%" changeType="increase" />
                <StatCard title="Toplam Rapor" value={totalReports.toString()} change="+3.8%" changeType="decrease" />
                <StatCard title="Aktif Boost'lar" value="12" change="+3.8%" changeType="increase" />
            </CardContent>
          </Card>

          <Card className="md:col-span-4">
             <CardHeader>
              <CardTitle>Kullanıcı Büyümesi</CardTitle>
            </CardHeader>
             <CardContent>
                <div className="h-[250px] w-full">
                <ChartContainer config={{}} className="h-full w-full">
                    <AreaChart data={userGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                        <Area type="monotone" dataKey="newUsers" name="Yeni Kullanıcılar" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUv)" />
                    </AreaChart>
                </ChartContainer>
                </div>
            </CardContent>
          </Card>
        </div>
    );
}
