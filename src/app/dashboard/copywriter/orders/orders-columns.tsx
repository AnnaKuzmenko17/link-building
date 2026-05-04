'use client'

import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatPublishMonth } from '@/lib/publish-months'
import type { CopywriterOrder } from '@/lib/data/orders'

function OrderActions({ order }: { order: CopywriterOrder }) {
  const router = useRouter()
  const showCreate = order.status === 'in_progress'
  const showEdit = order.status === 'needs_changes'

  if (!showCreate && !showEdit) return null

  function navigate(e: React.MouseEvent) {
    e.stopPropagation()
    router.push(`/dashboard/copywriter/orders/${order.id}/content`)
  }

  return (
    <div className="flex items-center gap-2">
      {showCreate && (
        <Button variant="outline" size="sm" onClick={navigate}>
          Create Content
        </Button>
      )}
      {showEdit && (
        <Button variant="outline" size="sm" onClick={navigate}>
          Edit Content
        </Button>
      )}
    </div>
  )
}

export function buildCopywriterOrderColumns(): ColumnDef<CopywriterOrder>[] {
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
      id: 'actions',
      header: '',
      cell: ({ row }) => <OrderActions order={row.original} />,
    },
  ]
}
