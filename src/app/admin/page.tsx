'use client';

import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, FileText, DollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const userGrowthData = [
  { month: 'Oca', users: 120 },
  { month: 'Şub', users: 240 },
  { month: 'Mar', users: 180 },
  { month: 'Nis', users: 350 },
  { month: 'May', users: 420 },
  { month: 'Haz', users: 580 },
];

const dailyActiveData = [
    { day: 'Pzt', active: 22 },
    { day: 'Sal', active: 35 },
    { day: 'Çar', active: 40 },
    { day: 'Per', active: 31 },
    { day: 'Cum', active: 50 },
    { day: 'Cmt', active: 65 },
    { day: 'Paz', active: 60 },
];

const recentActivities = [
  { id: 1, user: 'alex.d@email.com', avatar: 'https://i.pravatar.cc/150?u=alex', type: 'Kayıt Oldu', timestamp: '2 dakika önce' },
  { id: 2, user: 'samantha.g@email.com', avatar: 'https://i.pravatar.cc/150?u=samantha', type: 'Abonelik', timestamp: '5 dakika önce', details: 'Gold Plan' },
  { id: 3, user: 'mike_t@email.com', avatar: 'https://i.pravatar.cc/150?u=mike', type: 'Rapor', timestamp: '10 dakika önce', details: 'Spam Profil' },
  { id: 4, user: 'jessica.w@email.com', avatar: 'https://i.pravatar.cc/150?u=jessica', type: 'Kayıt Oldu', timestamp: '12 dakika önce' },
];


export default function AdminDashboardPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10,234</div>
            <p className="text-xs text-muted-foreground">Geçen aydan +%5.2</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Kullanıcı (Şimdi)</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground">Şu anda çevrimiçi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Gelir</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺12,450</div>
            <p className="text-xs text-muted-foreground">Geçen aydan +%12.1</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Eşleşme</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,350</div>
             <p className="text-xs text-muted-foreground">Bu hafta +180</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Raporlar</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">İnceleme gerektiriyor</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Kullanıcı Büyümesi</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Günlük Aktif Kullanıcılar</CardTitle>
          </CardHeader>
          <CardContent>
             <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dailyActiveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="active" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
         <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
          </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Kullanıcı</TableHead>
                        <TableHead>Tür</TableHead>
                        <TableHead>Detaylar</TableHead>
                        <TableHead>Zaman</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentActivities.map(activity => (
                        <TableRow key={activity.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={activity.avatar} />
                                        <AvatarFallback>{activity.user.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span>{activity.user}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={activity.type === 'Kayıt Oldu' ? 'default' : activity.type === 'Abonelik' ? 'secondary' : 'destructive'}>
                                  {activity.type}
                                </Badge>
                            </TableCell>
                            <TableCell>{activity.details || '-'}</TableCell>
                            <TableCell>{activity.timestamp}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
