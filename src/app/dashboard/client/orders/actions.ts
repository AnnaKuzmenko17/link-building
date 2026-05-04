'use server'

import { z } from 'zod'
import { requireSession } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import {
  getClientOrderById,
  updateOrderPublishMonth,
  updateOrderComment,
  updateOrderStatus,
  createChangeRequest,
} from '@/lib/data/orders'

type Result = { success: true } | { success: false; error: string }

export async function cancelOrderAction(orderId: string): Promise<Result> {
  const { user, role } = await requireSession()
  if (role !== 'client') return { success: false, error: 'Not authorized.' }

  const parsed = z.string().uuid().safeParse(orderId)
  if (!parsed.success) return { success: false, error: 'Invalid order.' }

  const supabase = await createClient()
  const order = await getClientOrderById(supabase, parsed.data, user.id)
  if (!order) return { success: false, error: 'Order not found.' }
  if (order.status !== 'new') return { success: false, error: 'Only new orders can be canceled.' }

  const { error } = await updateOrderStatus(supabase, parsed.data, 'canceled')
  if (error) return { success: false, error: 'Failed to cancel order.' }

  return { success: true }
}

const editOrderSchema = z.object({
  orderId: z.string().uuid(),
  publishMonth: z.string().regex(/^\d{4}-\d{2}-01$/, 'Invalid month format'),
  comment: z.string().max(1000).optional(),
})

export async function editOrderAction(
  orderId: string,
  publishMonth: string,
  comment?: string,
): Promise<Result> {
  const { user, role } = await requireSession()
  if (role !== 'client') return { success: false, error: 'Not authorized.' }

  const parsed = editOrderSchema.safeParse({ orderId, publishMonth, comment })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const supabase = await createClient()
  const order = await getClientOrderById(supabase, parsed.data.orderId, user.id)
  if (!order) return { success: false, error: 'Order not found.' }
  if (order.status !== 'new') return { success: false, error: 'Only new orders can be edited.' }

  const { error: monthError } = await updateOrderPublishMonth(supabase, parsed.data.orderId, parsed.data.publishMonth)
  if (monthError) return { success: false, error: 'Failed to update order.' }

  const { error: commentError } = await updateOrderComment(supabase, parsed.data.orderId, parsed.data.comment ?? null)
  if (commentError) return { success: false, error: 'Failed to update order.' }

  return { success: true }
}

export async function approveContentAction(orderId: string): Promise<Result> {
  const { user, role } = await requireSession()
  if (role !== 'client') return { success: false, error: 'Not authorized.' }

  const parsed = z.string().uuid().safeParse(orderId)
  if (!parsed.success) return { success: false, error: 'Invalid order.' }

  const supabase = await createClient()
  const order = await getClientOrderById(supabase, parsed.data, user.id)
  if (!order) return { success: false, error: 'Order not found.' }
  if (order.status !== 'content_sent') return { success: false, error: 'Content has not been sent yet.' }

  const { error } = await updateOrderStatus(supabase, parsed.data, 'content_approved')
  if (error) return { success: false, error: 'Failed to approve content.' }

  return { success: true }
}

const requestChangesSchema = z.object({
  orderId: z.string().uuid(),
  comment: z.string().min(1, 'Comment is required').max(2000),
})

export async function requestChangesAction(orderId: string, comment: string): Promise<Result> {
  const { user, role } = await requireSession()
  if (role !== 'client') return { success: false, error: 'Not authorized.' }

  const parsed = requestChangesSchema.safeParse({ orderId, comment })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const supabase = await createClient()
  const order = await getClientOrderById(supabase, parsed.data.orderId, user.id)
  if (!order) return { success: false, error: 'Order not found.' }
  if (order.status !== 'content_sent') return { success: false, error: 'Content has not been sent yet.' }

  const { error } = await createChangeRequest(supabase, parsed.data.orderId, parsed.data.comment, user.id)
  if (error) return { success: false, error: 'Failed to submit change request.' }

  return { success: true }
}
