import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveRole } from '@/lib/resolve-role'
import type { User } from '@supabase/supabase-js'
import type { Role } from '@/types'

export interface AuthSession {
  user: User
  role: Role
}

export const requireSession = cache(async (): Promise<AuthSession> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return { user, role: resolveRole(user.user_metadata?.role) }
})
