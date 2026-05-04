'use client'

import { useState, useMemo } from 'react'
import { SlidersHorizontalIcon } from 'lucide-react'
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

const columns = buildOrderColumns()

export function OrdersClient({ orders }: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = useMemo(() => {
    if (!filterStatus) return orders
    return orders.filter((o) => o.status === filterStatus)
  }, [orders, filterStatus])

  const activeCount = filterStatus ? 1 : 0

  function handleToggleFilters() {
    setFiltersOpen((v) => !v)
  }

  function handleClearFilters() {
    setFilterStatus('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleFilters}
          aria-expanded={filtersOpen}
          aria-controls="orders-filters"
        >
          <SlidersHorizontalIcon className="size-4" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {filtersOpen && (
        <div id="orders-filters" className="rounded-lg border p-4">
          <div className="flex flex-wrap gap-3">
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? '')}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <DataTable columns={columns} data={filtered} />
    </div>
  )
}
