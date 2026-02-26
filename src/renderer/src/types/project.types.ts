import type { Track } from './track.types'
import type { AllEffectParams } from './audio.types'

/**
 * Project save file format (extends base ProjectFile from ipc.types)
 */
export interface ProjectSaveData {
  version: string
  name: string
  createdAt: number
  modifiedAt: number

  // Transport state
  transport: {
    bpm: number
  }

  // Tracks (without runtime state)
  tracks: SerializedTrack[]

  // Effects state
  effects: AllEffectParams
}

/**
 * Serialized track (excludes waveformData and runtime state)
 */
export interface SerializedTrack {
  id: string
  metadata: {
    title: string
    artist?: string
    album?: string
    duration: number
    sampleRate: number
    channels: number
    source: 'youtube' | 'local' | 'recording'
    sourceUrl?: string
    filePath: string
    addedAt: number
  }
  volume: number
  pan: number
  muted: boolean
  solo: boolean
  effectsEnabled: boolean
  color: string
}

/**
 * Convert Track to SerializedTrack
 */
export function serializeTrack(track: Track): SerializedTrack {
  return {
    id: track.id,
    metadata: { ...track.metadata },
    volume: track.volume,
    pan: track.pan,
    muted: track.muted,
    solo: track.solo,
    effectsEnabled: track.effectsEnabled,
    color: track.color
  }
}

/**
 * Convert SerializedTrack to Track
 */
export function deserializeTrack(serialized: SerializedTrack): Track {
  return {
    ...serialized,
    isLoaded: false,
    isPlaying: false,
    waveformData: undefined
  }
}
