import { create } from 'zustand'

interface TransportState {
  // Playback state
  isPlaying: boolean
  isPaused: boolean
  currentTime: number // in seconds
  duration: number // in seconds

  // Tempo
  bpm: number

  // Loop
  loopEnabled: boolean
  loopStart: number
  loopEnd: number

  // Actions
  play: () => void
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  setDuration: (duration: number) => void
  setBpm: (bpm: number) => void
  setLoop: (enabled: boolean, start?: number, end?: number) => void
  updateTime: (time: number) => void

  // Direct setters (for audio engine sync)
  setIsPlaying: (isPlaying: boolean) => void
  setCurrentTime: (time: number) => void
}

export const useTransportStore = create<TransportState>((set) => ({
  // Initial state
  isPlaying: false,
  isPaused: false,
  currentTime: 0,
  duration: 0,
  bpm: 120,
  loopEnabled: false,
  loopStart: 0,
  loopEnd: 0,

  // Actions
  play: () => set({ isPlaying: true, isPaused: false }),

  pause: () => set({ isPlaying: false, isPaused: true }),

  stop: () => set({ isPlaying: false, isPaused: false, currentTime: 0 }),

  seek: (time) => set({ currentTime: Math.max(0, time) }),

  setDuration: (duration) => set({ duration }),

  setBpm: (bpm) => set({ bpm: Math.max(20, Math.min(300, bpm)) }),

  setLoop: (enabled, start, end) =>
    set((state) => ({
      loopEnabled: enabled,
      loopStart: start ?? state.loopStart,
      loopEnd: end ?? state.loopEnd
    })),

  updateTime: (time) => set({ currentTime: time }),

  // Direct setters for audio engine sync
  setIsPlaying: (isPlaying) => set({ isPlaying, isPaused: !isPlaying }),
  setCurrentTime: (time) => set({ currentTime: time })
}))
