'use client';
import type {Metadata, Viewport} from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { OnboardingProvider } from '@/context/onboarding-context';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/context/language-context';
import { FirebaseClientProvider, useFirebaseApp } from '@/firebase';
import { PresenceProvider } from '@/context/presence-context';
import { getPerformance } from 'firebase/performance';
import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

// Note: Metadata export is commented out because it can only be exported from a server component.
// This component is marked as 'use client'.
// export const metadata: Metadata = {
//   title: 'BeMatch',
//   description: 'Mükemmel eşini bul.',
//   appleWebApp: {
//     capable: true,
//     statusBarStyle: 'black-translucent',
//     title: 'BeMatch',
//   },
// };

// export const viewport: Viewport = {
//   width: 'device-width',
//   initialScale: 1,
//   maximumScale: 1,
//   userScalable: false,
//   viewportFit: 'cover',
// };

/**
 * Initializes Firebase Performance Monitoring. This component must be a child
 * of FirebaseClientProvider to have access to the initialized Firebase app.
 */
const FirebasePerformanceProvider = ({ children }: { children: React.ReactNode }) => {
  const app = useFirebaseApp(); // Get the initialized Firebase app instance.
  useEffect(() => {
    // Initialize performance monitoring only on the client side.
    if (typeof window !== 'undefined') {
      getPerformance(app);
    }
  }, [app]);

  return <>{children}</>;
}


const OfflineBanner = () => {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        // Set initial state
        if (typeof navigator.onLine !== 'undefined') {
            setIsOffline(!navigator.onLine);
        }

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-destructive text-destructive-foreground text-center text-sm font-medium overflow-hidden"
                >
                    <div className="p-2 flex items-center justify-center gap-2">
                        <WifiOff className="w-4 h-4" />
                        <span>Çevrimdışısınız. Bazı özellikler kullanılamayabilir.</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {/* We can manually set title and meta tags in the head for client components */}
        <title>BeMatch</title>
        <meta name="description" content="Mükemmel eşini bul." />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${poppins.variable} font-body antialiased h-dvh`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
             <OfflineBanner />
            <FirebaseClientProvider>
               <FirebasePerformanceProvider>
                <PresenceProvider>
                  <OnboardingProvider>
                    {children}
                  </OnboardingProvider>
                </PresenceProvider>
              </FirebasePerformanceProvider>
            </FirebaseClientProvider>
            <Toaster />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
