'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SlidersHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UsersFilterBar } from './users-filter-bar'
import { UsersTable } from './users-columns'
import type { UserWithManager } from '@/lib/data/users'

interface Props {
  users: UserWithManager[]
  basePath: string
  defaultFilters: { role?: string; status?: string; search?: string }
}

function ClearFiltersButton({ onClear }: { onClear: () => void }) {
  const router = useRouter()
  const pathname = usePathname()

  function handleClearFilters() {
    onClear()
    router.replace(pathname, { scroll: false })
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
      Clear filters
    </Button>
  )
}

export function UsersClient({ users, basePath, defaultFilters }: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(defaultFilters.search ?? '')

  const hasActiveFilters = !!(defaultFilters.role || defaultFilters.status || defaultFilters.search)
  const activeCount = [defaultFilters.role, defaultFilters.status, defaultFilters.search].filter(Boolean).length

  function handleToggleFilters() {
    setFiltersOpen((v) => !v)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleFilters}
          aria-expanded={filtersOpen}
          aria-controls="users-filters"
        >
          <SlidersHorizontalIcon className="size-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
        {hasActiveFilters && <ClearFiltersButton onClear={() => setSearchValue('')} />}
      </div>

      {filtersOpen && (
        <div id="users-filters" className="rounded-lg border p-4">
          <UsersFilterBar searchValue={searchValue} onSearchChange={setSearchValue} />
        </div>
      )}

      <UsersTable data={users} basePath={basePath} />
    </div>
  )
}
