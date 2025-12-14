'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserX, Trash2, Crown, Loader2, Ban, UserCog } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';
import { useState, useMemo, useTransition } from 'react';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { add } from 'date-fns';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter, 
    DialogClose 
} from '@/components/ui/dialog';
import { 
    AlertDialog, 
    AlertDialogContent, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogCancel, 
    AlertDialogAction 
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { subscriptionPackages } from '@/config/subscriptions';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import backend from '@/docs/backend.json';
import { setUserRoleAction, deleteUserAction } from '@/actions/user-actions';


const UserTableRowSkeleton = () => (
    <TableRow>
        <TableCell>
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className='space-y-2'>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                </div>
            </div>
        </TableCell>
        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
    </TableRow>
)

type PremiumGrantState = {
  user: UserProfile | null;
  selectedTier: 'plus' | 'gold' | 'platinum' | null;
  selectedDuration: number | null; // in days
};

type RoleAssignState = {
    user: UserProfile | null;
    selectedRole: string | null;
};

type DeleteUserState = {
    user: UserProfile | null;
}

export function UserTable() {
    const firestore = useFirestore();
    const usersQuery = useMemoFirebase(() => query(collection(firestore, 'users')), [firestore]);
    const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);
    const { toast } = useToast();
    const { t } = useLanguage();

    const [isPending, startTransition] = useTransition();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [genderFilter, setGenderFilter] = useState('all');
    const [onlineFilter, setOnlineFilter] = useState('all');

    const [grantModalState, setGrantModalState] = useState<PremiumGrantState>({ user: null, selectedTier: null, selectedDuration: null });
    const [userToRevoke, setUserToRevoke] = useState<UserProfile | null>(null);
    const [roleModalState, setRoleModalState] = useState<RoleAssignState>({ user: null, selectedRole: null });
    const [deleteModalState, setDeleteModalState] = useState<DeleteUserState>({ user: null });


    const durationOptions = [
        { label: '7 Gün', days: 7 },
        { label: '30 Gün', days: 30 },
        { label: '90 Gün', days: 90 },
        { label: '1 Yıl', days: 365 },
    ];
    
    const availableRoles = useMemo(() => {
        const rolesConfig = backend.auth?.roles;
        if (!rolesConfig) return [];
        return Object.entries(rolesConfig).map(([key, value]) => ({ 
            id: key, 
            name: (value as { name: string }).name 
        }));
    }, []);

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(user => {
            const name = user.name || '';
            const email = user.email || '';
            const searchMatch = name.toLowerCase().includes(searchTerm.toLowerCase()) || email.toLowerCase().includes(searchTerm.toLowerCase());

            const statusMatch = statusFilter === 'all';
            const genderMatch = genderFilter === 'all' || user.gender === genderFilter;
            const onlineMatch = onlineFilter === 'all';
            
            return searchMatch && statusMatch && genderMatch && onlineMatch;
        });
    }, [users, searchTerm, statusFilter, genderFilter, onlineFilter]);

    const handleConfirmGrantPremium = async () => {
        if (!grantModalState.user || !grantModalState.selectedTier || !grantModalState.selectedDuration) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Lütfen bir paket ve süre seçin.' });
            return;
        }
        
        const { user, selectedTier, selectedDuration } = grantModalState;
        
        startTransition(async () => {
            const userDocRef = doc(firestore, 'users', user.id);
            const expiresAt = add(new Date(), { days: selectedDuration });

            try {
                await updateDoc(userDocRef, {
                    premiumTier: selectedTier,
                    premiumExpiresAt: expiresAt,
                });
                toast({
                    title: 'Premium Verildi',
                    description: `${user.name} kullanıcısına ${selectedTier.toUpperCase()} paketi ${selectedDuration} gün süreyle verildi.`,
                });
            } catch (error) {
                console.error("Premium verme hatası:", error);
                toast({
                    variant: 'destructive',
                    title: 'Hata',
                    description: 'Premium yetkisi verilirken bir sorun oluştu.',
                });
            } finally {
                setGrantModalState({ user: null, selectedTier: null, selectedDuration: null });
            }
        });
    };
    
    const handleRevokePremium = async () => {
      if (!userToRevoke) return;

      startTransition(async () => {
          const userDocRef = doc(firestore, 'users', userToRevoke.id);
          try {
            await updateDoc(userDocRef, {
              premiumTier: null,
              premiumExpiresAt: null,
            });
            toast({
              title: 'Premium Yetkisi Alındı',
              description: `${userToRevoke.name} kullanıcısının premium yetkisi kaldırıldı.`,
            });
          } catch (error) {
            console.error("Premium alma hatası:", error);
            toast({
              variant: 'destructive',
              title: 'Hata',
              description: 'Premium yetkisi alınırken bir hata oluştu.',
            });
          } finally {
            setUserToRevoke(null);
          }
      });
    };
    
   const handleAssignRole = async () => {
        if (!roleModalState.user || !roleModalState.selectedRole) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Lütfen bir rol seçin.' });
            return;
        }
        
        const { user, selectedRole } = roleModalState;
        
        startTransition(async () => {
            const userDocRef = doc(firestore, 'users', user.id);
            try {
                // First, optimistically update the role in Firestore
                await updateDoc(userDocRef, { role: selectedRole });

                // Then, call the server action to set the custom claim
                const result = await setUserRoleAction(user.id, selectedRole);

                if (result.success) {
                    toast({
                        title: 'Rol Atandı',
                        description: `${user.name} kullanıcısına "${selectedRole}" rolü başarıyla atandı.`,
                    });
                } else {
                    // If the server action fails, revert the change in Firestore
                    toast({
                        variant: 'destructive',
                        title: 'Yetki Atanamadı',
                        description: result.error || 'Sunucu tarafında yetki (claim) atanamadı.',
                    });
                     await updateDoc(userDocRef, { role: user.role || 'user' }); // Revert
                }
            } catch (error) {
                 toast({
                    variant: 'destructive',
                    title: 'Firestore Hatası',
                    description: 'Rol güncellenirken bir veritabanı hatası oluştu.',
                });
                 await updateDoc(userDocRef, { role: user.role || 'user' }); // Revert
            } finally {
                 setRoleModalState({ user: null, selectedRole: null });
            }
        });
    };

    const handleDeleteUser = async () => {
        if (!deleteModalState.user) return;
        
        const userToDelete = deleteModalState.user;

        startTransition(async () => {
            const userDocRef = doc(firestore, 'users', userToDelete.id);
            try {
                // Delete from Firestore first, useCollection will update the UI
                await deleteDoc(userDocRef);

                // Then, delete from Auth in the background via Server Action
                const result = await deleteUserAction(userToDelete.id);
            
                if (result.success) {
                    toast({
                        title: 'Kullanıcı Silindi',
                        description: `${userToDelete.name} kullanıcısı başarıyla sistemden kaldırıldı.`,
                    });
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Authentication Hatası',
                        description: result.error || 'Kullanıcı kimlik doğrulama sisteminden silinemedi.',
                    });
                }
            } catch (firestoreError) {
                console.error("Firestore kullanıcı silme hatası:", firestoreError);
                toast({
                    variant: 'destructive',
                    title: 'Veritabanı Hatası',
                    description: 'Kullanıcı veritabanından silinemedi.',
                });
            } finally {
                setDeleteModalState({ user: null });
            }
        });
    };

    const getRoleName = (roleId: string) => {
        const roles = backend.auth.roles as Record<string, { name: string }>;
        return roles[roleId]?.name || roleId;
    }


    return (
        <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
            <Input 
                placeholder="İsim, e-posta veya ID'ye göre filtrele..." 
                className="max-w-sm" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Duruma göre filtrele" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="banned">Yasaklı</SelectItem>
                    <SelectItem value="pending">Beklemede</SelectItem>
                </SelectContent>
            </Select>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Cinsiyete göre filtrele" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tüm Cinsiyetler</SelectItem>
                    <SelectItem value="woman">Kadın</SelectItem>
                    <SelectItem value="man">Erkek</SelectItem>
                </SelectContent>
            </Select>
            <Select value={onlineFilter} onValueChange={setOnlineFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Çevrimiçi durumu" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="online">Çevrimiçi</SelectItem>
                    <SelectItem value="offline">Çevrimdışı</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Yaş</TableHead>
                <TableHead>Cinsiyet</TableHead>
                <TableHead>Konum</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead>İşlemler</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <UserTableRowSkeleton key={i} />)
                ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className='relative'>
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium flex items-center gap-2">
                                    {user.name}
                                    {user.premiumTier && <Crown className="w-4 h-4 text-yellow-500" />}
                                </div>
                                <p className='text-xs text-muted-foreground'>{user.email}</p>
                                {!!user.role && user.role !== 'user' && (
                                    <Badge variant={user.role === 'admin' ? "destructive" : "secondary"} className="mt-1">
                                        {getRoleName(user.role)}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        </TableCell>
                        <TableCell>{user.age}</TableCell>
                        <TableCell>{user.gender === 'man' ? 'Erkek' : 'Kadın'}</TableCell>
                        <TableCell>{user.location}</TableCell>
                        <TableCell>
                        <Badge variant={user.premiumTier ? 'default' : 'secondary'} className={
                            user.premiumTier === 'gold' ? 'bg-yellow-500 text-white' : 
                            user.premiumTier === 'platinum' ? 'bg-gray-800 text-white' : ''
                        }>
                            {user.premiumTier ? user.premiumTier.toUpperCase() : 'Standard'}
                        </Badge>
                        </TableCell>
                        <TableCell>{user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Menüyü aç</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                             <DropdownMenuItem asChild>
                                <Link href={`/admin/users/${user.id}`}>Detayları Görüntüle</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setRoleModalState({ user, selectedRole: user.role || 'user' })}>
                                <UserCog className="mr-2 h-4 w-4" />
                                <span>Rol Ata</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => setGrantModalState({ user, selectedTier: null, selectedDuration: null })}>
                                <Crown className="mr-2 h-4 w-4" />
                                <span>Premium Yetkisi Ver</span>
                            </DropdownMenuItem>
                             {user.premiumTier && (
                                <DropdownMenuItem onSelect={() => setUserToRevoke(user)} className="text-orange-500">
                                  <Ban className="mr-2 h-4 w-4" />
                                  <span>Premium Yetkisini Al</span>
                                </DropdownMenuItem>
                              )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <UserX className="mr-2 h-4 w-4" />
                                Kullanıcıyı Yasakla
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setDeleteModalState({ user })} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hesabı Sil
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                            Sonuç bulunamadı.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        <Dialog open={!!grantModalState.user} onOpenChange={(isOpen) => !isOpen && setGrantModalState({ user: null, selectedTier: null, selectedDuration: null })}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Kullanıcıya Premium Yetkisi Ver: {grantModalState.user?.name}</DialogTitle>
                    <DialogDescription>
                        Aşağıdan bir paket ve geçerlilik süresi seçerek kullanıcıya premium yetkisi atayın.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                     {subscriptionPackages.map((pkg) => (
                         <div
                            key={pkg.id}
                            onClick={() => setGrantModalState(prev => ({...prev, selectedTier: pkg.id as 'plus' | 'gold' | 'platinum'}))}
                            className={cn(
                                "border-2 rounded-lg p-4 cursor-pointer transition-all",
                                grantModalState.selectedTier === pkg.id ? "border-primary ring-2 ring-primary" : "border-border"
                            )}
                         >
                            <h3 className="font-bold text-lg" style={{color: pkg.colors.from}}>{pkg.name}</h3>
                            <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                               {pkg.features.slice(0, 4).map((feature, i) => (
                                   <li key={i} className={cn(!feature.included && "line-through opacity-50")}>{t(feature.text)}</li>
                               ))}
                            </ul>
                         </div>
                     ))}
                </div>
                 <div>
                    <Label className="font-semibold">Süre Seçimi</Label>
                    <RadioGroup 
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2"
                        value={grantModalState.selectedDuration?.toString()}
                        onValueChange={(val) => setGrantModalState(prev => ({...prev, selectedDuration: parseInt(val)}))}
                    >
                       {durationOptions.map(opt => (
                           <Label key={opt.days} className={cn("border rounded-md p-4 flex justify-center items-center cursor-pointer", grantModalState.selectedDuration === opt.days && "border-primary ring-2 ring-primary")}>
                                <RadioGroupItem value={opt.days.toString()} className="sr-only" />
                                {opt.label}
                           </Label>
                       ))}
                    </RadioGroup>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            İptal
                        </Button>
                    </DialogClose>
                    <Button onClick={handleConfirmGrantPremium} disabled={!grantModalState.selectedTier || !grantModalState.selectedDuration || isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Yetkiyi Onayla
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
         <AlertDialog open={!!userToRevoke} onOpenChange={(isOpen) => !isOpen && setUserToRevoke(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Premium Yetkisini Al</AlertDialogTitle>
                    <AlertDialogDescription>
                       {userToRevoke?.name} kullanıcısının premium yetkisini almak istediğinizden emin misiniz? Bu işlem kullanıcının aboneliğini anında sonlandıracaktır.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleRevokePremium}
                        disabled={isPending}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                         {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Evet, Yetkiyi Al
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <Dialog open={!!roleModalState.user} onOpenChange={(isOpen) => !isOpen && setRoleModalState({ user: null, selectedRole: null })}>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Rol Ata: {roleModalState.user?.name}</DialogTitle>
                    <DialogDescription>
                        Kullanıcının yönetici panelindeki yetkilerini belirlemek için bir rol seçin.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                     <RadioGroup
                        value={roleModalState.selectedRole || 'user'}
                        onValueChange={(val) => setRoleModalState(prev => ({ ...prev, selectedRole: val }))}
                        className="space-y-2"
                     >
                        {availableRoles.map(role => (
                            <Label key={role.id} className={cn("border rounded-md p-4 flex items-center justify-between cursor-pointer", roleModalState.selectedRole === role.id && "border-primary ring-2 ring-primary")}>
                                <span className="font-semibold">{role.name}</span>
                                <RadioGroupItem value={role.id} />
                           </Label>
                        ))}
                     </RadioGroup>
                </div>
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            İptal
                        </Button>
                    </DialogClose>
                    <Button onClick={handleAssignRole} disabled={!roleModalState.selectedRole || isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Rolü Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        <AlertDialog open={!!deleteModalState.user} onOpenChange={(isOpen) => !isOpen && setDeleteModalState({ user: null })}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Kullanıcıyı Sil: {deleteModalState.user?.name}</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu işlem geri alınamaz. Kullanıcıyı, tüm verilerini (profil, fotoğraflar, sohbetler) ve aboneliklerini kalıcı olarak silmek istediğinizden emin misiniz?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteUser}
                        disabled={isPending}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                         {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Evet, Kullanıcıyı Kalıcı Olarak Sil
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </div>
    );
}

    
    
    