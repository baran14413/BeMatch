import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { UserProfile } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function UsersTable({ users }: { users: UserProfile[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kullanıcı</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Premium</TableHead>
          <TableHead>Ülke</TableHead>
          <TableHead>IP Adresi</TableHead>
           <TableHead><span className="sr-only">Eylemler</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="font-medium">{user.name}</div>
              </div>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>{user.role || 'user'}</Badge>
            </TableCell>
             <TableCell>
              {user.premiumTier ? <Badge>{user.premiumTier.toUpperCase()}</Badge> : '-'}
            </TableCell>
            <TableCell>{user.country || '-'}</TableCell>
            <TableCell>{user.ipAddress || '-'}</TableCell>
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
                  <DropdownMenuItem>Profili Görüntüle</DropdownMenuItem>
                  <DropdownMenuItem>Rolü Değiştir</DropdownMenuItem>
                  <DropdownMenuItem>Premium Ver</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
