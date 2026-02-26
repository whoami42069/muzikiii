import { useTransportStore, useTracksStore } from '../../store';

interface StatusBarProps {
  status?: string;
}

export function StatusBar({ status = 'Ready' }: StatusBarProps): React.JSX.Element {
  const { isPlaying, bpm } = useTransportStore();
  const { tracks } = useTracksStore();

  const activeTracks = tracks.filter((t) => !t.muted).length;

  return (
    <footer className="h-6 bg-daw-surface border-t border-daw-accent/30 flex items-center justify-between px-4 text-xs text-daw-muted">
      {/* Left: Status */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <span
            className={`w-2 h-2 rounded-full ${
              isPlaying ? 'bg-green-500 animate-pulse' : 'bg-daw-muted'
            }`}
          />
          {status}
        </span>
      </div>

      {/* Center: Info */}
      <div className="flex items-center gap-4">
        <span>{tracks.length} track{tracks.length !== 1 ? 's' : ''}</span>
        <span>•</span>
        <span>{activeTracks} active</span>
        <span>•</span>
        <span>{bpm} BPM</span>
      </div>

      {/* Right: Version */}
      <div className="flex items-center gap-4">
        <span>Sample Rate: 44.1kHz</span>
        <span>•</span>
        <span>Muzikiii v1.0.0</span>
      </div>
    </footer>
  );
}
