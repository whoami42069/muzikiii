import { useState } from 'react';
import { useTracksStore, useTransportStore } from '../../store';
import { notify } from '../../store/notificationStore';
import * as Tone from 'tone';
import { gainToDb } from 'tone';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = 'wav' | 'mp3';

interface ExportOptions {
  format: ExportFormat;
  quality: 'high' | 'medium' | 'low';
  normalize: boolean;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps): React.JSX.Element | null {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'wav',
    quality: 'high',
    normalize: true,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const { tracks } = useTracksStore();
  const { duration } = useTransportStore();

  if (!isOpen) return null;

  const getSampleRate = () => {
    switch (options.quality) {
      case 'high':
        return 48000;
      case 'medium':
        return 44100;
      case 'low':
        return 22050;
    }
  };

  const handleExport = async () => {
    if (tracks.length === 0) {
      notify.warning('No tracks to export');
      return;
    }

    setIsExporting(true);
    setProgress(0);

    try {
      // Get export path from user
      const result = await window.api.file.exportAudio({
        defaultName: 'export',
        format: options.format,
      });

      if (!result?.success || !result?.filePath) {
        if (!result?.canceled) {
          notify.error('Failed to select export location');
        }
        setIsExporting(false);
        return;
      }

      const exportPath = result.filePath;
      setProgress(10);

      // Use Tone.Offline to render audio
      const sampleRate = getSampleRate();
      const exportDuration = Math.max(duration, 1);

      notify.info(`Rendering audio (${exportDuration.toFixed(1)}s at ${sampleRate}Hz)...`);

      // Track resources for cleanup
      const playersToDispose: Tone.Player[] = [];
      const channelsToDispose: Tone.Channel[] = [];

      try {
        // Create offline context and render
        const renderedBuffer = await Tone.Offline(
          async ({ transport }) => {
            for (const track of tracks) {
              if (track.muted) continue;

              try {
                const player = new Tone.Player(track.metadata.filePath);
                const channel = new Tone.Channel({
                  volume: gainToDb(track.volume),
                  pan: track.pan,
                });

                // Wait for player to load
                await player.load(track.metadata.filePath);

                player.connect(channel);
                channel.toDestination();

                // Sync player with transport
                player.sync().start(0);

                playersToDispose.push(player);
                channelsToDispose.push(channel);
              } catch (err) {
                console.warn(`Failed to load track ${track.metadata.title}:`, err);
              }
            }

            // Start transport
            transport.start(0);
          },
          exportDuration,
          2, // channels
          sampleRate
        );

      setProgress(70);

      // Convert ToneAudioBuffer to standard AudioBuffer
      const audioBuffer = renderedBuffer.get();
      if (!audioBuffer) {
        throw new Error('Failed to get audio buffer');
      }

      // Convert to WAV
      const wavBuffer = audioBufferToWav(audioBuffer);
      setProgress(90);

      // Notify user of export path
      notify.success(`Audio exported to: ${exportPath}`);

      // Create a download link
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportPath.split(/[/\\]/).pop() || 'export.wav';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

        setProgress(100);
        setTimeout(() => {
          onClose();
          setIsExporting(false);
          setProgress(0);
        }, 500);
      } finally {
        // Cleanup Tone.js resources
        playersToDispose.forEach((p) => p.dispose());
        channelsToDispose.forEach((c) => c.dispose());
      }
    } catch (error) {
      console.error('Export error:', error);
      notify.error(`Export failed: ${error}`);
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-daw-surface border border-daw-accent/40 rounded-lg w-[400px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-daw-accent/30">
          <h2 className="text-lg font-semibold text-daw-text">Export Audio</h2>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="text-daw-muted hover:text-daw-text disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Format */}
          <div>
            <label className="block text-sm text-daw-muted mb-2">Format</label>
            <div className="flex gap-2">
              {(['wav', 'mp3'] as ExportFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => setOptions({ ...options, format })}
                  disabled={isExporting}
                  className={`px-4 py-2 rounded text-sm uppercase transition-colors ${
                    options.format === format
                      ? 'bg-daw-highlight text-white'
                      : 'bg-daw-accent/50 text-daw-muted hover:text-daw-text'
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div>
            <label className="block text-sm text-daw-muted mb-2">Quality</label>
            <select
              value={options.quality}
              onChange={(e) => setOptions({ ...options, quality: e.target.value as ExportOptions['quality'] })}
              disabled={isExporting}
              className="w-full bg-daw-bg border border-daw-accent/40 rounded px-3 py-2 text-daw-text focus:outline-none focus:border-daw-highlight"
            >
              <option value="high">High (48kHz)</option>
              <option value="medium">Medium (44.1kHz)</option>
              <option value="low">Low (22kHz)</option>
            </select>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.normalize}
                onChange={(e) => setOptions({ ...options, normalize: e.target.checked })}
                disabled={isExporting}
                className="w-4 h-4 rounded bg-daw-bg border-daw-accent/40"
              />
              <span className="text-sm text-daw-text">Normalize audio</span>
            </label>
          </div>

          {/* Info */}
          <div className="bg-daw-bg rounded p-3 text-xs text-daw-muted">
            <div className="flex justify-between">
              <span>Tracks:</span>
              <span>{tracks.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Duration:</span>
              <span>{duration.toFixed(1)}s</span>
            </div>
            <div className="flex justify-between">
              <span>Sample Rate:</span>
              <span>{getSampleRate()} Hz</span>
            </div>
          </div>

          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-daw-muted">
                <span>Exporting...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-daw-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-daw-highlight transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-daw-accent/30">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-sm text-daw-muted hover:text-daw-text transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || tracks.length === 0}
            className="px-4 py-2 text-sm bg-daw-highlight hover:bg-daw-highlight/80 text-white rounded transition-colors disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Convert AudioBuffer to WAV format
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Interleave channels and write samples
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
