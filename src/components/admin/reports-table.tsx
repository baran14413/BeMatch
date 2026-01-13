'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Report, UserProfile } from '@/lib/data';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ShieldAlert, ShieldCheck, ShieldClose } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { banUserAccount } from '@/actions/user-actions';
import { updateReportStatus } from '@/actions/report-actions';

export type EnrichedReport = Report & {
  reporter: UserProfile | null;
  reportedUser: UserProfile | null;
};


const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  pending: 'secondary',
  reviewed: 'default',
  resolved: 'destructive',
};

const statusText: { [key: string]: string } = {
  pending: 'Bekliyor',
  reviewed: 'İncelendi',
  resolved: 'Çözüldü',
};


const formatDate = (timestamp: any, locale: string) => {
    if (!timestamp) return '-';
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return formatDistanceToNow(date, { addSuffix: true, locale: locale === 'tr' ? tr : enUS });
    } catch (e) {
        return '-';
    }
}

export default function ReportsTable({ reports }: { reports: EnrichedReport[] }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleAction = async (action: () => Promise<{success: boolean; message: string;}>, successMessage: string) => {
        startTransition(async () => {
            const result = await action();
            toast({
                variant: result.success ? 'default' : 'destructive',
                title: result.success ? successMessage : 'Bir Hata Oluştu',
                description: result.message,
            });
        });
    }

    const handleBan = (reportedUser: UserProfile | null) => {
        if(!reportedUser) return;
        handleAction(() => banUserAccount(reportedUser.id, reportedUser.isBanned || false), `Kullanıcı ${reportedUser.isBanned ? 'yasağı kaldırıldı' : 'yasaklandı'}`);
    }

    const handleUpdateStatus = (reportId: string, status: 'reviewed' | 'resolved') => {
        handleAction(() => updateReportStatus(reportId, status), `Rapor durumu '${status}' olarak güncellendi.`);
    }

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
            <TableCell>
                 <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={report.reporter?.avatarUrl} alt={report.reporter?.name} />
                      <AvatarFallback>{report.reporter?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{report.reporter?.name || report.reporterId}</div>
                </div>
            </TableCell>
            <TableCell>
                 <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={report.reportedUser?.avatarUrl} alt={report.reportedUser?.name} />
                      <AvatarFallback>{report.reportedUser?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{report.reportedUser?.name || report.reportedUserId}</div>
                </div>
            </TableCell>
            <TableCell className="font-medium">{report.reason}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[report.status]}>{statusText[report.status]}</Badge>
            </TableCell>
            <TableCell>{formatDate(report.timestamp, 'tr')}</TableCell>
             <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isPending}>
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Menüyü aç</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Eylemler</DropdownMenuLabel>
                  <DropdownMenuItem>Sohbeti İncele</DropdownMenuItem>
                   <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleUpdateStatus(report.id, 'reviewed')}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    <span>İncelendi Olarak İşaretle</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpdateStatus(report.id, 'resolved')}>
                    <ShieldClose className="mr-2 h-4 w-4" />
                    <span>Çözüldü Olarak İşaretle</span>
                  </DropdownMenuItem>
                   <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBan(report.reportedUser)} disabled={!report.reportedUser} className="text-destructive focus:bg-destructive/10">
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    <span>Kullanıcıyı Yasakla</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
