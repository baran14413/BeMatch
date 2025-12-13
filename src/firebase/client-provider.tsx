'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, useUser } from '@/firebase';
import Cookies from 'js-cookie';


function AuthAwareLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // This effect runs when the user's auth state changes.
    const handleTokenPersistence = async () => {
      if (user) {
        try {
          const token = await user.getIdToken();
          Cookies.set('idToken', token, { expires: 1, secure: process.env.NODE_ENV === 'production' });
        } catch (error) {
          console.error("Error getting user ID token:", error);
          Cookies.remove('idToken');
        }
      } else {
        // If user is null (logged out), remove the cookie.
        Cookies.remove('idToken');
      }
    };

    handleTokenPersistence();

  }, [user]);

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