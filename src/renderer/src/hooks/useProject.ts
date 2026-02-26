import { useCallback } from 'react'
import { useProjectStore } from '../store/projectStore'
import { useTracksStore } from '../store/tracksStore'
import { useTransportStore } from '../store/transportStore'
import { useEffectsStore } from '../store/effectsStore'
import type { ProjectSaveData, SerializedTrack } from '../types/project.types'
import { serializeTrack, deserializeTrack } from '../types/project.types'

/**
 * Hook for project save/load operations
 */
interface UseProjectReturn {
  projectName: string
  filePath: string | null
  isDirty: boolean
  lastSaved: number | null
  saveProject: (saveAs?: boolean) => Promise<{ success: boolean; error?: string }>
  openProject: () => Promise<{ success: boolean; error?: string }>
  newProject: () => void
  setProjectName: (name: string) => void
  markDirty: () => void
}

export function useProject(): UseProjectReturn {
  const project = useProjectStore()
  const tracksStore = useTracksStore()
  const transportStore = useTransportStore()
  const effectsStore = useEffectsStore()

  /**
   * Serialize current project state to JSON
   */
  const serializeProject = useCallback((): string => {
    const tracks: SerializedTrack[] = tracksStore.tracks.map(serializeTrack)

    const projectFile: ProjectSaveData = {
      version: project.version,
      name: project.name,
      createdAt: project.lastSaved || Date.now(),
      modifiedAt: Date.now(),
      transport: {
        bpm: transportStore.bpm
      },
      tracks,
      effects: effectsStore.params
    }

    return JSON.stringify(projectFile, null, 2)
  }, [project, tracksStore.tracks, transportStore, effectsStore.params])

  /**
   * Validate project file structure
   */
  const validateProjectFile = (data: unknown): data is ProjectSaveData => {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid project file: not an object')
    }

    const obj = data as Record<string, unknown>

    if (!obj.version || typeof obj.version !== 'string') {
      throw new Error('Invalid project file: missing or invalid version')
    }

    if (!obj.name || typeof obj.name !== 'string') {
      throw new Error('Invalid project file: missing or invalid name')
    }

    if (!Array.isArray(obj.tracks)) {
      throw new Error('Invalid project file: tracks must be an array')
    }

    if (!obj.transport || typeof obj.transport !== 'object') {
      throw new Error('Invalid project file: missing transport data')
    }

    const transport = obj.transport as Record<string, unknown>
    if (typeof transport.bpm !== 'number' || transport.bpm < 20 || transport.bpm > 300) {
      throw new Error('Invalid project file: BPM must be between 20 and 300')
    }

    if (!obj.effects || typeof obj.effects !== 'object') {
      throw new Error('Invalid project file: missing effects data')
    }

    // Validate each track has required fields
    for (let i = 0; i < obj.tracks.length; i++) {
      const track = obj.tracks[i] as Record<string, unknown>
      if (!track.metadata || typeof track.metadata !== 'object') {
        throw new Error(`Invalid track at index ${i}: missing metadata`)
      }
      const metadata = track.metadata as Record<string, unknown>
      if (!metadata.filePath || typeof metadata.filePath !== 'string') {
        throw new Error(`Invalid track at index ${i}: missing filePath`)
      }
    }

    return true
  }

  /**
   * Load project from JSON string
   */
  const loadProjectData = useCallback(
    (jsonString: string): boolean => {
      try {
        const parsed = JSON.parse(jsonString)

        // Validate project structure
        validateProjectFile(parsed)
        const projectFile = parsed as ProjectSaveData

        // Clear existing tracks
        tracksStore.tracks.forEach((track) => {
          tracksStore.removeTrack(track.id)
        })

        // Load tracks
        projectFile.tracks.forEach((serializedTrack) => {
          const track = deserializeTrack(serializedTrack)
          // Re-add track with same ID
          const trackId = tracksStore.addTrack(track.metadata)
          // Update with serialized state
          tracksStore.updateTrack(trackId, {
            volume: track.volume,
            pan: track.pan,
            muted: track.muted,
            solo: track.solo,
            effectsEnabled: track.effectsEnabled,
            color: track.color
          })
        })

        // Load transport settings
        transportStore.setBpm(projectFile.transport.bpm)

        // Calculate duration from tracks
        const maxDuration = projectFile.tracks.reduce(
          (max, track) => Math.max(max, track.metadata.duration),
          60
        )
        transportStore.setDuration(maxDuration)

        // Load effects
        Object.keys(projectFile.effects).forEach((effectType) => {
          const type = effectType as keyof typeof projectFile.effects
          effectsStore.setEffectParams(type, projectFile.effects[type])
        })

        // Update project state
        project.setName(projectFile.name)

        return true
      } catch (error) {
        console.error('Failed to load project:', error)
        return false
      }
    },
    [tracksStore, transportStore, effectsStore, project]
  )

  /**
   * Save project to file
   */
  const saveProject = useCallback(
    async (saveAs = false): Promise<{ success: boolean; error?: string }> => {
      try {
        const projectJson = serializeProject()
        const filePath = saveAs ? undefined : project.filePath || undefined

        const result = await window.api.file.saveProject(projectJson, filePath)

        if (result?.success && result?.filePath) {
          project.markSaved(result.filePath)
          // Extract filename from path
          const fileName =
            result.filePath
              .split(/[/\\]/)
              .pop()
              ?.replace(/\.[^.]+$/, '') || 'Untitled'
          project.setName(fileName)
          project.setDirty(false)
          return { success: true }
        } else if (result?.canceled) {
          return { success: false, error: 'Canceled' }
        } else {
          return { success: false, error: result?.error || 'Save failed' }
        }
      } catch (error) {
        console.error('Save error:', error)
        return { success: false, error: String(error) }
      }
    },
    [serializeProject, project]
  )

  /**
   * Open project from file
   */
  const openProject = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await window.api.file.loadProject()

      if (result?.success && result?.data) {
        const loaded = loadProjectData(result.data)
        if (loaded && result.filePath) {
          project.setFilePath(result.filePath)
          const fileName =
            result.filePath
              .split(/[/\\]/)
              .pop()
              ?.replace(/\.[^.]+$/, '') || 'Untitled'
          project.setName(fileName)
          project.setDirty(false)
          return { success: true }
        }
        return { success: false, error: 'Failed to parse project file' }
      } else if (result?.canceled) {
        return { success: false, error: 'Canceled' }
      } else {
        return { success: false, error: result?.error || 'Load failed' }
      }
    } catch (error) {
      console.error('Load error:', error)
      return { success: false, error: String(error) }
    }
  }, [loadProjectData, project])

  /**
   * Create new project
   */
  const newProject = useCallback((): void => {
    // Clear all tracks
    tracksStore.tracks.forEach((track) => {
      tracksStore.removeTrack(track.id)
    })

    // Reset transport
    transportStore.setBpm(120)
    transportStore.setCurrentTime(0)
    transportStore.setDuration(60)

    // Reset effects
    effectsStore.resetAllEffects()

    // Reset project state
    project.resetProject()
  }, [tracksStore, transportStore, effectsStore, project])

  return {
    // State
    projectName: project.name,
    filePath: project.filePath,
    isDirty: project.isDirty,
    lastSaved: project.lastSaved,

    // Actions
    saveProject,
    openProject,
    newProject,
    setProjectName: project.setName,
    markDirty: (): void => project.setDirty(true)
  }
}
