import { create } from 'zustand'

export interface ProjectState {
  name: string
  filePath: string | null
  isDirty: boolean
  lastSaved: number | null
  version: string
}

interface ProjectActions {
  setName: (name: string) => void
  setFilePath: (path: string | null) => void
  setDirty: (dirty: boolean) => void
  markSaved: (filePath: string) => void
  resetProject: () => void
}

const DEFAULT_STATE: ProjectState = {
  name: 'Untitled Project',
  filePath: null,
  isDirty: false,
  lastSaved: null,
  version: '1.0.0'
}

export const useProjectStore = create<ProjectState & ProjectActions>((set) => ({
  ...DEFAULT_STATE,

  setName: (name) => set({ name, isDirty: true }),

  setFilePath: (filePath) => set({ filePath }),

  setDirty: (isDirty) => set({ isDirty }),

  markSaved: (filePath) =>
    set({
      filePath,
      isDirty: false,
      lastSaved: Date.now()
    }),

  resetProject: () => set(DEFAULT_STATE)
}))
