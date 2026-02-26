import { useCallback, useState } from 'react';
import type { Track } from '../../types';
import { useAudioEngine } from '../../hooks';
import { useTracksStore } from '../../store';

interface TrackControlsProps {
  track: Track;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export function TrackControls({
  track,
  isSelected,
  onSelect,
  onRemove,
}: TrackControlsProps): React.JSX.Element {
  const { toggleMute, toggleSolo, setVolume, setPan } = useTracksStore();
  const { setTrackVolume, setTrackPan, setTrackMute, setTrackSolo } = useAudioEngine();
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle volume change - update both store and audio engine
  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      setVolume(track.id, newVolume);
      setTrackVolume(track.id, newVolume);
    },
    [track.id, setVolume, setTrackVolume]
  );

  // Handle pan change
  const handlePanChange = useCallback(
    (newPan: number) => {
      setPan(track.id, newPan);
      setTrackPan(track.id, newPan);
    },
    [track.id, setPan, setTrackPan]
  );

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    toggleMute(track.id);
    setTrackMute(track.id, !track.muted);
  }, [track.id, track.muted, toggleMute, setTrackMute]);

  // Handle solo toggle
  const handleSoloToggle = useCallback(() => {
    toggleSolo(track.id);
    setTrackSolo(track.id, !track.solo);
  }, [track.id, track.solo, toggleSolo, setTrackSolo]);

  // Format volume as dB
  const volumeDb = track.volume > 0 ? (20 * Math.log10(track.volume)).toFixed(1) : '-∞';

  return (
    <div
      className={`
        rounded-lg transition-all overflow-hidden
        ${isSelected ? 'bg-daw-accent ring-1 ring-daw-highlight' : 'bg-daw-surface hover:bg-daw-accent/50'}
      `}
    >
      {/* Main Track Row */}
      <div
        onClick={onSelect}
        className="p-2 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {/* Color indicator & expand button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-daw-bg/50 transition-colors"
          >
            <div
              className="w-2 h-6 rounded-full"
              style={{ backgroundColor: track.color }}
            />
          </button>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{track.metadata.title}</span>
              {/* Loading indicator */}
              {!track.isLoaded && (
                <div className="w-3 h-3 border-2 border-daw-muted border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <div className="text-xs text-daw-muted">
              {formatDuration(track.metadata.duration)}
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMuteToggle();
              }}
              className={`
                w-6 h-6 text-xs font-bold rounded transition-colors
                ${track.muted ? 'bg-red-500 text-white' : 'bg-daw-bg text-daw-muted hover:text-daw-text'}
              `}
              title="Mute (M)"
            >
              M
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSoloToggle();
              }}
              className={`
                w-6 h-6 text-xs font-bold rounded transition-colors
                ${track.solo ? 'bg-yellow-500 text-black' : 'bg-daw-bg text-daw-muted hover:text-daw-text'}
              `}
              title="Solo (S)"
            >
              S
            </button>
          </div>
        </div>

        {/* Inline Volume Bar */}
        <div className="mt-2 flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={track.volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 h-1 bg-daw-bg rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-3
                       [&::-webkit-slider-thumb]:h-3
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-daw-highlight"
            style={{
              background: `linear-gradient(to right, ${track.color} ${track.volume * 100}%, var(--daw-bg) ${track.volume * 100}%)`,
            }}
          />
          <span className="text-xs text-daw-muted w-12 text-right">{volumeDb} dB</span>
        </div>
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-daw-accent/30 space-y-3">
          {/* Pan Control */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-daw-muted">Pan</span>
              <span className="text-xs text-daw-muted">
                {track.pan === 0 ? 'C' : track.pan < 0 ? `L${Math.abs(Math.round(track.pan * 100))}` : `R${Math.round(track.pan * 100)}`}
              </span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={track.pan}
              onChange={(e) => handlePanChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-daw-bg rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-3
                         [&::-webkit-slider-thumb]:h-3
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-daw-highlight"
            />
            <div className="flex justify-between text-[10px] text-daw-muted/50 mt-0.5">
              <span>L</span>
              <span>C</span>
              <span>R</span>
            </div>
          </div>

          {/* Track Info */}
          <div className="text-xs text-daw-muted space-y-1">
            <div className="flex justify-between">
              <span>Source:</span>
              <span className="text-daw-text">{track.metadata.source}</span>
            </div>
            <div className="flex justify-between">
              <span>Sample Rate:</span>
              <span className="text-daw-text">{track.metadata.sampleRate} Hz</span>
            </div>
            <div className="flex justify-between">
              <span>Channels:</span>
              <span className="text-daw-text">{track.metadata.channels === 2 ? 'Stereo' : 'Mono'}</span>
            </div>
          </div>

          {/* Remove Button */}
          <button
            onClick={onRemove}
            className="w-full py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
          >
            Remove Track
          </button>
        </div>
      )}
    </div>
  );
}

// Format duration in MM:SS
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
