import { ipcMain, BrowserWindow } from 'electron';
import { youtubeService } from '../services/youtube.service';
import { binaryService } from '../services/binary.service';

interface DownloadRequest {
  url: string;
  outputFormat: 'mp3' | 'wav' | 'flac';
  quality?: 'best' | 'medium' | 'low';
}

/**
 * Register YouTube download IPC handlers
 */
export function registerYouTubeHandlers(mainWindow: BrowserWindow): void {
  // Initialize services
  youtubeService.setMainWindow(mainWindow);
  youtubeService.initialize();
  binaryService.initialize();

  // Start download
  ipcMain.handle('youtube:download', async (_, request: DownloadRequest) => {
    try {
      const result = await youtubeService.download({
        url: request.url,
        outputFormat: request.outputFormat,
        quality: request.quality,
      });

      return { success: true, filePath: result.filePath, metadata: result.metadata };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[YouTube] Download error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  });

  // Cancel download
  ipcMain.handle('youtube:cancel', async () => {
    youtubeService.cancel();
    return { success: true };
  });

  // Check if ytdlp is available
  ipcMain.handle('youtube:check-available', async () => {
    const available = await youtubeService.isAvailable();

    if (!available) {
      // Also check for system binaries
      const status = await binaryService.checkStatus();
      return {
        available: status.ytdlp.available && status.ffmpeg.available,
        ytdlp: status.ytdlp,
        ffmpeg: status.ffmpeg,
        instructions: binaryService.getInstallInstructions(),
      };
    }

    return { available: true };
  });

  // Validate YouTube URL and get video info
  ipcMain.handle('youtube:validate-url', async (_, url: string) => {
    const info = await youtubeService.validateUrl(url);
    return info;
  });

  // Get binary status
  ipcMain.handle('youtube:binary-status', async () => {
    const status = await binaryService.checkStatus();
    return {
      ...status,
      instructions: binaryService.getInstallInstructions(),
    };
  });

  // Get audio directory
  ipcMain.handle('youtube:get-audio-dir', async () => {
    return youtubeService.getAudioDir();
  });

  console.log('[IPC] YouTube handlers registered');
}
