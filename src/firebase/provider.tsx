'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc } from 'firebase/firestore';
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
  ghostMode: boolean;
  adminUser: User | null;
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
  ghostMode: boolean;
  adminUser: User | null;
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
  ghostMode: boolean;
  adminUser: User | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { // Renamed from UserAuthHookResult for consistency if desired, or keep as UserAuthHookResult
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  ghostMode: boolean;
  adminUser: User | null;
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
    ghostMode: false,
    adminUser: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth || !database || !firestore) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth, Database, or Firestore service not provided."), ghostMode: false, adminUser: null });
      return;
    }

    setUserAuthState(prev => ({ ...prev, isUserLoading: true }));

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        const ghostUserId = localStorage.getItem('ghostModeUser');

        if (ghostUserId && firebaseUser) {
            // We are in ghost mode. The `firebaseUser` is the admin.
            const userDocRef = doc(firestore, 'users', ghostUserId);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                // Create a "mock" user object that looks like the ghost user
                const ghostUserData = userDocSnap.data();
                const ghostUserObject = {
                    ...ghostUserData,
                    uid: ghostUserId,
                    // Mimic a User object as much as needed for the app to work
                    // This is a simplified example. You might need to add more properties
                    // based on what your app uses from the Firebase User object.
                    displayName: ghostUserData.name,
                    email: ghostUserData.email,
                    getIdTokenResult: async () => ({ claims: {} }), // Return empty claims for ghost user
                } as User;

                setUserAuthState({ 
                    user: ghostUserObject, 
                    isUserLoading: false, 
                    userError: null,
                    ghostMode: true,
                    adminUser: firebaseUser, // Store the real admin user
                });
            } else {
                 // Ghost user not found, clear ghost mode and use admin
                localStorage.removeItem('ghostModeUser');
                setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null, ghostMode: false, adminUser: null });
            }

        } else {
            // Not in ghost mode, normal operation
            setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null, ghostMode: false, adminUser: null });
        }
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error, ghostMode: false, adminUser: null });
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
      ghostMode: userAuthState.ghostMode,
      adminUser: userAuthState.adminUser,
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
    ghostMode: context.ghostMode,
    adminUser: context.adminUser,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase Storage instance. */
export const useStorage = (): FirebaseStorage => {
  const { storage } = useFirebase();
  return storage;
};

/** Hook to access Realtime Database instance. */
export const useDatabase = (): Database => {
    const { database } = useFirebase();
    return database;
}

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
    const memoized = useMemo(factory, deps);
    if (typeof memoized !== 'object' || memoized === null) return memoized;

    // This is a hack to ensure that the memoized value is not a new object instance on every render.
    // It's not a perfect solution, but it's a good enough heuristic for now.
    // We can't use Object.is because it will always be false for new object instances.
    // So we add a property to the object to mark it as memoized.
    (memoized as MemoFirebase<T>).__memo = true;
    
    return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError, ghostMode, adminUser } = useFirebase(); // Leverages the main hook
  return { user, isUserLoading, userError, ghostMode, adminUser };
};
