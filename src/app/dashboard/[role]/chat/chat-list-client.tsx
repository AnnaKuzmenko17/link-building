'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircleIcon, PlusIcon, PencilIcon, ArchiveIcon, ArchiveRestoreIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CreateChatDialog } from './create-chat-dialog'
import { archiveChatAction, unarchiveChatAction } from './actions'
import type { ChatWithPreview, ChatDetail } from '@/lib/data/chats'
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
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ChatCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ChatStatus | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editChat, setEditChat] = useState<ChatDetail | null>(null)
  const [confirmArchive, setConfirmArchive] = useState<ChatWithPreview | null>(null)
  const [confirmUnarchive, setConfirmUnarchive] = useState<ChatWithPreview | null>(null)

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

  function handleArchiveConfirm() {
    if (!confirmArchive) return
    const chatId = confirmArchive.id
    setConfirmArchive(null)
    startTransition(async () => {
      const result = await archiveChatAction(chatId)
      if (!result.success) toast.error(result.error)
      else { toast.success('Chat archived.'); router.refresh() }
    })
  }

  function handleUnarchiveConfirm() {
    if (!confirmUnarchive) return
    const chatId = confirmUnarchive.id
    setConfirmUnarchive(null)
    startTransition(async () => {
      const result = await unarchiveChatAction(chatId)
      if (!result.success) toast.error(result.error)
      else { toast.success('Chat unarchived.'); router.refresh() }
    })
  }

  // Build a ChatDetail stub for edit mode from the preview data
  function buildEditDetail(chat: ChatWithPreview): ChatDetail {
    return {
      id: chat.id,
      category: chat.category,
      status: chat.status,
      title: chat.title,
      created_at: chat.created_at,
      participants: chat.participants,
    }
  }

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
            const isStandard = chat.category === 'general'

            return (
              <div
                key={chat.id}
                className="flex items-start gap-3 px-4 py-3 first:rounded-t-lg last:rounded-b-lg hover:bg-muted/30 transition-colors"
              >
                <button
                  className="flex-1 min-w-0 text-left"
                  onClick={() => router.push(`/dashboard/${role}/chat/${chat.id}`)}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="text-xs shrink-0">
                      {categoryLabels[chat.category]}
                    </Badge>
                    {chat.status === 'archived' && (
                      <Badge variant="secondary" className="text-xs shrink-0">Archived</Badge>
                    )}
                    <span className="text-sm font-medium truncate">{chat.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.last_message ? chat.last_message.body : 'No messages yet'}
                  </p>
                </button>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(timeStr)}</span>
                  {chat.unread_count > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                      {chat.unread_count > 99 ? '99+' : chat.unread_count}
                    </span>
                  )}
                  {isStandard && (
                    <div className="flex gap-1 mt-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        title="Edit chat"
                        disabled={isPending}
                        onClick={(e) => { e.stopPropagation(); setEditChat(buildEditDetail(chat)) }}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                      {chat.status === 'active' ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          title="Archive chat"
                          disabled={isPending}
                          onClick={(e) => { e.stopPropagation(); setConfirmArchive(chat) }}
                        >
                          <ArchiveIcon className="size-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          title="Unarchive chat"
                          disabled={isPending}
                          onClick={(e) => { e.stopPropagation(); setConfirmUnarchive(chat) }}
                        >
                          <ArchiveRestoreIcon className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {canCreate && (
        <CreateChatDialog
          open={createOpen || !!editChat}
          onOpenChange={(open) => {
            if (!open) { setCreateOpen(false); setEditChat(null) }
          }}
          role={role}
          currentUserId={userId}
          editChat={editChat ?? undefined}
        />
      )}

      <AlertDialog open={!!confirmArchive} onOpenChange={(o) => !o && setConfirmArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive chat?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving will prevent new messages until the chat is unarchived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveConfirm}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmUnarchive} onOpenChange={(o) => !o && setConfirmUnarchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unarchive chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will allow participants to send messages again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnarchiveConfirm}>Unarchive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
