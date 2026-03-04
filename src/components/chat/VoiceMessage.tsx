import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Play, Pause } from 'lucide-react'

interface VoiceMessageProps {
    url: string
    duration: number
    isMe: boolean
}

export default function VoiceMessage({ url, duration, isMe }: VoiceMessageProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [durationState, setDurationState] = useState(duration || 0)

    // Generate a static pseudo-waveform based on the URL (so it looks random but consistent)
    const pseudoWaveHeights = useMemo(() => {
        const heights = []
        // Simple hash function from URL to get consistent heights
        let hash = 0
        for (let i = 0; i < url.length; i++) hash = url.charCodeAt(i) + ((hash << 5) - hash)

        for (let i = 0; i < 35; i++) {
            // Predictable pseudo-random height between 30% and 100%
            const rnd = Math.abs(Math.sin(hash + i * 1.3)) * 70 + 30
            heights.push(rnd)
        }
        return heights
    }, [url])

    useEffect(() => {
        const audio = new Audio(url)
        audio.preload = "auto" // Changed to auto to force fetching size and metadata immediately
        audioRef.current = audio

        const handleLoadedData = () => {
            if (audio.duration && audio.duration !== Infinity && !isNaN(audio.duration)) {
                setDurationState(audio.duration)
            }
        }

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
        const handleEnded = () => {
            setIsPlaying(false)
            setCurrentTime(0)
        }
        const handlePlay = () => setIsPlaying(true)
        const handlePause = () => setIsPlaying(false)

        // Multiple events to catch readiness on varying browsers
        audio.addEventListener('loadedmetadata', handleLoadedData)
        audio.addEventListener('canplay', handleLoadedData)
        audio.addEventListener('loadeddata', handleLoadedData)

        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('play', handlePlay)
        audio.addEventListener('pause', handlePause)

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedData)
            audio.removeEventListener('canplay', handleLoadedData)
            audio.removeEventListener('loadeddata', handleLoadedData)
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('play', handlePlay)
            audio.removeEventListener('pause', handlePause)
            audio.pause()
            audio.src = ''
        }
    }, [url])

    const formatTime = useCallback((seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }, [])

    const togglePlayPause = () => {
        if (!audioRef.current) return
        if (isPlaying) {
            audioRef.current.pause()
        } else {
            // Force play. If it hasn't loaded metadata yet, this interaction will bypass Safari/Mobile autoplay blocks
            audioRef.current.play().catch(e => {
                console.error("Oynatma hatası:", e)
                // Sometimes browsers block the first play if the source isn't fully resolved. 
                // We just log it; the user can tap again.
            })
        }
    }

    const toggleSpeed = () => {
        if (!audioRef.current) return
        const speeds = [1, 1.5, 2]
        const currentIdx = speeds.indexOf(playbackRate)
        const nextSpeed = speeds[(currentIdx + 1) % speeds.length]

        audioRef.current.playbackRate = nextSpeed
        setPlaybackRate(nextSpeed)
    }

    const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !durationState) return

        const rect = e.currentTarget.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const percent = Math.max(0, Math.min(1, clickX / rect.width))

        // Only seek if we have a valid duration
        if (durationState > 0 && durationState !== Infinity) {
            audioRef.current.currentTime = percent * durationState
        }
    }

    const progressPercent = durationState > 0 ? (currentTime / durationState) * 100 : 0

    // Always show a valid looking time, fallback to '0:00' initially until metadata loads
    const displayTime = isPlaying || currentTime > 0
        ? formatTime(currentTime)
        : formatTime(durationState > 0 ? durationState : duration)

    return (
        <div className={`custom-voice-message ${isMe ? 'me' : 'other'}`}>
            <button className="voice-play-btn" onClick={togglePlayPause}>
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>

            {/* Custom Pseudo-Waveform Renderer */}
            <div
                className="voice-waveform-container native"
                onClick={handleWaveformClick}
                style={{
                    display: 'flex', alignItems: 'center', gap: '2px',
                    height: '28px', flex: 1, cursor: 'pointer', overflow: 'hidden'
                }}
            >
                {pseudoWaveHeights.map((height, i) => {
                    const barPercent = (i / pseudoWaveHeights.length) * 100
                    const isPlayed = barPercent <= progressPercent

                    return (
                        <div
                            key={i}
                            style={{
                                flex: 1,
                                height: `${height}%`,
                                backgroundColor: isPlayed
                                    ? (isMe ? '#ffffff' : 'var(--primary)')
                                    : (isMe ? 'rgba(255, 255, 255, 0.4)' : 'rgba(230, 57, 70, 0.3)'),
                                borderRadius: '2px',
                                transition: 'background-color 0.1s linear'
                            }}
                        />
                    )
                })}
            </div>

            <span className="voice-time-display" style={{ width: '36px', textAlign: 'right' }}>
                {displayTime}
            </span>

            <button className="voice-speed-ctrl" onClick={toggleSpeed}>
                {playbackRate}x
            </button>
        </div>
    )
}
