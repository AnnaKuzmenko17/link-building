'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatPublishMonth } from '@/lib/publish-months'
import { AssignCopywriterSheet } from './assign-copywriter-sheet'
import { PublishOrderSheet } from './publish-order-sheet'
import type { OrderWithDetails } from '@/lib/data/orders'
import type { ActiveCopywriter } from '@/lib/data/users'

interface OrderActionsProps {
  order: OrderWithDetails
  copywriters: ActiveCopywriter[]
}

function OrderActions({ order, copywriters }: OrderActionsProps) {
  const [assignOpen, setAssignOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)

  const showAssign = order.copywriter_id === null
  const showReassign = order.copywriter_id !== null
  const showPublish = order.status === 'content_approved'

  return (
    <>
      <div className="flex items-center gap-2">
        {showAssign && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setAssignOpen(true) }}
          >
            Assign Copywriter
          </Button>
        )}
        {showReassign && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setAssignOpen(true) }}
          >
            Reassign
          </Button>
        )}
        {showPublish && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setPublishOpen(true) }}
          >
            Publish
          </Button>
        )}
      </div>

      {assignOpen && (
        <AssignCopywriterSheet
          open={assignOpen}
          onOpenChange={setAssignOpen}
          order={order}
          copywriters={copywriters}
        />
      )}
      {publishOpen && (
        <PublishOrderSheet
          open={publishOpen}
          onOpenChange={setPublishOpen}
          order={order}
        />
      )}
    </>
  )
}

export function buildManagerOrderColumns(
  copywriters: ActiveCopywriter[],
  role: string,
): ColumnDef<OrderWithDetails>[] {
  return [
    {
      id: 'domain',
      header: 'Site',
      cell: ({ row }) => (
        <Link
          href={`/dashboard/${role}/orders/${row.original.id}`}
          className="font-medium text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.site.domain}
        </Link>
      ),
    },
    {
      id: 'client',
      header: 'Client',
      cell: ({ row }) =>
        `${row.original.client.first_name} ${row.original.client.last_name}`,
    },
    {
      id: 'copywriter',
      header: 'Copywriter',
      cell: ({ row }) =>
        row.original.copywriter
          ? `${row.original.copywriter.first_name} ${row.original.copywriter.last_name}`
          : <span className="text-muted-foreground">Unassigned</span>,
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
      cell: ({ row }) => (
        <OrderActions order={row.original} copywriters={copywriters} />
      ),
    },
  ]
}
