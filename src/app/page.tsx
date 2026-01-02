'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AuthScreen from '@/components/auth/auth-screen';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import WelcomeVideo from '@/components/auth/welcome-video';

export default function Home() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showWelcomeVideo, setShowWelcomeVideo] = useState(false);

    useEffect(() => {
      // Sadece istemci tarafında çalışır
      if (typeof window !== 'undefined') {
        const hasSeenVideo = localStorage.getItem('hasSeenWelcomeVideo');
        if (!hasSeenVideo) {
          setShowWelcomeVideo(true);
        }
      }
    }, []);

    useEffect(() => {
        // If the user lands here after a logout, ensure the history stack is cleared.
        if (searchParams.get('loggedOut')) {
            router.replace('/');
        } else if (!isUserLoading && user) {
            router.replace('/discover');
        }
    }, [user, isUserLoading, router, searchParams]);

    const handleVideoClose = () => {
        localStorage.setItem('hasSeenWelcomeVideo', 'true');
        setShowWelcomeVideo(false);
    };

    if (isUserLoading || user) {
        return (
             <main className="w-full h-screen flex items-center justify-center bg-gray-100 dark:bg-black">
                 <div className="w-full max-w-md h-[90vh] max-h-[800px]">
                    <Skeleton className="w-full h-full rounded-2xl" />
                 </div>
            </main>
        )
    }

    const handleAuthSuccess = () => {
        router.replace('/discover');
    };

    return (
        <>
            {showWelcomeVideo && <WelcomeVideo onClose={handleVideoClose} />}
            <main className="w-full h-screen flex items-center justify-center bg-background">
                <AnimatePresence>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-md h-full md:h-[90vh] md:max-h-[800px] bg-card md:rounded-2xl"
                    >
                        <AuthScreen onAuthSuccess={handleAuthSuccess} />
                    </motion.div>
                </AnimatePresence>
            </main>
        </>
    );
}
