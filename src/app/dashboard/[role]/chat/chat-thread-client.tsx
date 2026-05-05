'use client'

import { useState, useEffect, useRef, useTransition, useCallback } from 'react'
import { toast } from 'sonner'
import { SendHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { sendMessageAction, markMessagesReadAction } from './actions'
import type { ChatDetail, MessageWithSender } from '@/lib/data/chats'

interface Props {
  chat: ChatDetail
  initialMessages: MessageWithSender[]
  currentUserId: string
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function getInitials(user: { first_name: string; last_name: string }): string {
  return `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || '?'
}

export function ChatThreadClient({ chat, initialMessages, currentUserId }: Props) {
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages)
  const [body, setBody] = useState('')
  const [isSending, startSending] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    markMessagesReadAction(chat.id)
  }, [chat.id])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`chat-${chat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chat.id}`,
        },
        (payload) => {
          const newMsg = payload.new as {
            id: string
            chat_id: string
            sender_id: string
            body: string
            status: string
            created_at: string
          }

          if (newMsg.sender_id === currentUserId) return

          const sender = chat.participants.find((p) => p.id === newMsg.sender_id) ?? {
            id: newMsg.sender_id,
            first_name: '',
            last_name: 'Unknown',
            avatar_url: null,
          }

          setMessages((prev) => [
            ...prev,
            {
              id: newMsg.id,
              chat_id: newMsg.chat_id,
              sender_id: newMsg.sender_id,
              body: newMsg.body,
              status: newMsg.status as 'unread' | 'read',
              created_at: newMsg.created_at,
              sender,
            },
          ])

          markMessagesReadAction(chat.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chat.id, chat.participants, currentUserId])

  const handleSend = useCallback(() => {
    const trimmed = body.trim()
    if (!trimmed) return

    const currentSender = chat.participants.find((p) => p.id === currentUserId) ?? {
      id: currentUserId,
      first_name: '',
      last_name: 'Me',
      avatar_url: null,
    }

    const optimistic: MessageWithSender = {
      id: `optimistic-${Date.now()}`,
      chat_id: chat.id,
      sender_id: currentUserId,
      body: trimmed,
      status: 'unread',
      created_at: new Date().toISOString(),
      sender: currentSender,
    }

    setMessages((prev) => [...prev, optimistic])
    setBody('')

    startSending(async () => {
      const result = await sendMessageAction(chat.id, trimmed)
      if (!result.success) {
        toast.error(result.error)
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
        setBody(trimmed)
      }
    })
  }, [body, chat.id, chat.participants, currentUserId])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  let lastDateLabel = ''

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] rounded-lg border bg-background">
      <div className="chat-messages flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-8">
            No messages yet. Start the conversation.
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId
          const dateLabel = formatDateLabel(msg.created_at)
          const showDateLabel = dateLabel !== lastDateLabel
          lastDateLabel = dateLabel

          return (
            <div key={msg.id}>
              {showDateLabel && (
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 border-t" />
                  <span className="text-xs text-muted-foreground">{dateLabel}</span>
                  <div className="flex-1 border-t" />
                </div>
              )}
              <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium"
                  title={`${msg.sender.first_name} ${msg.sender.last_name}`.trim()}
                >
                  {msg.sender.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={msg.sender.avatar_url}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    getInitials(msg.sender)
                  )}
                </div>
                <div className={`flex flex-col gap-0.5 max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-muted-foreground px-1">
                    {isOwn
                      ? 'You'
                      : `${msg.sender.first_name} ${msg.sender.last_name}`.trim() || 'Unknown'}
                  </span>
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    }`}
                  >
                    {msg.body}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          rows={1}
          maxLength={5000}
          className="resize-none min-h-[40px] max-h-[120px] flex-1"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!body.trim() || isSending}
          aria-label="Send message"
        >
          <SendHorizontalIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
