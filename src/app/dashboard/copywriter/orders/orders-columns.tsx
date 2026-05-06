'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatPublishMonth } from '@/lib/publish-months'
import type { CopywriterOrder } from '@/lib/data/orders'

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
      id: 'dr',
      header: 'DR',
      cell: ({ row }) => row.original.site?.dr ?? '—',
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'publish_month',
      header: 'Publish Date',
      cell: ({ row }) => formatPublishMonth(row.original.publish_month),
    },
    {
      id: 'comments',
      header: 'Comments',
      cell: ({ row }) => row.original.change_requests.length + (row.original.comment ? 1 : 0),
    },
  ]
}
