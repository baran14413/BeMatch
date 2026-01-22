'use client';

import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import type { UserProfile } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';

interface ItIsAMatchProps {
  currentUser: UserProfile;
  matchedUser: UserProfile;
  onContinue: () => void;
}

export default function ItIsAMatch({
  currentUser,
  matchedUser,
  onContinue,
}: ItIsAMatchProps) {
    const router = useRouter();
    const { t } = useLanguage();

    const handleSendMessage = () => {
        const matchId = [currentUser.id, matchedUser.id].sort().join('_');
        router.push(`/chat/${matchId}`);
    }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4"
    >
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { delay: 0.2, type: 'spring', stiffness: 120 } }}
        className="text-5xl font-extrabold text-white mb-8 tracking-tighter bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent"
      >
        {t('match.title')}
      </motion.h1>

      <div className="flex items-center justify-center -space-x-8 mb-10">
        <motion.div
          initial={{ x: -100, opacity: 0, rotate: -15 }}
          animate={{ x: 0, opacity: 1, rotate: -15, transition: { delay: 0.4, type: 'spring' } }}
        >
          <Avatar className="w-40 h-40 border-4 border-white shadow-2xl">
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} className="object-cover" />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </motion.div>
        <motion.div
          initial={{ x: 100, opacity: 0, rotate: 15 }}
          animate={{ x: 0, opacity: 1, rotate: 15, transition: { delay: 0.4, type: 'spring' } }}
        >
          <Avatar className="w-40 h-40 border-4 border-white shadow-2xl">
            <AvatarImage src={matchedUser.avatarUrl} alt={matchedUser.name} className="object-cover" />
            <AvatarFallback>{matchedUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </motion.div>
      </div>
      
      <p className="text-white/80 text-lg text-center mb-10">
        {t('match.description', { name: matchedUser.name })}
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { delay: 0.6 } }}
        >
          <Button onClick={handleSendMessage} className="w-full h-14 text-lg font-bold bg-white text-black hover:bg-gray-200">
            {t('match.sendMessage')}
          </Button>
        </motion.div>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { delay: 0.7 } }}
        >
          <Button onClick={onContinue} variant="ghost" className="w-full h-14 text-lg text-white/80 hover:text-white">
            {t('match.keepSwiping')}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
