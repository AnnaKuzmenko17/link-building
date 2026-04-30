'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Role } from '@/types'
import { VALID_ROLES } from '@/types'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type LoginResult =
  | { success: true; role: Role }
  | { success: false; error: string }

export async function loginAction(email: string, password: string): Promise<LoginResult> {
  const parsed = schema.safeParse({ email, password })
  if (!parsed.success) {
    return { success: false, error: 'Invalid email or password.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    return { success: false, error: 'Invalid email or password.' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', data.user.id)
    .single()

  if (profile?.status === 'disabled') {
    await supabase.auth.signOut()
    return { success: false, error: 'Your account has been disabled. Contact support.' }
  }

  const role: Role = VALID_ROLES.includes(profile?.role as Role)
    ? (profile!.role as Role)
    : 'client'

  return { success: true, role }
}
