'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { createCategory, updateCategory } from '@/lib/data/sites'

type Result = { success: true } | { success: false; error: string }

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
})

export async function createCategoryAction(input: { name: string }): Promise<Result> {
  const { user, role } = await requireSession()
  if (role !== 'admin') return { success: false, error: 'Not authorized.' }

  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()
  const { error } = await createCategory(supabase, parsed.data.name, user.id)
  if (error) {
    if (error.code === '23505') return { success: false, error: 'A category with this name already exists.' }
    return { success: false, error: 'Failed to create category. Please try again.' }
  }

  return { success: true }
}

export async function editCategoryAction(
  categoryId: string,
  input: { name: string },
): Promise<Result> {
  if (!z.string().uuid().safeParse(categoryId).success) {
    return { success: false, error: 'Invalid category.' }
  }

  const { role } = await requireSession()
  if (role !== 'admin') return { success: false, error: 'Not authorized.' }

  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()
  const { error } = await updateCategory(supabase, categoryId, parsed.data.name)
  if (error) {
    if (error.code === '23505') return { success: false, error: 'A category with this name already exists.' }
    return { success: false, error: 'Failed to update category. Please try again.' }
  }

  return { success: true }
}
