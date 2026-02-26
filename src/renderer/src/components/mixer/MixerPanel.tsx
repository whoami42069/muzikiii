import { useTracksStore } from '../../store';
import { ChannelStrip } from './ChannelStrip';
import { MasterChannel } from './MasterChannel';

interface MixerPanelProps {
  onTrackSelect?: (trackId: string) => void;
}

export function MixerPanel({ onTrackSelect }: MixerPanelProps): React.JSX.Element {
  const { tracks, selectedTrackId, selectTrack } = useTracksStore();

  const handleTrackSelect = (trackId: string) => {
    selectTrack(trackId);
    onTrackSelect?.(trackId);
  };

  return (
    <div className="h-full flex flex-col bg-daw-bg">
      {/* Header */}
      <div className="h-8 bg-daw-surface border-b border-daw-accent/30 flex items-center justify-between px-4">
        <span className="text-xs font-medium text-daw-text">Mixer</span>
        <span className="text-xs text-daw-muted">{tracks.length} channels</span>
      </div>

      {/* Mixer Content */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full p-3 gap-2 min-w-min">
          {/* Track Channel Strips */}
          {tracks.length === 0 ? (
            <div className="flex items-center justify-center flex-1 text-daw-muted">
              <div className="text-center">
                <div className="text-3xl mb-2">🎚️</div>
                <p className="text-sm">No tracks</p>
                <p className="text-xs text-daw-muted/70">Import audio to see channels</p>
              </div>
            </div>
          ) : (
            <>
              {tracks.map((track) => (
                <ChannelStrip
                  key={track.id}
                  track={track}
                  isSelected={track.id === selectedTrackId}
                  onSelect={() => handleTrackSelect(track.id)}
                />
              ))}

              {/* Separator */}
              <div className="w-px bg-daw-accent/30 mx-2 self-stretch" />

              {/* Master Channel */}
              <MasterChannel />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
