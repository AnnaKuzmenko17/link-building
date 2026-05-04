'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { StatusBadge } from '@/components/shared/status-badge'
import type { InvoiceListRow } from '@/lib/data/invoices'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function buildInvoiceColumns(role: string): ColumnDef<InvoiceListRow>[] {
  const cols: ColumnDef<InvoiceListRow>[] = []

  if (role !== 'client') {
    cols.push({
      id: 'client',
      header: 'Client',
      cell: ({ row }) =>
        `${row.original.client.first_name} ${row.original.client.last_name}`,
    })
  }

  cols.push(
    {
      id: 'billing_period',
      header: 'Billing Period',
      cell: ({ row }) =>
        `${formatDate(row.original.billing_period_start)} — ${formatDate(row.original.billing_period_end)}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'total',
      header: 'Total Amount',
      cell: ({ row }) => {
        const total = row.original.invoice_items.reduce((sum, item) => sum + Number(item.amount), 0)
        return `$${total.toFixed(2)}`
      },
    },
  )

  return cols
}
