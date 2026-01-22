'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { Database } from 'firebase/database';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  database: Database;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  storage: FirebaseStorage | null;
  database: Database | null;
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  database: Database;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { 
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
  database,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth || !database || !firestore) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth, Database, or Firestore service not provided.") });
      return;
    }

    setUserAuthState(prev => ({ ...prev, isUserLoading: true }));

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe();
  }, [auth, database, firestore]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && storage && database);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      storage: servicesAvailable ? storage: null,
      database: servicesAvailable ? database: null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, storage, database, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.storage || !context.database) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage,
    database: context.database,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const context = useContext(FirebaseContext);
  if (context === undefined || !context.auth) {
    throw new Error('useAuth must be used within a FirebaseProvider.');
  }
  return context.auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const context = useContext(FirebaseContext);
  if (context === undefined || !context.firestore) {
    throw new Error('useFirestore must be used within a FirebaseProvider.');
  }
  return context.firestore;
};

/** Hook to access Firebase Storage instance. */
export const useStorage = (): FirebaseStorage => {
   const context = useContext(FirebaseContext);
  if (context === undefined || !context.storage) {
    throw new Error('useStorage must be used within a FirebaseProvider.');
  }
  return context.storage;
};

/** Hook to access Realtime Database instance. */
export const useDatabase = (): Database => {
    const context = useContext(FirebaseContext);
    if (context === undefined || !context.database) {
        throw new Error('useDatabase must be used within a FirebaseProvider.');
    }
    return context.database;
}

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const context = useContext(FirebaseContext);
  if (context === undefined || !context.firebaseApp) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider.');
  }
  return context.firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

/**
 * A custom hook that functions like `useMemo`, but adds a marker to the memoized
 * object. This marker is used by other custom hooks (`useCollection`, `useDoc`) to
 * enforce that queries and references passed to them are properly memoized,
 * preventing infinite re-render loops.
 *
 * @template T The type of the value to be memoized.
 * @param {() => T} factory The function that computes the value.
 * @param {DependencyList} deps An array of dependencies. `useMemoFirebase` will only
 * recompute the memoized value when one of the dependencies has changed.
 * @returns {T} The memoized value.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
    const memoized = useMemo(factory, deps);
    
    // Only mark non-null objects. Primitives don't need marking as they are compared by value.
    if (typeof memoized === 'object' && memoized !== null) {
        // This is a "marker" property to ensure that the object instance is stable across renders.
        // Other hooks can check for this property to verify that they are receiving a memoized value.
        (memoized as MemoFirebase<T>).__memo = true;
    }
    
    return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  const { user, isUserLoading, userError } = context;
  return { user, isUserLoading, userError };
};
