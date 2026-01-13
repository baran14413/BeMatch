'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, onSnapshot, limit, Timestamp } from 'firebase/firestore';

export function useNewLikes(): boolean {
  const { user } = useUser();
  const firestore = useFirestore();
  const [hasNew, setHasNew] = useState(false);

  const latestLikeQuery = useMemoFirebase(() => {
    if (!user) return null;
    // Query for the single most recent like
    return query(
      collection(firestore, 'users', user.uid, 'likedBy'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [user, firestore]);

  useEffect(() => {
    if (!latestLikeQuery) {
      setHasNew(false);
      return;
    }

    const checkNewLikes = (latestLikeTimestamp: Timestamp | null) => {
      if (!latestLikeTimestamp) {
        setHasNew(false);
        return;
      }
      const lastViewedTimestamp = localStorage.getItem('lastLikesViewTimestamp');
      if (!lastViewedTimestamp) {
        setHasNew(true);
        return;
      }
      const hasUnseen = latestLikeTimestamp.toDate() > new Date(lastViewedTimestamp);
      setHasNew(hasUnseen);
    };

    const unsubscribe = onSnapshot(latestLikeQuery, (snapshot) => {
      if (snapshot.empty) {
        checkNewLikes(null);
        return;
      }
      const latestLike = snapshot.docs[0].data();
      checkNewLikes(latestLike.timestamp as Timestamp | null);
    });

    // Create a listener for our custom event to immediately reflect the change
    const handleLikesViewed = () => {
      setHasNew(false);
    };
    
    window.addEventListener('likes-viewed', handleLikesViewed);

    return () => {
        unsubscribe();
        window.removeEventListener('likes-viewed', handleLikesViewed);
    };

  }, [latestLikeQuery]);

  return hasNew;
}
