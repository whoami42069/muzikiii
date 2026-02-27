export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  canceled?: boolean
}

export function ipcSuccess<T>(data?: T): IpcResponse<T> {
  return { success: true, ...(data !== undefined ? { data } : {}) }
}

export function ipcError(error: string): IpcResponse {
  return { success: false, error }
}

export function ipcCanceled(): IpcResponse {
  return { success: false, canceled: true }
}
