import { useState, useCallback } from 'react'
import { MainLayout } from './components/layout'
import { Timeline } from './components/timeline'
import { EffectsPanel } from './components/effects'
import { VisualizerPanel } from './components/visualizer'
import { MixerPanel } from './components/mixer'
import { YouTubeImportModal } from './components/import'
import { NotificationToast, ExportModal } from './components/common'
import { useTracksStore, useTransportStore, notify } from './store'
import { useKeyboardShortcuts, useProject } from './hooks'

function App(): React.JSX.Element {
  const [showYouTubeModal, setShowYouTubeModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const { addTrack } = useTracksStore()
  const { setDuration } = useTransportStore()
  const { saveProject, openProject, newProject, isDirty, projectName } = useProject()

  // Handle save
  const handleSave = useCallback(async () => {
    const result = await saveProject()
    if (result.success) {
      notify.success('Project saved')
    } else if (result.error !== 'Canceled') {
      notify.error(`Save failed: ${result.error}`)
    }
  }, [saveProject])

  // Handle open
  const handleOpen = useCallback(async () => {
    if (isDirty) {
      // Could show confirmation dialog here
    }
    const result = await openProject()
    if (result.success) {
      notify.success('Project loaded')
    } else if (result.error !== 'Canceled') {
      notify.error(`Load failed: ${result.error}`)
    }
  }, [openProject, isDirty])

  // Handle new project
  const handleNew = useCallback(() => {
    if (isDirty) {
      // Could show confirmation dialog here
    }
    newProject()
    notify.info('New project created')
  }, [newProject, isDirty])

  // Handle export
  const handleExport = useCallback(() => {
    setShowExportModal(true)
  }, [])

  // Enable keyboard shortcuts
  useKeyboardShortcuts({
    onSave: handleSave,
    onOpen: handleOpen,
    onNew: handleNew,
    onExport: handleExport,
    onUndo: () => notify.info('Undo not yet implemented'),
    onRedo: () => notify.info('Redo not yet implemented')
  })

  const handleImportClick = async (): Promise<void> => {
    try {
      const result = await window.api.file.importAudio()
      if (result?.success && result?.filePaths) {
        // Add each imported file as a track
        for (const filePath of result.filePaths) {
          const fileName = filePath.split(/[/\\]/).pop() || 'Untitled'
          addTrack({
            title: fileName.replace(/\.[^.]+$/, ''), // Remove extension
            duration: 180, // Will be updated when audio loads
            sampleRate: 44100,
            channels: 2,
            source: 'local',
            filePath,
            addedAt: Date.now()
          })
        }
        // Update duration to longest track
        setDuration(180)
      }
    } catch (error) {
      console.error('Import error:', error)
    }
  }

  const handleYouTubeClick = (): void => {
    setShowYouTubeModal(true)
  }

  const handleYouTubeImportComplete = useCallback(
    (filePath: string, metadata: { title: string; artist?: string; duration: number }) => {
      addTrack({
        title: metadata.title,
        duration: metadata.duration || 180,
        sampleRate: 44100,
        channels: 2,
        source: 'youtube',
        filePath,
        addedAt: Date.now()
      })
      setDuration(Math.max(metadata.duration || 180, 60))
    },
    [addTrack, setDuration]
  )

  const handleDropFiles = async (files: FileList): Promise<void> => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('audio/')) {
        // Electron adds path property to File objects
        const filePath = (file as File & { path?: string }).path || file.name
        addTrack({
          title: file.name.replace(/\.[^.]+$/, ''),
          duration: 180,
          sampleRate: 44100,
          channels: 2,
          source: 'local',
          filePath,
          addedAt: Date.now()
        })
      }
    }
    setDuration(180)
  }

  return (
    <>
      <MainLayout
        onImportClick={handleImportClick}
        onYouTubeClick={handleYouTubeClick}
        onSaveClick={handleSave}
        onLoadClick={handleOpen}
        onExportClick={handleExport}
        projectName={projectName}
        isDirty={isDirty}
        effectsPanel={<EffectsPanel />}
        visualizerPanel={<VisualizerPanel />}
        mixerPanel={<MixerPanel />}
      >
        <Timeline onDropFiles={handleDropFiles} />
      </MainLayout>

      {/* YouTube Import Modal */}
      <YouTubeImportModal
        isOpen={showYouTubeModal}
        onClose={() => setShowYouTubeModal(false)}
        onImportComplete={handleYouTubeImportComplete}
      />

      {/* Export Modal */}
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />

      {/* Notification Toast */}
      <NotificationToast />
    </>
  )
}

export default App
