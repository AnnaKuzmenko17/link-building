'use server'

import { z } from 'zod'
import { requireSession } from '@/lib/auth/get-session'
import { createAdminClient } from '@/lib/supabase/admin'
import { findUserByEmail } from '@/lib/data/users'
import type { Role } from '@/types'
import { getAppUrl } from '@/lib/get-app-url'

const MANAGER_ALLOWED_ROLES: Role[] = ['client', 'copywriter', 'sourcer']
const ALL_ROLES: Role[] = ['client', 'manager', 'copywriter', 'sourcer', 'admin']

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['client', 'manager', 'copywriter', 'sourcer', 'admin']),
  manager_id: z.string().uuid().optional(),
})

type InviteResult = { success: true } | { success: false; error: string }

export async function inviteUserAction(input: {
  email: string
  role: string
  manager_id?: string
}): Promise<InviteResult> {
  const { user, role: viewerRole } = await requireSession()

  if (viewerRole !== 'manager' && viewerRole !== 'admin') {
    return { success: false, error: 'Not authorized.' }
  }

  const parsed = inviteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { email, role, manager_id } = parsed.data

  const allowedRoles = viewerRole === 'manager' ? MANAGER_ALLOWED_ROLES : ALL_ROLES
  if (!allowedRoles.includes(role as Role)) {
    return { success: false, error: 'You are not allowed to invite users with that role.' }
  }

  const resolvedManagerId = role === 'client'
    ? (viewerRole === 'manager' ? user.id : manager_id)
    : undefined

  if (role === 'client' && !resolvedManagerId) {
    return { success: false, error: 'A manager is required for client users.' }
  }

  const adminClient = createAdminClient()

  const existing = await findUserByEmail(adminClient, email)
  if (existing) {
    return { success: false, error: 'A user with this email already exists.' }
  }

  // The trigger handle_new_user() auto-inserts the public.users profile row
  // on auth.users insert, reading role and manager_id from raw_user_meta_data.
  const { error: authError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { role, manager_id: resolvedManagerId ?? null },
    redirectTo: `${getAppUrl()}/auth/set-password`,
  })

  if (authError) {
    if (authError.message.toLowerCase().includes('already been registered')) {
      return { success: false, error: 'A user with this email already exists.' }
    }
    return { success: false, error: 'Failed to send invite.' }
  }

  return { success: true }
}
