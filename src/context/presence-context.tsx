'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useUser, useDatabase } from '@/firebase';
import { ref, onValue, off, serverTimestamp, set, onDisconnect } from 'firebase/database';

const PresenceContext = createContext<null>(null);

export const PresenceProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const database = useDatabase();

  useEffect(() => {
    if (!user || !database) {
      return;
    }

    const uid = user.uid;
    const userStatusDatabaseRef = ref(database, '/status/' + uid);

    const isOfflineForDatabase = {
      state: 'offline',
      last_changed: serverTimestamp(),
    };

    const isOnlineForDatabase = {
      state: 'online',
      last_changed: serverTimestamp(),
    };

    const connectedRef = ref(database, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === false) {
        // If the client loses connection, we don't need to do anything here,
        // onDisconnect will handle setting the user to 'offline'.
        return;
      }

      // We are connected. Set up onDisconnect to set user's status to offline
      // when they disconnect. This is the crucial part.
      onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
        // Now that onDisconnect is set, we can finally set the user's status to online.
        set(userStatusDatabaseRef, isOnlineForDatabase);
      });
    });

    return () => {
      // Clean up listener
      off(connectedRef);
      // Setting status to offline on unmount/cleanup isn't strictly necessary
      // because onDisconnect handles it, but it can make the status update faster on voluntary navigation.
      set(userStatusDatabaseRef, isOfflineForDatabase);
    };
  }, [user, database]);

  return <PresenceContext.Provider value={null}>{children}</PresenceContext.Provider>;
};

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};
