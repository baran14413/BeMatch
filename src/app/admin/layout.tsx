'use client';
import {
  Home,
  Users,
  ShieldCheck,
  CreditCard,
  Settings,
  Menu,
  BrainCircuit,
  History,
  LayoutDashboard,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
    const [authStatus, setAuthStatus] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');
    const [userRole, setUserRole] = useState<string | null>(null);

    const allNavItems = [
        { href: '/admin', icon: Home, label: 'Genel Bakış' },
        { href: '/admin/users', icon: Users, label: 'Kullanıcı Yönetimi' },
        { href: '/admin/safety', icon: ShieldCheck, label: 'Güvenlik & Denetim' },
        { href: '/admin/financials', icon: CreditCard, label: 'Finans & Abonelikler' },
        { href: '/admin/algorithm', icon: BrainCircuit, label: 'Algoritma Ayarları' },
        { href: '/admin/app-settings', icon: Settings, label: 'Uygulama Ayarları' },
        { href: '/admin/audit-logs', icon: History, label: 'Denetim Kayıtları' },
    ];
    
    useEffect(() => {
        if (isUserLoading) {
            setAuthStatus('checking');
            return;
        }

        if (!user) {
            setAuthStatus('unauthorized');
            return;
        }

        user.getIdTokenResult(true)
            .then((idTokenResult) => {
                const claims = idTokenResult.claims;
                const role = claims.role as keyof typeof backend.auth.roles | undefined;

                if (role && (role === 'admin' || role === 'moderator' || role === 'support')) {
                    setUserRole(role);
                    setAuthStatus('authorized');
                } else {
                    setAuthStatus('unauthorized');
                }
            })
            .catch(() => {
                setAuthStatus('unauthorized');
            });

    }, [user, isUserLoading]);
    
    if (authStatus === 'checking') {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-muted/40">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Yetkiniz kontrol ediliyor...</p>
                </div>
            </div>
        );
    }
    
    if (authStatus === 'unauthorized') {
        router.replace('/?auth=unauthorized');
        return null;
    }


    const SidebarContent = () => (
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/admin" className="flex items-center gap-2 font-semibold">
                    <span className="">BeMatch Komuta Merkezi</span>
                </Link>
            </div>
            <div className="flex-1">
                <nav className="grid items-start gap-1 px-2 text-sm font-medium lg:px-4">
                    {allNavItems.map((item) => (
                        <NavItem key={item.href} {...item} />
                    ))}
                </nav>
            </div>
        </div>
    );

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
                 <SheetHeader className="sr-only">
                    <SheetTitle>Admin Navigation</SheetTitle>
                 </SheetHeader>
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
                <DropdownMenuLabel>{userRole ? (backend.auth.roles as any)[userRole]?.name : 'Admin'}</DropdownMenuLabel>
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
