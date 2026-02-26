import { app } from 'electron';
import path from 'path';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BinaryStatus {
  ytdlp: {
    available: boolean;
    version?: string;
    path?: string;
  };
  ffmpeg: {
    available: boolean;
    version?: string;
    path?: string;
  };
}

class BinaryService {
  private binDir: string;

  constructor() {
    this.binDir = path.join(app.getPath('userData'), 'bin');
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.binDir, { recursive: true });
      console.log('[Binary] Binary directory:', this.binDir);
    } catch (error) {
      console.error('[Binary] Failed to create binary directory:', error);
    }
  }

  async checkStatus(): Promise<BinaryStatus> {
    const [ytdlp, ffmpeg] = await Promise.all([
      this.checkYtDlp(),
      this.checkFfmpeg(),
    ]);

    return { ytdlp, ffmpeg };
  }

  private async checkYtDlp(): Promise<BinaryStatus['ytdlp']> {
    // First try system yt-dlp
    try {
      const { stdout } = await execAsync('yt-dlp --version');
      return {
        available: true,
        version: stdout.trim(),
        path: 'system',
      };
    } catch {
      // System yt-dlp not found
    }

    // Check local binary
    const localPath = this.getYtDlpPath();
    try {
      await fs.access(localPath);
      const { stdout } = await execAsync(`"${localPath}" --version`);
      return {
        available: true,
        version: stdout.trim(),
        path: localPath,
      };
    } catch {
      // Local binary not found
    }

    return { available: false };
  }

  private async checkFfmpeg(): Promise<BinaryStatus['ffmpeg']> {
    // First try system ffmpeg
    try {
      const { stdout } = await execAsync('ffmpeg -version');
      const versionMatch = stdout.match(/ffmpeg version (\S+)/);
      return {
        available: true,
        version: versionMatch?.[1] || 'unknown',
        path: 'system',
      };
    } catch {
      // System ffmpeg not found
    }

    // Check local binary
    const localPath = this.getFfmpegPath();
    try {
      await fs.access(localPath);
      const { stdout } = await execAsync(`"${localPath}" -version`);
      const versionMatch = stdout.match(/ffmpeg version (\S+)/);
      return {
        available: true,
        version: versionMatch?.[1] || 'unknown',
        path: localPath,
      };
    } catch {
      // Local binary not found
    }

    return { available: false };
  }

  getYtDlpPath(): string {
    const ext = process.platform === 'win32' ? '.exe' : '';
    return path.join(this.binDir, `yt-dlp${ext}`);
  }

  getFfmpegPath(): string {
    const ext = process.platform === 'win32' ? '.exe' : '';
    return path.join(this.binDir, `ffmpeg${ext}`);
  }

  getBinDir(): string {
    return this.binDir;
  }

  /**
   * Get download URLs for binaries based on platform
   */
  getDownloadUrls(): { ytdlp: string; ffmpeg: string } {
    const platform = process.platform;
    const arch = process.arch;

    let ytdlpUrl = '';
    let ffmpegUrl = '';

    if (platform === 'win32') {
      ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
      ffmpegUrl = arch === 'x64'
        ? 'https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip'
        : 'https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win32-gpl.zip';
    } else if (platform === 'darwin') {
      ytdlpUrl = arch === 'arm64'
        ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos'
        : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos_legacy';
      ffmpegUrl = 'https://evermeet.cx/ffmpeg/getrelease/zip';
    } else {
      // Linux
      ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
      ffmpegUrl = arch === 'x64'
        ? 'https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-linux64-gpl.tar.xz'
        : 'https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-linuxarm64-gpl.tar.xz';
    }

    return { ytdlp: ytdlpUrl, ffmpeg: ffmpegUrl };
  }

  /**
   * Instructions for manual installation
   */
  getInstallInstructions(): string {
    const platform = process.platform;

    if (platform === 'win32') {
      return `To enable YouTube downloads:
1. Install yt-dlp: winget install yt-dlp OR download from https://github.com/yt-dlp/yt-dlp/releases
2. Install FFmpeg: winget install ffmpeg OR download from https://ffmpeg.org/download.html
3. Restart Muzikiii`;
    } else if (platform === 'darwin') {
      return `To enable YouTube downloads:
1. Install Homebrew if not installed: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
2. Run: brew install yt-dlp ffmpeg
3. Restart Muzikiii`;
    } else {
      return `To enable YouTube downloads:
1. Run: sudo apt install yt-dlp ffmpeg (Debian/Ubuntu)
   OR: sudo dnf install yt-dlp ffmpeg (Fedora)
   OR: sudo pacman -S yt-dlp ffmpeg (Arch)
2. Restart Muzikiii`;
    }
  }
}

// Singleton instance
export const binaryService = new BinaryService();
