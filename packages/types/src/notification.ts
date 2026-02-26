export type NotificationChannel = 'in_app' | 'email'
export type NotificationCategory = 'task_updates' | 'payments' | 'messages' | 'platform'

export interface NotificationPreference {
  category: NotificationCategory
  channel: NotificationChannel
  enabled: boolean
}
