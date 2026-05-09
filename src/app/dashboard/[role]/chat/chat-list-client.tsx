'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircleIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CreateChatDialog } from './create-chat-dialog'
import { getInitials } from '@/lib/utils'
import type { ChatWithPreview } from '@/lib/data/chats'
import type { ChatCategory, ChatStatus } from '@/types'

interface Props {
  chats: ChatWithPreview[]
  userId: string
  role: string
  canCreate: boolean
  showCategoryFilter?: boolean
}

const categoryLabels: Record<ChatCategory | 'all', string> = {
  all: 'All',
  support: 'Support',
  sales: 'Sales',
  general: 'Standard',
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

export function ChatListClient({ chats, userId, role, canCreate, showCategoryFilter = false }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ChatCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ChatStatus | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = useMemo(() => {
    return chats.filter((chat) => {
      if (categoryFilter !== 'all' && chat.category !== categoryFilter) return false
      if (statusFilter !== 'all' && chat.status !== statusFilter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const titleMatch = chat.title.toLowerCase().includes(q)
        const participantMatch = chat.participants.some((p) =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(q)
        )
        const messageMatch = chat.last_message?.body.toLowerCase().includes(q)
        if (!titleMatch && !participantMatch && !messageMatch) return false
      }
      return true
    })
  }, [chats, categoryFilter, statusFilter, search])

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
        {showCategoryFilter && (
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
        )}
        <div className="flex gap-1">
          {(['all', 'active', 'archived'] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
        {canCreate && (
          <div className="ml-auto">
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="size-4" />
              New Chat
            </Button>
          </div>
        )}
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
            const otherParticipants = chat.participants.filter((p) => p.id !== userId)

            return (
              <button
                key={chat.id}
                className="flex items-start gap-3 px-4 py-3 first:rounded-t-lg last:rounded-b-lg hover:bg-muted/30 transition-colors text-left"
                onClick={() => router.push(`/dashboard/${role}/chat/${chat.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="text-xs shrink-0">
                      {categoryLabels[chat.category]}
                    </Badge>
                    {chat.status === 'archived' && (
                      <Badge variant="secondary" className="text-xs shrink-0">Archived</Badge>
                    )}
                    <span className="text-sm font-medium truncate">{chat.title}</span>
                  </div>
                  {otherParticipants.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
                      {otherParticipants.slice(0, 3).map((p) => (
                        <div key={p.id} className="flex items-center gap-1 shrink-0">
                          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-medium overflow-hidden">
                            {p.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />
                            ) : (
                              getInitials(p.first_name, p.last_name)
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground truncate">{p.first_name} {p.last_name}</span>
                        </div>
                      ))}
                      {otherParticipants.length > 3 && (
                        <span className="text-xs text-muted-foreground shrink-0">+{otherParticipants.length - 3} more</span>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.last_message ? chat.last_message.body : 'No messages yet'}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
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

      {canCreate && (
        <CreateChatDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          role={role}
          currentUserId={userId}
        />
      )}
    </div>
  )
}
