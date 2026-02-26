export type MessageSenderRole = 'contributor' | 'support_lead'

export interface Message {
  id: string
  threadId: string
  senderRole: MessageSenderRole
  content: string
  sentAt: string
  isRead: boolean
}

export interface MessageThread {
  id: string
  subject: string
  lastMessageAt: string
  unreadCount: number
  messages: Message[]
}
