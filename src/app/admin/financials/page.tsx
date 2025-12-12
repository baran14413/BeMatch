'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';

const transactions = [
  { id: 'txn_1', user: 'user_x', plan: 'Gold', amount: '₺149.99', status: 'Başarılı', date: '2024-07-20' },
  { id: 'txn_2', user: 'user_y', plan: 'Platinum', amount: '₺899.99', status: 'Başarılı', date: '2024-07-20' },
  { id: 'txn_3', user: 'user_z', plan: 'Plus', amount: '₺49.99', status: 'Başarısız', date: '2024-07-19' },
  { id: 'txn_4', user: 'user_a', plan: 'Gold', amount: '₺149.99', status: 'İade Edildi', date: '2024-07-18' },
];

export default function FinancialHubPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Finans & Abonelikler</h1>
      <div className="grid gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">₺25,678.00</div>
                <p className="text-xs text-muted-foreground">Geçen aydan +%15.3</p>
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Son İşlemler</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İşlem ID</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>{txn.id}</TableCell>
                    <TableCell>{txn.user}</TableCell>
                    <TableCell>{txn.plan}</TableCell>
                    <TableCell>{txn.amount}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          txn.status === 'Başarılı'
                            ? 'default'
                            : txn.status === 'Başarısız'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {txn.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{txn.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
