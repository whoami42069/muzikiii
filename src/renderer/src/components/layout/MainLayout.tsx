import { useState } from 'react'
import { Toolbar } from './Toolbar'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'

interface MainLayoutProps {
  children: React.ReactNode
  effectsPanel: React.ReactNode
  visualizerPanel: React.ReactNode
  mixerPanel: React.ReactNode
  onImportClick: () => void
  onYouTubeClick: () => void
  onSaveClick: () => void
  onLoadClick: () => void
  onExportClick: () => void
  projectName?: string
  isDirty?: boolean
}

type BottomPanelView = 'visualizer' | 'mixer' | 'none'

export function MainLayout({
  children,
  effectsPanel,
  visualizerPanel,
  mixerPanel,
  onImportClick,
  onYouTubeClick,
  onSaveClick,
  onLoadClick,
  onExportClick,
  projectName = 'Untitled Project',
  isDirty = false
}: MainLayoutProps): React.JSX.Element {
  const [showEffects, setShowEffects] = useState(true)
  const [bottomPanel, setBottomPanel] = useState<BottomPanelView>('visualizer')
  const [status, setStatus] = useState('Ready')

  const handleTrackSelect = (trackId: string): void => {
    console.log('Selected track:', trackId)
    setStatus(`Selected: Track ${trackId.slice(-4)}`)
    setTimeout(() => setStatus('Ready'), 2000)
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-daw-bg text-daw-text overflow-hidden">
      {/* Toolbar */}
      <Toolbar
        onImportClick={onImportClick}
        onYouTubeClick={onYouTubeClick}
        onSaveClick={onSaveClick}
        onLoadClick={onLoadClick}
        onExportClick={onExportClick}
        projectName={projectName}
        isDirty={isDirty}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar onTrackSelect={handleTrackSelect} />

        {/* Center: Timeline + Visualizer */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Timeline Area */}
          <div className="flex-1 overflow-auto">{children}</div>

          {/* Bottom Panel (Visualizer or Mixer) */}
          {bottomPanel !== 'none' && (
            <div
              className={`bg-daw-surface border-t border-daw-accent/30 relative ${
                bottomPanel === 'mixer' ? 'h-52' : 'h-32'
              }`}
            >
              {/* Panel Tabs */}
              <div className="absolute top-0 left-0 flex gap-1 p-1 z-10">
                <button
                  onClick={() => setBottomPanel('visualizer')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                    bottomPanel === 'visualizer'
                      ? 'bg-daw-highlight text-white'
                      : 'bg-daw-accent/50 text-daw-muted hover:text-daw-text'
                  }`}
                >
                  Visualizer
                </button>
                <button
                  onClick={() => setBottomPanel('mixer')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                    bottomPanel === 'mixer'
                      ? 'bg-daw-highlight text-white'
                      : 'bg-daw-accent/50 text-daw-muted hover:text-daw-text'
                  }`}
                >
                  Mixer
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setBottomPanel('none')}
                className="absolute top-1 right-2 text-daw-muted hover:text-daw-text text-xs z-10"
                title="Hide panel"
              >
                ▼
              </button>

              {/* Panel Content */}
              {bottomPanel === 'visualizer' && visualizerPanel}
              {bottomPanel === 'mixer' && mixerPanel}
            </div>
          )}

          {/* Show panel button when hidden */}
          {bottomPanel === 'none' && (
            <div className="h-6 bg-daw-surface border-t border-daw-accent/30 flex items-center justify-center gap-2">
              <button
                onClick={() => setBottomPanel('visualizer')}
                className="text-xs text-daw-muted hover:text-daw-text"
              >
                ▲ Visualizer
              </button>
              <span className="text-daw-accent/50">|</span>
              <button
                onClick={() => setBottomPanel('mixer')}
                className="text-xs text-daw-muted hover:text-daw-text"
              >
                ▲ Mixer
              </button>
            </div>
          )}
        </main>

        {/* Effects Panel (collapsible) */}
        {showEffects && (
          <aside className="w-80 bg-daw-surface border-l border-daw-accent/30 relative">
            <button
              onClick={() => setShowEffects(false)}
              className="absolute top-2 right-2 text-daw-muted hover:text-daw-text text-xs"
              title="Hide effects"
            >
              ▶
            </button>
            {effectsPanel}
          </aside>
        )}

        {/* Show effects button when hidden */}
        {!showEffects && (
          <button
            onClick={() => setShowEffects(true)}
            className="w-6 bg-daw-surface border-l border-daw-accent/30 flex items-center justify-center text-daw-muted hover:text-daw-text"
            title="Show effects"
          >
            <span className="transform -rotate-90 text-xs whitespace-nowrap">◀ Effects</span>
          </button>
        )}
      </div>

      {/* Status Bar */}
      <StatusBar status={status} />
    </div>
  )
}
