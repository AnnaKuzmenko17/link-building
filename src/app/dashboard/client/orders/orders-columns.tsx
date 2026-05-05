'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { formatPublishMonth } from '@/lib/publish-months'
import { cancelOrderAction } from './actions'
import { EditOrderSheet } from './edit-order-sheet'
import { ReviewContentSheet } from './review-content-sheet'
import type { OrderWithSite } from '@/lib/data/orders'

function OrderActions({ order }: { order: OrderWithSite }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const showEdit = order.status === 'new'
  const showCancel = order.status === 'new'
  const showReview = order.status === 'content_sent'
  const showLink = (order.status === 'published' || order.status === 'completed') && !!order.published_url

  if (!showEdit && !showCancel && !showReview && !showLink) return null

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
      <div className="flex items-center gap-2">
        {showLink && (
          <a
            href={order.published_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline underline-offset-2 hover:opacity-80 max-w-[180px] truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {order.published_url}
          </a>
        )}
        {showEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setEditOpen(true) }}
          >
            Edit
          </Button>
        )}
        {showReview && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setReviewOpen(true) }}
          >
            Review
          </Button>
        )}
        {showCancel && (
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setCancelOpen(true) }}
          >
            Cancel
          </Button>
        )}
      </div>

      <EditOrderSheet open={editOpen} onOpenChange={setEditOpen} order={order} />
      <ReviewContentSheet open={reviewOpen} onOpenChange={setReviewOpen} order={order} />
      {cancelOpen && (
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
      )}
    </>
  )
}

export function buildOrderColumns(): ColumnDef<OrderWithSite>[] {
  return [
    {
      id: 'domain',
      header: 'Site',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.site?.domain ?? '—'}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'publish_month',
      header: 'Publish Month',
      cell: ({ row }) => formatPublishMonth(row.original.publish_month),
    },
    {
      id: 'created_at',
      header: 'Created',
      cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <OrderActions order={row.original} />,
    },
  ]
}
