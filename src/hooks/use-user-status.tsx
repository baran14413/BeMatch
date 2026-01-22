'use client';

import { useState, useEffect } from 'react';
import { useDatabase } from '@/firebase';
import { ref, onValue, off } from 'firebase/database';
import type { UserStatus } from '@/lib/data';

export function useUserStatus(userId?: string | null): UserStatus | null {
  const database = useDatabase();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);

  useEffect(() => {
    if (!userId || !database) {
      setUserStatus(null);
      return;
    }

    const userStatusRef = ref(database, 'status/' + userId);

    const handleValueChange = (snapshot: any) => {
      if (snapshot.val()) {
        setUserStatus(snapshot.val());
      } else {
        setUserStatus(null);
      }
    };

    onValue(userStatusRef, handleValueChange);

    return () => {
      off(userStatusRef, 'value', handleValueChange);
    };
  }, [userId, database]);

  return userStatus;
}
