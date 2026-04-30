'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { resolveRole } from '@/lib/resolve-role'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type LoginResult =
  | { success: true; role: ReturnType<typeof resolveRole> }
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

  if (!profile) {
    await supabase.auth.signOut()
    return { success: false, error: 'Account setup is incomplete. Contact support.' }
  }

  if (profile.status === 'disabled') {
    await supabase.auth.signOut()
    return { success: false, error: 'Your account has been disabled. Contact support.' }
  }

  return { success: true, role: resolveRole(profile.role) }
}
