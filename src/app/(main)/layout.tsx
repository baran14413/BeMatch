'use client';

import MainHeader from '@/components/main-header';
import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [isUserLoading, user, router]);

  const isChatPage = pathname.startsWith('/chat');
  
  if (isUserLoading || !user) {
    return null;
  }
  
  return (
    <div className="flex flex-col h-dvh bg-background">
      {!isChatPage && <MainHeader />}
      <ScrollArea className="flex-1">
        <main>{children}</main>
      </ScrollArea>
    </div>
  );
}
