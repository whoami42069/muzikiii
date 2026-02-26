import { useRef, useState, useEffect, useCallback } from 'react';
import { useTracksStore, useTransportStore } from '../../store';
import { useAudioEngine, waveformRegistry } from '../../hooks';
import { TrackLane } from './TrackLane';
import { TimelineRuler } from './TimelineRuler';
import { Playhead } from './Playhead';

interface TimelineProps {
  onDropFiles?: (files: FileList) => void;
}

// Zoom presets for quick selection
const ZOOM_PRESETS = [
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: '100%', value: 1 },
  { label: '200%', value: 2 },
  { label: '400%', value: 4 },
];

// Format time in MM:SS.ms format
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}

export function Timeline({ onDropFiles }: TimelineProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const { tracks } = useTracksStore();
  const { currentTime, duration, isPlaying } = useTransportStore();
  const { seek } = useAudioEngine();
  const [zoom, setZoom] = useState(1); // zoom multiplier
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const pixelsPerSecond = 50 * zoom;
  const totalWidth = Math.max(duration * pixelsPerSecond, 1000);

  // Update waveform registry when zoom changes
  useEffect(() => {
    waveformRegistry.zoomAll(pixelsPerSecond);
  }, [pixelsPerSecond]);

  // Auto-scroll to follow playhead during playback
  useEffect(() => {
    if (!isPlaying || !containerRef.current) return;

    const container = containerRef.current;
    const playheadPosition = currentTime * pixelsPerSecond;
    const viewportWidth = container.clientWidth;
    const currentScroll = container.scrollLeft;

    // If playhead is outside the visible area, scroll to keep it in view
    if (playheadPosition < currentScroll || playheadPosition > currentScroll + viewportWidth - 100) {
      container.scrollLeft = Math.max(0, playheadPosition - viewportWidth / 4);
    }
  }, [currentTime, pixelsPerSecond, isPlaying]);

  // Keyboard shortcuts for zoom (when timeline is focused)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;

    if (e.key === '=' || e.key === '+') {
      e.preventDefault();
      setZoom((z) => Math.min(z * 1.5, 10));
    } else if (e.key === '-') {
      e.preventDefault();
      setZoom((z) => Math.max(z / 1.5, 0.1));
    } else if (e.key === '0') {
      e.preventDefault();
      setZoom(1); // Reset to 100%
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const time = x / pixelsPerSecond;
    seek(Math.max(0, Math.min(time, duration)));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0 && onDropFiles) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.5, 10));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.5, 0.1));

  return (
    <div className="h-full flex flex-col bg-daw-bg">
      {/* Zoom Controls */}
      <div className="h-8 bg-daw-surface border-b border-daw-accent/30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-daw-muted">Timeline</span>
          <span className="text-xs text-daw-text/50">|</span>
          <span className="text-xs text-daw-muted">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="w-6 h-6 flex items-center justify-center text-sm bg-daw-accent hover:bg-daw-accent/80 rounded"
            title="Zoom out (-)"
          >
            −
          </button>

          {/* Zoom preset dropdown */}
          <select
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="bg-daw-surface border border-daw-accent/40 text-xs text-daw-text px-1 py-0.5 rounded focus:outline-none focus:border-daw-highlight"
            title="Zoom level"
          >
            {ZOOM_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleZoomIn}
            className="w-6 h-6 flex items-center justify-center text-sm bg-daw-accent hover:bg-daw-accent/80 rounded"
            title="Zoom in (+)"
          >
            +
          </button>

          <button
            onClick={() => setZoom(1)}
            className="px-2 py-1 text-xs bg-daw-accent/50 hover:bg-daw-accent/80 rounded"
            title="Reset zoom (0)"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Timeline Content */}
      <div
        ref={containerRef}
        className={`
          flex-1 overflow-auto relative
          ${isDragging ? 'bg-daw-accent/20' : ''}
        `}
        onScroll={handleScroll}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div style={{ width: totalWidth, minHeight: '100%' }}>
          {/* Ruler */}
          <TimelineRuler
            duration={duration}
            pixelsPerSecond={pixelsPerSecond}
            onClick={handleTimelineClick}
          />

          {/* Track Lanes */}
          <div className="relative">
            {tracks.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-daw-muted">
                <div className="text-center p-8">
                  <div className="text-5xl mb-4">🎵</div>
                  <p className="text-lg mb-2">Drop audio files here</p>
                  <p className="text-sm">or use Import / YouTube buttons</p>
                </div>
              </div>
            ) : (
              tracks.map((track, index) => (
                <TrackLane
                  key={track.id}
                  track={track}
                  index={index}
                  pixelsPerSecond={pixelsPerSecond}
                  totalWidth={totalWidth}
                />
              ))
            )}
          </div>

          {/* Playhead */}
          <Playhead
            currentTime={currentTime}
            pixelsPerSecond={pixelsPerSecond}
          />
        </div>

        {/* Drop overlay */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-daw-highlight/20 border-2 border-dashed border-daw-highlight pointer-events-none">
            <span className="text-xl text-daw-highlight font-semibold">
              Drop audio files here
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
