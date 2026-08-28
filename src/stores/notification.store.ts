import { ref } from 'vue'
import { defineStore } from 'pinia'

export type NotificationVariant = 'error' | 'success' | 'warning'

interface AppNotification {
  id: number
  message: string
  variant: NotificationVariant
}

interface ShowNotificationOptions {
  durationMilliseconds?: number
  message: string
  variant: NotificationVariant
}

const DEFAULT_NOTIFICATION_DURATION_MILLISECONDS = 4_000
let nextNotificationId = 1

export const useNotificationStore = defineStore('notification', () => {
  const activeNotifications = ref<AppNotification[]>([])

  const dismissNotification = (notificationId: number) => {
    activeNotifications.value = activeNotifications.value.filter(activeNotification => activeNotification.id !== notificationId)
  }

  const showNotification = ({
    durationMilliseconds = DEFAULT_NOTIFICATION_DURATION_MILLISECONDS,
    message,
    variant,
  }: ShowNotificationOptions) => {
    const notificationId = nextNotificationId
    nextNotificationId += 1

    activeNotifications.value.push({
      id: notificationId,
      message,
      variant,
    })

    if (durationMilliseconds > 0) {
      window.setTimeout(() => {
        dismissNotification(notificationId)
      }, durationMilliseconds)
    }

    return notificationId
  }

  return {
    activeNotifications,
    dismissNotification,
    showNotification,
  }
})
