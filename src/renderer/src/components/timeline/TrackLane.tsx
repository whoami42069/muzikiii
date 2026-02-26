import type { Track } from '../../types';
import { WaveformDisplay } from './WaveformDisplay';

interface TrackLaneProps {
  track: Track;
  index: number;
  pixelsPerSecond: number;
  totalWidth: number;
}

export function TrackLane({
  track,
  index,
  pixelsPerSecond,
  totalWidth,
}: TrackLaneProps): React.JSX.Element {
  const trackWidth = track.metadata.duration * pixelsPerSecond;

  return (
    <div
      className={`
        h-20 border-b border-daw-accent/20 relative
        ${track.muted ? 'opacity-50' : ''}
        ${index % 2 === 0 ? 'bg-daw-bg' : 'bg-daw-surface/30'}
      `}
      style={{ width: totalWidth }}
    >
      {/* Track Content */}
      <div
        className="absolute top-1 bottom-1 rounded overflow-hidden"
        style={{
          left: 0,
          width: trackWidth,
          backgroundColor: `${track.color}20`,
          borderLeft: `3px solid ${track.color}`,
        }}
      >
        {/* Track Header */}
        <div
          className="h-5 px-2 flex items-center text-xs font-medium truncate"
          style={{ backgroundColor: `${track.color}40` }}
        >
          {track.metadata.title}
        </div>

        {/* Waveform Display - uses wavesurfer.js */}
        <div className="flex-1 relative h-[calc(100%-1.25rem)]">
          {track.metadata.filePath ? (
            <WaveformDisplay
              trackId={track.id}
              filePath={track.metadata.filePath}
              color={track.color}
              pixelsPerSecond={pixelsPerSecond}
              duration={track.metadata.duration}
            />
          ) : (
            <PlaceholderWaveform color={track.color} />
          )}
        </div>
      </div>

      {/* Solo/Mute indicators */}
      <div className="absolute top-1 right-2 flex items-center gap-1">
        {track.muted && (
          <span className="px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded">
            M
          </span>
        )}
        {track.solo && (
          <span className="px-1.5 py-0.5 text-[10px] bg-yellow-500 text-black rounded">
            S
          </span>
        )}
      </div>
    </div>
  );
}

// Placeholder waveform when no file is loaded
function PlaceholderWaveform({ color }: { color: string }): React.JSX.Element {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex gap-0.5">
        {Array.from({ length: 50 }).map((_, i) => {
          // Use deterministic pattern instead of Math.random()
          const height = 20 + Math.sin(i * 0.4) * 40 + Math.cos(i * 0.2) * 20;
          return (
            <div
              key={i}
              className="w-1 rounded-full"
              style={{
                height: `${height}%`,
                backgroundColor: `${color}60`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
