import { TrackList } from '../tracks';

interface SidebarProps {
  onTrackSelect?: (trackId: string) => void;
}

export function Sidebar({ onTrackSelect }: SidebarProps): React.JSX.Element {
  return (
    <aside className="w-64 bg-daw-surface border-r border-daw-accent/30 flex flex-col">
      <TrackList onTrackSelect={onTrackSelect} />
    </aside>
  );
}
