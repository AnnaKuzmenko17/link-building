'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/shared/data-table'
import { buildOrderColumns } from './orders-columns'
import type { OrderWithSite } from '@/lib/data/orders'
import type { OrderStatus } from '@/types'

interface Props {
  orders: OrderWithSite[]
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'content_sent', label: 'Content Sent' },
  { value: 'needs_changes', label: 'Needs Changes' },
  { value: 'content_approved', label: 'Content Approved' },
  { value: 'published', label: 'Published' },
  { value: 'completed', label: 'Completed' },
  { value: 'canceled', label: 'Canceled' },
]

export function OrdersClient({ orders }: Props) {
  const [filterStatus, setFilterStatus] = useState('')
  const columns = useMemo(() => buildOrderColumns(), [])

  const filtered = filterStatus ? orders.filter((o) => o.status === filterStatus) : orders

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v ?? '')}
          items={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filterStatus && (
          <Button variant="ghost" size="sm" onClick={() => setFilterStatus('')}>
            Clear
          </Button>
        )}
      </div>
      <DataTable columns={columns} data={filtered} />
    </div>
  )
}
