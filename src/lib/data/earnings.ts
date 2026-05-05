import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Client = SupabaseClient<Database>

const COMMISSION_RATE = 0.05

export type EarningRow = {
  id: string
  amount: number
  commission: number
  order: {
    id: string
    order_number: number
    publish_month: string
    site: {
      id: string
      domain: string
      sourcer: {
        id: string
        first_name: string
        last_name: string
      } | null
    }
  }
  invoice: {
    id: string
    billing_period_start: string
    billing_period_end: string
  }
}

export async function getEarnings(
  supabase: Client,
  opts: { viewerRole: string; viewerId: string },
): Promise<EarningRow[]> {
  const { data } = await supabase
    .from('invoice_items')
    .select(
      'id, amount, order:orders!order_id(id, order_number, publish_month, sourcer_id, site:sites!site_id(id, domain, sourcer:users!created_by(id, first_name, last_name))), invoice:invoices!invoice_id(id, status, billing_period_start, billing_period_end)',
    )
    .order('id', { ascending: false })

  const rows = (data ?? []) as unknown as (EarningRow & { invoice: { status: string } | null })[]

  // Only earnings from paid invoices
  const paid = rows.filter((r) => r.invoice?.status === 'paid')

  if (opts.viewerRole === 'sourcer') {
    return paid
      .filter((r) => r.order?.site?.sourcer?.id === opts.viewerId)
      .map((r) => ({ ...r, commission: Number(r.amount) * COMMISSION_RATE }))
  }

  return paid.map((r) => ({ ...r, commission: Number(r.amount) * COMMISSION_RATE }))
}
