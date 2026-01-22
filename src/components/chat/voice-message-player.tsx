'use client';
import { Play, Pause } from 'lucide-react';
import { Button } from '../ui/button';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const WaveformIcon = ({ isPlaying, isPreview }: { isPlaying: boolean, isPreview: boolean }) => {
    const barCount = isPreview ? 25 : 40;
    const initialHeight = isPlaying ? 2 : 4;
    const maxHeight = isPlaying ? 12 : 20;

    return (
        <svg viewBox={`0 0 ${barCount * 4} 24`} className="h-10 w-full" fill="currentColor">
        {Array.from({ length: barCount }).map((_, i) => {
            const randomHeight = initialHeight + Math.random() * (maxHeight - initialHeight);
            const randomDuration = 0.8 + Math.random() * 0.4;
            return (
            <rect 
                key={i}
                x={i * 4} 
                y={12 - randomHeight/2} 
                width="2" 
                height={randomHeight} 
                rx="1"
            >
                {isPlaying && (
                    <>
                        <animate 
                            attributeName="height" 
                            values={`${randomHeight};${maxHeight};${randomHeight}`} 
                            begin={`${i*0.02}s`}
                            dur={`${randomDuration}s`}
                            repeatCount="indefinite" 
                        />
                         <animate 
                            attributeName="y" 
                             values={`${12 - randomHeight/2};${12 - maxHeight/2};${12 - randomHeight/2}`}
                            begin={`${i*0.02}s`}
                            dur={`${randomDuration}s`}
                            repeatCount="indefinite" 
                        />
                    </>
                )}
            </rect>
            );
        })}
        </svg>
    )
};


export default function VoiceMessagePlayer({ src, duration, isPreview = false }: { src: string, duration?: number, isPreview?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);


  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!audioRef.current || !progressRef.current || !audioDuration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (x / width) * audioDuration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }

  const cyclePlaybackRate = (e: React.MouseEvent) => {
      e.stopPropagation();
      setPlaybackRate(prev => {
          if (prev === 1) return 1.5;
          if (prev === 1.5) return 2;
          return 1;
      })
  }

  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.playbackRate = playbackRate;
      }
  }, [playbackRate]);

   const formatTime = (time: number) => {
     if (isNaN(time) || time <= 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      const onEnded = () => {
          setIsPlaying(false);
          setCurrentTime(0);
      };
      const onTimeUpdate = () => setCurrentTime(audio.currentTime);
      const onLoadedMetadata = () => {
        if (audio.duration !== Infinity && audio.duration > 0) {
          setAudioDuration(audio.duration);
        }
      };

      audio.addEventListener('play', onPlay);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      
      if (audio.readyState >= 1) {
          onLoadedMetadata();
      }
      
      return () => {
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      };
    }
  }, [src]);

  const progressPercentage = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-3", isPreview ? "w-full" : "w-64")}>
      <Button variant="ghost" size="icon" onClick={togglePlay} className="w-10 h-10 shrink-0 bg-white/20 hover:bg-white/30 rounded-full">
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current pl-0.5" />}
      </Button>
      <div className="flex-1 space-y-1">
        <div 
          className="h-6 w-full cursor-pointer relative"
          onClick={handleProgressClick}
          ref={progressRef}
        >
            <div className="absolute top-1/2 -translate-y-1/2 w-full">
              <WaveformIcon isPlaying={isPlaying} isPreview={isPreview} />
            </div>
            {audioDuration > 0 && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-full bg-primary/50 mix-blend-screen"
                  style={{ clipPath: `inset(0 ${100 - progressPercentage}% 0 0)` }}
                >
                  <WaveformIcon isPlaying={isPlaying} isPreview={isPreview} />
                </div>
            )}
        </div>

        <div className="flex justify-between items-center">
            <span className="text-xs font-mono w-10">{formatTime(audioDuration > 0 ? audioDuration - currentTime : 0)}</span>
            {!isPreview && (
              <Button variant="ghost" size="sm" className="h-6 px-2 rounded-full text-xs" onClick={cyclePlaybackRate}>
                {playbackRate}x
              </Button>
            )}
        </div>
      </div>
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}
