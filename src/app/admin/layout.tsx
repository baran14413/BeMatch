'use client';
import {
  Bell,
  Home,
  Users,
  ShieldCheck,
  CreditCard,
  Settings,
  Menu,
  BrainCircuit, // New Icon
  History,      // New Icon
  Ghost,        // New Icon
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import backend from '@/docs/backend.json';

const NavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string; }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
        isActive && 'bg-muted text-primary'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
};


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(true);

    const allNavItems = [
        { href: '/admin', icon: Home, label: 'Genel Bakış', requiredPermission: '/admin' },
        { href: '/admin/users', icon: Users, label: 'Kullanıcı Yönetimi', requiredPermission: '/admin/users' },
        { href: '/admin/safety', icon: ShieldCheck, label: 'Güvenlik & Denetim', requiredPermission: '/admin/safety' },
        { href: '/admin/financials', icon: CreditCard, label: 'Finans & Abonelikler', requiredPermission: '/admin/financials' },
        { href: '/admin/algorithm', icon: BrainCircuit, label: 'Algoritma Ayarları', requiredPermission: '/admin/algorithm' },
        { href: '/admin/app-settings', icon: Settings, label: 'Uygulama Ayarları', requiredPermission: '/admin/app-settings' },
        { href: '/admin/audit-logs', icon: History, label: 'Denetim Kayıtları', requiredPermission: '/admin/audit-logs' },
    ];
    
    const [accessibleNavItems, setAccessibleNavItems] = useState<typeof allNavItems>([]);
    const { roles } = backend.auth;

    useEffect(() => {
        if (isUserLoading) {
            return; // Wait until user object is available
        }

        if (!user) {
            router.replace('/?auth=required'); // Redirect if not logged in
            return;
        }

        user.getIdTokenResult(true)
            .then((idTokenResult) => {
                const claims = idTokenResult.claims;
                const role = claims.role as keyof typeof roles | 'user' | undefined;
                
                if (role && role !== 'user' && role in roles) {
                    setUserRole(role);
                    const roleConfig = roles[role];
                    if (roleConfig) {
                        const userPermissions = roleConfig.permissions;
                        if(userPermissions.includes('*')) {
                            setAccessibleNavItems(allNavItems);
                        } else {
                           const filteredNavItems = allNavItems.filter(item => userPermissions.includes(item.requiredPermission));
                           setAccessibleNavItems(filteredNavItems);
                        }
                    } else {
                        // Role from token doesn't exist in our config, treat as no access
                         router.replace('/?auth=unauthorized');
                    }
                } else {
                    router.replace('/?auth=unauthorized'); // Redirect if not an admin/mod/support
                }
            })
            .catch(() => {
                router.replace('/?auth=error'); // Redirect on error
            })
            .finally(() => {
                setIsChecking(false);
            });

    }, [user, isUserLoading, router, roles]);


    const SidebarContent = () => (
        <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <span className="">BeMatch Komuta Merkezi</span>
            </Link>
        </div>
        <div className="flex-1">
            <nav className="grid items-start gap-1 px-2 text-sm font-medium lg:px-4">
            {accessibleNavItems.map((item) => (
                <NavItem key={item.href} {...item} />
            ))}
            </nav>
        </div>
        </div>
    );
    
    if (isChecking || !userRole) {
        return (
        <div className="flex h-screen w-full items-center justify-center bg-muted/40">
            <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Yetkiniz kontrol ediliyor...</p>
            </div>
        </div>
        );
    }

  return (
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/20 md:block">
          <SidebarContent />
        </div>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Navigasyon menüsünü aç/kapat</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
              {/* Header Content, e.g., Search Bar */}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage src={user?.photoURL || "https://i.pravatar.cc/150?u=superadmin"} />
                    <AvatarFallback>{user?.displayName?.charAt(0) || 'A'}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Kullanıcı menüsünü aç/kapat</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{userRole && userRole in roles ? roles[userRole as keyof typeof roles].name : 'Admin'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Ayarlar</DropdownMenuItem>
                <DropdownMenuItem>Destek</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Çıkış Yap</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
          </main>
        </div>
      </div>
  );
}
