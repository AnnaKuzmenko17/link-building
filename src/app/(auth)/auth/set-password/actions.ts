'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveRole } from '@/lib/resolve-role'
import { getUserRoleAndStatus, getUserRole, activateUserAndGetRole } from '@/lib/data/users'

type ActivateResult =
  | { success: true; role: ReturnType<typeof resolveRole> }
  | { success: false; error: string }

// Called after the client has already updated the password via supabase.auth.updateUser().
// Handles profile activation for first-login, or just returns the role for change mode.
export async function activateSessionAction(mode: 'first-login' | 'change'): Promise<ActivateResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Session expired. Please log in again.' }
  }

  if (mode === 'first-login') {
    const existing = await getUserRoleAndStatus(supabase, user.id)

    if (existing?.status !== 'pending') {
      const profile = await getUserRole(supabase, user.id)
      return { success: true, role: resolveRole(profile?.role) }
    }

    const adminClient = createAdminClient()
    const profile = await activateUserAndGetRole(adminClient, user.id)
    return { success: true, role: resolveRole(profile?.role) }
  }

  const profile = await getUserRole(supabase, user.id)
  return { success: true, role: resolveRole(profile?.role) }
}
