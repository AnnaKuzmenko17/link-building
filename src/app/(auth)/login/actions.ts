'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveRole } from '@/lib/resolve-role'
import { ensureDefaultChatsForClient } from '@/lib/data/chats'
import type { Role } from '@/types'

const schema = z.object({
  email: z.email(),
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

  const role = resolveRole(data.user.user_metadata?.role)
  if (!role) {
    return { success: false, error: 'Account configuration error. Please contact support.' }
  }

  if (role === 'client') {
    const adminClient = createAdminClient()
    ensureDefaultChatsForClient(adminClient, data.user.id).catch(console.error)
  }

  return { success: true, role }
}
