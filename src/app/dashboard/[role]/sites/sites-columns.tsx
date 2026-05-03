'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontalIcon } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import type { SiteWithRelations } from '@/lib/data/sites'
import type { Role } from '@/types'
import { changeSiteStatusAction } from './actions'

type StatusAction = 'request_changes' | 'approve' | 'archive' | 'unarchive'

const ACTION_CONFIG: Record<StatusAction, { title: string; description: string }> = {
  request_changes: { title: 'Request Changes', description: 'Mark this site as Needs Changes?' },
  approve: { title: 'Approve Site', description: 'Approve this site and make it active?' },
  archive: { title: 'Archive Site', description: 'Archive this site? It will no longer be visible to clients.' },
  unarchive: { title: 'Unarchive Site', description: 'Unarchive this site and reset its status to Pending?' },
}

interface ActionButtonsProps {
  site: SiteWithRelations
  viewerRole: Role
  viewerUserId: string
}

function ActionButtons({ site, viewerRole, viewerUserId }: ActionButtonsProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [confirm, setConfirm] = useState<StatusAction | null>(null)

  const canEdit =
    viewerRole === 'admin' ||
    (viewerRole === 'sourcer' && site.created_by === viewerUserId && site.status !== 'archived')

  const showRequestChanges = viewerRole === 'admin' && site.status === 'pending'
  const showApprove = viewerRole === 'admin' && (site.status === 'pending' || site.status === 'needs_changes')
  const showArchive = viewerRole === 'admin' && site.status !== 'archived'
  const showUnarchive = viewerRole === 'admin' && site.status === 'archived'

  const hasActions = canEdit || showRequestChanges || showApprove || showArchive || showUnarchive
  if (!hasActions) return null

  async function handleConfirm() {
    if (!confirm) return
    setPending(true)
    const result = await changeSiteStatusAction(site.id, confirm)
    setPending(false)
    setConfirm(null)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Status updated.')
    router.refresh()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Site actions"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontalIcon />
            </Button>
          }
        />
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {canEdit && (
            <DropdownMenuItem onClick={() => router.push(`/dashboard/${viewerRole}/sites/${site.id}/edit`)}>
              Edit
            </DropdownMenuItem>
          )}
          {(canEdit && (showRequestChanges || showApprove || showArchive || showUnarchive)) && (
            <DropdownMenuSeparator />
          )}
          {showRequestChanges && (
            <DropdownMenuItem onClick={() => setConfirm('request_changes')}>
              Request Changes
            </DropdownMenuItem>
          )}
          {showApprove && (
            <DropdownMenuItem onClick={() => setConfirm('approve')}>
              Approve
            </DropdownMenuItem>
          )}
          {showArchive && (
            <DropdownMenuItem onClick={() => setConfirm('archive')}>
              Archive
            </DropdownMenuItem>
          )}
          {showUnarchive && (
            <DropdownMenuItem onClick={() => setConfirm('unarchive')}>
              Unarchive
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {confirm && (
        <ConfirmDialog
          open={!!confirm}
          onOpenChange={(open) => { if (!open) setConfirm(null) }}
          title={ACTION_CONFIG[confirm].title}
          description={ACTION_CONFIG[confirm].description}
          onConfirm={handleConfirm}
          isLoading={pending}
        />
      )}
    </>
  )
}

export function buildSiteColumns(
  viewerRole: Role,
  viewerUserId: string,
): ColumnDef<SiteWithRelations>[] {
  const columns: ColumnDef<SiteWithRelations>[] = [
    {
      accessorKey: 'domain',
      header: 'Domain',
      cell: ({ row }) => (
        <span className="font-medium max-w-[200px] truncate block">{row.original.domain}</span>
      ),
    },
    { accessorKey: 'dr', header: 'DR' },
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) => row.original.category?.name ?? '—',
    },
    { accessorKey: 'top_countries', header: 'Top Countries' },
    {
      id: 'countries',
      header: 'Countries',
      cell: ({ row }) => row.original.countries.join(', ') || '—',
    },
    {
      id: 'languages',
      header: 'Languages',
      cell: ({ row }) => row.original.languages.join(', ') || '—',
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => `$${Number(row.original.price).toFixed(2)}`,
    },
  ]

  if (viewerRole === 'sourcer' || viewerRole === 'admin') {
    columns.push({
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    })
  }

  columns.push({
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <ActionButtons site={row.original} viewerRole={viewerRole} viewerUserId={viewerUserId} />
    ),
  })

  return columns
}
