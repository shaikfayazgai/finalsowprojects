'use client'
import { useState } from 'react'
import { Badge, Button, PageHeader } from '@glimmora/ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Send } from 'lucide-react'
import type { MessageThread } from '@glimmora/types'
import { cn } from '@glimmora/ui'

export function MessagesPage() {
  const t = useTranslations('messages')
  const queryClient = useQueryClient()
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')

  const { data } = useQuery<{ data: MessageThread[] }>({
    queryKey: ['messages'],
    queryFn: () => fetch('/api/messages').then(r => r.json()),
  })

  const sendMutation = useMutation({
    mutationFn: async ({ threadId, content }: { threadId: string; content: string }) => {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, content }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      setNewMessage('')
    },
  })

  const threads = data?.data || []
  const selectedThread = threads.find(t => t.id === selectedThreadId) || threads[0] || null

  const handleSend = () => {
    if (!newMessage.trim() || !selectedThread) return
    sendMutation.mutate({ threadId: selectedThread.id, content: newMessage.trim() })
  }

  return (
    <div className="flex flex-col h-full p-6">
      <PageHeader title={t('title')} />

      <div className="flex-1 mt-6 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Thread list */}
        <div className="lg:w-80 shrink-0 bg-bg-card rounded-card shadow-card overflow-y-auto">
          <div className="p-3 border-b border-border">
            <h2 className="text-sm font-display font-semibold text-text-heading">Conversations</h2>
          </div>
          <div className="divide-y divide-border">
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => setSelectedThreadId(thread.id)}
                className={cn(
                  'w-full text-start p-3 hover:bg-hover transition-colors',
                  selectedThread?.id === thread.id && 'bg-hover'
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-body font-medium text-text-heading truncate">{thread.subject}</p>
                  {thread.unreadCount > 0 && (
                    <Badge status="inprogress">{thread.unreadCount}</Badge>
                  )}
                </div>
                <p className="text-xs font-body text-text-caption mt-1 truncate">
                  {thread.messages[thread.messages.length - 1]?.content}
                </p>
                <p className="text-[10px] font-body text-text-disabled mt-1">
                  {new Date(thread.lastMessageAt).toLocaleDateString()}
                </p>
              </button>
            ))}
            {threads.length === 0 && (
              <p className="text-sm font-body text-text-caption text-center py-8">{t('empty')}</p>
            )}
          </div>
        </div>

        {/* Message view */}
        <div className="flex-1 bg-bg-card rounded-card shadow-card flex flex-col min-h-0">
          {selectedThread ? (
            <>
              {/* Thread header */}
              <div className="p-4 border-b border-border shrink-0">
                <h3 className="font-display text-base font-semibold text-text-heading">{selectedThread.subject}</h3>
                <p className="text-xs font-body text-text-caption mt-0.5">Async conversation with Community Support Lead</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedThread.messages.map((msg) => {
                  const isContributor = msg.senderRole === 'contributor'
                  return (
                    <div
                      key={msg.id}
                      className={cn('flex', isContributor ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] px-4 py-2.5',
                          isContributor
                            ? 'bg-brand-primary/10 rounded-card rounded-br-none'
                            : 'bg-bg-dashboard border border-border rounded-card rounded-bl-none'
                        )}
                      >
                        <p className="text-[10px] font-body font-medium text-text-caption mb-1">
                          {isContributor ? t('you') : t('supportLead')}
                        </p>
                        <p className="text-sm font-body text-text-body">{msg.content}</p>
                        <p className="text-[10px] font-body text-text-disabled mt-1">
                          {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Message input */}
              <div className="p-4 border-t border-border shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder={t('placeholder')}
                    className="flex-1 border border-border bg-bg-card text-text-body rounded-inner px-3 py-2 text-sm font-body placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sendMutation.isPending}
                    size="md"
                    icon={<Send className="h-4 w-4" />}
                  >
                    {t('send')}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm font-body text-text-caption">{t('empty')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
