import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Client = SupabaseClient<Database>

export async function ensureManagerInClientSalesChat(
  supabase: Client,
  clientUserId: string,
  managerId: string
): Promise<void> {
  const { data: clientParticipations } = await supabase
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', clientUserId)

  if (!clientParticipations || clientParticipations.length === 0) return

  const chatIds = clientParticipations.map((p) => p.chat_id)

  const { data: salesChats } = await supabase
    .from('chats')
    .select('id')
    .in('id', chatIds)
    .eq('category', 'sales')

  if (!salesChats || salesChats.length === 0) return

  const salesChatId = salesChats[0].id

  const { data: existing } = await supabase
    .from('chat_participants')
    .select('id')
    .eq('chat_id', salesChatId)
    .eq('user_id', managerId)
    .maybeSingle()

  if (!existing) {
    await supabase.from('chat_participants').insert({
      chat_id: salesChatId,
      user_id: managerId,
    })
  }
}
