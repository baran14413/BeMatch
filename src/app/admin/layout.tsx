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
import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/firebase';
import backend from '@/docs/backend.json';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const [authStatus, setAuthStatus] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');
    const [userRole, setUserRole] = useState<string | null>(null);

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
    
    if (authStatus !== 'authorized') {
        return null;
    }

  return (
      <div className="flex min-h-screen w-full flex-col">
          <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <Link
                    href="#"
                    className="flex items-center gap-2 text-lg font-semibold md:text-base"
                >
                    <LayoutDashboard className="h-6 w-6" />
                    <span className="sr-only">BeMatch</span>
                </Link>
                 <h1 className='text-lg font-semibold'>BeMatch Komuta Merkezi</h1>
            </nav>
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 md:hidden"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <nav className="grid gap-6 text-lg font-medium">
                         <Link
                            href="#"
                            className="flex items-center gap-2 text-lg font-semibold"
                        >
                            <LayoutDashboard className="h-6 w-6" />
                             <span className="sr-only">BeMatch</span>
                        </Link>
                         <h1 className='text-lg font-semibold'>BeMatch Komuta Merkezi</h1>
                    </nav>
                </SheetContent>
            </Sheet>
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <div className="ml-auto flex-1 sm:flex-initial">
                    {/* Potential Search Bar */}
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
                        <DropdownMenuLabel>{userRole && backend.auth.roles && (backend.auth.roles as any)[userRole] ? (backend.auth.roles as any)[userRole].name : (userRole || 'Admin')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/discover">Uygulamaya Dön</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Destek</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Çıkış Yap</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
          </main>
      </div>
  );
}
