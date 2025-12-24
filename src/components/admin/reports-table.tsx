import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Report } from '@/lib/data';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
  pending: 'secondary',
  reviewed: 'default',
  resolved: 'destructive',
};

export default function ReportsTable({ reports }: { reports: Report[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Şikayet Eden</TableHead>
          <TableHead>Şikayet Edilen</TableHead>
          <TableHead>Neden</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Tarih</TableHead>
          <TableHead><span className="sr-only">Eylemler</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => (
          <TableRow key={report.id}>
            <TableCell>{report.reporterId}</TableCell>
            <TableCell>{report.reportedUserId}</TableCell>
            <TableCell className="font-medium">{report.reason}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[report.status]}>{report.status}</Badge>
            </TableCell>
            <TableCell>{formatDistanceToNow(new Date(report.timestamp), { addSuffix: true, locale: tr })}</TableCell>
             <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-haspopup="true" size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Menüyü aç</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Eylemler</DropdownMenuLabel>
                  <DropdownMenuItem>Raporu İncele</DropdownMenuItem>
                  <DropdownMenuItem>Kullanıcıyı Yasakla</DropdownMenuItem>
                  <DropdownMenuItem>Raporu Kapat</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
