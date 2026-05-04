import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { Order, Site, User, OrderStatus, ChangeRequest } from '@/types'

type Client = SupabaseClient<Database>

export type OrderWithSite = Order & {
  site: Pick<Site, 'id' | 'domain'>
}

export type OrderWithDetails = Order & {
  site: Pick<Site, 'id' | 'domain'>
  client: Pick<User, 'id' | 'first_name' | 'last_name'>
  copywriter: Pick<User, 'id' | 'first_name' | 'last_name'> | null
}

export type OrderWithFullDetails = OrderWithDetails & {
  change_requests: ChangeRequest[]
}

export async function getClientOrders(
  supabase: Client,
  clientId: string,
): Promise<OrderWithSite[]> {
  const { data } = await supabase
    .from('orders')
    .select('*, site:sites(id, domain)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  return (data ?? []) as OrderWithSite[]
}

export async function getClientOrderById(
  supabase: Client,
  orderId: string,
  clientId: string,
): Promise<OrderWithSite | null> {
  const { data } = await supabase
    .from('orders')
    .select('*, site:sites(id, domain)')
    .eq('id', orderId)
    .eq('client_id', clientId)
    .maybeSingle()
  return data as OrderWithSite | null
}

export async function createOrders(
  supabase: Client,
  rows: Array<{ client_id: string; site_id: string; publish_month: string; status: 'new'; comment?: string | null }>,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase.from('orders').insert(rows)
  return { error: error ?? null }
}

export async function updateOrderPublishMonth(
  supabase: Client,
  orderId: string,
  publishMonth: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('orders')
    .update({ publish_month: publishMonth })
    .eq('id', orderId)
  return { error: error ?? null }
}

export async function updateOrderComment(
  supabase: Client,
  orderId: string,
  comment: string | null,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('orders')
    .update({ comment })
    .eq('id', orderId)
  return { error: error ?? null }
}

export async function updateOrderStatus(
  supabase: Client,
  orderId: string,
  status: OrderStatus,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
  return { error: error ?? null }
}

export async function createChangeRequest(
  supabase: Client,
  orderId: string,
  comment: string,
  createdBy: string,
): Promise<{ error: PostgrestError | null }> {
  const { error: crError } = await supabase
    .from('change_requests')
    .insert({ order_id: orderId, comment, created_by: createdBy })
  if (crError) return { error: crError }

  const { error: statusError } = await supabase
    .from('orders')
    .update({ status: 'needs_changes' })
    .eq('id', orderId)
  return { error: statusError ?? null }
}

export async function getAllOrders(
  supabase: Client,
  filters: {
    status?: string
    clientId?: string
    copywriterId?: string
    publishMonth?: string
  } = {},
): Promise<OrderWithDetails[]> {
  let query = supabase
    .from('orders')
    .select('*, site:sites(id, domain), client:users!client_id(id, first_name, last_name), copywriter:users!copywriter_id(id, first_name, last_name)')
    .order('created_at', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status as OrderStatus)
  if (filters.clientId) query = query.eq('client_id', filters.clientId)
  if (filters.copywriterId) {
    if (filters.copywriterId === '__unassigned__') {
      query = query.is('copywriter_id', null)
    } else {
      query = query.eq('copywriter_id', filters.copywriterId)
    }
  }
  if (filters.publishMonth) query = query.eq('publish_month', filters.publishMonth)

  const { data } = await query
  return (data ?? []) as unknown as OrderWithDetails[]
}

export async function getOrderById(
  supabase: Client,
  orderId: string,
): Promise<OrderWithFullDetails | null> {
  const { data } = await supabase
    .from('orders')
    .select('*, site:sites(id, domain), client:users!client_id(id, first_name, last_name), copywriter:users!copywriter_id(id, first_name, last_name), change_requests(*)')
    .eq('id', orderId)
    .maybeSingle()
  return data as unknown as OrderWithFullDetails | null
}

export async function assignCopywriter(
  supabase: Client,
  orderId: string,
  copywriterId: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('orders')
    .update({ copywriter_id: copywriterId, status: 'in_progress' })
    .eq('id', orderId)
  return { error: error ?? null }
}

export async function reassignCopywriter(
  supabase: Client,
  orderId: string,
  copywriterId: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('orders')
    .update({ copywriter_id: copywriterId })
    .eq('id', orderId)
  return { error: error ?? null }
}

export async function publishOrder(
  supabase: Client,
  orderId: string,
  publishedUrl: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('orders')
    .update({ published_url: publishedUrl, status: 'published' })
    .eq('id', orderId)
  return { error: error ?? null }
}

export async function reassignOrder(
  supabase: Client,
  orderId: string,
  fromCopywriterId: string,
  toCopywriterId: string
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('orders')
    .update({ copywriter_id: toCopywriterId })
    .eq('id', orderId)
    .eq('copywriter_id', fromCopywriterId)

  return { error }
}
