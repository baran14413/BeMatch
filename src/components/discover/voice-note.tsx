'use client';
import { Play, Pause } from 'lucide-react';
import { Button } from '../ui/button';
import { useState, useRef, useEffect } from 'react';

const WaveformIcon = () => (
    <svg viewBox="0 0 120 40" className="h-10 w-full text-primary" fill="currentColor">
      <rect x="0" y="15" width="4" height="10" rx="2"><animate attributeName="height" values="10;25;10" begin="0s" dur="1s" repeatCount="indefinite" /><animate attributeName="y" values="15;7.5;15" begin="0s" dur="1s" repeatCount="indefinite" /></rect>
      <rect x="8" y="15" width="4" height="10" rx="2"><animate attributeName="height" values="10;30;10" begin="0.1s" dur="1s" repeatCount="indefinite" /><animate attributeName="y" values="15;5;15" begin="0.1s" dur="1s" repeatCount="indefinite" /></rect>
      <rect x="16" y="15" width="4" height="10" rx="2"><animate attributeName="height" values="10;20;10" begin="0.2s" dur="1s" repeatCount="indefinite" /><animate attributeName="y" values="15;10;15" begin="0.2s" dur="1s" repeatCount="indefinite" /></rect>
      <rect x="24" y="15" width="4" height="10" rx="2"><animate attributeName="height" values="10;35;10" begin="0.3s" dur="1s" repeatCount="indefinite" /><animate attributeName="y" values="15;2.5;15" begin="0.3s" dur="1s" repeatCount="indefinite" /></rect>
      <rect x="32" y="15" width="4" height="10" rx="2"><animate attributeName="height" values="10;22;10" begin="0.4s" dur="1s" repeatCount="indefinite" /><animate attributeName="y" values="15;9;15" begin="0.4s" dur="1s" repeatCount="indefinite" /></rect>
      <rect x="40" y="15" width="4" height="10" rx="2"><animate attributeName="height" values="10;28;10" begin="0.5s" dur="1s" repeatCount="indefinite" /><animate attributeName="y" values="15;6;15" begin="0.5s" dur="1s" repeatCount="indefinite" /></rect>
      <rect x="48" y="15" width="4" height="10" rx="2"><animate attributeName="height" values="10;18;10" begin="0.6s" dur="1s" repeatCount="indefinite" /><animate attributeName="y" values="15;11;15" begin="0.6s" dur="1s" repeatCount="indefinite" /></rect>
      <rect x="56" y="15" width="4" height="10" rx="2"><animate attributeName="height" values="10;32;10" begin="0.7s" dur="1s" repeatCount="indefinite" /><animate attributeName="y" values="15;4;15" begin="0.7s" dur="1s" repeatCount="indefinite" /></rect>
      <rect x="64" y="15" width="4" height="10" rx="2"><animate attributeName="height" values="10;24;10" begin="0.8s" dur="1s" repeatCount="indefinite" /><animate attributeName="y" values="15;8;15" begin="0.8s" dur="1s" repeatCount="indefinite" /></rect>
      <rect x="72" y="15" width="4" height="10" rx="2"><animate attributeName="height" values="10;29;10" begin="0.9s" dur="1s" repeatCount="indefinite" /><animate attributeName="y" values="15;5.5;15" begin="0.9s" dur="1s" repeatCount="indefinite" /></rect>
      <rect x="80" y="15" width="4" height="10" rx="2"><animate attributeName="height" values="10;20;10" begin="0.2s" dur="1s" repeatCount="indefinite" /><animate attributeName="y" values="15;10;15" begin="0.2s" dur="1s" repeatCount="indefinite" /></rect>
      <rect x="88" y="15" width="4" height="10" rx="2"><animate attributeName="height" values="10;35;10" begin="0.3s" dur="1s" repeatCount="indefinite" /><animate attributeName="y" values="15;2.5;15" begin="0.3s" dur="1s" repeatCount="indefinite" /></rect>
      <rect x="96" y="15" width="4" height="10" rx="2"><animate attributeName="height" values="10;22;10" begin="0.4s" dur="1s" repeatCount="indefinite" /><animate attributeName="y" values="15;9;15" begin="0.4s" dur="1s" repeatCount="indefinite" /></rect>
      <rect x="104" y="15" width="4" height="10" rx="2"><animate attributeName="height" values="10;28;10" begin="0.5s" dur="1s" repeatCount="indefinite" /><animate attributeName="y" values="15;6;15" begin="0.5s" dur="1s" repeatCount="indefinite" /></rect>
      <rect x="112" y="15" width="4" height="10" rx="2"><animate attributeName="height" values="10;18;10" begin="0.6s" dur="1s" repeatCount="indefinite" /><animate attributeName="y" values="15;11;15" begin="0.6s" dur="1s" repeatCount="indefinite" /></rect>
    </svg>
  );

export default function VoiceNote({ audioSrc }: { audioSrc: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      const onEnded = () => setIsPlaying(false);

      audio.addEventListener('play', onPlay);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('ended', onEnded);
      
      return () => {
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('ended', onEnded);
      };
    }
  }, []);

  return (
    <div className="flex items-center gap-4 bg-secondary p-2 rounded-lg">
      <Button variant="ghost" size="icon" onClick={togglePlay}>
        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
      </Button>
      <div className="flex-1">
        <WaveformIcon />
      </div>
      <audio ref={audioRef} src={audioSrc} preload="none" />
    </div>
  );
}
