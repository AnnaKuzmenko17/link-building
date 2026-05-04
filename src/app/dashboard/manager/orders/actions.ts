'use server'

import { z } from 'zod'
import { requireSession } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { getOrderById, assignCopywriter, reassignCopywriter, publishOrder } from '@/lib/data/orders'

type Result = { success: true } | { success: false; error: string }

const orderIdSchema = z.string().uuid()

export async function assignCopywriterAction(orderId: string, copywriterId: string): Promise<Result> {
  const { role } = await requireSession()
  if (role !== 'manager' && role !== 'admin') return { success: false, error: 'Not authorized.' }

  const parsedOrder = orderIdSchema.safeParse(orderId)
  const parsedCopywriter = orderIdSchema.safeParse(copywriterId)
  if (!parsedOrder.success || !parsedCopywriter.success) return { success: false, error: 'Invalid input.' }

  const supabase = await createClient()
  const order = await getOrderById(supabase, parsedOrder.data)
  if (!order) return { success: false, error: 'Order not found.' }
  if (order.copywriter_id !== null) return { success: false, error: 'Order already has a copywriter. Use reassign instead.' }

  const { error } = await assignCopywriter(supabase, parsedOrder.data, parsedCopywriter.data)
  if (error) return { success: false, error: 'Failed to assign copywriter.' }

  return { success: true }
}

export async function reassignCopywriterAction(orderId: string, copywriterId: string): Promise<Result> {
  const { role } = await requireSession()
  if (role !== 'manager' && role !== 'admin') return { success: false, error: 'Not authorized.' }

  const parsedOrder = orderIdSchema.safeParse(orderId)
  const parsedCopywriter = orderIdSchema.safeParse(copywriterId)
  if (!parsedOrder.success || !parsedCopywriter.success) return { success: false, error: 'Invalid input.' }

  const supabase = await createClient()
  const order = await getOrderById(supabase, parsedOrder.data)
  if (!order) return { success: false, error: 'Order not found.' }
  if (!order.copywriter_id) return { success: false, error: 'Order has no copywriter to reassign.' }

  const { error } = await reassignCopywriter(supabase, parsedOrder.data, parsedCopywriter.data)
  if (error) return { success: false, error: 'Failed to reassign copywriter.' }

  return { success: true }
}

const publishSchema = z.object({
  orderId: z.string().uuid(),
  publishedUrl: z.string().url('Please enter a valid URL'),
})

export async function publishOrderAction(orderId: string, publishedUrl: string): Promise<Result> {
  const { role } = await requireSession()
  if (role !== 'manager' && role !== 'admin') return { success: false, error: 'Not authorized.' }

  const parsed = publishSchema.safeParse({ orderId, publishedUrl })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const supabase = await createClient()
  const order = await getOrderById(supabase, parsed.data.orderId)
  if (!order) return { success: false, error: 'Order not found.' }
  if (order.status !== 'content_approved') return { success: false, error: 'Only content-approved orders can be published.' }

  const { error } = await publishOrder(supabase, parsed.data.orderId, parsed.data.publishedUrl)
  if (error) return { success: false, error: 'Failed to publish order.' }

  return { success: true }
}
