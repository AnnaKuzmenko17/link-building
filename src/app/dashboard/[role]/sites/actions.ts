'use server'

import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import { createSite, updateSite, changeSiteStatus, getSiteById } from '@/lib/data/sites'
import { siteSchema, type SiteFormValues } from './site-schema'

type Result = { success: true } | { success: false; error: string }

export async function createSiteAction(input: SiteFormValues): Promise<Result> {
  const { user, role } = await requireSession()
  if (role !== 'sourcer') return { success: false, error: 'Not authorized.' }

  const parsed = siteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()
  const { error } = await createSite(supabase, {
    ...parsed.data,
    created_by: user.id,
    sourcer_id: user.id,
  })

  if (error) {
    if (error.code === '23505') return { success: false, error: 'A site with this domain already exists.' }
    return { success: false, error: 'Failed to add site. Please try again.' }
  }

  return { success: true }
}

export async function editSiteAction(
  siteId: string,
  input: SiteFormValues,
): Promise<Result> {
  const { user, role } = await requireSession()
  if (role !== 'sourcer' && role !== 'admin') return { success: false, error: 'Not authorized.' }

  const parsed = siteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = await createClient()

  if (role === 'sourcer') {
    const existing = await getSiteById(supabase, siteId)
    if (!existing) return { success: false, error: 'Site not found.' }
    if (existing.created_by !== user.id || existing.status === 'archived') {
      return { success: false, error: 'Not authorized.' }
    }
  }

  const updates = {
    ...parsed.data,
    ...(role === 'sourcer' ? { status: 'pending' as const } : {}),
  }

  const { error } = await updateSite(supabase, siteId, updates)
  if (error) {
    if (error.code === '23505') return { success: false, error: 'A site with this domain already exists.' }
    return { success: false, error: 'Failed to update site. Please try again.' }
  }

  return { success: true }
}

export async function changeSiteStatusAction(
  siteId: string,
  action: 'request_changes' | 'approve' | 'archive' | 'unarchive',
): Promise<Result> {
  const { user, role } = await requireSession()
  if (role !== 'admin') return { success: false, error: 'Not authorized.' }

  const supabase = await createClient()

  const site = await getSiteById(supabase, siteId)
  if (!site) return { success: false, error: 'Site not found.' }

  const { status } = site
  if (action === 'request_changes' && status !== 'pending') {
    return { success: false, error: 'Can only request changes on a pending site.' }
  }
  if (action === 'approve' && status !== 'pending' && status !== 'needs_changes') {
    return { success: false, error: 'Can only approve a pending or needs-changes site.' }
  }
  if (action === 'archive' && status === 'archived') {
    return { success: false, error: 'Site is already archived.' }
  }
  if (action === 'unarchive' && status !== 'archived') {
    return { success: false, error: 'Site is not archived.' }
  }

  const { error } = await changeSiteStatus(supabase, siteId, action, user.id)
  if (error) return { success: false, error: 'Failed to update site status. Please try again.' }

  return { success: true }
}
