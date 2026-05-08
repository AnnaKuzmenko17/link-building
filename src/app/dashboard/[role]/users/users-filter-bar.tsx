'use client'

import { useRef, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchIcon } from 'lucide-react'

export function UsersFilterBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const roleValue = searchParams.get('role') ?? 'all'
  const statusValue = searchParams.get('status') ?? 'all'
  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '')

  const roleItems = [
    { value: 'all', label: 'All Roles' },
    { value: 'client', label: 'Client' },
    { value: 'manager', label: 'Manager' },
    { value: 'copywriter', label: 'Copywriter' },
    { value: 'sourcer', label: 'Sourcer' },
    { value: 'admin', label: 'Admin' },
  ]

  const statusItems = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'disabled', label: 'Disabled' },
  ]

  function pushParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const role = updates.role ?? (searchParams.get('role') || undefined)
    const status = updates.status ?? (searchParams.get('status') || undefined)
    const search = updates.search ?? (searchParams.get('search') || undefined)
    if (role) params.set('role', role)
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setSearchValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      pushParams({ search: value || undefined })
    }, 300)
  }

  function handleRoleChange(value: string | null) {
    const next = value ?? 'all'
    pushParams({ role: next === 'all' ? undefined : next })
  }

  function handleStatusChange(value: string | null) {
    const next = value ?? 'all'
    pushParams({ status: next === 'all' ? undefined : next })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-8 w-64"
          placeholder="Search by name or email…"
          value={searchValue}
          onChange={handleSearchChange}
        />
      </div>
      <Select value={roleValue} onValueChange={handleRoleChange} items={roleItems}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Roles">
            {roleItems.find((r) => r.value === roleValue)?.label ?? 'All Roles'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="client">Client</SelectItem>
          <SelectItem value="manager">Manager</SelectItem>
          <SelectItem value="copywriter">Copywriter</SelectItem>
          <SelectItem value="sourcer">Sourcer</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
      <Select value={statusValue} onValueChange={handleStatusChange} items={statusItems}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Statuses">
            {statusItems.find((s) => s.value === statusValue)?.label ?? 'All Statuses'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="disabled">Disabled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
