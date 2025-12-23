'use client';
import {
  Home,
  Users,
  Shield,
  Heart,
  Settings,
  Menu,
  Bell,
  Search,
  LogOut,
  LayoutDashboard,
  Loader2,
  ChevronRight,
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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import backend from '@/docs/backend.json';
import { useLanguage } from '@/context/language-context';
import { collection, query, where } from 'firebase/firestore';
import type { Report } from '@/lib/data';


const SidebarLink = ({ href, icon: Icon, children, hasBadge, badgeCount }: { href: string; icon: any; children: React.ReactNode; hasBadge?: boolean; badgeCount?: number; }) => {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-700",
                isActive && "bg-gray-800 text-white"
            )}
        >
            <Icon className="h-4 w-4" />
            {children}
            {hasBadge && badgeCount! > 0 && (
                <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs">
                    {badgeCount}
                </span>
            )}
        </Link>
    );
};

const SidebarContent = ({ userRole, pendingReportsCount }: { userRole: string | null; pendingReportsCount?: number }) => {
  const { t } = useLanguage();

  const navLinks = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', requiredPermission: '/admin' },
    { href: '/admin/users', icon: Users, label: 'User Management', requiredPermission: '/admin/users' },
    { href: '/admin/matches', icon: Heart, label: 'Match History', requiredPermission: '/admin/matches' },
    { href: '/admin/safety', icon: Shield, label: 'Moderation/Reports', requiredPermission: '/admin/safety', hasBadge: true },
    { href: '/admin/settings', icon: Settings, label: 'Settings', requiredPermission: '/admin/settings' },
  ];

  const getFilteredLinks = () => {
    if (!userRole) return [];
    
    const permissions = (backend.auth.roles as any)[userRole]?.permissions || [];
    if (permissions.includes('*')) {
      return navLinks;
    }

    return navLinks.filter(link => permissions.includes(link.requiredPermission));
  };

  const filteredNavLinks = getFilteredLinks();

  return (
    <div className="flex h-full max-h-screen flex-col gap-2 bg-[#1f1f1f] text-white">
        <div className="flex h-16 items-center border-b border-gray-700 px-6 pt-[env(safe-area-inset-top,0rem)]">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
                <Heart className="h-6 w-6 text-pink-500" />
                <span>BeMatch Admin</span>
            </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
                {filteredNavLinks.map(link => (
                    <SidebarLink key={link.href} href={link.href} icon={link.icon} hasBadge={link.hasBadge} badgeCount={pendingReportsCount}>
                        {link.label}
                    </SidebarLink>
                ))}
            </nav>
        </div>
        <div className="mt-auto p-4 border-t border-gray-700 pb-[env(safe-area-inset-bottom,0rem)]">
            <SidebarLink href="#" icon={LogOut}>
                Logout
            </SidebarLink>
            <p className="text-xs text-gray-500 mt-2 text-center">Version 1.0.0</p>
        </div>
    </div>
  );
};


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const auth = useAuth();
    const firestore = useFirestore();
    const [authStatus, setAuthStatus] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');
    const [userRole, setUserRole] = useState<string | null>(null);

    const pendingReportsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, "reports"), where("status", "==", "pending"));
    }, [user, firestore]);
    const { data: pendingReports } = useCollection<Report>(pendingReportsQuery);


    useEffect(() => {
        if (isUserLoading) {
            setAuthStatus('checking');
            return;
        }

        if (!user) {
            setAuthStatus('unauthorized');
            router.replace('/?auth=unauthorized');
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
                    router.replace('/?auth=unauthorized');
                }
            })
            .catch(() => {
                setAuthStatus('unauthorized');
                router.replace('/?auth=unauthorized');
            });

    }, [user, isUserLoading, router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/');
    };
    
    if (authStatus === 'checking') {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Yetkiniz kontrol ediliyor...</p>
                </div>
            </div>
        );
    }
    
    if (authStatus !== 'authorized') {
        return null;
    }

  return (
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
          <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
            <SidebarContent userRole={userRole} pendingReportsCount={pendingReports?.length} />
          </div>
          <div className="flex flex-col">
              <header className="flex h-14 items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40 pt-[env(safe-area-inset-top,0rem)]">
                  <Sheet>
                      <SheetTrigger asChild>
                          <Button
                              variant="outline"
                              size="icon"
                              className="shrink-0 lg:hidden"
                          >
                              <Menu className="h-5 w-5" />
                              <span className="sr-only">Toggle navigation menu</span>
                          </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="flex flex-col p-0 bg-[#1f1f1f] text-white border-r-0">
                          <SidebarContent userRole={userRole} pendingReportsCount={pendingReports?.length} />
                      </SheetContent>
                  </Sheet>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Link href="/admin" className="hover:text-foreground">Home</Link>
                      <ChevronRight className="h-4 w-4" />
                      <span className="font-medium text-foreground">Dashboard</span>
                  </div>

                  <div className="w-full flex-1">
                      <form>
                          <div className="relative">
                              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                  type="search"
                                  placeholder="Search users, matches, IDs..."
                                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                              />
                          </div>
                      </form>
                  </div>
                   <Button variant="ghost" size="icon" className="rounded-full">
                       <Bell className="h-5 w-5" />
                       <span className="sr-only">Toggle notifications</span>
                   </Button>
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" className="rounded-full">
                              <Avatar className="h-8 w-8">
                                  <AvatarImage src={user?.photoURL || ''} />
                                  <AvatarFallback>{user?.displayName?.charAt(0) || 'A'}</AvatarFallback>
                              </Avatar>
                              <span className="sr-only">Kullanıcı menüsünü aç/kapat</span>
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Admin</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild><Link href="/discover">Uygulamaya Dön</Link></DropdownMenuItem>
                          <DropdownMenuItem>Destek</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleLogout}>Çıkış Yap</DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              </header>
              <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 bg-gray-50 dark:bg-black pb-[env(safe-area-inset-bottom,0rem)]">
                {children}
              </main>
          </div>
      </div>
  );
}
