'use client';
import { Sparkles, MessageCircle, CircleUserRound, Heart, Shield } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { useNewLikes } from '@/hooks/use-new-likes';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { UserProfile } from '@/lib/data';
import { doc } from 'firebase/firestore';
import { motion } from 'framer-motion';

const MainHeader = () => {
    const pathname = usePathname();
    const { t } = useLanguage();
    const { user } = useUser();
    const firestore = useFirestore();
    const unreadState = useUnreadMessages();
    const hasUnreadMessages = Object.values(unreadState).some(hasUnread => hasUnread);
    const hasNewLikes = useNewLikes();

    const userDocRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile } = useDoc<UserProfile>(userDocRef);
    const isAdmin = userProfile?.role === 'admin';

    const navLinks = [
        { href: '/discover', icon: Sparkles, label: t('discover.title') },
        { href: '/likes', icon: Heart, label: t('likes.title'), hasNotification: hasNewLikes },
        { href: '/lounge', icon: MessageCircle, label: t('lounge.title'), hasNotification: hasUnreadMessages },
        { href: '/profile', icon: CircleUserRound, label: t('profile.title') },
    ];
    
    return (
        <header className={cn("fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-around px-4 py-2 h-16 w-[calc(100%-2rem)] max-w-sm rounded-full border border-border/20 shadow-lg bg-background/70 backdrop-blur-md")}>
            {navLinks.map(link => {
                const isActive = pathname.startsWith(link.href);
                return (
                    <Button key={link.href} variant="ghost" asChild className="flex flex-col items-center h-full p-1 rounded-full">
                        <Link href={link.href} aria-label={link.label} className="relative flex flex-col items-center justify-center gap-1 w-12">
                            <link.icon className={cn("w-6 h-6", isActive ? "text-primary" : "text-muted-foreground")} />
                            {link.hasNotification && (
                                <span className="absolute top-0 right-2.5 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            )}
                            {isActive && (
                                <motion.div 
                                    layoutId="active-nav-indicator"
                                    className="absolute -bottom-1 h-1 w-6 rounded-full bg-white" 
                                />
                            )}
                        </Link>
                    </Button>
                )
            })}
            {isAdmin && (
                <Button key="/admin" variant="ghost" asChild className="flex flex-col items-center h-full p-1 rounded-full">
                    <Link href="/admin" aria-label="Admin" className="relative flex flex-col items-center justify-center gap-1 w-12">
                        <Shield className={cn("w-6 h-6", pathname.startsWith('/admin') ? "text-primary" : "text-muted-foreground")} />
                         {pathname.startsWith('/admin') && (
                            <motion.div 
                                layoutId="active-nav-indicator"
                                className="absolute -bottom-1 h-1 w-6 rounded-full bg-white" 
                            />
                        )}
                    </Link>
                </Button>
            )}
        </header>
    )
}

export default MainHeader;
