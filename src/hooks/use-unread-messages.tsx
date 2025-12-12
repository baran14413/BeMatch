'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';

export type UnreadMessagesMap = {
  [matchId: string]: boolean;
};

export function useUnreadMessages(): UnreadMessagesMap {
  const { user } = useUser();
  const firestore = useFirestore();
  const [unreadState, setUnreadState] = useState<UnreadMessagesMap>({});

  const matchesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'matches'), where('users', 'array-contains', user.uid));
  }, [user, firestore]);

  useEffect(() => {
    if (!matchesQuery || !user) {
      setUnreadState({});
      return;
    }

    let messageUnsubs: Unsubscribe[] = [];
    let unreadStateByMatch: UnreadMessagesMap = {};

    const unsubMatches = onSnapshot(matchesQuery, (matchesSnapshot) => {
      // Clean up old message listeners before setting up new ones
      messageUnsubs.forEach(unsub => unsub());
      messageUnsubs = [];
      unreadStateByMatch = {}; // Reset local state on match changes

      if (matchesSnapshot.empty) {
        setUnreadState({}); // No matches, no unread messages
        return;
      }
      
      matchesSnapshot.docs.forEach(matchDoc => {
        const matchId = matchDoc.id;
        const messagesQuery = query(
          collection(firestore, 'matches', matchId, 'messages'),
          where('isRead', '==', false),
          where('senderId', '!=', user.uid)
        );
        
        const unsubMessages = onSnapshot(messagesQuery, (messagesSnapshot) => {
          // Update the state for this specific match
          unreadStateByMatch[matchId] = !messagesSnapshot.empty;
          // Combine all states and update the main hook state
          setUnreadState(prevState => ({ ...prevState, ...unreadStateByMatch }));
        });
        messageUnsubs.push(unsubMessages);
      });
    }, (error) => {
        console.error("Error listening to matches for unread status:", error);
        setUnreadState({});
    });

    return () => {
      unsubMatches();
      messageUnsubs.forEach(unsub => unsub());
    };
  }, [matchesQuery, user, firestore]);

  return unreadState;
}
