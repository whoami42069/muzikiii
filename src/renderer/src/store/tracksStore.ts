import { create } from 'zustand'
import type { Track, TrackMetadata } from '../types'

interface TracksState {
  tracks: Track[]
  selectedTrackId: string | null

  // Actions
  addTrack: (metadata: TrackMetadata) => string
  removeTrack: (id: string) => void
  selectTrack: (id: string | null) => void
  updateTrack: (id: string, updates: Partial<Track>) => void

  // Mixing
  setVolume: (id: string, volume: number) => void
  setPan: (id: string, pan: number) => void
  toggleMute: (id: string) => void
  toggleSolo: (id: string) => void

  // Loading
  setTrackLoaded: (id: string, loaded: boolean) => void
  setWaveformData: (id: string, data: Float32Array) => void

  // Reset
  resetTracks: () => void
}

const TRACK_COLORS = [
  '#e94560',
  '#4ecdc4',
  '#45b7d1',
  '#f39c12',
  '#9b59b6',
  '#2ecc71',
  '#e74c3c',
  '#3498db'
]

let trackCounter = 0

const generateTrackId = (): string => `track-${++trackCounter}-${Date.now()}`

export const useTracksStore = create<TracksState>(
  (set, get): TracksState => ({
    tracks: [],
    selectedTrackId: null,

    addTrack: (metadata) => {
      const id = generateTrackId()
      const colorIndex = get().tracks.length % TRACK_COLORS.length

      const newTrack: Track = {
        id,
        metadata,
        isLoaded: false,
        isPlaying: false,
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        effectsEnabled: true,
        color: TRACK_COLORS[colorIndex]
      }

      set((state) => ({
        tracks: [...state.tracks, newTrack],
        selectedTrackId: id
      }))

      return id
    },

    removeTrack: (id) =>
      set((state) => ({
        tracks: state.tracks.filter((t) => t.id !== id),
        selectedTrackId: state.selectedTrackId === id ? null : state.selectedTrackId
      })),

    selectTrack: (id) => set({ selectedTrackId: id }),

    updateTrack: (id, updates) =>
      set((state) => ({
        tracks: state.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t))
      })),

    setVolume: (id, volume) =>
      set((state) => ({
        tracks: state.tracks.map((t) =>
          t.id === id ? { ...t, volume: Math.max(0, Math.min(1, volume)) } : t
        )
      })),

    setPan: (id, pan) =>
      set((state) => ({
        tracks: state.tracks.map((t) =>
          t.id === id ? { ...t, pan: Math.max(-1, Math.min(1, pan)) } : t
        )
      })),

    toggleMute: (id) =>
      set((state) => ({
        tracks: state.tracks.map((t) => (t.id === id ? { ...t, muted: !t.muted } : t))
      })),

    toggleSolo: (id) =>
      set((state) => ({
        tracks: state.tracks.map((t) => (t.id === id ? { ...t, solo: !t.solo } : t))
      })),

    setTrackLoaded: (id, loaded) =>
      set((state) => ({
        tracks: state.tracks.map((t) => (t.id === id ? { ...t, isLoaded: loaded } : t))
      })),

    setWaveformData: (id, data) =>
      set((state) => ({
        tracks: state.tracks.map((t) => (t.id === id ? { ...t, waveformData: data } : t))
      })),

    resetTracks: () => {
      trackCounter = 0
      set({ tracks: [], selectedTrackId: null })
    }
  })
)
