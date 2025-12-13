'use client';

import MainHeader from '@/components/main-header';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

const GhostModeBanner = ({ adminUser, ghostUser }: { adminUser: User, ghostUser: UserProfile | null }) => {

    const handleExitGhostMode = () => {
        localStorage.removeItem('ghostModeUser');
        window.location.href = '/admin/users';
    };

    return (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center p-2 z-50 text-sm font-semibold flex items-center justify-center gap-4">
            <Eye className="w-4 h-4" />
            <span><b>{adminUser.displayName || adminUser.email}</b> olarak, <b>{ghostUser?.name || '...'}</b> adına geziniyorsunuz.</span>
            <Button variant="ghost" size="sm" onClick={handleExitGhostMode} className="text-black hover:bg-black/10">
                <X className="w-4 h-4 mr-1" />
                Çıkış
            </Button>
        </div>
    )
}


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isUserLoading, ghostMode, adminUser } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/?loggedOut=true');
    }
  }, [isUserLoading, user, router]);

  const isChatPage = pathname.startsWith('/chat');
  const mainContentPadding = ghostMode ? 'pt-[36px]' : '';


  if (isUserLoading || !user) {
    return null;
  }
  
  return (
    <div className="flex flex-col h-screen bg-background">
      {ghostMode && adminUser && (
        <GhostModeBanner adminUser={adminUser} ghostUser={user as UserProfile} />
      )}
      <div className={mainContentPadding}>
        {!isChatPage && <MainHeader />}
      </div>
      <ScrollArea className="flex-1">
        <main className={mainContentPadding}>{children}</main>
      </ScrollArea>
    </div>
  );
}
