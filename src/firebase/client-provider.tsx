'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, useUser } from '@/firebase';

function AuthAwareLayout({ children }: { children: React.ReactNode }) {
  const { isUserLoading } = useUser();

  // Don't render children until the auth state is resolved to prevent flashes
  if (isUserLoading) {
    return null; // or a global loading spinner
  }

  return <>{children}</>;
}


interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
      database={firebaseServices.database}
    >
      <AuthAwareLayout>
        {children}
      </AuthAwareLayout>
    </FirebaseProvider>
  );
}
