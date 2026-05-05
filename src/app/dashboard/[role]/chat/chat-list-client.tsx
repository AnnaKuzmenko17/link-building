'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircleIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CreateChatDialog } from './create-chat-dialog'
import type { ChatWithPreview } from '@/lib/data/chats'
import type { ChatCategory } from '@/types'

interface Props {
  chats: ChatWithPreview[]
  userId: string
  role: string
}

const categoryLabels: Record<ChatCategory | 'all', string> = {
  all: 'All',
  support: 'Support',
  sales: 'Sales',
  general: 'General',
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatParticipants(participants: ChatWithPreview['participants'], currentUserId: string): string {
  const others = participants.filter((p) => p.id !== currentUserId)
  if (others.length === 0) return 'Just you'
  const shown = others.slice(0, 2).map((p) => {
    const name = `${p.first_name} ${p.last_name}`.trim()
    return name || 'Unknown'
  })
  const rest = others.length - shown.length
  return rest > 0 ? `${shown.join(', ')} +${rest}` : shown.join(', ')
}

export function ChatListClient({ chats, userId, role }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ChatCategory | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = useMemo(() => {
    return chats.filter((chat) => {
      if (categoryFilter !== 'all' && chat.category !== categoryFilter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const participantMatch = chat.participants.some((p) =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(q)
        )
        const messageMatch = chat.last_message?.body.toLowerCase().includes(q)
        if (!participantMatch && !messageMatch) return false
      }
      return true
    })
  }, [chats, categoryFilter, search])

  const categories: (ChatCategory | 'all')[] = ['all', 'support', 'sales', 'general']

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search chats…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <div className="flex gap-1">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
            >
              {categoryLabels[cat]}
            </Button>
          ))}
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-4" />
            New Chat
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <MessageCircleIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {chats.length === 0 ? 'No chats yet.' : 'No chats match your filters.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-lg border">
          {filtered.map((chat) => {
            const timeStr = chat.last_message?.created_at ?? chat.created_at
            return (
              <button
                key={chat.id}
                className="flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                onClick={() => router.push(`/dashboard/${role}/chat/${chat.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="text-xs capitalize shrink-0">
                      {chat.category}
                    </Badge>
                    <span className="text-sm font-medium truncate">
                      {formatParticipants(chat.participants, userId)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.last_message ? chat.last_message.body : 'No messages yet'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(timeStr)}</span>
                  {chat.unread_count > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                      {chat.unread_count > 99 ? '99+' : chat.unread_count}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <CreateChatDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        role={role}
      />
    </div>
  )
}
