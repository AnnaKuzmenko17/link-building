'use server'

import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { Site, Category, SiteStatus, Role } from '@/types'

type Client = SupabaseClient<Database>

export type SiteWithRelations = Site & {
  category: Pick<Category, 'id' | 'name'> | null
  created_by_user: { first_name: string; last_name: string } | null
  approved_by_user: { first_name: string; last_name: string } | null
  needs_changes_by_user: { first_name: string; last_name: string } | null
}

export type SiteFilters = {
  search?: string
  category_id?: string
  status?: SiteStatus
  countries?: string[]
  language?: string
  link_type?: string
  price_from?: number
  price_to?: number
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getSites(
  supabase: Client,
  filters: SiteFilters = {},
  viewerRole: Role,
  viewerUserId: string,
): Promise<SiteWithRelations[]> {
  if (viewerRole === 'copywriter') return []

  let query = supabase
    .from('sites')
    .select('*, category:categories(id, name), created_by_user:users!created_by(first_name, last_name)')
    .order('created_at', { ascending: false })

  if (viewerRole === 'sourcer') {
    query = query.eq('created_by', viewerUserId).neq('status', 'archived')
  } else if (viewerRole === 'client') {
    query = query.eq('status', 'active')
  }

  if (filters.search) {
    query = query.or(
      `domain.ilike.%${filters.search}%,description.ilike.%${filters.search}%,keywords_relevance.ilike.%${filters.search}%`,
    )
  }
  if (filters.category_id) query = query.eq('category_id', filters.category_id)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.countries?.length) query = query.overlaps('countries', filters.countries)
  if (filters.language) query = query.contains('languages', [filters.language])
  if (filters.link_type) query = query.eq('link_type', filters.link_type as Site['link_type'])
  if (filters.price_from != null) query = query.gte('price', filters.price_from)
  if (filters.price_to != null) query = query.lte('price', filters.price_to)

  const { data } = await query
  return (data ?? []) as SiteWithRelations[]
}

export async function getSiteById(
  supabase: Client,
  id: string,
): Promise<SiteWithRelations | null> {
  const { data } = await supabase
    .from('sites')
    .select('*, category:categories(id, name), created_by_user:users!created_by(first_name, last_name), approved_by_user:users!approved_by(first_name, last_name), needs_changes_by_user:users!needs_changes_by(first_name, last_name)')
    .eq('id', id)
    .maybeSingle()
  return data as SiteWithRelations | null
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createSite(
  supabase: Client,
  values: Omit<Database['public']['Tables']['sites']['Insert'], 'id' | 'created_at' | 'updated_at' | 'status'>,
): Promise<{ data: Site | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('sites')
    .insert({ ...values, status: 'pending' })
    .select()
    .single()
  return { data: data as Site | null, error: error ?? null }
}

export async function updateSite(
  supabase: Client,
  id: string,
  values: Database['public']['Tables']['sites']['Update'],
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('sites')
    .update(values)
    .eq('id', id)
  return { error: error ?? null }
}

export async function changeSiteStatus(
  supabase: Client,
  id: string,
  action: 'request_changes' | 'approve' | 'archive' | 'unarchive',
  adminId: string,
): Promise<{ error: PostgrestError | null }> {
  const now = new Date().toISOString()

  let patch: Database['public']['Tables']['sites']['Update']

  switch (action) {
    case 'request_changes':
      patch = {
        status: 'needs_changes',
        needs_changes_by: adminId,
        needs_changes_at: now,
      }
      break
    case 'approve':
      patch = {
        status: 'active',
        approved_by: adminId,
        approved_at: now,
        needs_changes_by: null,
        needs_changes_at: null,
      }
      break
    case 'archive':
      patch = { status: 'archived' }
      break
    case 'unarchive':
      patch = {
        status: 'pending',
        approved_by: null,
        approved_at: null,
        needs_changes_by: null,
        needs_changes_at: null,
      }
      break
  }

  const { error } = await supabase.from('sites').update(patch).eq('id', id)
  return { error: error ?? null }
}

// When a sourcer is disabled, archive their non-archived sites.
export async function unlinkSourcerFromSites(
  supabase: Client,
  sourcerId: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('sites')
    .update({ status: 'archived' })
    .eq('created_by', sourcerId)
    .neq('status', 'archived')
  return { error: error ?? null }
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function getCategories(supabase: Client): Promise<Category[]> {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  return (data ?? []) as Category[]
}

export async function getCategoryById(
  supabase: Client,
  id: string,
): Promise<Category | null> {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return data as Category | null
}

export async function createCategory(
  supabase: Client,
  name: string,
  createdBy: string,
): Promise<{ data: Category | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, created_by: createdBy })
    .select()
    .single()
  return { data: data as Category | null, error: error ?? null }
}

export async function updateCategory(
  supabase: Client,
  id: string,
  name: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
  return { error: error ?? null }
}
