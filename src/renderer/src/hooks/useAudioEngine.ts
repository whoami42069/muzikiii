import { useEffect, useCallback, useRef } from 'react'
import { audioEngine, EngineState } from '../audio/engine'
import { useTransportStore, useTracksStore } from '../store'

interface UseAudioEngineReturn {
  isPlaying: boolean
  currentTime: number
  isInitialized: boolean
  play: () => Promise<void>
  pause: () => void
  stop: () => void
  togglePlayPause: () => Promise<void>
  seek: (time: number) => void
  setTrackVolume: (trackId: string, volume: number) => void
  setTrackPan: (trackId: string, pan: number) => void
  setTrackMute: (trackId: string, muted: boolean) => void
  setTrackSolo: (trackId: string, solo: boolean) => void
  setMasterVolume: (volume: number) => void
  getFrequencyData: () => Float32Array
  getLevel: () => number
  initializeAudio: () => Promise<boolean>
}

/**
 * Hook to connect the audio engine to React state
 */
export function useAudioEngine(): UseAudioEngineReturn {
  const { isPlaying, currentTime, setIsPlaying, setCurrentTime, setDuration } = useTransportStore()

  const { tracks, updateTrack } = useTracksStore()
  const loadedTracksRef = useRef<Set<string>>(new Set())
  const tracksRef = useRef(tracks)
  const updateTrackRef = useRef(updateTrack)
  const prevTracksRef = useRef<typeof tracks>([])

  // Keep refs in sync with latest values
  useEffect(() => {
    tracksRef.current = tracks
    updateTrackRef.current = updateTrack
  })

  // Initialize audio context on first user interaction
  const initializeAudio = useCallback(async () => {
    if (audioEngine.isInitialized()) return true
    return await audioEngine.initialize()
  }, [])

  // Play
  const play = useCallback(async () => {
    const initialized = await initializeAudio()
    if (initialized) {
      audioEngine.play()
    }
  }, [initializeAudio])

  // Pause
  const pause = useCallback(() => {
    audioEngine.pause()
  }, [])

  // Stop
  const stop = useCallback(() => {
    audioEngine.stop()
  }, [])

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      pause()
    } else {
      await play()
    }
  }, [isPlaying, play, pause])

  // Seek
  const seek = useCallback(
    (time: number) => {
      audioEngine.seek(time)
      setCurrentTime(time)
    },
    [setCurrentTime]
  )

  // Set track volume
  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    audioEngine.setTrackVolume(trackId, volume)
  }, [])

  // Set track pan
  const setTrackPan = useCallback((trackId: string, pan: number) => {
    audioEngine.setTrackPan(trackId, pan)
  }, [])

  // Set track mute
  const setTrackMute = useCallback((trackId: string, muted: boolean) => {
    audioEngine.setTrackMute(trackId, muted)
  }, [])

  // Set track solo
  const setTrackSolo = useCallback((trackId: string, solo: boolean) => {
    audioEngine.setTrackSolo(trackId, solo)
  }, [])

  // Set master volume
  const setMasterVolume = useCallback((volume: number) => {
    audioEngine.setMasterVolume(volume)
  }, [])

  // Get frequency data for visualizations
  const getFrequencyData = useCallback(() => {
    return audioEngine.getFrequencyData()
  }, [])

  // Get current level
  const getLevel = useCallback(() => {
    return audioEngine.getLevel()
  }, [])

  // Subscribe to engine events
  useEffect(() => {
    const handleStateChange = (state: EngineState): void => {
      setIsPlaying(state === 'playing')
    }

    const handleTimeUpdate = (time: number): void => {
      setCurrentTime(time)
    }

    const handleTrackLoaded = (trackId: string, duration: number): void => {
      // Use refs to avoid stale closure over tracks
      const currentTracks = tracksRef.current
      const track = currentTracks.find((t) => t.id === trackId)
      if (track) {
        updateTrackRef.current(trackId, {
          metadata: { ...track.metadata, duration },
          isLoaded: true
        })
      }
      // Update total duration
      setDuration(audioEngine.getDuration())
    }

    audioEngine.on('stateChange', handleStateChange)
    audioEngine.on('timeUpdate', handleTimeUpdate)
    audioEngine.on('trackLoaded', handleTrackLoaded)

    return () => {
      audioEngine.off('stateChange', handleStateChange)
      audioEngine.off('timeUpdate', handleTimeUpdate)
      audioEngine.off('trackLoaded', handleTrackLoaded)
    }
  }, [setIsPlaying, setCurrentTime, setDuration])

  // Load/unload tracks when they change
  useEffect(() => {
    const currentTrackIds = new Set(tracks.map((t) => t.id))
    const loadedIds = loadedTracksRef.current

    // Load new tracks
    tracks.forEach((track) => {
      if (!loadedIds.has(track.id) && track.metadata.filePath) {
        console.log('[useAudioEngine] Loading track:', track.id, track.metadata.filePath)
        audioEngine.loadTrack(track.id, track.metadata.filePath)
        loadedIds.add(track.id)
      }
    })

    // Unload removed tracks
    loadedIds.forEach((id) => {
      if (!currentTrackIds.has(id)) {
        console.log('[useAudioEngine] Unloading track:', id)
        audioEngine.unloadTrack(id)
        loadedIds.delete(id)
      }
    })
  }, [tracks])

  // Sync mute/solo/volume/pan state with audio engine (diff-based)
  useEffect(() => {
    tracks.forEach((track) => {
      const prev = prevTracksRef.current.find((t) => t.id === track.id)
      if (!prev || prev.muted !== track.muted) audioEngine.setTrackMute(track.id, track.muted)
      if (!prev || prev.solo !== track.solo) audioEngine.setTrackSolo(track.id, track.solo)
      if (!prev || prev.volume !== track.volume) audioEngine.setTrackVolume(track.id, track.volume)
      if (!prev || prev.pan !== track.pan) audioEngine.setTrackPan(track.id, track.pan)
    })
    prevTracksRef.current = tracks
  }, [tracks])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't dispose the engine on unmount - it's a singleton
      // Just stop playback
      audioEngine.stop()
    }
  }, [])

  return {
    // State
    isPlaying,
    currentTime,
    isInitialized: audioEngine.isInitialized(),

    // Transport controls
    play,
    pause,
    stop,
    togglePlayPause,
    seek,

    // Track controls
    setTrackVolume,
    setTrackPan,
    setTrackMute,
    setTrackSolo,

    // Master controls
    setMasterVolume,

    // Visualization
    getFrequencyData,
    getLevel,

    // Initialization
    initializeAudio
  }
}
