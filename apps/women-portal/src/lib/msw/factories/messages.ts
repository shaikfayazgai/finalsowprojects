import type { MessageThread } from '@glimmora/types'
import { randomId } from './common'

export function createMockMessageThreads(): MessageThread[] {
  return [
    {
      id: randomId('thread'),
      subject: 'Getting started with my first task',
      lastMessageAt: '2026-02-25T14:00:00Z',
      unreadCount: 1,
      messages: [
        { id: randomId('msg'), threadId: 'thread-1', senderRole: 'contributor', content: 'Hi, I just received my first task assignment. Can you help me understand the evidence submission process?', sentAt: '2026-02-25T10:00:00Z', isRead: true },
        { id: randomId('msg'), threadId: 'thread-1', senderRole: 'support_lead', content: 'Welcome! Great to see you starting. For evidence submission, you can upload files, share links, paste code, or write text descriptions. Each task brief will guide you on what evidence is expected.', sentAt: '2026-02-25T11:00:00Z', isRead: true },
        { id: randomId('msg'), threadId: 'thread-1', senderRole: 'contributor', content: 'Thank you! That makes sense. One more question - how long does the review process typically take?', sentAt: '2026-02-25T13:00:00Z', isRead: true },
        { id: randomId('msg'), threadId: 'thread-1', senderRole: 'support_lead', content: 'Reviews typically take 24-48 hours. You can track the status in your Submissions page. If rework is needed, you will see specific feedback from the mentor.', sentAt: '2026-02-25T14:00:00Z', isRead: false },
      ],
    },
    {
      id: randomId('thread'),
      subject: 'Payment question',
      lastMessageAt: '2026-02-20T09:00:00Z',
      unreadCount: 0,
      messages: [
        { id: randomId('msg'), threadId: 'thread-2', senderRole: 'contributor', content: 'When will my payment for the completed task be released?', sentAt: '2026-02-20T08:00:00Z', isRead: true },
        { id: randomId('msg'), threadId: 'thread-2', senderRole: 'support_lead', content: 'Payments are released once the enterprise requester approves the evidence pack. Your latest task payment should be processed within 3-5 business days.', sentAt: '2026-02-20T09:00:00Z', isRead: true },
      ],
    },
  ]
}
