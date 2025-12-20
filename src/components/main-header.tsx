'use client';
import { Sparkles, MessageCircle, CircleUserRound, Heart } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { useNewLikes } from '@/hooks/use-new-likes';

const MainHeader = () => {
    const pathname = usePathname();
    const { t } = useLanguage();
    const unreadState = useUnreadMessages();
    const hasUnreadMessages = Object.values(unreadState).some(hasUnread => hasUnread);
    const hasNewLikes = useNewLikes();

    const navLinks = [
        { href: '/discover', icon: Sparkles, label: t('discover.title') },
        { href: '/likes', icon: Heart, label: t('likes.title'), hasNotification: hasNewLikes },
        { href: '/lounge', icon: MessageCircle, label: t('lounge.title'), hasNotification: hasUnreadMessages },
        { href: '/profile', icon: CircleUserRound, label: t('profile.title') },
    ];
    
    return (
        <header className={cn("flex items-center justify-between px-4 py-1 h-14 border-b border-border bg-background z-10", "pt-[calc(env(safe-area-inset-top,0rem)+0.25rem)]")}>
            <Link href="/discover">
                <h1 className="text-2xl font-bold text-primary tracking-tight">BeMatch</h1>
            </Link>
            <div className="flex items-center gap-4">
                {navLinks.map(link => {
                    const isActive = pathname.startsWith(link.href);
                    return (
                        <Button key={link.href} variant="ghost" size="icon" asChild>
                            <Link href={link.href} aria-label={link.label} className="relative">
                                <link.icon className={cn("w-6 h-6", isActive ? "text-primary" : "text-muted-foreground")} />
                                {link.hasNotification && (
                                     <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                )}
                            </Link>
                        </Button>
                    )
                })}
            </div>
        </header>
    )
}

export default MainHeader;