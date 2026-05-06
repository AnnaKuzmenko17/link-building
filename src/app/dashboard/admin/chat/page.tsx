import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { getChatsForUser } from '@/lib/data/chats'
import { PageHeader } from '@/components/shared/page-header'
import { ChatListClient } from '@/app/dashboard/[role]/chat/chat-list-client'

export default async function AdminChatPage() {
  const { user } = await requireSession()
  const supabase = await createClient()
  const chats = await getChatsForUser(supabase, user.id)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Chat" />
      <ChatListClient chats={chats} userId={user.id} role="admin" canCreate={true} showCategoryFilter />
    </div>
  )
}
