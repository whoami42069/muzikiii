import { useEffect, useCallback } from 'react'
import { useAudioEngine } from './useAudioEngine'
import { audioEngine } from '../audio/engine'
import { useTransportStore, useTracksStore } from '../store'

interface KeyboardShortcutsOptions {
  onSave?: () => void
  onOpen?: () => void
  onNew?: () => void
  onExport?: () => void
  onUndo?: () => void
  onRedo?: () => void
}

/**
 * Hook to handle global keyboard shortcuts
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}): void {
  const { togglePlayPause, stop, seek } = useAudioEngine()
  const { duration, setCurrentTime } = useTransportStore()
  const { selectedTrackId, toggleMute, toggleSolo } = useTracksStore()

  // Destructure options to avoid object reference changes causing re-renders
  const { onSave, onOpen, onNew, onExport, onUndo, onRedo } = options

  const handleSeekStart = useCallback((): void => {
    seek(0)
    setCurrentTime(0)
  }, [seek, setCurrentTime])

  const handleSeekEnd = useCallback((): void => {
    if (duration > 0) {
      seek(duration - 0.1)
      setCurrentTime(duration - 0.1)
    }
  }, [seek, setCurrentTime, duration])

  const handleSeekForward = useCallback((): void => {
    const current = audioEngine.getCurrentTime()
    const newTime = Math.min(current + 5, duration)
    seek(newTime)
    setCurrentTime(newTime)
  }, [seek, setCurrentTime, duration])

  const handleSeekBackward = useCallback((): void => {
    const current = audioEngine.getCurrentTime()
    const newTime = Math.max(current - 5, 0)
    seek(newTime)
    setCurrentTime(newTime)
  }, [seek, setCurrentTime])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      const isMod = e.ctrlKey || e.metaKey

      // Modifier key shortcuts
      if (isMod) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault()
            onSave?.()
            break

          case 'o':
            e.preventDefault()
            onOpen?.()
            break

          case 'n':
            e.preventDefault()
            onNew?.()
            break

          case 'e':
            e.preventDefault()
            onExport?.()
            break

          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              onRedo?.()
            } else {
              onUndo?.()
            }
            break

          case 'y':
            e.preventDefault()
            onRedo?.()
            break
        }
        return
      }

      // Non-modifier shortcuts
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlayPause()
          break

        case 'Escape':
          stop()
          break

        case 'Home':
          e.preventDefault()
          handleSeekStart()
          break

        case 'End':
          e.preventDefault()
          handleSeekEnd()
          break

        case 'ArrowLeft':
          e.preventDefault()
          handleSeekBackward()
          break

        case 'ArrowRight':
          e.preventDefault()
          handleSeekForward()
          break

        case 'KeyM':
          if (selectedTrackId) {
            toggleMute(selectedTrackId)
          }
          break

        case 'KeyS':
          if (selectedTrackId) {
            toggleSolo(selectedTrackId)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    togglePlayPause,
    stop,
    handleSeekStart,
    handleSeekEnd,
    handleSeekForward,
    handleSeekBackward,
    onSave,
    onOpen,
    onNew,
    onExport,
    onUndo,
    onRedo,
    selectedTrackId,
    toggleMute,
    toggleSolo
  ])
}
