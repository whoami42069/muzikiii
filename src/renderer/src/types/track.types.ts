// Track-related type definitions

export interface TrackMetadata {
  title: string;
  artist?: string;
  album?: string;
  duration: number;      // in seconds
  sampleRate: number;
  channels: number;
  source: 'youtube' | 'local' | 'recording';
  sourceUrl?: string;    // Original YouTube URL if applicable
  filePath: string;      // Local file path
  addedAt: number;       // Timestamp
}

export interface Track {
  id: string;
  metadata: TrackMetadata;

  // Playback state
  isLoaded: boolean;
  isPlaying: boolean;

  // Mixing
  volume: number;        // 0-1
  pan: number;           // -1 to 1
  muted: boolean;
  solo: boolean;

  // Effects chain
  effectsEnabled: boolean;

  // Visual
  color: string;         // Track color for UI
  waveformData?: Float32Array;
}

export interface TrackState {
  tracks: Track[];
  selectedTrackId: string | null;
  soloedTrackIds: string[];
}

// Default track values
export const DEFAULT_TRACK_VALUES: Partial<Track> = {
  volume: 0.8,
  pan: 0,
  muted: false,
  solo: false,
  effectsEnabled: true,
  isLoaded: false,
  isPlaying: false,
};

// Track colors for visual distinction
export const TRACK_COLORS = [
  '#e94560', // Red
  '#4ecdc4', // Teal
  '#45b7d1', // Blue
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#2ecc71', // Green
  '#e74c3c', // Coral
  '#3498db', // Light Blue
];
