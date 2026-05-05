import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { Role } from '@/types'

type Client = SupabaseClient<Database>

const CLOSED_ORDER_STATUSES = '("completed","canceled")'

export interface MetricCard {
  label: string
  value: number
  href: string
}

async function getClientMetrics(supabase: Client, userId: string): Promise<MetricCard[]> {
  const [{ count: openOrders }, { count: invoicesDue }] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true })
      .eq('client_id', userId)
      .not('status', 'in', CLOSED_ORDER_STATUSES),
    supabase.from('invoices').select('*', { count: 'exact', head: true })
      .eq('client_id', userId)
      .eq('status', 'sent'),
  ])

  return [
    { label: 'Open Orders', value: openOrders ?? 0, href: '/dashboard/client/orders' },
    { label: 'Invoices Due', value: invoicesDue ?? 0, href: '/dashboard/client/invoices' },
  ]
}

async function getManagerMetrics(supabase: Client): Promise<MetricCard[]> {
  const [{ count: openOrders }, { count: pendingUsers }, { count: activeSites }] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true })
      .not('status', 'in', CLOSED_ORDER_STATUSES),
    supabase.from('users').select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('sites').select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
  ])

  return [
    { label: 'Open Orders', value: openOrders ?? 0, href: '/dashboard/manager/orders' },
    { label: 'Pending Users', value: pendingUsers ?? 0, href: '/dashboard/manager/users' },
    { label: 'Active Sites', value: activeSites ?? 0, href: '/dashboard/manager/sites' },
  ]
}

async function getCopywriterMetrics(supabase: Client, userId: string): Promise<MetricCard[]> {
  const [{ count: inProgress }, { count: needsChanges }] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true })
      .eq('copywriter_id', userId)
      .eq('status', 'in_progress'),
    supabase.from('orders').select('*', { count: 'exact', head: true })
      .eq('copywriter_id', userId)
      .eq('status', 'needs_changes'),
  ])

  return [
    { label: 'Orders In Progress', value: inProgress ?? 0, href: '/dashboard/copywriter/orders' },
    { label: 'Needs Changes', value: needsChanges ?? 0, href: '/dashboard/copywriter/orders' },
  ]
}

async function getSourcerMetrics(supabase: Client, userId: string): Promise<MetricCard[]> {
  const [{ count: activeSites }, { count: pendingSites }] = await Promise.all([
    supabase.from('sites').select('*', { count: 'exact', head: true })
      .eq('created_by', userId)
      .eq('status', 'active'),
    supabase.from('sites').select('*', { count: 'exact', head: true })
      .eq('created_by', userId)
      .eq('status', 'pending'),
  ])

  return [
    { label: 'Active Sites', value: activeSites ?? 0, href: '/dashboard/sourcer/sites' },
    { label: 'Pending Sites', value: pendingSites ?? 0, href: '/dashboard/sourcer/sites' },
  ]
}

async function getAdminMetrics(supabase: Client): Promise<MetricCard[]> {
  const [{ count: openOrders }, { count: totalUsers }, { count: activeSites }] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true })
      .not('status', 'in', CLOSED_ORDER_STATUSES),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('sites').select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
  ])

  return [
    { label: 'Open Orders', value: openOrders ?? 0, href: '/dashboard/admin/orders' },
    { label: 'Total Users', value: totalUsers ?? 0, href: '/dashboard/admin/users' },
    { label: 'Active Sites', value: activeSites ?? 0, href: '/dashboard/admin/sites' },
  ]
}

export function getMetricsForRole(supabase: Client, role: Role, userId: string): Promise<MetricCard[]> {
  switch (role) {
    case 'client': return getClientMetrics(supabase, userId)
    case 'manager': return getManagerMetrics(supabase)
    case 'copywriter': return getCopywriterMetrics(supabase, userId)
    case 'sourcer': return getSourcerMetrics(supabase, userId)
    case 'admin': return getAdminMetrics(supabase)
  }
}
