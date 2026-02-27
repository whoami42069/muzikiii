import { ipcMain, dialog, app } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import { ipcError, ipcCanceled } from './types'

// Project file extension
const PROJECT_EXTENSION = '.mzk'

/**
 * Register file operation IPC handlers
 */
export function registerFileHandlers(): void {
  // Save project
  ipcMain.handle('file:save-project', async (_, projectData: string, filePath?: string) => {
    try {
      let savePath = filePath

      if (!savePath) {
        const result = await dialog.showSaveDialog({
          title: 'Save Project',
          defaultPath: path.join(app.getPath('documents'), 'Untitled' + PROJECT_EXTENSION),
          filters: [
            { name: 'Muzikiii Project', extensions: ['mzk'] },
            { name: 'JSON', extensions: ['json'] }
          ]
        })

        if (result.canceled || !result.filePath) {
          return ipcCanceled()
        }
        savePath = result.filePath
      }

      await fs.writeFile(savePath, projectData, 'utf-8')
      return { success: true, filePath: savePath }
    } catch (error) {
      console.error('[IPC] Save project error:', error)
      return ipcError(String(error))
    }
  })

  // Load project
  ipcMain.handle('file:load-project', async (_, filePath?: string) => {
    try {
      let loadPath = filePath

      if (!loadPath) {
        const result = await dialog.showOpenDialog({
          title: 'Open Project',
          defaultPath: app.getPath('documents'),
          filters: [
            { name: 'Muzikiii Project', extensions: ['mzk'] },
            { name: 'JSON', extensions: ['json'] }
          ],
          properties: ['openFile']
        })

        if (result.canceled || result.filePaths.length === 0) {
          return ipcCanceled()
        }
        loadPath = result.filePaths[0]
      }

      const content = await fs.readFile(loadPath, 'utf-8')
      return { success: true, filePath: loadPath, data: content }
    } catch (error) {
      console.error('[IPC] Load project error:', error)
      return ipcError(String(error))
    }
  })

  // Import audio files
  ipcMain.handle('file:import-audio', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Import Audio',
        defaultPath: app.getPath('music'),
        filters: [
          { name: 'Audio Files', extensions: ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile', 'multiSelections']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return ipcCanceled()
      }

      return { success: true, filePaths: result.filePaths }
    } catch (error) {
      console.error('[IPC] Import audio error:', error)
      return ipcError(String(error))
    }
  })

  // Export audio
  ipcMain.handle(
    'file:export-audio',
    async (_, options: { defaultName?: string; format?: string }) => {
      try {
        const format = options.format || 'wav'
        const result = await dialog.showSaveDialog({
          title: 'Export Audio',
          defaultPath: path.join(app.getPath('music'), options.defaultName || `export.${format}`),
          filters: [
            { name: 'WAV Audio', extensions: ['wav'] },
            { name: 'MP3 Audio', extensions: ['mp3'] },
            { name: 'FLAC Audio', extensions: ['flac'] }
          ]
        })

        if (result.canceled || !result.filePath) {
          return ipcCanceled()
        }

        return { success: true, filePath: result.filePath }
      } catch (error) {
        console.error('[IPC] Export audio error:', error)
        return ipcError(String(error))
      }
    }
  )

  // Select folder
  ipcMain.handle('file:select-folder', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Folder',
        properties: ['openDirectory', 'createDirectory']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return ipcCanceled()
      }

      return { success: true, folderPath: result.filePaths[0] }
    } catch (error) {
      console.error('[IPC] Select folder error:', error)
      return ipcError(String(error))
    }
  })

  // Read file as buffer (for audio loading)
  const ALLOWED_AUDIO_EXTENSIONS = [
    '.mp3',
    '.wav',
    '.flac',
    '.ogg',
    '.m4a',
    '.aac',
    '.wma',
    '.opus'
  ]

  ipcMain.handle('file:read-buffer', async (_, filePath: string) => {
    try {
      // Prevent path traversal attacks
      if (filePath.includes('..') || filePath.includes('\x00')) {
        return ipcError('Access denied: Invalid file path')
      }

      // Security: Validate path is within allowed directories
      const audioDir = path.join(app.getPath('userData'), 'audio')
      const musicDir = app.getPath('music')
      const documentsDir = app.getPath('documents')
      const downloadsDir = app.getPath('downloads')

      const resolvedPath = path.resolve(filePath)
      const isInAudioDir = resolvedPath.startsWith(path.resolve(audioDir))
      const isInMusicDir = resolvedPath.startsWith(path.resolve(musicDir))
      const isInDocsDir = resolvedPath.startsWith(path.resolve(documentsDir))
      const isInDownloads = resolvedPath.startsWith(path.resolve(downloadsDir))

      if (!isInAudioDir && !isInMusicDir && !isInDocsDir && !isInDownloads) {
        console.warn('[IPC] Access denied for path:', resolvedPath)
        return ipcError('Access denied: File path not in allowed directories')
      }

      // Check audio file extension allowlist
      const fileExt = path.extname(resolvedPath).toLowerCase()
      if (!ALLOWED_AUDIO_EXTENSIONS.includes(fileExt)) {
        return ipcError('Access denied: File type not allowed')
      }

      const buffer = await fs.readFile(resolvedPath)
      return { success: true, buffer }
    } catch (error) {
      console.error('[IPC] Read buffer error:', error)
      return ipcError(String(error))
    }
  })

  // Get audio files directory
  ipcMain.handle('file:get-audio-dir', async () => {
    const audioDir = path.join(app.getPath('userData'), 'audio')
    try {
      await fs.mkdir(audioDir, { recursive: true })
    } catch {
      // Directory might already exist
    }
    return audioDir
  })

  console.log('[IPC] File handlers registered')
}
