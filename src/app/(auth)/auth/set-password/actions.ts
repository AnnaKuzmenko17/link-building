'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Role } from '@/types'
import { VALID_ROLES } from '@/types'

const schema = z.object({
  password: z.string().min(8),
})

type SetPasswordResult =
  | { success: true; role: Role }
  | { success: false; error: string }

export async function setPasswordAction(
  newPassword: string,
  mode: 'first-login' | 'change'
): Promise<SetPasswordResult> {
  const parsed = schema.safeParse({ password: newPassword })
  if (!parsed.success) {
    return { success: false, error: 'Password must be at least 8 characters.' }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) {
    return { success: false, error: updateError.message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Session expired. Please log in again.' }
  }

  if (mode === 'first-login') {
    const { data: profile } = await supabase
      .from('users')
      .update({ status: 'active' })
      .eq('id', user.id)
      .select('role')
      .single()

    const role: Role = VALID_ROLES.includes(profile?.role as Role)
      ? (profile!.role as Role)
      : 'client'

    return { success: true, role }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role: Role = VALID_ROLES.includes(profile?.role as Role)
    ? (profile!.role as Role)
    : 'client'

  return { success: true, role }
}
