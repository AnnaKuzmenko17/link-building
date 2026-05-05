'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EditOrderSheet } from '@/app/dashboard/client/orders/edit-order-sheet'
import { cancelOrderAction } from '@/app/dashboard/client/orders/actions'
import type { OrderWithSite } from '@/lib/data/orders'

interface Props {
  order: OrderWithSite
}

export function ClientOrderActions({ order }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleCancel() {
    setIsPending(true)
    const result = await cancelOrderAction(order.id)
    setIsPending(false)
    setCancelOpen(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Order canceled.')
    router.refresh()
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setCancelOpen(true)}>
          Cancel Order
        </Button>
      </div>

      <EditOrderSheet open={editOpen} onOpenChange={setEditOpen} onSuccess={() => router.refresh()} order={order} />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={(open) => { if (!open) setCancelOpen(false) }}
        title="Cancel Order"
        description="Are you sure you want to cancel this order? This cannot be undone."
        confirmLabel="Cancel Order"
        variant="destructive"
        onConfirm={handleCancel}
        isLoading={isPending}
      />
    </>
  )
}
