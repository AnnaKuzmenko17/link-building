import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { getChatById, getMessagesForChat } from '@/lib/data/chats'
import { PageHeader } from '@/components/shared/page-header'
import { BackButton } from '@/components/shared/back-button'
import { Badge } from '@/components/ui/badge'
import { ChatThreadClient } from '@/app/dashboard/[role]/chat/chat-thread-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CopywriterChatThreadPage({ params }: Props) {
  const { id } = await params
  const { user } = await requireSession()
  const supabase = await createClient()

  const [chat, messages] = await Promise.all([
    getChatById(supabase, id, user.id),
    getMessagesForChat(supabase, id),
  ])

  if (!chat) notFound()

  const otherParticipants = chat.participants
    .filter((p) => p.id !== user.id)
    .map((p) => `${p.first_name} ${p.last_name}`.trim() || 'Unknown')

  const title = otherParticipants.length > 0
    ? otherParticipants.slice(0, 2).join(', ') + (otherParticipants.length > 2 ? ` +${otherParticipants.length - 2}` : '')
    : 'Chat'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackButton fallbackHref="/dashboard/copywriter/chat" />
        <PageHeader title={title} />
        <Badge variant="outline" className="capitalize shrink-0">{chat.category}</Badge>
      </div>
      <ChatThreadClient
        chat={chat}
        initialMessages={messages}
        currentUserId={user.id}
      />
    </div>
  )
}
