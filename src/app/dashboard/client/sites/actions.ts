'use server'

import { z } from 'zod'
import { requireSession } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { addToCart } from '@/lib/data/cart'

type Result = { success: true } | { success: false; error: string }

const addToCartSchema = z.object({ siteId: z.string().uuid() })

export async function addToCartAction(siteId: string): Promise<Result> {
  const { user, role } = await requireSession()
  if (role !== 'client') return { success: false, error: 'Not authorized.' }

  const parsed = addToCartSchema.safeParse({ siteId })
  if (!parsed.success) return { success: false, error: 'Invalid site ID.' }

  const supabase = await createClient()
  const { error } = await addToCart(supabase, user.id, parsed.data.siteId)

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Site is already in your cart.' }
    return { success: false, error: 'Failed to add to cart. Please try again.' }
  }

  return { success: true }
}
