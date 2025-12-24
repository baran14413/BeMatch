'use client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { DollarSign, Users, ShieldCheck, TrendingUp, TrendingDown } from "lucide-react"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Label, Pie, PieChart, Cell } from "recharts"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const areaChartData = [
  { name: 'Jan', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Feb', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Mar', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Apr', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'May', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Jun', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Jul', uv: 3490, pv: 4300, amt: 2100 },
];


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

export default function AdminDashboard() {
    return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Lorem ipsum</CardTitle>
              <CardDescription>Dolor sit amet</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-yellow-500"/>
                    </div>
                    <div className="flex-1">
                        <p className="font-bold">Lorem ipsum</p>
                        <p className="text-sm text-muted-foreground">Amet lorem</p>
                    </div>
                    <p className="font-bold text-lg">5,678</p>
                </div>
                 <div className="flex items-center p-2">
                    <p className="text-sm text-muted-foreground flex-1">Lorem ipsum dolor sit</p>
                    <TrendingUp className="w-8 h-8 text-muted-foreground"/>
                </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Lorem Ipsum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20">
                        <DonutChart value={55} label="Lorem" color="hsl(var(--primary))" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">$3 450</p>
                        <p className="text-sm text-muted-foreground">Lorem ipsum dolor sit amet</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20">
                        <DonutChart value={33} label="Ipsum" color="#8884d8" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">$4 780</p>
                        <p className="text-sm text-muted-foreground">Lorem ipsum dolor sit amet</p>
                    </div>
                </div>
            </CardContent>
          </Card>
          <Card>
             <CardHeader>
              <CardTitle>Dolor Sit</CardTitle>
            </CardHeader>
             <CardContent className="space-y-4">
                <StatCard title="Amet lorem" value="Lorem" change="+5.4%" changeType="increase" />
                <StatCard title="Amet lorem" value="Ipsum" change="+6.7%" changeType="increase" />
                <StatCard title="Amet lorem" value="Dolor" change="+3.8%" changeType="decrease" />
                <StatCard title="Amet lorem" value="Dolor" change="+3.8%" changeType="increase" />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
             <CardHeader>
              <CardTitle>Ipsum Dolor</CardTitle>
            </CardHeader>
             <CardContent>
                <div className="h-[200px] w-full">
                <ChartContainer config={{}} className="h-full w-full">
                    <AreaChart data={areaChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                             <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                        <Area type="monotone" dataKey="uv" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUv)" />
                         <Area type="monotone" dataKey="pv" stroke="#82ca9d" fillOpacity={1} fill="url(#colorPv)" />
                    </AreaChart>
                </ChartContainer>
                </div>
            </CardContent>
          </Card>
          
           <Card className="md:col-span-2">
             <CardHeader>
              <CardTitle>Amet Lorem</CardTitle>
            </CardHeader>
             <CardContent>
                <div className="h-[200px] w-full">
                <ChartContainer config={{}} className="h-full w-full">
                    <AreaChart data={areaChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                         <defs>
                             <linearGradient id="colorPv2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                         <Area type="monotone" dataKey="pv" stroke="#82ca9d" fillOpacity={1} fill="url(#colorPv2)" />
                    </AreaChart>
                </ChartContainer>
                </div>
            </CardContent>
          </Card>
        </div>
    )
}
