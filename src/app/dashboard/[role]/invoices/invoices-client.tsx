'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { SlidersHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { DataTable } from '@/components/shared/data-table'
import { buildInvoiceColumns } from './invoices-columns'
import type { InvoiceListRow } from '@/lib/data/invoices'
import type { InvoiceStatus } from '@/types'

interface Props {
  invoices: InvoiceListRow[]
  clients: { id: string; first_name: string; last_name: string }[]
  role: string
}

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
]

export function InvoicesClient({ invoices, clients, role }: Props) {
  const router = useRouter()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [filterPeriodStart, setFilterPeriodStart] = useState('')
  const [filterPeriodEnd, setFilterPeriodEnd] = useState('')

  const columns = useMemo(() => buildInvoiceColumns(role), [role])

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (filterStatus && inv.status !== filterStatus) return false
      if (filterClient && inv.client_id !== filterClient) return false
      if (filterPeriodStart && inv.billing_period_start < filterPeriodStart) return false
      if (filterPeriodEnd && inv.billing_period_end > filterPeriodEnd) return false
      return true
    })
  }, [invoices, filterStatus, filterClient, filterPeriodStart, filterPeriodEnd])

  const activeCount = [filterStatus, filterClient, filterPeriodStart, filterPeriodEnd].filter(Boolean).length

  function clearFilters() {
    setFilterStatus('')
    setFilterClient('')
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
          aria-controls="invoices-filters"
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
        <div id="invoices-filters" className="rounded-lg border p-4">
          <div className="flex flex-wrap gap-3">
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? '')}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Statuses">
                  {filterStatus ? (STATUS_OPTIONS.find((s) => s.value === filterStatus)?.label ?? filterStatus) : 'All Statuses'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {role !== 'client' && (
              <Select value={filterClient} onValueChange={(v) => setFilterClient(v ?? '')}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Clients">
                    {filterClient
                      ? (`${clients.find((c) => c.id === filterClient)?.first_name ?? ''} ${clients.find((c) => c.id === filterClient)?.last_name ?? ''}`).trim() || '—'
                      : 'All Clients'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Clients</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {(`${c.first_name} ${c.last_name}`).trim() || '—'}
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

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(row) => router.push(`/dashboard/${role}/invoices/${row.id}`)}
      />
    </div>
  )
}
