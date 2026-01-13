'use client';

import MainHeader from '@/components/main-header';
import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import EmailVerificationBanner from '@/components/auth/email-verification-banner';
import { usePageVisibility } from '@/hooks/use-page-visibility';
import NotificationPermissionBanner from '@/components/notifications/notification-permission-banner';
import { cn } from '@/lib/utils';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const isVisible = usePageVisibility();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    // When the tab becomes visible again, reload the user's data
    // to get the latest emailVerified status.
    if (isVisible && user) {
      user.reload();
    }
  }, [isVisible, user]);

  const isChatPage = pathname.startsWith('/chat');
  
  if (isUserLoading || !user) {
    return null;
  }
  
  return (
    <div className="flex flex-col h-dvh">
      {!user.emailVerified && <EmailVerificationBanner />}
      <NotificationPermissionBanner />
      <main className="flex-1 h-full">{children}</main>
      {!isChatPage && <MainHeader />}
    </div>
  );
}
