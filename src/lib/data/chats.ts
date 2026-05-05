import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { ChatCategory } from '@/types'

type Client = SupabaseClient<Database>

export type ChatParticipantUser = {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
}

export type ChatWithPreview = {
  id: string
  category: ChatCategory
  created_at: string
  participants: ChatParticipantUser[]
  last_message: {
    body: string
    created_at: string
    sender_id: string
  } | null
  unread_count: number
}

export type MessageWithSender = {
  id: string
  chat_id: string
  sender_id: string
  body: string
  status: 'unread' | 'read'
  created_at: string
  sender: ChatParticipantUser
}

export type ChatDetail = {
  id: string
  category: ChatCategory
  created_at: string
  participants: ChatParticipantUser[]
}

export async function getChatsForUser(
  supabase: Client,
  userId: string
): Promise<ChatWithPreview[]> {
  const { data: participations } = await supabase
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', userId)

  if (!participations || participations.length === 0) return []

  const chatIds = participations.map((p) => p.chat_id)

  const { data: chats } = await supabase
    .from('chats')
    .select('id, category, created_at')
    .in('id', chatIds)
    .order('created_at', { ascending: false })

  if (!chats || chats.length === 0) return []

  const { data: allParticipants } = await supabase
    .from('chat_participants')
    .select('chat_id, user_id, users(id, first_name, last_name, avatar_url)')
    .in('chat_id', chatIds)

  const { data: allMessages } = await supabase
    .from('messages')
    .select('id, chat_id, body, created_at, sender_id, status')
    .in('chat_id', chatIds)
    .order('created_at', { ascending: false })

  return chats.map((chat) => {
    const chatParticipants = (allParticipants ?? [])
      .filter((p) => p.chat_id === chat.id)
      .map((p) => p.users as ChatParticipantUser)
      .filter(Boolean)

    const chatMessages = (allMessages ?? []).filter((m) => m.chat_id === chat.id)
    const lastMessage = chatMessages[0] ?? null
    const unreadCount = chatMessages.filter(
      (m) => m.status === 'unread' && m.sender_id !== userId
    ).length

    return {
      id: chat.id,
      category: chat.category as ChatCategory,
      created_at: chat.created_at,
      participants: chatParticipants,
      last_message: lastMessage
        ? { body: lastMessage.body, created_at: lastMessage.created_at, sender_id: lastMessage.sender_id }
        : null,
      unread_count: unreadCount,
    }
  }).sort((a, b) => {
    const aTime = a.last_message?.created_at ?? a.created_at
    const bTime = b.last_message?.created_at ?? b.created_at
    return bTime.localeCompare(aTime)
  })
}

export async function getChatById(
  supabase: Client,
  chatId: string,
  userId: string
): Promise<ChatDetail | null> {
  const { data: participation } = await supabase
    .from('chat_participants')
    .select('id')
    .eq('chat_id', chatId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!participation) return null

  const { data: chat } = await supabase
    .from('chats')
    .select('id, category, created_at')
    .eq('id', chatId)
    .maybeSingle()

  if (!chat) return null

  const { data: participants } = await supabase
    .from('chat_participants')
    .select('user_id, users(id, first_name, last_name, avatar_url)')
    .eq('chat_id', chatId)

  return {
    id: chat.id,
    category: chat.category as ChatCategory,
    created_at: chat.created_at,
    participants: (participants ?? [])
      .map((p) => p.users as ChatParticipantUser)
      .filter(Boolean),
  }
}

export async function getMessagesForChat(
  supabase: Client,
  chatId: string
): Promise<MessageWithSender[]> {
  const { data } = await supabase
    .from('messages')
    .select('id, chat_id, sender_id, body, status, created_at, users(id, first_name, last_name, avatar_url)')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  if (!data) return []

  return data.map((m) => ({
    id: m.id,
    chat_id: m.chat_id,
    sender_id: m.sender_id,
    body: m.body,
    status: m.status as 'unread' | 'read',
    created_at: m.created_at,
    sender: m.users as ChatParticipantUser,
  }))
}

export async function sendMessage(
  supabase: Client,
  chatId: string,
  senderId: string,
  body: string
): Promise<{ data: MessageWithSender | null; error: string | null }> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, sender_id: senderId, body, status: 'unread' })
    .select('id, chat_id, sender_id, body, status, created_at, users(id, first_name, last_name, avatar_url)')
    .single()

  if (error || !data) return { data: null, error: error?.message ?? 'Failed to send.' }

  return {
    data: {
      id: data.id,
      chat_id: data.chat_id,
      sender_id: data.sender_id,
      body: data.body,
      status: data.status as 'unread' | 'read',
      created_at: data.created_at,
      sender: data.users as ChatParticipantUser,
    },
    error: null,
  }
}

export async function markMessagesRead(
  supabase: Client,
  chatId: string,
  userId: string
): Promise<void> {
  await supabase
    .from('messages')
    .update({ status: 'read' })
    .eq('chat_id', chatId)
    .eq('status', 'unread')
    .neq('sender_id', userId)
}

export async function createChat(
  supabase: Client,
  category: ChatCategory,
  participantIds: string[]
): Promise<{ chatId: string | null; error: string | null }> {
  // Generate the UUID upfront so we can insert participants before trying to
  // read the chat row back — the chats_select RLS policy calls is_chat_participant,
  // which would fail if we did insert+select before participants exist.
  const chatId = crypto.randomUUID()

  const { error: chatError } = await supabase
    .from('chats')
    .insert({ id: chatId, category })

  if (chatError) return { chatId: null, error: chatError.message }

  const rows = participantIds.map((uid) => ({ chat_id: chatId, user_id: uid }))
  const { error: participantsError } = await supabase.from('chat_participants').insert(rows)

  if (participantsError) return { chatId: null, error: participantsError.message }

  return { chatId, error: null }
}

export async function searchUsersForChat(
  supabase: Client,
  query: string
): Promise<{ id: string; first_name: string; last_name: string; email: string; role: string }[]> {
  const q = `%${query.trim()}%`
  const { data } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, role')
    .eq('status', 'active')
    .or(`first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q}`)
    .limit(20)

  return data ?? []
}

export async function createSupportChatForUser(
  supabase: Client,
  newUserId: string
): Promise<void> {
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .eq('status', 'active')

  if (!admins || admins.length === 0) return

  const participantIds = [newUserId, ...admins.map((a) => a.id)]
  await createChat(supabase, 'support', participantIds)
}

export async function createSalesChatForClient(
  supabase: Client,
  clientUserId: string
): Promise<void> {
  const existing = await supabase
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', clientUserId)

  if (existing.data && existing.data.length > 0) {
    const chatIds = existing.data.map((p) => p.chat_id)
    const { data: salesChats } = await supabase
      .from('chats')
      .select('id')
      .in('id', chatIds)
      .eq('category', 'sales')

    if (salesChats && salesChats.length > 0) return
  }

  const { data: managers } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'manager')
    .eq('status', 'active')

  if (!managers || managers.length === 0) return

  const participantIds = [clientUserId, ...managers.map((m) => m.id)]
  await createChat(supabase, 'sales', participantIds)
}

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
