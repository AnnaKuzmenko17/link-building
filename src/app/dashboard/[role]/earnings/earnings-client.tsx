'use client'

import { useState, useMemo } from 'react'
import { SlidersHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/shared/data-table'
import { buildEarningsColumns } from './earnings-columns'
import type { EarningRow } from '@/lib/data/earnings'

interface Props {
  rows: EarningRow[]
  sourcers: { id: string; first_name: string; last_name: string }[]
  role: string
}

export function EarningsClient({ rows, sourcers, role }: Props) {
  const columns = useMemo(() => buildEarningsColumns(role), [role])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterSourcer, setFilterSourcer] = useState('')
  const [filterPeriodStart, setFilterPeriodStart] = useState('')
  const [filterPeriodEnd, setFilterPeriodEnd] = useState('')

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterSourcer && r.order?.site?.sourcer?.id !== filterSourcer) return false
      if (filterPeriodStart && r.invoice?.billing_period_start < filterPeriodStart) return false
      if (filterPeriodEnd && r.invoice?.billing_period_end > filterPeriodEnd) return false
      return true
    })
  }, [rows, filterSourcer, filterPeriodStart, filterPeriodEnd])

  const showSourcerFilter = role === 'manager' || role === 'admin'
  const activeCount = [filterSourcer, filterPeriodStart, filterPeriodEnd].filter(Boolean).length

  function clearFilters() {
    setFilterSourcer('')
    setFilterPeriodStart('')
    setFilterPeriodEnd('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          aria-controls="earnings-filters"
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
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {filtersOpen && (
        <div id="earnings-filters" className="rounded-lg border p-4">
          <div className="flex flex-wrap gap-3">
            {showSourcerFilter && (
              <Select value={filterSourcer} onValueChange={(v) => setFilterSourcer(v ?? '')}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Sourcers">
                    {filterSourcer
                      ? (() => {
                          const s = sourcers.find((x) => x.id === filterSourcer)
                          return s ? (`${s.first_name} ${s.last_name}`).trim() || '—' : '—'
                        })()
                      : 'All Sourcers'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sourcers</SelectItem>
                  {sourcers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {(`${s.first_name} ${s.last_name}`).trim() || '—'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <DatePicker
              value={filterPeriodStart}
              onChange={(v) => {
                setFilterPeriodStart(v)
                if (filterPeriodEnd && v > filterPeriodEnd) setFilterPeriodEnd('')
              }}
              maxDate={filterPeriodEnd || undefined}
              placeholder="From DD.MM.YYYY"
            />
            <DatePicker
              value={filterPeriodEnd}
              onChange={(v) => {
                setFilterPeriodEnd(v)
                if (filterPeriodStart && v < filterPeriodStart) setFilterPeriodStart('')
              }}
              minDate={filterPeriodStart || undefined}
              placeholder="To DD.MM.YYYY"
            />
          </div>
        </div>
      )}

      <DataTable columns={columns} data={filtered} />
    </div>
  )
}
