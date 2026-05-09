import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { getChatById, getMessagesForChat } from '@/lib/data/chats'
import { BackButton } from '@/components/shared/back-button'
import { Badge } from '@/components/ui/badge'
import { ChatThreadClient } from '@/app/dashboard/[role]/chat/chat-thread-client'
import { getInitials } from '@/lib/utils'

interface Props {
  params: Promise<{ id: string }>
}

const categoryLabel: Record<string, string> = { support: 'Support', sales: 'Sales', general: 'Standard' }

export default async function AdminChatThreadPage({ params }: Props) {
  const { id } = await params
  const { user } = await requireSession()
  const supabase = await createClient()

  const [chat, messages] = await Promise.all([
    getChatById(supabase, id, user.id),
    getMessagesForChat(supabase, id),
  ])

  if (!chat) notFound()

  const otherParticipants = chat.participants.filter((p) => p.id !== user.id)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <BackButton fallbackHref="/dashboard/admin/chat" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight truncate min-w-0">{chat.title}</h1>
          {otherParticipants.length > 0 && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {otherParticipants.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center gap-1">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium overflow-hidden">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      getInitials(p.first_name, p.last_name)
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{p.first_name} {p.last_name}</span>
                </div>
              ))}
              {otherParticipants.length > 3 && (
                <span className="text-sm text-muted-foreground">+{otherParticipants.length - 3} more</span>
              )}
            </div>
          )}
        </div>
        <Badge variant="outline" className="shrink-0">{categoryLabel[chat.category] ?? chat.category}</Badge>
        {chat.status === 'archived' && <Badge variant="secondary" className="shrink-0">Archived</Badge>}
      </div>
      <ChatThreadClient
        chat={chat}
        initialMessages={messages}
        currentUserId={user.id}
      />
    </div>
  )
}
