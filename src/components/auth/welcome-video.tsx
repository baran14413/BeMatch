'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeVideoProps {
  onClose: () => void;
}

export default function WelcomeVideo({ onClose }: WelcomeVideoProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-[90vw] max-w-[380px] aspect-[9/16] overflow-hidden rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the video
        >
          <video
            src="https://videos.pexels.com/video-files/8470300/8470300-sd_540_960_25fps.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-black/30 text-white hover:bg-black/50 rounded-full h-9 w-9 z-10"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close video</span>
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
