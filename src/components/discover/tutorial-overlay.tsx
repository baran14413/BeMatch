'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/context/language-context';

const HandIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-10 h-10"
  >
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-4.5a2 2 0 0 1-2-2v-3.36a1.5 1.5 0 0 1 .24-1.5l1.55-2.3A2 2 0 0 1 14.5 8z" />
  </svg>
);

const TutorialItem = ({ side, text }: { side: 'left' | 'right'; text: string }) => {
  const isLeft = side === 'left';
  return (
    <motion.div
      className={`absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 text-white font-bold text-lg ${isLeft ? 'left-8' : 'right-8'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.5 } }}
      exit={{ opacity: 0, y: 20, transition: { duration: 0.5 } }}
    >
      <motion.div
        animate={{
            translateX: isLeft ? [-5, 5, -5] : [5, -5, 5],
            transition: { delay: 1, duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <HandIcon />
      </motion.div>
      <span className="uppercase tracking-widest">{text}</span>
    </motion.div>
  );
};


export default function TutorialOverlay() {
  const { t } = useLanguage();
  return (
    <div className="absolute inset-0 pointer-events-none z-50">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[80%] w-[1px] border-l-2 border-dashed border-white/50"></div>
        <TutorialItem side="left" text={t('discover.tutorial.previous')} />
        <TutorialItem side="right" text={t('discover.tutorial.next')} />
    </div>
  );
}
