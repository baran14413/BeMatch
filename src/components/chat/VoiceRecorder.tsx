import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Square, Trash2, Send, Play, Pause, AlertCircle } from 'lucide-react'
import { storage } from '../../firebase'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

interface VoiceRecorderProps {
    onSend: (url: string, duration: number) => void
    onCancel: () => void
}

export default function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
    // UI States
    const [status, setStatus] = useState<'recording' | 'preview' | 'error'>('recording')
    const [errorMessage, setErrorMessage] = useState('')

    // Recording States
    const [recordingTime, setRecordingTime] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

    // Preview Playback States
    const [isPlayingPreview, setIsPlayingPreview] = useState(false)
    const [previewTime, setPreviewTime] = useState(0)
    const previewAudioRef = useRef<HTMLAudioElement | null>(null)

    // Static pseudo heights for preview
    const previewWaveHeights = useMemo(() => {
        const heights = []
        for (let i = 0; i < 30; i++) heights.push(Math.abs(Math.sin(i * 1.5)) * 60 + 40)
        return heights
    }, [])

    // Live Waveform States
    const [waveformData, setWaveformData] = useState<number[]>(Array(20).fill(6))

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<BlobPart[]>([])
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Context Refs
    const audioCtxRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const animationFrameRef = useRef<number>(0)
    const nativeWaveformInterval = useRef<ReturnType<typeof setInterval> | null>(null)

    // Cleanup function - STRICT requirement 3
    const cleanupAudioResources = useCallback(() => {
        // Only stop the recorder to trigger onstop. 
        // DO NOT stop tracks here, otherwise the final blob gets corrupted.
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }

        // Stop animations
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }
        if (nativeWaveformInterval.current) {
            clearInterval(nativeWaveformInterval.current)
        }
    }, [])

    useEffect(() => {
        startRecording()
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            cleanupAudioResources()
            // If component abruptly unmounts, forcefully kill tracks if they somehow survived
            const stream = mediaRecorderRef.current?.stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close()
            }
            if (previewAudioRef.current) {
                previewAudioRef.current.pause()
                previewAudioRef.current.src = ''
            }
        }
    }, [cleanupAudioResources])

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null
        if (status === 'recording') {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
            timerRef.current = interval
        }
        return () => {
            if (interval) {
                clearInterval(interval)
                if (timerRef.current === interval) timerRef.current = null
            }
        }
    }, [status])

    // Format time helpers
    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Draw Live Waveform - Requirement 4
    const drawWaveform = () => {
        if (!analyserRef.current) return
        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyserRef.current.getByteFrequencyData(dataArray)

        // Sip data down to 20 bars
        const bars = 20
        const step = Math.floor(bufferLength / bars)
        const heights = []

        for (let i = 0; i < bars; i++) {
            let sum = 0
            for (let j = 0; j < step; j++) {
                sum += dataArray[i * step + j]
            }
            const avg = sum / step
            // Map 0-255 to min 6px, max 24px height
            heights.push(Math.max(6, (avg / 255) * 24))
        }

        setWaveformData(heights)
        animationFrameRef.current = requestAnimationFrame(drawWaveform)
    }

    // A ref to track if we should upload immediately after stop
    const shouldUploadOnStop = useRef(false)

    const startRecording = async () => {
        try {
            // App native environment permission check for Android/iOS
            const isNative = typeof window !== 'undefined' && 'Capacitor' in window && (window as any).Capacitor.isNativePlatform();

            if (isNative) {
                const { VoiceRecorder } = await import('capacitor-voice-recorder')
                const { value: hasPermission } = await VoiceRecorder.hasAudioRecordingPermission()
                if (!hasPermission) {
                    const { value: req } = await VoiceRecorder.requestAudioRecordingPermission()
                    if (!req) {
                        throw new Error("Lütfen cihaz ayarları -> BeMatch -> İzinler sekmesinden mikrofona erişim izni verin.")
                    }
                }

                await VoiceRecorder.startRecording()
                setStatus('recording')

                nativeWaveformInterval.current = setInterval(() => {
                    const heights = Array.from({ length: 20 }, () => Math.random() * 18 + 6)
                    setWaveformData(heights)
                }, 100)
                return
            }

            // Requirement 1: Graceful Permission & High-Fidelity Audio Constraints
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: 48000,
                    channelCount: 1
                }
            }).catch(() => {
                throw new Error("Lütfen tarayıcı / cihaz ayarlarından mikrofona izin verin.")
            })

            setStatus('recording')

            // Setup real waveform analyzer
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
            audioCtxRef.current = audioCtx
            const analyser = audioCtx.createAnalyser()
            analyser.fftSize = 64
            analyserRef.current = analyser

            const source = audioCtx.createMediaStreamSource(stream)
            source.connect(analyser)

            drawWaveform()

            // Requirement 2: High Bitrate & Opus Codec Check
            let options: MediaRecorderOptions = { audioBitsPerSecond: 128000, mimeType: 'audio/webm;codecs=opus' }
            if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
                options = { audioBitsPerSecond: 128000, mimeType: 'audio/mp4' }
                if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
                    options = {} // Fallback for Safari/unsupported
                }
            }

            const mediaRecorder = new MediaRecorder(stream, options)

            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                // 1. Create Audio Blob
                // MUST use mediaRecorder.mimeType exactly as negotiated, or Safari/iOS will fail to play it.
                const finalMimeType = mediaRecorder.mimeType || 'audio/webm'
                const blob = new Blob(audioChunksRef.current, { type: finalMimeType })
                setAudioBlob(blob)
                setAudioUrl(URL.createObjectURL(blob))
                setWaveformData(Array(20).fill(6)) // reset visual state

                // 2. STRCIT CLEANUP NOW THAT THE BLOB IS SAFE
                stream.getTracks().forEach(track => {
                    track.stop()
                    stream.removeTrack(track)
                })
                if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                    audioCtxRef.current.close()
                }
                audioCtxRef.current = null
                mediaRecorderRef.current = null

                // 3. Auto send if user pressed Send during recording
                if (shouldUploadOnStop.current) {
                    executeUpload(blob)
                }
            }

            // Requirement 3: Smooth Chunking (no timeslice)
            mediaRecorder.start()

        } catch (err: any) {
            console.error("Mikrofon izni alınamadı:", err)
            setStatus('error')
            setErrorMessage(err.message || "Mikrofon kullanılamıyor.")
        }
    }

    const stopRecording = async () => {
        const isNative = typeof window !== 'undefined' && 'Capacitor' in window && (window as any).Capacitor.isNativePlatform()
        if (isNative) {
            cleanupAudioResources()
            try {
                const { VoiceRecorder } = await import('capacitor-voice-recorder')
                const result = await VoiceRecorder.stopRecording()
                if (result.value && result.value.recordDataBase64) {
                    const byteCharacters = atob(result.value.recordDataBase64)
                    const byteNumbers = new Array(byteCharacters.length)
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i)
                    }
                    const byteArray = new Uint8Array(byteNumbers)
                    const blob = new Blob([byteArray], { type: result.value.mimeType || 'audio/aac' })

                    setAudioBlob(blob)
                    setAudioUrl(URL.createObjectURL(blob))
                    setWaveformData(Array(20).fill(6)) // reset visual state

                    setStatus('preview')
                    if (shouldUploadOnStop.current) {
                        executeUpload(blob)
                    }
                }
            } catch (err: any) {
                console.error("Native recording stop error:", err)
                setStatus('error')
                setErrorMessage("Kayıt tamamlanamadı.")
            }
            return
        }

        // Strict Stop & Resource free triggers onstop
        cleanupAudioResources()
        setStatus('preview')
    }

    const handleCancel = () => {
        cleanupAudioResources()
        // If aborting, make sure we definitively kill streams outside of onstop too just in case
        const stream = mediaRecorderRef.current?.stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
        }
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
            audioCtxRef.current.close()
        }

        if (timerRef.current) clearInterval(timerRef.current)
        onCancel()
    }

    // Initialize native Audio when preview mode opens
    useEffect(() => {
        if (status === 'preview' && audioUrl) {
            const audio = new Audio(audioUrl)
            previewAudioRef.current = audio

            const handleUpdate = () => setPreviewTime(audio.currentTime)
            const handleEnded = () => {
                setIsPlayingPreview(false)
                setPreviewTime(0)
            }
            const handlePlay = () => setIsPlayingPreview(true)
            const handlePause = () => setIsPlayingPreview(false)

            audio.addEventListener('timeupdate', handleUpdate)
            audio.addEventListener('ended', handleEnded)
            audio.addEventListener('play', handlePlay)
            audio.addEventListener('pause', handlePause)

            return () => {
                audio.removeEventListener('timeupdate', handleUpdate)
                audio.removeEventListener('ended', handleEnded)
                audio.removeEventListener('play', handlePlay)
                audio.removeEventListener('pause', handlePause)
                audio.pause()
                audio.src = ''
            }
        }
    }, [status, audioUrl])

    const togglePreviewPlay = () => {
        if (!previewAudioRef.current) return
        if (isPlayingPreview) {
            previewAudioRef.current.pause()
        } else {
            previewAudioRef.current.play().catch(e => console.error(e))
        }
    }

    const handleSend = async () => {
        if (status === 'recording') {
            shouldUploadOnStop.current = true
            await stopRecording() // This triggers the async stop logic
            return
        }
        executeUpload(audioBlob)
    }

    const executeUpload = async (blobToUpload: Blob | null) => {
        if (!blobToUpload || blobToUpload.size === 0) {
            console.error("Yüklenecek ses dosyası bulunamadı.")
            setStatus('error')
            setErrorMessage("Ses kaydedilemedi. Lütfen tekrar deneyin.")
            return
        }

        setIsUploading(true)
        const filename = `voice_${Date.now()}.webm`
        const storageRef = ref(storage, `voice_messages/${filename}`)

        const uploadTask = uploadBytesResumable(storageRef, blobToUpload)

        uploadTask.on(
            'state_changed',
            () => { },
            (error) => {
                console.error("Ses yükleme hatası:", error)
                setIsUploading(false)
                handleCancel()
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
                    onSend(downloadURL, recordingTime)
                } catch (err) {
                    console.error("URL alınamadı:", err)
                    handleCancel()
                }
                setIsUploading(false)
            }
        )
    }

    // Render Error State
    if (status === 'error') {
        return (
            <div className="voice-recorder-bar" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <AlertCircle size={18} color="#ef4444" />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{errorMessage}</span>
                </div>
                <button className="voice-cancel-btn" onClick={handleCancel}>
                    Kapat
                </button>
            </div>
        )
    }

    return (
        <div className="voice-recorder-bar">
            {isUploading ? (
                <div className="voice-uploading">
                    <div className="loading-spinner"></div>
                    <span>Gönderiliyor...</span>
                </div>
            ) : status === 'recording' ? (
                <>
                    <button className="voice-cancel-btn" onClick={handleCancel} title="İptal">
                        <Trash2 size={20} />
                    </button>

                    <div className="voice-recording-info">
                        <div className="record-red-dot"></div>
                        <span className="record-time">{formatTime(recordingTime)}</span>
                    </div>

                    {/* LIVE DYNAMIC WAVEFORM - Requirement 4 */}
                    <div className="live-waveform">
                        {waveformData.map((height, i) => (
                            <div
                                key={i}
                                className="live-wave-bar"
                                style={{ height: `${height}px` }}
                            />
                        ))}
                    </div>

                    <div className="voice-actions">
                        <button className="voice-stop-btn" onClick={stopRecording} title="Durdur">
                            <Square size={16} fill="currentColor" />
                        </button>
                    </div>
                </>
            ) : (
                /* PREVIEW PLAYBACK UI - Requirement 2 */
                <>
                    <button className="voice-cancel-btn" onClick={handleCancel} title="Sil">
                        <Trash2 size={20} />
                    </button>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px' }}>
                        <button
                            className="voice-play-btn"
                            style={{
                                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                border: 'none', background: 'var(--primary)', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                            }}
                            onClick={togglePreviewPlay}
                        >
                            {isPlayingPreview ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                        </button>

                        {/* NATIVE CUSTOM PREVIEW UI */}
                        <div
                            style={{
                                display: 'flex', alignItems: 'center', gap: '2px',
                                height: '28px', flex: 1, cursor: 'pointer', overflow: 'hidden'
                            }}
                            onClick={(e) => {
                                if (!previewAudioRef.current) return
                                const rect = e.currentTarget.getBoundingClientRect()
                                const clickX = e.clientX - rect.left
                                const percent = Math.max(0, Math.min(1, clickX / rect.width))
                                previewAudioRef.current.currentTime = percent * recordingTime
                            }}
                        >
                            {previewWaveHeights.map((height, i) => {
                                const progressPercent = recordingTime > 0 ? (previewTime / recordingTime) * 100 : 0
                                const barPercent = (i / previewWaveHeights.length) * 100
                                const isPlayed = barPercent <= progressPercent

                                return (
                                    <div
                                        key={i}
                                        style={{
                                            flex: 1,
                                            height: `${height}%`,
                                            backgroundColor: isPlayed ? 'var(--primary)' : 'rgba(230, 57, 70, 0.3)',
                                            borderRadius: '2px',
                                            transition: 'background-color 0.1s linear'
                                        }}
                                    />
                                )
                            })}
                        </div>

                        <span className="record-time" style={{ fontSize: '0.8rem', opacity: 0.8, fontFamily: 'monospace' }}>
                            {isPlayingPreview ? formatTime(previewTime) : formatTime(recordingTime)}
                        </span>
                    </div>

                    {/* SEND FUNCTIONALITY - Requirement 5 */}
                    <button className="voice-send-btn direct" onClick={handleSend} title="Gönder">
                        <Send size={18} />
                    </button>
                </>
            )}
        </div>
    )
}
