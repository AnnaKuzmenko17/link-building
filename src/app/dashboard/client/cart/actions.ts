'use server'

import { z } from 'zod'
import { requireSession } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { removeFromCart, clearCart } from '@/lib/data/cart'
import { createOrders } from '@/lib/data/orders'
import { createSalesChatForClient } from '@/lib/data/chats'

type Result = { success: true } | { success: false; error: string }

export async function removeFromCartAction(cartItemId: string): Promise<Result> {
  const { user, role } = await requireSession()
  if (role !== 'client') return { success: false, error: 'Not authorized.' }

  const parsed = z.string().uuid().safeParse(cartItemId)
  if (!parsed.success) return { success: false, error: 'Invalid cart item.' }

  const supabase = await createClient()
  const { error } = await removeFromCart(supabase, parsed.data, user.id)
  if (error) return { success: false, error: 'Failed to remove item.' }

  return { success: true }
}

const createOrdersSchema = z.array(
  z.object({
    cartItemId: z.string().uuid(),
    siteId: z.string().uuid(),
    publishMonth: z.string().regex(/^\d{4}-\d{2}-01$/, 'Invalid month format'),
    comment: z.string().max(1000).optional(),
  })
).min(1)

export async function createOrdersAction(
  items: Array<{ cartItemId: string; siteId: string; publishMonth: string; comment?: string }>,
): Promise<Result> {
  const { user, role } = await requireSession()
  if (role !== 'client') return { success: false, error: 'Not authorized.' }

  const parsed = createOrdersSchema.safeParse(items)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const supabase = await createClient()

  const { count: existingOrderCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', user.id)

  const isFirstOrder = existingOrderCount === 0

  const rows = parsed.data.map(({ siteId, publishMonth, comment }) => ({
    client_id: user.id,
    site_id: siteId,
    publish_month: publishMonth,
    status: 'new' as const,
    comment: comment || null,
  }))

  const { error: insertError } = await createOrders(supabase, rows)
  if (insertError) return { success: false, error: 'Failed to create orders. Please try again.' }

  const { error: clearError } = await clearCart(supabase, user.id)
  if (clearError) console.error('[createOrdersAction] clearCart failed:', clearError.message)

  if (isFirstOrder) {
    try {
      const adminClient = createAdminClient()
      await createSalesChatForClient(adminClient, user.id)
    } catch (e) {
      console.error('[createOrdersAction] createSalesChatForClient failed:', e)
    }
  }

  return { success: true }
}
