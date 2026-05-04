'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/get-session'
import {
  getInvoiceById,
  updateInvoiceFields,
  updateInvoiceItemAmount,
  setInvoiceStatus,
} from '@/lib/data/invoices'
import { updateOrdersToCompleted } from '@/lib/data/orders'

type Result = { success: true } | { success: false; error: string }

const invoiceIdSchema = z.string().uuid()

const updateSchema = z.object({
  billing_period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  billing_period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  items: z.array(z.object({ id: z.string().uuid(), amount: z.number().positive() })),
})

export async function updateInvoiceAction(
  invoiceId: string,
  input: z.infer<typeof updateSchema>,
): Promise<Result> {
  const { role, user } = await requireSession()
  if (role !== 'manager' && role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }

  const parsedId = invoiceIdSchema.safeParse(invoiceId)
  if (!parsedId.success) return { success: false, error: 'Invalid invoice.' }

  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  const invoice = await getInvoiceById(supabase, parsedId.data, role, user.id)
  if (!invoice) return { success: false, error: 'Invoice not found.' }

  const { error: fieldsError } = await updateInvoiceFields(supabase, parsedId.data, {
    billing_period_start: parsed.data.billing_period_start,
    billing_period_end: parsed.data.billing_period_end,
  })
  if (fieldsError) return { success: false, error: 'Failed to update invoice.' }

  for (const item of parsed.data.items) {
    const { error } = await updateInvoiceItemAmount(supabase, item.id, item.amount)
    if (error) return { success: false, error: 'Failed to update invoice item.' }
  }

  return { success: true }
}

export async function sendInvoiceAction(invoiceId: string): Promise<Result> {
  const { role, user } = await requireSession()
  if (role !== 'manager' && role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }

  const parsedId = invoiceIdSchema.safeParse(invoiceId)
  if (!parsedId.success) return { success: false, error: 'Invalid invoice.' }

  const supabase = await createClient()
  const invoice = await getInvoiceById(supabase, parsedId.data, role, user.id)
  if (!invoice) return { success: false, error: 'Invoice not found.' }
  if (invoice.status !== 'draft') return { success: false, error: 'Invoice is not in draft status.' }

  const { error } = await setInvoiceStatus(supabase, parsedId.data, 'sent')
  if (error) return { success: false, error: 'Failed to send invoice.' }

  return { success: true }
}

export async function markAsPaidAction(invoiceId: string): Promise<Result> {
  const { role, user } = await requireSession()
  if (role !== 'manager' && role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }

  const parsedId = invoiceIdSchema.safeParse(invoiceId)
  if (!parsedId.success) return { success: false, error: 'Invalid invoice.' }

  const supabase = await createClient()
  const invoice = await getInvoiceById(supabase, parsedId.data, role, user.id)
  if (!invoice) return { success: false, error: 'Invoice not found.' }
  if (invoice.status !== 'sent') return { success: false, error: 'Invoice is not in sent status.' }

  const { error: statusError } = await setInvoiceStatus(supabase, parsedId.data, 'paid')
  if (statusError) return { success: false, error: 'Failed to mark invoice as paid.' }

  const orderIds = invoice.invoice_items.map((item) => item.order_id)
  const { error: ordersError } = await updateOrdersToCompleted(supabase, orderIds)
  if (ordersError) return { success: false, error: 'Failed to complete orders.' }

  return { success: true }
}
