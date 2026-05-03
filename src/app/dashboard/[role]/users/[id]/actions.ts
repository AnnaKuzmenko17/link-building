'use server'

import { z } from 'zod'
import { requireSession } from '@/lib/auth/get-session'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getUserById,
  getActiveOrdersForCopywriter,
  getActiveCopywriters,
  findUserByEmailExcluding,
  updateUserProfile,
  setUserStatus,
  assignManagerToUser,
} from '@/lib/data/users'
import { reassignOrder } from '@/lib/data/orders'
import { unlinkSourcerFromSites } from '@/lib/data/sites'
import { ensureManagerInClientSalesChat } from '@/lib/data/chats'
import type { Role } from '@/types'
import { getAppUrl } from '@/lib/get-app-url'
import type { ActiveOrderForReassign, ActiveCopywriter } from '@/lib/data/users'

const MANAGER_ASSIGNABLE_ROLES: Role[] = ['client', 'copywriter', 'sourcer']

type Result = { success: true } | { success: false; error: string }

// ── Edit User ──────────────────────────────────────────────────────────────

const editSchema = z.object({
  targetId: z.string().uuid(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  role: z.enum(['client', 'manager', 'copywriter', 'sourcer', 'admin']),
})

export async function editUserAction(input: {
  targetId: string
  first_name: string
  last_name: string
  email: string
  role: string
}): Promise<Result> {
  const { role: viewerRole } = await requireSession()

  if (viewerRole !== 'manager' && viewerRole !== 'admin') {
    return { success: false, error: 'Not authorized.' }
  }

  const parsed = editSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { targetId, first_name, last_name, email, role } = parsed.data

  const adminClient = createAdminClient()

  const target = await getUserById(adminClient, targetId)
  if (!target) return { success: false, error: 'User not found.' }

  if (viewerRole === 'manager' && (target.role === 'admin' || target.role === 'manager')) {
    return { success: false, error: 'Managers cannot edit admin or manager accounts.' }
  }

  if (viewerRole === 'manager' && !MANAGER_ASSIGNABLE_ROLES.includes(role as Role)) {
    return { success: false, error: 'Managers cannot assign that role.' }
  }

  if (email !== target.email) {
    const existing = await findUserByEmailExcluding(adminClient, email, targetId)
    if (existing) {
      return { success: false, error: 'A user with this email already exists.' }
    }
  }

  const { error } = await updateUserProfile(adminClient, targetId, { first_name, last_name, email, role: role as Role })
  if (error) return { success: false, error: 'Failed to update user. Please try again.' }

  await adminClient.auth.admin.updateUserById(targetId, {
    email,
    user_metadata: { role },
  })

  return { success: true }
}

// ── Resend Invite ──────────────────────────────────────────────────────────

export async function resendInviteAction(targetId: string): Promise<Result> {
  const { role: viewerRole } = await requireSession()

  if (viewerRole !== 'manager' && viewerRole !== 'admin') {
    return { success: false, error: 'Not authorized.' }
  }

  const adminClient = createAdminClient()
  const target = await getUserById(adminClient, targetId)
  if (!target) return { success: false, error: 'User not found.' }
  if (target.status !== 'pending') return { success: false, error: 'User is not pending.' }

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email: target.email,
    options: { redirectTo: `${getAppUrl()}/auth/set-password` },
  })

  if (error || !data?.properties?.action_link) {
    return { success: false, error: 'Failed to generate invite link. Please try again.' }
  }

  const brevoApiKey = process.env.BREVO_API_KEY
  const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL
  if (!brevoApiKey || !brevoSenderEmail) return { success: false, error: 'Email service not configured.' }

  const actionLink = data.properties.action_link
  if (!actionLink.startsWith('https://')) {
    return { success: false, error: 'Generated link is invalid.' }
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': brevoApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_SENDER_NAME ?? 'Linkbuilding',
        email: brevoSenderEmail,
      },
      to: [{ email: target.email }],
      subject: "You've been invited",
      textContent: `You've been invited. Visit the following link to set your password and activate your account:\n\n${actionLink}`,
      htmlContent: `<p>You've been invited. <a href="${encodeURI(actionLink)}">Click here to set your password</a> and activate your account.</p>`,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { success: false, error: body?.message ?? 'Failed to send invite email.' }
  }

  return { success: true }
}

// ── Disable User: pre-check ────────────────────────────────────────────────

export type DisablePreCheck =
  | { type: 'simple' }
  | { type: 'sourcer' }
  | { type: 'copywriter_reassign'; orders: ActiveOrderForReassign[]; copywriters: ActiveCopywriter[] }
  | { success: false; error: string }

export async function getDisablePreCheckAction(targetId: string): Promise<DisablePreCheck> {
  const { role: viewerRole } = await requireSession()
  if (viewerRole !== 'admin') return { success: false, error: 'Not authorized.' }

  const adminClient = createAdminClient()
  const target = await getUserById(adminClient, targetId)
  if (!target) return { success: false, error: 'User not found.' }
  if (target.status !== 'active') return { success: false, error: 'User is not active.' }

  if (target.role === 'sourcer') return { type: 'sourcer' }

  if (target.role === 'copywriter') {
    const orders = await getActiveOrdersForCopywriter(adminClient, targetId)
    if (orders.length > 0) {
      const copywriters = await getActiveCopywriters(adminClient, targetId)
      return { type: 'copywriter_reassign', orders, copywriters }
    }
  }

  return { type: 'simple' }
}

// ── Disable User: simple ───────────────────────────────────────────────────

export async function disableUserAction(targetId: string): Promise<Result> {
  const { user, role: viewerRole } = await requireSession()
  if (viewerRole !== 'admin') return { success: false, error: 'Not authorized.' }
  if (user.id === targetId) return { success: false, error: 'Cannot disable your own account.' }

  const adminClient = createAdminClient()
  const target = await getUserById(adminClient, targetId)
  if (!target) return { success: false, error: 'User not found.' }
  if (target.role === 'admin') return { success: false, error: 'Cannot disable another admin account.' }

  const { error } = await setUserStatus(adminClient, targetId, 'disabled')
  if (error) return { success: false, error: 'Failed to disable user. Please try again.' }
  return { success: true }
}

// ── Disable User: sourcer ──────────────────────────────────────────────────

export async function disableSourcerAction(targetId: string): Promise<Result> {
  const { user, role: viewerRole } = await requireSession()
  if (viewerRole !== 'admin') return { success: false, error: 'Not authorized.' }
  if (user.id === targetId) return { success: false, error: 'Cannot disable your own account.' }

  const adminClient = createAdminClient()

  const { error: sitesError } = await unlinkSourcerFromSites(adminClient, targetId)
  if (sitesError) return { success: false, error: 'Failed to unlink sourcer from sites. Please try again.' }

  const { error } = await setUserStatus(adminClient, targetId, 'disabled')
  if (error) return { success: false, error: 'Failed to disable user. Please try again.' }
  return { success: true }
}

// ── Disable User: copywriter with reassign ─────────────────────────────────

const reassignSchema = z.object({
  userId: z.string().uuid(),
  assignments: z.array(z.object({
    orderId: z.string().uuid(),
    copywriterId: z.string().uuid('Select a copywriter for each order'),
  })),
})

export async function disableCopywriterWithReassignAction(input: {
  userId: string
  assignments: { orderId: string; copywriterId: string }[]
}): Promise<Result> {
  const { user, role: viewerRole } = await requireSession()
  if (viewerRole !== 'admin') return { success: false, error: 'Not authorized.' }
  if (user.id === input.userId) return { success: false, error: 'Cannot disable your own account.' }

  const parsed = reassignSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { userId, assignments } = parsed.data
  const adminClient = createAdminClient()

  const validCopywriters = await getActiveCopywriters(adminClient, userId)
  const validCopywriterIds = new Set(validCopywriters.map((c) => c.id))

  for (const { orderId, copywriterId } of assignments) {
    if (!validCopywriterIds.has(copywriterId)) {
      return { success: false, error: 'Invalid copywriter selected.' }
    }

    const { error } = await reassignOrder(adminClient, orderId, userId, copywriterId)
    if (error) return { success: false, error: 'Failed to reassign order. Please try again.' }
  }

  const { error } = await setUserStatus(adminClient, userId, 'disabled')
  if (error) return { success: false, error: 'Failed to disable user. Please try again.' }
  return { success: true }
}

// ── Activate User ──────────────────────────────────────────────────────────

export async function activateUserAction(targetId: string): Promise<Result> {
  const { user, role: viewerRole } = await requireSession()
  if (viewerRole !== 'admin') return { success: false, error: 'Not authorized.' }
  if (user.id === targetId) return { success: false, error: 'Cannot modify your own account status.' }

  const adminClient = createAdminClient()
  const target = await getUserById(adminClient, targetId)
  if (!target) return { success: false, error: 'User not found.' }
  if (target.role === 'admin') return { success: false, error: 'Cannot modify another admin account status.' }

  const { error } = await setUserStatus(adminClient, targetId, 'active')
  if (error) return { success: false, error: 'Failed to activate user. Please try again.' }
  return { success: true }
}

// ── Assign Manager ─────────────────────────────────────────────────────────

const assignManagerSchema = z.object({
  userId: z.string().uuid(),
  managerId: z.string().uuid(),
})

export async function assignManagerAction(input: {
  userId: string
  managerId: string
}): Promise<Result> {
  const { role: viewerRole } = await requireSession()
  if (viewerRole !== 'admin') return { success: false, error: 'Not authorized.' }

  const parsed = assignManagerSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { userId, managerId } = parsed.data

  const adminClient = createAdminClient()
  const [targetUser, managerUser] = await Promise.all([
    getUserById(adminClient, userId),
    getUserById(adminClient, managerId),
  ])

  if (!targetUser) return { success: false, error: 'User not found.' }
  if (!managerUser) return { success: false, error: 'Manager not found.' }
  if (managerUser.role !== 'manager') return { success: false, error: 'Selected user is not a manager.' }
  if (managerUser.status !== 'active') return { success: false, error: 'Selected manager is not active.' }

  const { error } = await assignManagerToUser(adminClient, userId, managerId)
  if (error) return { success: false, error: 'Failed to assign manager. Please try again.' }

  try {
    await ensureManagerInClientSalesChat(adminClient, userId, managerId)
  } catch {
    // Best-effort: manager assignment succeeded, chat participant add is non-fatal
  }

  return { success: true }
}
