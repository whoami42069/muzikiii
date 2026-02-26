import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Types for our API
interface YouTubeProgressPayload {
  percentage: number
  downloadedBytes: number
  totalBytes: number
  speed?: string
  eta?: string
  status?: string
}

interface YouTubeCompletePayload {
  filePath: string
  metadata: {
    title: string
    artist?: string
    duration: number
    thumbnail?: string
  }
}

interface YouTubeErrorPayload {
  message: string
  code?: string
}

// Custom APIs for renderer
const api = {
  // YouTube operations
  youtube: {
    download: (request: { url: string; outputFormat: 'mp3' | 'wav' | 'flac'; quality?: string }) =>
      ipcRenderer.invoke('youtube:download', request),

    cancel: () => ipcRenderer.invoke('youtube:cancel'),

    checkAvailable: () => ipcRenderer.invoke('youtube:check-available'),

    validateUrl: (url: string) => ipcRenderer.invoke('youtube:validate-url', url),

    onProgress: (callback: (data: YouTubeProgressPayload) => void) => {
      const handler = (_: Electron.IpcRendererEvent, data: YouTubeProgressPayload) => callback(data)
      ipcRenderer.on('youtube:progress', handler)
      return () => ipcRenderer.removeListener('youtube:progress', handler)
    },

    onComplete: (callback: (data: YouTubeCompletePayload) => void) => {
      const handler = (_: Electron.IpcRendererEvent, data: YouTubeCompletePayload) => callback(data)
      ipcRenderer.on('youtube:complete', handler)
      return () => ipcRenderer.removeListener('youtube:complete', handler)
    },

    onError: (callback: (data: YouTubeErrorPayload) => void) => {
      const handler = (_: Electron.IpcRendererEvent, data: YouTubeErrorPayload) => callback(data)
      ipcRenderer.on('youtube:error', handler)
      return () => ipcRenderer.removeListener('youtube:error', handler)
    }
  },

  // File operations
  file: {
    saveProject: (projectData: string, filePath?: string) =>
      ipcRenderer.invoke('file:save-project', projectData, filePath),

    loadProject: (filePath?: string) => ipcRenderer.invoke('file:load-project', filePath),

    importAudio: () => ipcRenderer.invoke('file:import-audio'),

    exportAudio: (options: { defaultName?: string; format?: string }) =>
      ipcRenderer.invoke('file:export-audio', options),

    selectFolder: () => ipcRenderer.invoke('file:select-folder'),

    readBuffer: (filePath: string) => ipcRenderer.invoke('file:read-buffer', filePath),

    getAudioDir: () => ipcRenderer.invoke('file:get-audio-dir')
  },

  // App utilities
  app: {
    getPath: (name: 'userData' | 'music' | 'documents') =>
      ipcRenderer.invoke('app:get-path', name),

    showDialog: (options: Electron.MessageBoxOptions) =>
      ipcRenderer.invoke('app:show-dialog', options),

    showOpenDialog: (options: Electron.OpenDialogOptions) =>
      ipcRenderer.invoke('app:show-open-dialog', options),

    showSaveDialog: (options: Electron.SaveDialogOptions) =>
      ipcRenderer.invoke('app:show-save-dialog', options)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

// Export type for renderer
export type API = typeof api
