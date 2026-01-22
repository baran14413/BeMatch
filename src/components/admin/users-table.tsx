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
import { MoreHorizontal, ShieldBan, ShieldCheck, Trash2, UserCog, UserX } from 'lucide-react';
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
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFirestore } from '@/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { add } from 'date-fns';
import { updateUserRole, deleteUserAccount, banUserAccount } from '@/actions/user-actions';
import { useTransition } from 'react';

type PremiumTier = 'plus' | 'gold' | 'platinum';
type UserRole = 'admin' | 'moderator' | 'support' | 'user';


export default function UsersTable({ users }: { users: UserProfile[] }) {
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

  const handleGivePremium = (userId: string, tier: PremiumTier) => {
    handleAction(
        () => {
            const userDocRef = doc(useFirestore(), 'users', userId);
            const expiryDate = add(new Date(), { months: 1 });
            return updateDoc(userDocRef, {
                premiumTier: tier,
                premiumExpiresAt: Timestamp.fromDate(expiryDate),
            }).then(() => ({success: true, message: `Kullanıcıya ${tier.toUpperCase()} üyeliği verildi.`}));
        },
        'Premium Verildi!'
    )
  };

  const handleUpdateRole = (userId: string, role: UserRole) => {
    handleAction(() => updateUserRole(userId, role), 'Kullanıcı Rolü Güncellendi!');
  };
  
  const handleBanUser = (userId: string, currentStatus: boolean) => {
    handleAction(() => banUserAccount(userId, currentStatus), currentStatus ? 'Kullanıcının Yasağı Kaldırıldı!' : 'Kullanıcı Yasaklandı!');
  }
  
  const handleDeleteUser = (userId: string) => {
    handleAction(() => deleteUserAccount(userId), 'Kullanıcı Kalıcı Olarak Silindi!');
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kullanıcı</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Premium</TableHead>
          <TableHead>Durum</TableHead>
           <TableHead><span className="sr-only">Eylemler</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id} className={isPending ? 'opacity-50' : ''}>
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
                {user.isBanned ? <Badge variant="destructive">Yasaklı</Badge> : <Badge variant="default">Aktif</Badge>}
            </TableCell>
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
                  <DropdownMenuItem>Profili Görüntüle</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <UserCog className="mr-2 h-4 w-4" />
                        <span>Rolü Değiştir</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'admin')}>Admin</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'moderator')}>Moderatör</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'support')}>Destek</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'user')}>Kullanıcı</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBanUser(user.id, user.isBanned || false)}>
                    {user.isBanned ? (
                        <>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            <span>Yasağı Kaldır</span>
                        </>
                    ) : (
                         <>
                            <ShieldBan className="mr-2 h-4 w-4" />
                            <span>Hesabı Yasakla</span>
                        </>
                    )}
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                             <Trash2 className="mr-2 h-4 w-4" />
                             <span>Hesabı Sil</span>
                         </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription>
                               Bu eylem geri alınamaz. Bu, kullanıcıyı kalıcı olarak silecek ve verilerini sunucularımızdan kaldıracaktır.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">
                                Evet, Hesabı Sil
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}