'use client';

import { motion } from 'framer-motion';

const dotVariants = {
  initial: {
    y: 0,
  },
  animate: {
    y: [0, -5, 0],
  },
};

const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-1.5 p-3 px-4 rounded-2xl rounded-tl-none bg-secondary">
      <motion.span
        className="w-2 h-2 bg-muted-foreground rounded-full"
        variants={dotVariants}
        animate="animate"
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.1,
        }}
      />
      <motion.span
        className="w-2 h-2 bg-muted-foreground rounded-full"
        variants={dotVariants}
        animate="animate"
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.2,
        }}
      />
      <motion.span
        className="w-2 h-2 bg-muted-foreground rounded-full"
        variants={dotVariants}
        animate="animate"
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.3,
        }}
      />
    </div>
  );
};

export default TypingIndicator;
