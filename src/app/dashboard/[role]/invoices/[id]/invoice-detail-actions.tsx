'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EditInvoiceSheet } from './edit-invoice-sheet'
import { sendInvoiceAction, markAsPaidAction } from './actions'
import type { InvoiceWithItems } from '@/lib/data/invoices'

interface Props {
  invoice: InvoiceWithItems
  role: string
}

export function InvoiceDetailActions({ invoice, role }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [paidOpen, setPaidOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)

  const canManage = role === 'manager' || role === 'admin'

  async function handleSend() {
    setIsSending(true)
    const result = await sendInvoiceAction(invoice.id)
    setIsSending(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Invoice sent')
    setSendOpen(false)
    router.refresh()
  }

  async function handleMarkPaid() {
    setIsMarkingPaid(true)
    const result = await markAsPaidAction(invoice.id)
    setIsMarkingPaid(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Invoice marked as paid')
    setPaidOpen(false)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-shrink-0">
        {canManage && invoice.status === 'draft' && (
          <>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button size="sm" onClick={() => setSendOpen(true)}>
              Send Invoice
            </Button>
          </>
        )}

        {canManage && invoice.status === 'sent' && (
          <Button size="sm" onClick={() => setPaidOpen(true)}>
            Mark as Paid
          </Button>
        )}

        {(invoice.status === 'sent' || invoice.status === 'paid') && (
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            download
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Download PDF
          </a>
        )}
      </div>

      <EditInvoiceSheet
        invoice={invoice}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => router.refresh()}
      />

      <ConfirmDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        title="Send Invoice"
        description="This will send the invoice to the client. They will be able to see and download it."
        confirmLabel="Send"
        onConfirm={handleSend}
        isLoading={isSending}
      />

      <ConfirmDialog
        open={paidOpen}
        onOpenChange={setPaidOpen}
        title="Mark as Paid"
        description="This will mark the invoice as paid and set all associated orders to completed."
        confirmLabel="Mark as Paid"
        onConfirm={handleMarkPaid}
        isLoading={isMarkingPaid}
      />
    </>
  )
}
