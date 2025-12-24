'use client';

import AdminSidebar from '@/components/admin/admin-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Search, Bell, Menu, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    // Wait until both user and profile data are loaded before checking role
    if (!isUserLoading && !isProfileLoading) {
      if (!user) {
        // If no user is logged in, redirect to the discover page.
        router.replace('/discover');
      } else if (userProfile?.role !== 'admin') {
        // If the user is logged in but is not an admin, redirect.
        console.log(`User ${user.uid} with role '${userProfile?.role}' is not an admin. Redirecting.`);
        router.replace('/discover');
      }
    }
  }, [user, isUserLoading, userProfile, isProfileLoading, router]);

  // Determine the overall loading state
  const isLoading = isUserLoading || isProfileLoading;

  // Show a loading screen while authentication and profile data are being fetched.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Yetkiler kontrol ediliyor...</span>
      </div>
    );
  }
  
  // After loading, if the user is not an admin, they will be redirected by the useEffect.
  // We can render a fallback loading state here as well to prevent a flash of content.
  if (userProfile?.role !== 'admin') {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Yönlendiriliyor...</span>
      </div>
    );
  }


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-primary text-primary-foreground md:block">
        <AdminSidebar />
      </div>
      <div className="flex flex-col bg-muted/20">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Navigasyon menüsünü aç</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-primary text-primary-foreground border-none p-0">
               <SheetHeader className="sr-only">
                  <SheetTitle>Admin Navigation Menu</SheetTitle>
              </SheetHeader>
              <AdminSidebar />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Ara..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3 rounded-full"
                />
              </div>
            </form>
          </div>
           <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="sr-only">Bildirimler</span>
          </Button>
           <Avatar className="h-9 w-9">
            <AvatarImage src={userProfile?.avatarUrl} alt="Admin" />
            <AvatarFallback>{userProfile?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
