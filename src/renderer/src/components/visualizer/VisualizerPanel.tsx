import { useState } from 'react'
import { SpectrumAnalyzer } from './SpectrumAnalyzer'
import { Oscilloscope } from './Oscilloscope'

type VisualizerMode = 'spectrum' | 'oscilloscope' | 'combined'
type ColorTheme = 'classic' | 'rainbow' | 'gradient'

export function VisualizerPanel(): React.JSX.Element {
  const [mode, setMode] = useState<VisualizerMode>('combined')
  const [colorTheme, setColorTheme] = useState<ColorTheme>('gradient')
  const [showPeaks, setShowPeaks] = useState(true)
  const [showGrid, setShowGrid] = useState(true)

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-daw-surface/50">
        {/* Mode selector */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode('spectrum')}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              mode === 'spectrum'
                ? 'bg-daw-highlight text-white'
                : 'bg-daw-accent/50 text-daw-muted hover:text-daw-text'
            }`}
          >
            Spectrum
          </button>
          <button
            onClick={() => setMode('oscilloscope')}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              mode === 'oscilloscope'
                ? 'bg-daw-highlight text-white'
                : 'bg-daw-accent/50 text-daw-muted hover:text-daw-text'
            }`}
          >
            Oscilloscope
          </button>
          <button
            onClick={() => setMode('combined')}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
              mode === 'combined'
                ? 'bg-daw-highlight text-white'
                : 'bg-daw-accent/50 text-daw-muted hover:text-daw-text'
            }`}
          >
            Combined
          </button>
        </div>

        {/* Settings */}
        <div className="flex items-center gap-3">
          {/* Color theme */}
          {(mode === 'spectrum' || mode === 'combined') && (
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-daw-muted">Theme:</span>
              <select
                value={colorTheme}
                onChange={(e) => setColorTheme(e.target.value as ColorTheme)}
                className="bg-daw-surface border border-daw-accent/40 text-[10px] text-daw-text px-1 py-0.5 rounded focus:outline-none"
              >
                <option value="gradient">DAW</option>
                <option value="classic">Classic</option>
                <option value="rainbow">Rainbow</option>
              </select>
            </div>
          )}

          {/* Toggle options */}
          <label className="flex items-center gap-1 text-[9px] text-daw-muted cursor-pointer">
            <input
              type="checkbox"
              checked={showPeaks}
              onChange={(e) => setShowPeaks(e.target.checked)}
              className="w-3 h-3 rounded bg-daw-surface border-daw-accent/40"
            />
            Peaks
          </label>
          <label className="flex items-center gap-1 text-[9px] text-daw-muted cursor-pointer">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="w-3 h-3 rounded bg-daw-surface border-daw-accent/40"
            />
            Grid
          </label>

          {/* Legend */}
          <div className="flex items-center gap-2 text-[9px] text-daw-muted border-l border-daw-accent/30 pl-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ff6b6b' }} />
              Bass
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4ecdc4' }} />
              Mid
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#45b7d1' }} />
              Treble
            </span>
          </div>
        </div>
      </div>

      {/* Visualization Area */}
      <div className="flex-1 p-2 bg-daw-bg overflow-hidden">
        {mode === 'spectrum' && (
          <SpectrumAnalyzer height={92} colorMode={colorTheme} showPeaks={showPeaks} />
        )}

        {mode === 'oscilloscope' && (
          <Oscilloscope
            height={92}
            lineColor="#e94560"
            lineWidth={2}
            showGrid={showGrid}
            showCenterLine={true}
          />
        )}

        {mode === 'combined' && (
          <div className="flex flex-col gap-1 h-full">
            <div className="flex-1">
              <SpectrumAnalyzer height={44} colorMode={colorTheme} showPeaks={showPeaks} />
            </div>
            <div className="flex-1">
              <Oscilloscope
                height={44}
                lineColor="#e94560"
                lineWidth={1.5}
                showGrid={showGrid}
                showCenterLine={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
