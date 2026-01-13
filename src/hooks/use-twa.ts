
'use client';
import { useState, useEffect } from 'react';

/**
 * Custom hook to determine if the application is running inside a 
 * Trusted Web Activity (TWA) on Android.
 * 
 * @returns {boolean} `true` if the app is running as a TWA, otherwise `false`.
 */
export function useTwa(): boolean {
  const [isTwa, setIsTwa] = useState(false);

  useEffect(() => {
    // This check should only run on the client side.
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      // TWAs often include "; wv)" in their user agent string.
      // This is a common and reasonably reliable way to detect if the app is
      // running inside a WebView, which is how TWAs are implemented.
      const runningInTwa = userAgent.includes('; wv)');
      setIsTwa(runningInTwa);
    }
  }, []); // Empty dependency array ensures this runs only once on mount.

  return isTwa;
}
