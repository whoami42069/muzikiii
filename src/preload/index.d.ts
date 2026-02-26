import { ElectronAPI } from '@electron-toolkit/preload'

// IPC response types
interface FileOperationResult {
  success: boolean
  canceled?: boolean
  error?: string
}

interface SaveProjectResult extends FileOperationResult {
  filePath?: string
}

interface LoadProjectResult extends FileOperationResult {
  filePath?: string
  data?: string
}

interface ImportAudioResult extends FileOperationResult {
  filePaths?: string[]
}

interface ExportAudioResult extends FileOperationResult {
  filePath?: string
}

interface SelectFolderResult extends FileOperationResult {
  folderPath?: string
}

interface ReadBufferResult extends FileOperationResult {
  buffer?: Buffer
}

interface YouTubeProgressPayload {
  percentage: number
  downloadedBytes: number
  totalBytes: number
  speed?: string
  eta?: string
  status?: string
}

interface YouTubeCompletePayload {
  filePath: string
  metadata: {
    title: string
    artist?: string
    duration: number
    thumbnail?: string
  }
}

interface YouTubeErrorPayload {
  message: string
  code?: string
}

interface YouTubeDownloadRequest {
  url: string
  outputFormat: 'mp3' | 'wav' | 'flac'
  quality?: string
}

interface YouTubeAvailabilityResult {
  available: boolean
  ytdlp?: { available: boolean; version?: string; path?: string }
  ffmpeg?: { available: boolean; version?: string; path?: string }
  instructions?: string
}

interface YouTubeVideoInfo {
  valid: boolean
  title?: string
  duration?: number
  thumbnail?: string
  channel?: string
}

interface YouTubeDownloadResult {
  success: boolean
  filePath?: string
  metadata?: YouTubeCompletePayload['metadata']
  error?: string
}

// API interface
interface MuzikiiiAPI {
  youtube: {
    download: (request: YouTubeDownloadRequest) => Promise<YouTubeDownloadResult>
    cancel: () => Promise<{ success: boolean }>
    checkAvailable: () => Promise<YouTubeAvailabilityResult>
    validateUrl: (url: string) => Promise<YouTubeVideoInfo>
    onProgress: (callback: (data: YouTubeProgressPayload) => void) => () => void
    onComplete: (callback: (data: YouTubeCompletePayload) => void) => () => void
    onError: (callback: (data: YouTubeErrorPayload) => void) => () => void
  }
  file: {
    saveProject: (projectData: string, filePath?: string) => Promise<SaveProjectResult>
    loadProject: (filePath?: string) => Promise<LoadProjectResult>
    importAudio: () => Promise<ImportAudioResult>
    exportAudio: (options: { defaultName?: string; format?: string }) => Promise<ExportAudioResult>
    selectFolder: () => Promise<SelectFolderResult>
    readBuffer: (filePath: string) => Promise<ReadBufferResult>
    getAudioDir: () => Promise<string>
  }
  app: {
    getPath: (name: 'userData' | 'music' | 'documents') => Promise<string>
    showDialog: (options: Electron.MessageBoxOptions) => Promise<Electron.MessageBoxReturnValue>
    showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>
    showSaveDialog: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: MuzikiiiAPI
  }
}

export {}
