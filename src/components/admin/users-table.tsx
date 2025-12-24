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
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { useFirestore } from '@/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { add } from 'date-fns';

type PremiumTier = 'plus' | 'gold' | 'platinum';

export default function UsersTable({ users }: { users: UserProfile[] }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleGivePremium = async (userId: string, tier: PremiumTier) => {
    if (!firestore) return;
    
    const userDocRef = doc(firestore, 'users', userId);
    const expiryDate = add(new Date(), { months: 1 });
    
    try {
      await updateDoc(userDocRef, {
        premiumTier: tier,
        premiumExpiresAt: Timestamp.fromDate(expiryDate),
      });
      toast({
        title: 'Premium Verildi!',
        description: `Kullanıcıya ${tier.toUpperCase()} paketi başarıyla tanımlandı.`,
      });
    } catch (error) {
      console.error('Error giving premium:', error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Premium verilirken bir sorun oluştu.',
      });
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kullanıcı</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Premium</TableHead>
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
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Premium Ver</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => handleGivePremium(user.id, 'plus')}>
                          PLUS
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleGivePremium(user.id, 'gold')}>
                          GOLD
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleGivePremium(user.id, 'platinum')}>
                          PLATINUM
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
