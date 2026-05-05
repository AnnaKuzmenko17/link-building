'use client'

import type { ColumnDef } from '@tanstack/react-table'
import type { EarningRow } from '@/lib/data/earnings'

export function buildEarningsColumns(role: string): ColumnDef<EarningRow>[] {
  const cols: ColumnDef<EarningRow>[] = []

  if (role !== 'sourcer') {
    cols.push({
      id: 'sourcer',
      header: 'Sourcer',
      cell: ({ row }) => {
        const s = row.original.order?.site?.sourcer
        if (!s) return '—'
        return (`${s.first_name} ${s.last_name}`).trim() || '—'
      },
    })
  }

  cols.push(
    {
      id: 'site',
      header: 'Site',
      cell: ({ row }) => row.original.order?.site?.domain ?? '—',
    },
    {
      id: 'order_number',
      header: 'Order #',
      cell: ({ row }) => row.original.order?.order_number ?? '—',
    },
    {
      id: 'publish_month',
      header: 'Publish Month',
      cell: ({ row }) => row.original.order?.publish_month ?? '—',
    },
    {
      id: 'amount',
      header: 'Order Amount',
      cell: ({ row }) => `$${Number(row.original.amount).toFixed(2)}`,
    },
    {
      id: 'commission',
      header: 'Commission (5%)',
      cell: ({ row }) => `$${Number(row.original.commission).toFixed(2)}`,
    },
  )

  return cols
}
