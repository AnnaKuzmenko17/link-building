'use client'

import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import type { UserWithManager } from '@/lib/data/users'
import { capitalize } from '@/lib/utils'

const columns: ColumnDef<UserWithManager>[] = [
  {
    id: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const { first_name, last_name } = row.original
      const name = `${first_name} ${last_name}`.trim() || '—'
      return <span className="font-medium">{name}</span>
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ getValue }) => capitalize(getValue<string>()),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue<UserWithManager['status']>()} />,
  },
  {
    id: 'manager',
    header: 'Manager',
    cell: ({ row }) => {
      if (row.original.role !== 'client') return '—'
      const m = row.original.manager
      return m ? `${m.first_name} ${m.last_name}`.trim() : '—'
    },
  },
]

interface UsersTableProps {
  data: UserWithManager[]
  basePath: string
}

export function UsersTable({ data, basePath }: UsersTableProps) {
  const router = useRouter()
  return (
    <DataTable
      columns={columns}
      data={data}
      onRowClick={(user) => router.push(`${basePath}/${user.id}`)}
    />
  )
}
