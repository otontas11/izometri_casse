import { useNotificationStore, type NotificationVariant } from '@/stores/notification.store'

export const useToast = () => {
  const notificationStore = useNotificationStore()

  const showToast = (message: string, variant: NotificationVariant) => notificationStore.showNotification({ message, variant })

  const showErrorToast = (message: string) => showToast(message, 'error')
  const showSuccessToast = (message: string) => showToast(message, 'success')
  const showWarningToast = (message: string) => showToast(message, 'warning')

  return {
    showErrorToast,
    showSuccessToast,
    showWarningToast,
  }
}
