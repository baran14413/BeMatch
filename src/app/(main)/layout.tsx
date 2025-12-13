'use client';

import MainHeader from '@/components/main-header';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';

const GhostModeBanner = ({ ghostUserId, onExit }: { ghostUserId: string, onExit: () => void }) => {
    const firestore = useFirestore();
    const ghostUserDocRef = useMemoFirebase(() => doc(firestore, 'users', ghostUserId), [firestore, ghostUserId]);
    const { data: ghostUser } = useDoc<UserProfile>(ghostUserDocRef);

    return (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center p-2 z-50 text-sm font-semibold flex items-center justify-center gap-4">
            <Eye className="w-4 h-4" />
            <span>Şu anda <b>{ghostUser?.name || '...'}</b> olarak geziniyorsunuz.</span>
            <Button variant="ghost" size="sm" onClick={onExit} className="text-black hover:bg-black/10">
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
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [ghostModeUser, setGhostModeUser] = useState<string | null>(null);

  useEffect(() => {
    // Check for ghost mode user on initial load
    const ghostUserId = localStorage.getItem('ghostModeUser');
    setGhostModeUser(ghostUserId);

    if (!isUserLoading && !user) {
      router.replace('/?loggedOut=true');
    }
  }, [isUserLoading, user, router]);

  const handleExitGhostMode = () => {
    localStorage.removeItem('ghostModeUser');
    setGhostModeUser(null);
    // Optional: reload or navigate to ensure clean state
    window.location.reload();
  };

  const isChatPage = pathname.startsWith('/chat');
  const mainContentPadding = ghostModeUser ? 'pt-[36px]' : '';


  if (isUserLoading || !user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {ghostModeUser && <GhostModeBanner ghostUserId={ghostModeUser} onExit={handleExitGhostMode} />}
      <div className={mainContentPadding}>
        {!isChatPage && <MainHeader />}
      </div>
      <ScrollArea className="flex-1">
        <main className={mainContentPadding}>{children}</main>
      </ScrollArea>
    </div>
  );
}
