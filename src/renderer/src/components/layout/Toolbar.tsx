import { useTransportStore } from '../../store';
import { useAudioEngine } from '../../hooks';

interface ToolbarProps {
  onImportClick: () => void;
  onYouTubeClick: () => void;
  onSaveClick: () => void;
  onLoadClick: () => void;
  onExportClick: () => void;
  projectName?: string;
  isDirty?: boolean;
}

export function Toolbar({
  onImportClick,
  onYouTubeClick,
  onSaveClick,
  onLoadClick,
  onExportClick,
  projectName = 'Untitled Project',
  isDirty = false,
}: ToolbarProps): React.JSX.Element {
  const { currentTime, duration, bpm, setBpm } = useTransportStore();
  const { isPlaying, play, pause, stop } = useAudioEngine();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <header className="h-14 bg-daw-surface border-b border-daw-accent/30 flex items-center justify-between px-4 titlebar-drag">
      {/* Left: Logo, Project Name and File Menu */}
      <div className="flex items-center gap-4 titlebar-no-drag">
        <h1 className="text-xl font-bold text-daw-highlight">Muzikiii</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-daw-muted">|</span>
          <span className="text-sm text-daw-text max-w-[150px] truncate" title={projectName}>
            {projectName}
            {isDirty && <span className="text-daw-highlight ml-1">*</span>}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onLoadClick}
            className="px-3 py-1.5 text-sm text-daw-text hover:bg-daw-accent/50 rounded transition-colors"
            title="Open Project (Ctrl+O)"
          >
            Open
          </button>
          <button
            onClick={onSaveClick}
            className="px-3 py-1.5 text-sm text-daw-text hover:bg-daw-accent/50 rounded transition-colors"
            title="Save Project (Ctrl+S)"
          >
            Save
          </button>
          <button
            onClick={onExportClick}
            className="px-3 py-1.5 text-sm text-daw-text hover:bg-daw-accent/50 rounded transition-colors"
            title="Export Audio (Ctrl+E)"
          >
            Export
          </button>
        </div>
      </div>

      {/* Center: Transport Controls */}
      <div className="flex items-center gap-3 titlebar-no-drag">
        {/* Stop */}
        <button
          onClick={stop}
          className="w-10 h-10 flex items-center justify-center bg-daw-accent hover:bg-daw-accent/80 rounded-lg transition-colors"
          title="Stop"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={isPlaying ? pause : play}
          className="w-14 h-14 flex items-center justify-center bg-daw-highlight hover:bg-daw-highlight/80 rounded-full transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Time Display */}
        <div className="flex flex-col items-center min-w-[120px]">
          <div className="font-mono text-xl text-daw-text">
            {formatTime(currentTime)}
          </div>
          <div className="text-xs text-daw-muted">
            / {formatTime(duration)}
          </div>
        </div>

        {/* BPM */}
        <div className="flex items-center gap-2 ml-4">
          <span className="text-xs text-daw-muted">BPM</span>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-16 px-2 py-1 bg-daw-bg border border-daw-accent/30 rounded text-center text-sm focus:outline-none focus:border-daw-highlight"
            min={20}
            max={300}
          />
        </div>
      </div>

      {/* Right: Import Actions */}
      <div className="flex items-center gap-2 titlebar-no-drag">
        <button
          onClick={onImportClick}
          className="px-4 py-2 text-sm bg-daw-accent hover:bg-daw-accent/80 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import
        </button>
        <button
          onClick={onYouTubeClick}
          className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          YouTube
        </button>
      </div>
    </header>
  );
}
