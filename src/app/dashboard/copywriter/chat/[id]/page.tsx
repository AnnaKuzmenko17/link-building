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

const categoryLabel: Record<string, string> = { support: 'Support', sales: 'Sales', general: 'Standard' }

export default async function CopywriterChatThreadPage({ params }: Props) {
  const { id } = await params
  const { user } = await requireSession()
  const supabase = await createClient()

  const [chat, messages] = await Promise.all([
    getChatById(supabase, id, user.id),
    getMessagesForChat(supabase, id),
  ])

  if (!chat) notFound()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BackButton fallbackHref="/dashboard/copywriter/chat" />
        <PageHeader title={chat.title} />
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
