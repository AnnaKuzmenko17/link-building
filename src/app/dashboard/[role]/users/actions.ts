'use server'

import { z } from 'zod'
import { requireSession } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { findUserByEmail, insertUserProfile } from '@/lib/data/users'
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

  if (role === 'client') {
    const resolvedManagerId = viewerRole === 'manager' ? user.id : manager_id
    if (!resolvedManagerId) {
      return { success: false, error: 'A manager is required for client users.' }
    }
  }

  const supabase = await createClient()

  const existing = await findUserByEmail(supabase, email)
  if (existing) {
    return { success: false, error: 'A user with this email already exists.' }
  }

  const adminClient = createAdminClient()
  const { data: authData, error: authError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { role },
    redirectTo: `${getAppUrl()}/auth/set-password`,
  })

  if (authError) {
    if (authError.message.toLowerCase().includes('already been registered')) {
      return { success: false, error: 'A user with this email already exists.' }
    }
    return { success: false, error: authError.message ?? 'Failed to send invite.' }
  }

  if (!authData.user) {
    return { success: false, error: 'Failed to send invite.' }
  }

  const resolvedManagerId = role === 'client'
    ? (viewerRole === 'manager' ? user.id : manager_id)
    : undefined

  const { error: insertError } = await insertUserProfile(supabase, {
    id: authData.user.id,
    email,
    role: role as Role,
    status: 'pending',
    first_name: '',
    last_name: '',
    manager_id: resolvedManagerId ?? null,
  })

  if (insertError) {
    return { success: false, error: 'User invited but profile creation failed. Please contact support.' }
  }

  return { success: true }
}
