'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import {
  sendMessage,
  markMessagesRead,
  createChat,
  updateChat,
  setChatStatus,
  getChatById,
  searchUsersForChat,
  startOrderChat,
} from '@/lib/data/chats'

type Result = { success: true } | { success: false; error: string }
type CreateResult = { success: true; chatId: string } | { success: false; error: string }
type SearchResult =
  | { success: true; users: { id: string; first_name: string; last_name: string; email: string; role: string }[] }
  | { success: false; error: string }

const chatIdSchema = z.string().uuid()

export async function sendMessageAction(chatId: string, body: string): Promise<Result> {
  const { user } = await requireSession()

  const parsedId = chatIdSchema.safeParse(chatId)
  if (!parsedId.success) return { success: false, error: 'Invalid chat.' }

  const parsedBody = z.string().min(1).max(5000).safeParse(body.trim())
  if (!parsedBody.success) return { success: false, error: 'Message cannot be empty.' }

  const supabase = await createClient()

  const chat = await getChatById(supabase, parsedId.data, user.id)
  if (!chat) return { success: false, error: 'Chat not found.' }
  if (chat.status === 'archived') return { success: false, error: 'This chat is archived.' }

  const { error } = await sendMessage(supabase, parsedId.data, user.id, parsedBody.data)
  if (error) return { success: false, error: 'Failed to send message.' }

  return { success: true }
}

export async function markMessagesReadAction(chatId: string): Promise<Result> {
  const { user } = await requireSession()

  const parsedId = chatIdSchema.safeParse(chatId)
  if (!parsedId.success) return { success: false, error: 'Invalid chat.' }

  const supabase = await createClient()
  await markMessagesRead(supabase, parsedId.data, user.id)

  return { success: true }
}

export async function createChatAction(
  participantIds: string[],
  title: string
): Promise<CreateResult> {
  const { user } = await requireSession()

  const parsedIds = z.array(z.string().uuid()).min(1).safeParse(participantIds)
  if (!parsedIds.success) return { success: false, error: 'Select at least one participant.' }

  const parsedTitle = z.string().min(1).max(200).safeParse(title.trim())
  if (!parsedTitle.success) return { success: false, error: 'Title is required.' }

  const allParticipants = Array.from(new Set([user.id, ...parsedIds.data]))
  if (allParticipants.length < 2) return { success: false, error: 'Select at least one other participant.' }

  const supabase = await createClient()
  const { chatId, error } = await createChat(supabase, 'general', allParticipants, parsedTitle.data, user.id)
  if (error || !chatId) return { success: false, error: 'Failed to create chat.' }

  return { success: true, chatId }
}

export async function editChatAction(
  chatId: string,
  title: string,
  participantIds: string[]
): Promise<Result> {
  const { user } = await requireSession()

  const parsedId = chatIdSchema.safeParse(chatId)
  if (!parsedId.success) return { success: false, error: 'Invalid chat.' }

  const parsedTitle = z.string().min(1).max(200).safeParse(title.trim())
  if (!parsedTitle.success) return { success: false, error: 'Title is required.' }

  const parsedIds = z.array(z.string().uuid()).min(1).safeParse(participantIds)
  if (!parsedIds.success) return { success: false, error: 'Select at least one participant.' }

  const supabase = await createClient()

  const chat = await getChatById(supabase, parsedId.data, user.id)
  if (!chat) return { success: false, error: 'Chat not found.' }
  if (chat.category !== 'general') return { success: false, error: 'Only Standard chats can be edited.' }

  // Ensure current user stays in
  const allParticipants = Array.from(new Set([user.id, ...parsedIds.data]))
  if (allParticipants.length < 2) return { success: false, error: 'At least 2 participants required.' }

  const { error } = await updateChat(supabase, parsedId.data, parsedTitle.data, allParticipants)
  if (error) return { success: false, error: 'Failed to update chat.' }

  revalidatePath(`/dashboard/${user.id}/chat`)
  return { success: true }
}

export async function archiveChatAction(chatId: string): Promise<Result> {
  const { user } = await requireSession()

  const parsedId = chatIdSchema.safeParse(chatId)
  if (!parsedId.success) return { success: false, error: 'Invalid chat.' }

  const supabase = await createClient()

  const chat = await getChatById(supabase, parsedId.data, user.id)
  if (!chat) return { success: false, error: 'Chat not found.' }
  if (chat.category !== 'general') return { success: false, error: 'Only Standard chats can be archived.' }
  if (chat.status === 'archived') return { success: false, error: 'Chat is already archived.' }

  const { error } = await setChatStatus(supabase, parsedId.data, 'archived')
  if (error) return { success: false, error: 'Failed to archive chat.' }

  return { success: true }
}

export async function unarchiveChatAction(chatId: string): Promise<Result> {
  const { user } = await requireSession()

  const parsedId = chatIdSchema.safeParse(chatId)
  if (!parsedId.success) return { success: false, error: 'Invalid chat.' }

  const supabase = await createClient()

  const chat = await getChatById(supabase, parsedId.data, user.id)
  if (!chat) return { success: false, error: 'Chat not found.' }
  if (chat.category !== 'general') return { success: false, error: 'Only Standard chats can be unarchived.' }
  if (chat.status === 'active') return { success: false, error: 'Chat is already active.' }

  const { error } = await setChatStatus(supabase, parsedId.data, 'active')
  if (error) return { success: false, error: 'Failed to unarchive chat.' }

  return { success: true }
}

export async function startOrderChatAction(orderId: string): Promise<CreateResult> {
  const { user } = await requireSession()

  const parsedId = z.string().uuid().safeParse(orderId)
  if (!parsedId.success) return { success: false, error: 'Invalid order.' }

  const supabase = await createClient()
  const { chatId, error } = await startOrderChat(supabase, parsedId.data, user.id)
  if (error || !chatId) return { success: false, error: error ?? 'Failed to start chat.' }

  return { success: true, chatId }
}

export async function searchUsersAction(query: string): Promise<SearchResult> {
  const { user, role } = await requireSession()

  const parsed = z.string().min(1).max(100).safeParse(query.trim())
  if (!parsed.success) return { success: true, users: [] }

  const supabase = await createClient()
  const users = await searchUsersForChat(supabase, parsed.data, role, user.id)

  return { success: true, users }
}
