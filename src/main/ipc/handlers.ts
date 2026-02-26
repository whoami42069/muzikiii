import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import { registerFileHandlers } from './file.ipc';
import { registerYouTubeHandlers } from './youtube.ipc';

/**
 * Register all IPC handlers for the main process
 */
export function registerAllHandlers(mainWindow: BrowserWindow): void {
  // File operations
  registerFileHandlers();

  // YouTube download
  registerYouTubeHandlers(mainWindow);

  // App utilities
  registerAppHandlers();

  console.log('[IPC] All handlers registered');
}

/**
 * App-related IPC handlers
 */
function registerAppHandlers(): void {
  // Get app paths
  ipcMain.handle('app:get-path', async (_, name: 'userData' | 'music' | 'documents') => {
    return app.getPath(name);
  });

  // Show native dialog
  ipcMain.handle('app:show-dialog', async (_, options: Electron.MessageBoxOptions) => {
    return dialog.showMessageBox(options);
  });

  // Show open dialog
  ipcMain.handle('app:show-open-dialog', async (_, options: Electron.OpenDialogOptions) => {
    return dialog.showOpenDialog(options);
  });

  // Show save dialog
  ipcMain.handle('app:show-save-dialog', async (_, options: Electron.SaveDialogOptions) => {
    return dialog.showSaveDialog(options);
  });
}
