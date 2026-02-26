import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { audioEngine } from '../../audio/engine'

interface WaveformDisplayProps {
  trackId: string
  filePath: string
  color: string
  pixelsPerSecond: number
  duration: number
}

export function WaveformDisplay({
  trackId,
  filePath,
  color,
  pixelsPerSecond,
  duration
}: WaveformDisplayProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isWaveformReady, setIsWaveformReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate width based on duration and zoom
  const width = Math.max(duration * pixelsPerSecond, 100)

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current || !filePath) return

    try {
      // Create WaveSurfer instance (for visualization only, not playback)
      const ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: color,
        progressColor: `${color}99`,
        cursorWidth: 0, // Hide cursor - we use our own playhead
        height: 52,
        normalize: true,
        interact: false, // Disable interaction - seeking handled by Timeline
        hideScrollbar: true,
        fillParent: true,
        minPxPerSec: pixelsPerSecond,
        backend: 'WebAudio',
        barWidth: 2,
        barGap: 1,
        barRadius: 1
      })

      // Event handlers
      ws.on('ready', () => {
        console.log(`[WaveformDisplay] Waveform ready for track ${trackId}`)
        setIsWaveformReady(true)
        setError(null)
      })

      ws.on('error', (err) => {
        console.error(`[WaveformDisplay] Error for track ${trackId}:`, err)
        setError('Failed to load waveform')
        setIsWaveformReady(false)
      })

      // Load the audio file for waveform visualization
      // Note: We only use wavesurfer for visualization, Tone.js handles playback
      ws.load(filePath)

      wavesurferRef.current = ws
    } catch (err) {
      console.error(`[WaveformDisplay] Init error for track ${trackId}:`, err)
      // Defer setState to avoid synchronous setState in effect body
      setTimeout(() => setError('Failed to initialize waveform'), 0)
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy()
        wavesurferRef.current = null
      }
      setIsWaveformReady(false)
    }
  }, [filePath, trackId, color, pixelsPerSecond])

  // Update zoom level
  useEffect(() => {
    if (wavesurferRef.current && isWaveformReady) {
      wavesurferRef.current.zoom(pixelsPerSecond)
    }
  }, [pixelsPerSecond, isWaveformReady])

  // Track playback progress for custom cursor
  const [playbackProgress, setPlaybackProgress] = useState(0)

  // Update playback progress periodically (not continuously with RAF)
  useEffect(() => {
    if (!wavesurferRef.current || !isWaveformReady) return

    const updateProgress = (): void => {
      if (wavesurferRef.current && audioEngine.isInitialized()) {
        const currentTime = audioEngine.getCurrentTime()
        const trackDuration = wavesurferRef.current.getDuration()
        if (trackDuration > 0) {
          const progress = currentTime / trackDuration
          setPlaybackProgress(Math.min(Math.max(progress, 0), 1))
        }
      }
    }

    // Update at a reasonable rate (60fps max) instead of continuous RAF
    const intervalId = setInterval(updateProgress, 16)

    return () => {
      clearInterval(intervalId)
    }
  }, [isWaveformReady])

  return (
    <div className="relative w-full h-full" style={{ width }}>
      {/* Loading state */}
      {!isWaveformReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-daw-surface/20">
          <div className="flex items-center gap-2 text-xs text-daw-text/50">
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Loading waveform...
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-daw-surface/20">
          <div className="text-xs text-red-400">{error}</div>
        </div>
      )}

      {/* Wavesurfer container */}
      <div
        ref={containerRef}
        className={`w-full h-full ${!isWaveformReady ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
      />

      {/* Custom playback progress cursor */}
      {isWaveformReady && playbackProgress > 0 && (
        <div
          className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-10"
          style={{
            left: `${playbackProgress * 100}%`,
            backgroundColor: color,
            boxShadow: `0 0 4px ${color}`
          }}
        />
      )}

      {/* Placeholder waveform while loading */}
      {!isWaveformReady && !error && (
        <div className="absolute inset-0 flex items-center px-1 opacity-30">
          <PlaceholderWaveform color={color} />
        </div>
      )}
    </div>
  )
}

// Simple placeholder waveform - uses consistent pattern (no random values)
function PlaceholderWaveform({ color }: { color: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-px w-full h-full">
      {Array.from({ length: 80 }).map((_, i) => {
        // Use deterministic pattern instead of Math.random()
        const height = 15 + Math.sin(i * 0.3) * 30 + Math.cos(i * 0.15) * 20
        return (
          <div
            key={i}
            className="flex-1 rounded-full"
            style={{
              height: `${height}%`,
              backgroundColor: color,
              opacity: 0.4
            }}
          />
        )
      })}
    </div>
  )
}
