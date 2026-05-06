'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createChatAction, editChatAction, searchUsersAction } from './actions'
import type { ChatDetail } from '@/lib/data/chats'

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: string
  currentUserId: string
  /** When provided, the dialog is in edit mode */
  editChat?: ChatDetail
}

function userName(u: User) {
  return `${u.first_name} ${u.last_name}`.trim() || u.email
}

function defaultTitle(selected: User[]): string {
  return selected.map(userName).join(', ')
}

function initialSelected(editChat: ChatDetail | undefined, currentUserId: string): User[] {
  if (!editChat) return []
  return editChat.participants
    .filter((p) => p.id !== currentUserId)
    .map((p) => ({ id: p.id, first_name: p.first_name, last_name: p.last_name, email: '', role: '' }))
}

export function CreateChatDialog({ open, onOpenChange, role, currentUserId, editChat }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(() => editChat?.title ?? '')
  const [titleTouched, setTitleTouched] = useState(!!editChat)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selected, setSelected] = useState<User[]>(() => initialSelected(editChat, currentUserId))
  const [searching, setSearching] = useState(false)

  const isEdit = !!editChat

  const displayTitle = titleTouched || isEdit ? title : defaultTitle(selected)

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const result = await searchUsersAction(query)
    setSearching(false)
    if (result.success) setSearchResults(result.users)
  }, [])

  function selectUser(user: User) {
    if (!selected.find((u) => u.id === user.id) && user.id !== currentUserId) {
      setSelected((prev) => [...prev, user])
    }
    setSearchQuery('')
    setSearchResults([])
  }

  function removeUser(userId: string) {
    setSelected((prev) => prev.filter((u) => u.id !== userId))
  }

  function handleClose() {
    onOpenChange(false)
    setTitle(editChat?.title ?? '')
    setTitleTouched(!!editChat)
    setSelected(initialSelected(editChat, currentUserId))
    setSearchQuery('')
    setSearchResults([])
  }

  function handleSubmit() {
    if (!displayTitle.trim()) {
      toast.error('Title is required.')
      return
    }
    if (selected.length === 0) {
      toast.error('Select at least one other participant.')
      return
    }
    startTransition(async () => {
      if (isEdit) {
        const result = await editChatAction(
          editChat!.id,
          displayTitle,
          selected.map((u) => u.id)
        )
        if (!result.success) {
          toast.error(result.error)
          return
        }
        toast.success('Chat updated.')
        handleClose()
        router.refresh()
      } else {
        const result = await createChatAction(selected.map((u) => u.id), displayTitle)
        if (!result.success) {
          toast.error(result.error)
          return
        }
        toast.success('Chat created.')
        handleClose()
        router.push(`/dashboard/${role}/chat/${result.chatId}`)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Chat' : 'New Chat'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="chat-title">Title</Label>
            <Input
              id="chat-title"
              placeholder="Chat title…"
              value={displayTitle}
              onChange={(e) => {
                setTitle(e.target.value)
                setTitleTouched(true)
              }}
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Participants</Label>
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1">
                {selected.map((u) => (
                  <span
                    key={u.id}
                    className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-sm"
                  >
                    {userName(u)}
                    <button
                      type="button"
                      onClick={() => removeUser(u.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <XIcon className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <Input
                placeholder="Search by name or email…"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoComplete="off"
              />
              {(searchResults.length > 0 || searching) && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                  {searching && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
                  )}
                  {!searching && searchResults.length === 0 && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">No users found.</p>
                  )}
                  {!searching &&
                    searchResults
                      .filter((u) => u.id !== currentUserId && !selected.find((s) => s.id === u.id))
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => selectUser(u)}
                        >
                          <span className="font-medium">
                            {`${u.first_name} ${u.last_name}`.trim() || '—'}
                          </span>
                          <span className="ml-2 text-muted-foreground text-xs">
                            {u.email} · {u.role}
                          </span>
                        </button>
                      ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !displayTitle.trim() || selected.length === 0}
          >
            {isPending ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save' : 'Create Chat')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
