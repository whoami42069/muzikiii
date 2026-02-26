import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type DownloadStatus = 'idle' | 'validating' | 'downloading' | 'converting' | 'complete' | 'error';

interface VideoInfo {
  valid: boolean;
  title?: string;
  duration?: number;
  thumbnail?: string;
  channel?: string;
}

interface DownloadProgress {
  percentage: number;
  downloadedBytes: number;
  totalBytes: number;
  speed?: string;
  eta?: string;
  status?: string;
}

interface DownloadResult {
  filePath: string;
  metadata: {
    title: string;
    artist?: string;
    duration: number;
    thumbnail?: string;
  };
}

interface YouTubeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (filePath: string, metadata: DownloadResult['metadata']) => void;
}

export function YouTubeImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: YouTubeImportModalProps): React.JSX.Element | null {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'mp3' | 'wav' | 'flac'>('mp3');
  const [quality, setQuality] = useState<'best' | 'medium' | 'low'>('best');
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [instructions, setInstructions] = useState<string>('');

  // Check if YouTube download is available
  useEffect(() => {
    if (isOpen) {
      window.api.youtube.checkAvailable().then((result) => {
        setIsAvailable(result.available);
        if (!result.available && 'instructions' in result) {
          setInstructions(result.instructions as string);
        }
      });
    }
  }, [isOpen]);

  // Set up progress listener
  useEffect(() => {
    if (!isOpen) return;

    const unsubProgress = window.api.youtube.onProgress((data) => {
      setProgress(data);
      if (data.status === 'converting') {
        setStatus('converting');
      } else if (data.status === 'complete') {
        setStatus('complete');
      }
    });

    const unsubComplete = window.api.youtube.onComplete((data: DownloadResult) => {
      setStatus('complete');
      onImportComplete(data.filePath, data.metadata);
    });

    const unsubError = window.api.youtube.onError((data) => {
      setStatus('error');
      setError(data.message);
    });

    return () => {
      unsubProgress();
      unsubComplete();
      unsubError();
    };
  }, [isOpen, onImportComplete]);

  // Validate URL when it changes
  useEffect(() => {
    if (!url || url.length < 10) {
      setVideoInfo(null);
      return;
    }

    const timer = setTimeout(async () => {
      setStatus('validating');
      const info = await window.api.youtube.validateUrl(url);
      setVideoInfo(info);
      setStatus('idle');
    }, 500);

    return () => clearTimeout(timer);
  }, [url]);

  const handleDownload = useCallback(async () => {
    if (!url || !videoInfo?.valid) return;

    setStatus('downloading');
    setProgress(null);
    setError(null);

    try {
      await window.api.youtube.download({ url, outputFormat: format, quality });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  }, [url, format, quality, videoInfo]);

  const handleCancel = useCallback(async () => {
    await window.api.youtube.cancel();
    setStatus('idle');
    setProgress(null);
  }, []);

  const handleClose = useCallback(() => {
    if (status === 'downloading') {
      handleCancel();
    }
    setUrl('');
    setVideoInfo(null);
    setStatus('idle');
    setProgress(null);
    setError(null);
    onClose();
  }, [status, handleCancel, onClose]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  const isDownloading = status === 'downloading' || status === 'converting';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && !isDownloading && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-daw-surface rounded-xl w-full max-w-lg shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-daw-accent/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-daw-text">Import from YouTube</h2>
                <p className="text-xs text-daw-muted">Download audio from YouTube videos</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isDownloading}
              className="w-8 h-8 rounded-lg hover:bg-daw-accent/50 flex items-center justify-center text-daw-muted hover:text-daw-text transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Availability warning */}
            {isAvailable === false && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-sm text-yellow-400 font-medium mb-2">YouTube download not available</p>
                <pre className="text-xs text-daw-muted whitespace-pre-wrap">{instructions}</pre>
              </div>
            )}

            {/* URL Input */}
            <div>
              <label className="block text-sm text-daw-muted mb-2">YouTube URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={isDownloading || isAvailable === false}
                className="w-full px-4 py-3 bg-daw-bg border border-daw-accent/30 rounded-lg text-daw-text placeholder-daw-muted/50 focus:outline-none focus:border-daw-highlight disabled:opacity-50"
              />
            </div>

            {/* Video Preview */}
            {videoInfo?.valid && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 bg-daw-bg rounded-lg p-3"
              >
                {videoInfo.thumbnail && (
                  <img
                    src={videoInfo.thumbnail}
                    alt=""
                    className="w-24 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-daw-text font-medium truncate">{videoInfo.title}</p>
                  <p className="text-xs text-daw-muted">{videoInfo.channel}</p>
                  {videoInfo.duration && (
                    <p className="text-xs text-daw-muted mt-1">
                      Duration: {formatDuration(videoInfo.duration)}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Validation status */}
            {status === 'validating' && (
              <div className="flex items-center gap-2 text-daw-muted text-sm">
                <div className="w-4 h-4 border-2 border-daw-accent border-t-daw-highlight rounded-full animate-spin" />
                Validating URL...
              </div>
            )}

            {/* Format & Quality */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-daw-muted mb-2">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'mp3' | 'wav' | 'flac')}
                  disabled={isDownloading}
                  className="w-full px-3 py-2 bg-daw-bg border border-daw-accent/30 rounded-lg text-daw-text focus:outline-none focus:border-daw-highlight disabled:opacity-50"
                >
                  <option value="mp3">MP3 (Compressed)</option>
                  <option value="wav">WAV (Lossless)</option>
                  <option value="flac">FLAC (Lossless)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-daw-muted mb-2">Quality</label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as 'best' | 'medium' | 'low')}
                  disabled={isDownloading}
                  className="w-full px-3 py-2 bg-daw-bg border border-daw-accent/30 rounded-lg text-daw-text focus:outline-none focus:border-daw-highlight disabled:opacity-50"
                >
                  <option value="best">Best</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Progress */}
            {isDownloading && progress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-daw-muted">
                    {status === 'converting' ? 'Converting...' : 'Downloading...'}
                  </span>
                  <span className="text-daw-text">{Math.round(progress.percentage)}%</span>
                </div>
                <div className="h-2 bg-daw-bg rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-500 to-red-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-daw-muted">
                  <span>
                    {progress.downloadedBytes > 0 && formatBytes(progress.downloadedBytes)}
                    {progress.totalBytes > 0 && ` / ${formatBytes(progress.totalBytes)}`}
                  </span>
                  <span>
                    {progress.speed && `${progress.speed}`}
                    {progress.eta && ` - ETA: ${progress.eta}`}
                  </span>
                </div>
              </div>
            )}

            {/* Success */}
            {status === 'complete' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg p-3"
              >
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-green-400 font-medium">Download complete!</p>
                  <p className="text-xs text-daw-muted">Audio has been added to your project</p>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {status === 'error' && error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-500/10 border border-red-500/30 rounded-lg p-3"
              >
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-daw-accent/30">
            {isDownloading ? (
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
              >
                Cancel
              </button>
            ) : (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-daw-muted hover:text-daw-text transition-colors"
                >
                  {status === 'complete' ? 'Close' : 'Cancel'}
                </button>
                {status !== 'complete' && (
                  <button
                    onClick={handleDownload}
                    disabled={!videoInfo?.valid || isAvailable === false}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Download
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
