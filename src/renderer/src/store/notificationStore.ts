import { create } from 'zustand'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  duration?: number // ms, 0 = persistent
}

interface NotificationState {
  notifications: Notification[]
}

interface NotificationActions {
  addNotification: (type: NotificationType, message: string, duration?: number) => string
  removeNotification: (id: string) => void
  clearAll: () => void
}

let notificationCounter = 0

export const useNotificationStore = create<NotificationState & NotificationActions>((set, get) => ({
  notifications: [],

  addNotification: (type, message, duration = 4000) => {
    const id = `notification-${++notificationCounter}-${Date.now()}`
    const notification: Notification = { id, type, message, duration }

    set((state) => ({
      notifications: [...state.notifications, notification]
    }))

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(id)
      }, duration)
    }

    return id
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    })),

  clearAll: () => set({ notifications: [] })
}))

// Helper functions for convenience
export const notify = {
  success: (message: string, duration?: number) =>
    useNotificationStore.getState().addNotification('success', message, duration),
  error: (message: string, duration?: number) =>
    useNotificationStore.getState().addNotification('error', message, duration || 6000),
  warning: (message: string, duration?: number) =>
    useNotificationStore.getState().addNotification('warning', message, duration),
  info: (message: string, duration?: number) =>
    useNotificationStore.getState().addNotification('info', message, duration)
}
