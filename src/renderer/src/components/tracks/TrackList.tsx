import { useState } from 'react';
import { useTracksStore } from '../../store';
import { useAudioEngine } from '../../hooks';
import { TrackControls } from './TrackControls';

interface TrackListProps {
  onTrackSelect?: (trackId: string) => void;
}

export function TrackList({ onTrackSelect }: TrackListProps): React.JSX.Element {
  const { tracks, selectedTrackId, selectTrack, removeTrack } = useTracksStore();

  const handleTrackSelect = (trackId: string) => {
    selectTrack(trackId);
    onTrackSelect?.(trackId);
  };

  const handleTrackRemove = (trackId: string) => {
    // The useAudioEngine hook will automatically unload the track
    // when it's removed from the store
    removeTrack(trackId);
  };

  // Calculate totals
  const totalDuration = tracks.reduce((sum, t) => sum + t.metadata.duration, 0);
  const loadedCount = tracks.filter((t) => t.isLoaded).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-daw-accent/30">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-daw-text">
            Tracks
          </h2>
          <span className="text-xs text-daw-muted">
            {tracks.length} track{tracks.length !== 1 ? 's' : ''}
          </span>
        </div>
        {tracks.length > 0 && (
          <div className="text-xs text-daw-muted mt-1">
            {loadedCount}/{tracks.length} loaded · {formatTotalDuration(totalDuration)}
          </div>
        )}
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {tracks.length === 0 ? (
          <EmptyTrackList />
        ) : (
          tracks.map((track) => (
            <TrackControls
              key={track.id}
              track={track}
              isSelected={track.id === selectedTrackId}
              onSelect={() => handleTrackSelect(track.id)}
              onRemove={() => handleTrackRemove(track.id)}
            />
          ))
        )}
      </div>

      {/* Footer with Master Volume */}
      {tracks.length > 0 && (
        <div className="p-3 border-t border-daw-accent/30">
          <MasterVolumeControl />
        </div>
      )}
    </div>
  );
}

function EmptyTrackList(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="text-4xl mb-3 opacity-50">🎵</div>
      <p className="text-sm text-daw-muted mb-2">No tracks yet</p>
      <p className="text-xs text-daw-muted/70">
        Import audio files or paste a YouTube URL to get started
      </p>
    </div>
  );
}

function MasterVolumeControl(): React.JSX.Element {
  const { setMasterVolume } = useAudioEngine();
  const [volume, setVolume] = useState(0.8);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setMasterVolume(newVolume);
  };

  const volumeDb = volume > 0 ? (20 * Math.log10(volume)).toFixed(1) : '-∞';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-daw-text">Master</span>
        <span className="text-xs text-daw-muted">{volumeDb} dB</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-daw-bg rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-4
                   [&::-webkit-slider-thumb]:h-4
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-daw-highlight
                   [&::-webkit-slider-thumb]:shadow-md"
        style={{
          background: `linear-gradient(to right, #4ecdc4 ${volume * 100}%, var(--daw-bg) ${volume * 100}%)`,
        }}
      />
    </div>
  );
}

function formatTotalDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
