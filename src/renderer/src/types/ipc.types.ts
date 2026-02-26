// IPC Channel definitions for Electron communication

export const IPC_CHANNELS = {
  // YouTube Import
  YOUTUBE_DOWNLOAD: 'youtube:download',
  YOUTUBE_PROGRESS: 'youtube:progress',
  YOUTUBE_COMPLETE: 'youtube:complete',
  YOUTUBE_ERROR: 'youtube:error',
  YOUTUBE_CANCEL: 'youtube:cancel',

  // File Operations
  FILE_SAVE_PROJECT: 'file:save-project',
  FILE_LOAD_PROJECT: 'file:load-project',
  FILE_EXPORT_AUDIO: 'file:export-audio',
  FILE_IMPORT_AUDIO: 'file:import-audio',
  FILE_SELECT_FOLDER: 'file:select-folder',

  // App
  APP_GET_PATH: 'app:get-path',
  APP_SHOW_DIALOG: 'app:show-dialog',
} as const;

// YouTube Download
export interface YouTubeDownloadRequest {
  url: string;
  outputFormat: 'mp3' | 'wav' | 'flac';
  quality?: 'best' | 'medium' | 'low';
}

export interface YouTubeProgressPayload {
  percentage: number;
  downloadedBytes: number;
  totalBytes: number;
  speed?: string;
  eta?: string;
}

export interface YouTubeCompletePayload {
  filePath: string;
  metadata: {
    title: string;
    artist?: string;
    duration: number;
    thumbnail?: string;
  };
}

export interface YouTubeErrorPayload {
  message: string;
  code?: string;
}

// Project File
export interface ProjectFile {
  version: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  tracks: import('./track.types').Track[];
  effects: import('./audio.types').AllEffectParams;
  transport: {
    bpm: number;
    position: number;
  };
}

// Export Options
export interface AudioExportOptions {
  format: 'wav' | 'mp3' | 'flac';
  sampleRate: 44100 | 48000 | 96000;
  bitDepth: 16 | 24 | 32;
  normalize: boolean;
}

// Note: The actual window.api types are defined in src/preload/index.d.ts
// which matches the IPC handler return types
