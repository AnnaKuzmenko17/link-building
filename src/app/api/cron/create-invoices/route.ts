import { createAdminClient } from '@/lib/supabase/admin'
import { getPublishedOrdersNotInvoiced, createInvoiceWithItems } from '@/lib/data/invoices'

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const orders = await getPublishedOrdersNotInvoiced(supabase)

  const grouped = new Map<string, typeof orders>()
  for (const order of orders) {
    const existing = grouped.get(order.client_id) ?? []
    existing.push(order)
    grouped.set(order.client_id, existing)
  }

  const today = new Date().toISOString().slice(0, 10)
  let created = 0
  const errors: string[] = []

  for (const [clientId, clientOrders] of grouped) {
    const billingStart = clientOrders
      .map((o) => o.created_at.slice(0, 10))
      .sort()[0]

    const { error } = await createInvoiceWithItems(supabase, {
      client_id: clientId,
      billing_period_start: billingStart,
      billing_period_end: today,
      items: clientOrders.map((o) => ({ order_id: o.id, amount: 0 })),
    })

    if (error) {
      errors.push(`client ${clientId}: ${error.message}`)
    } else {
      created++
    }
  }

  return Response.json({ created, errors })
}
