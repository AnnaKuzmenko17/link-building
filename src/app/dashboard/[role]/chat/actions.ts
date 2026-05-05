'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import {
  sendMessage,
  markMessagesRead,
  createChat,
  getChatById,
  searchUsersForChat,
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

const categorySchema = z.enum(['support', 'sales', 'general'])

export async function createChatAction(
  category: string,
  participantIds: string[]
): Promise<CreateResult> {
  const { user } = await requireSession()

  const parsedCategory = categorySchema.safeParse(category)
  if (!parsedCategory.success) return { success: false, error: 'Invalid category.' }

  const parsedIds = z.array(z.string().uuid()).min(1).safeParse(participantIds)
  if (!parsedIds.success) return { success: false, error: 'Select at least one participant.' }

  const allParticipants = Array.from(new Set([user.id, ...parsedIds.data]))

  const supabase = await createClient()
  const { chatId, error } = await createChat(supabase, parsedCategory.data, allParticipants)
  if (error || !chatId) return { success: false, error: 'Failed to create chat.' }

  return { success: true, chatId }
}

export async function searchUsersAction(query: string): Promise<SearchResult> {
  await requireSession()

  const parsed = z.string().min(1).max(100).safeParse(query.trim())
  if (!parsed.success) return { success: true, users: [] }

  const supabase = await createClient()
  const users = await searchUsersForChat(supabase, parsed.data)

  return { success: true, users }
}
