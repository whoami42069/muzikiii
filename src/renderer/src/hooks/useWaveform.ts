import { useEffect, useRef, useState, useCallback } from 'react'
import WaveSurfer from 'wavesurfer.js'

interface UseWaveformOptions {
  container: HTMLElement | null
  filePath: string
  color: string
  pixelsPerSecond: number
  onReady?: () => void
  onError?: (error: Error) => void
}

interface UseWaveformReturn {
  getWavesurfer: () => WaveSurfer | null
  isReady: boolean
  error: string | null
  duration: number
  seekTo: (progress: number) => void
  zoom: (pixelsPerSecond: number) => void
}

/**
 * Hook for managing a WaveSurfer instance
 * Note: WaveSurfer is used for visualization only, Tone.js handles playback
 */
export function useWaveform({
  container,
  filePath,
  color,
  pixelsPerSecond,
  onReady,
  onError
}: UseWaveformOptions): UseWaveformReturn {
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)

  // Use refs for callbacks to avoid triggering effect re-creation
  const onReadyRef = useRef(onReady)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onReadyRef.current = onReady
    onErrorRef.current = onError
  })

  // Initialize WaveSurfer
  useEffect(() => {
    if (!container || !filePath) return

    try {
      const ws = WaveSurfer.create({
        container,
        waveColor: color,
        progressColor: `${color}99`,
        cursorWidth: 0,
        height: 52,
        normalize: true,
        interact: false,
        hideScrollbar: true,
        fillParent: true,
        minPxPerSec: pixelsPerSecond,
        backend: 'WebAudio',
        barWidth: 2,
        barGap: 1,
        barRadius: 1
      })

      ws.on('ready', () => {
        setIsReady(true)
        setError(null)
        setDuration(ws.getDuration())
        onReadyRef.current?.()
      })

      ws.on('error', (err) => {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        setIsReady(false)
        onErrorRef.current?.(err instanceof Error ? err : new Error(errorMessage))
      })

      ws.load(filePath)
      wavesurferRef.current = ws
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize'
      // Defer setState to avoid synchronous setState in effect body
      setTimeout(() => setError(errorMessage), 0)
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.unAll()
        wavesurferRef.current.destroy()
        wavesurferRef.current = null
      }
      setIsReady(false)
      setError(null)
    }
  }, [container, filePath, color, pixelsPerSecond])

  // Seek to position (0-1 progress)
  const seekTo = useCallback(
    (progress: number) => {
      if (wavesurferRef.current && isReady) {
        wavesurferRef.current.seekTo(Math.min(Math.max(progress, 0), 1))
      }
    },
    [isReady]
  )

  // Update zoom level
  const zoom = useCallback(
    (newPixelsPerSecond: number) => {
      if (wavesurferRef.current && isReady) {
        wavesurferRef.current.zoom(newPixelsPerSecond)
      }
    },
    [isReady]
  )

  // Return a getter to avoid reading ref during render
  const getWavesurfer = useCallback(() => wavesurferRef.current, [])

  return {
    getWavesurfer,
    isReady,
    error,
    duration,
    seekTo,
    zoom
  }
}

/**
 * Store for managing multiple waveform instances
 * Useful for coordinating zoom and seeking across all tracks
 */
class WaveformRegistry {
  private instances = new Map<string, WaveSurfer>()
  private listeners = new Set<() => void>()

  register(trackId: string, wavesurfer: WaveSurfer): void {
    this.instances.set(trackId, wavesurfer)
    this.notifyListeners()
  }

  unregister(trackId: string): void {
    this.instances.delete(trackId)
    this.notifyListeners()
  }

  get(trackId: string): WaveSurfer | undefined {
    return this.instances.get(trackId)
  }

  getAll(): Map<string, WaveSurfer> {
    return new Map(this.instances)
  }

  // Zoom all waveforms
  zoomAll(pixelsPerSecond: number): void {
    this.instances.forEach((ws) => {
      ws.zoom(pixelsPerSecond)
    })
  }

  // Seek all waveforms to a position
  seekAll(progress: number): void {
    this.instances.forEach((ws) => {
      ws.seekTo(Math.min(Math.max(progress, 0), 1))
    })
  }

  // Subscribe to registry changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener())
  }
}

// Global waveform registry singleton
export const waveformRegistry = new WaveformRegistry()
