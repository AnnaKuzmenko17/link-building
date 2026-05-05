'use client'

import { useRef, useEffect } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'

interface Props<T> {
  columns: ColumnDef<T>[]
  data: T[]
  isLoading?: boolean
  onRowClick?: (row: T) => void
}

export function DataTable<T>({ columns, data, isLoading, onRowClick }: Props<T>) {
  const tableRef = useRef<HTMLDivElement>(null)
  // true when the most recent pointerdown started outside the table (e.g. on a sheet backdrop)
  const pointerDownOutside = useRef(false)

  useEffect(() => {
    if (!onRowClick) return
    function onPointerDown(e: PointerEvent) {
      pointerDownOutside.current = !tableRef.current?.contains(e.target as Node)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [onRowClick])
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div ref={tableRef} className="rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <EmptyState message="No results found." />
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => {
              function handleKeyDown(e: React.KeyboardEvent) {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onRowClick?.(row.original)
                }
              }
              function handleClick() {
                if (pointerDownOutside.current) return
                onRowClick?.(row.original)
              }
              return (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? handleClick : undefined}
                  onKeyDown={onRowClick ? handleKeyDown : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={onRowClick ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring' : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
