import { app, BrowserWindow } from 'electron'
import path from 'path'
import { promises as fs } from 'fs'

// Types
export interface DownloadOptions {
  url: string
  outputFormat: 'mp3' | 'wav' | 'flac'
  quality?: 'best' | 'medium' | 'low'
}

export interface DownloadProgress {
  percentage: number
  downloadedBytes: number
  totalBytes: number
  speed?: string
  eta?: string
  status: 'downloading' | 'converting' | 'complete' | 'error'
}

export interface DownloadResult {
  filePath: string
  metadata: {
    title: string
    artist?: string
    duration: number
    thumbnail?: string
  }
}

export interface VideoInfo {
  valid: boolean
  title?: string
  duration?: number
  thumbnail?: string
  channel?: string
}

// Dynamic import for ytdlp-nodejs (optional dependency)
let YtDlpClass: typeof import('ytdlp-nodejs').YtDlp | null = null

async function loadYtDlp(): Promise<typeof import('ytdlp-nodejs').YtDlp | null> {
  if (YtDlpClass) return YtDlpClass

  try {
    const module = await import('ytdlp-nodejs')
    YtDlpClass = module.YtDlp
    return YtDlpClass
  } catch (error) {
    console.error('[YouTube] ytdlp-nodejs not available:', error)
    return null
  }
}

class YouTubeService {
  private audioDir: string
  private currentDownload: AbortController | null = null
  private mainWindow: BrowserWindow | null = null

  constructor() {
    this.audioDir = path.join(app.getPath('userData'), 'audio')
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  private sendProgress(progress: DownloadProgress): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('youtube:progress', progress)
    }
  }

  private sendComplete(result: DownloadResult): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('youtube:complete', result)
    }
  }

  private sendError(error: { message: string; code?: string }): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('youtube:error', error)
    }
  }

  async initialize(): Promise<void> {
    // Ensure audio directory exists
    try {
      await fs.mkdir(this.audioDir, { recursive: true })
      console.log('[YouTube] Audio directory:', this.audioDir)
    } catch (error) {
      console.error('[YouTube] Failed to create audio directory:', error)
    }
  }

  async isAvailable(): Promise<boolean> {
    const ytdlp = await loadYtDlp()
    return ytdlp !== null
  }

  async validateUrl(url: string): Promise<VideoInfo> {
    const ytdlp = await loadYtDlp()
    if (!ytdlp) {
      return { valid: false }
    }

    try {
      // Check if URL looks like a YouTube URL
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
      if (!youtubeRegex.test(url)) {
        return { valid: false }
      }

      // Get video info
      const instance = new ytdlp()
      const info = await instance.getInfoAsync(url)

      // Type guard - check if it's a video (not a playlist)
      const isVideo = 'duration' in info

      return {
        valid: true,
        title: info.title,
        duration: isVideo ? (info as { duration: number }).duration : 0,
        thumbnail: 'thumbnail' in info ? (info as { thumbnail?: string }).thumbnail : undefined,
        channel: 'channel' in info ? (info as { channel?: string }).channel : undefined
      }
    } catch (error) {
      console.error('[YouTube] URL validation error:', error)
      return { valid: false }
    }
  }

  async download(options: DownloadOptions): Promise<DownloadResult> {
    const ytdlp = await loadYtDlp()
    if (!ytdlp) {
      throw new Error('ytdlp-nodejs is not installed. Run: npm install ytdlp-nodejs')
    }

    this.currentDownload = new AbortController()
    const signal = this.currentDownload.signal

    // Check if already cancelled
    if (signal.aborted) {
      throw new Error('Download cancelled')
    }

    // Will be set once we know the output path (for cleanup on cancel)
    let outputPath = ''

    try {
      // Get video info first
      this.sendProgress({
        percentage: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        status: 'downloading'
      })

      const instance = new ytdlp()
      const info = await instance.getInfoAsync(options.url)

      // Generate output filename
      const safeTitle = (info.title || 'download').replace(/[<>:"/\\|?*]/g, '_').substring(0, 100)
      const timestamp = Date.now()
      outputPath = path.join(this.audioDir, `${safeTitle}_${timestamp}.${options.outputFormat}`)

      // Download with progress tracking
      let lastProgress = 0

      // Format options for ytdlp-nodejs
      // Use VideoProgress type from ytdlp-nodejs
      type VideoProgress = {
        status: 'downloading' | 'finished'
        downloaded: number
        total: number
        speed: number
        eta: number
        percentage: number
        speed_str: string
        eta_str: string
      }

      const formatOptions = {
        format: options.outputFormat as 'mp3' | 'wav' | 'flac',
        output: outputPath,
        quality:
          options.quality === 'best' ? 'highest' : options.quality === 'low' ? 'lowest' : undefined,
        onProgress: (progress: VideoProgress) => {
          // Check if download was cancelled
          if (signal.aborted) {
            throw new Error('Download cancelled')
          }

          const percentage = progress.percentage || 0

          // Only send updates when progress changes significantly
          if (percentage - lastProgress >= 1 || percentage === 100) {
            lastProgress = percentage
            this.sendProgress({
              percentage,
              downloadedBytes: progress.downloaded || 0,
              totalBytes: progress.total || 0,
              speed: progress.speed_str || undefined,
              eta: progress.eta_str || undefined,
              status: percentage >= 100 ? 'converting' : 'downloading'
            })
          }
        }
      }

      const DOWNLOAD_TIMEOUT = 10 * 60 * 1000 // 10 minutes
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Download timed out after 10 minutes')), DOWNLOAD_TIMEOUT)
      })

      await Promise.race([instance.downloadAsync(options.url, formatOptions), timeoutPromise])

      // Verify file exists
      await fs.access(outputPath)

      // Extract metadata with type safety
      const isVideo = 'duration' in info
      const result: DownloadResult = {
        filePath: outputPath,
        metadata: {
          title: info.title || 'Unknown',
          artist: 'channel' in info ? (info as { channel?: string }).channel : undefined,
          duration: isVideo ? (info as { duration: number }).duration : 0,
          thumbnail: 'thumbnail' in info ? (info as { thumbnail?: string }).thumbnail : undefined
        }
      }

      this.sendProgress({
        percentage: 100,
        downloadedBytes: 0,
        totalBytes: 0,
        status: 'complete'
      })

      this.sendComplete(result)
      return result
    } catch (error) {
      if (signal.aborted) {
        // Clean up partial file
        try {
          await fs.unlink(outputPath)
        } catch {
          // Partial file may not exist
        }
        this.sendError({ message: 'Download cancelled', code: 'CANCELLED' })
        throw new Error('Download cancelled')
      }
      const message = error instanceof Error ? error.message : 'Unknown download error'
      this.sendError({ message, code: 'DOWNLOAD_FAILED' })
      throw error
    } finally {
      this.currentDownload = null
    }
  }

  cancel(): void {
    if (this.currentDownload) {
      this.currentDownload.abort()
      this.currentDownload = null
      this.sendError({ message: 'Download cancelled', code: 'CANCELLED' })
    }
  }

  getAudioDir(): string {
    return this.audioDir
  }
}

// Singleton instance
export const youtubeService = new YouTubeService()
