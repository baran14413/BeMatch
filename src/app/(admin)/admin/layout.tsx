'use client';
import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading) {
      if (!user) {
        router.replace('/');
      } else if (userProfile?.role !== 'admin' && userProfile?.role !== 'moderator' && userProfile?.role !== 'support') {
        router.replace('/discover');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, isUserLoading, userProfile, isProfileLoading, router]);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/40">
      <AdminSidebar />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
